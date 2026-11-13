const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const hasShell = spawnSync('sh', ['-c', 'command -v sha256sum'], { encoding: 'utf8' }).status === 0;

function setup(t) {
    const parent = path.join(os.tmpdir(), 'opencode');
    fs.mkdirSync(parent, { recursive: true });
    const root = fs.mkdtempSync(path.join(parent, 'coinage-pi-start-test-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const script = fs.readFileSync(path.join(__dirname, '../docker/start-pi.sh'), 'utf8').replace(/\r\n/g, '\n');
    fs.writeFileSync(path.join(root, 'start.sh'), script);
    fs.writeFileSync(path.join(root, '.env'), 'PG_PASSWORD=keep-this-secret\n');
    for (const filename of ['images.tar', 'compose.yaml', 'README.md']) fs.writeFileSync(path.join(root, filename), 'fixture');
    const checksums = ['images.tar', 'compose.yaml', 'start.sh', 'README.md'].map((filename) => {
        const hash = createHash('sha256').update(fs.readFileSync(path.join(root, filename))).digest('hex');
        return `${hash}  ${filename}`;
    });
    fs.writeFileSync(path.join(root, 'SHA256SUMS'), checksums.join('\n') + '\n');
    fs.mkdirSync(path.join(root, 'bin'));
    // No real Docker calls: record exactly which operations startup would perform.
    fs.writeFileSync(path.join(root, 'bin/docker'), '#!/bin/sh\nprintf "%s\\n" "$*" >> docker-calls\n', { mode: 0o755 });
    return root;
}

function start(root) {
    const result = spawnSync('sh', ['-c', 'PATH="$(pwd)/bin:$PATH"; export PATH; sh ./start.sh'], { cwd: root, encoding: 'utf8' });
    if (result.error) throw result.error;
    return { ...result, calls: fs.readFileSync(path.join(root, 'docker-calls'), 'utf8').trim().split('\n') };
}

for (const legacy of ['docker/postgres-data', '.docker-data/postgres18', '.docker-data/uploads', 'uploads']) {
    test(`Pi startup refuses ${legacy} even when canonical data already exists`, { skip: !hasShell && 'Requires sh and sha256sum on PATH' }, (t) => {
        const root = setup(t);
        fs.mkdirSync(path.join(root, legacy), { recursive: true });
        fs.writeFileSync(path.join(root, legacy, 'keep'), 'legacy data');
        fs.mkdirSync(path.join(root, 'data/pg'), { recursive: true });
        fs.mkdirSync(path.join(root, 'data/uploads'), { recursive: true });
        const result = start(root);
        assert.equal(result.status, 1, result.stderr);
        assert.ok(result.stderr.includes(`Legacy data path found: ./${legacy}`));
        assert.equal(result.calls.length, 1);
        assert.match(result.calls[0], /config --quiet$/);
        assert.equal(fs.readFileSync(path.join(root, legacy, 'keep'), 'utf8'), 'legacy data');
        assert.equal(fs.readFileSync(path.join(root, '.env'), 'utf8'), 'PG_PASSWORD=keep-this-secret\n');
    });
}

for (const existing of [false, true]) {
    test(`Pi startup accepts ${existing ? 'existing' : 'fresh'} canonical storage`, { skip: !hasShell && 'Requires sh and sha256sum on PATH' }, (t) => {
        const root = setup(t);
        if (existing) {
            fs.mkdirSync(path.join(root, 'data/pg'), { recursive: true });
            fs.mkdirSync(path.join(root, 'data/uploads'), { recursive: true });
            fs.writeFileSync(path.join(root, 'data/pg/keep'), 'canonical data');
        }
        const result = start(root);
        assert.equal(result.status, 0, result.stderr);
        assert.equal(result.calls.length, 3);
        assert.match(result.calls[1], /^image load --input/);
        assert.match(result.calls[2], /up -d --no-build --pull never --force-recreate$/);
        if (existing) assert.equal(fs.readFileSync(path.join(root, 'data/pg/keep'), 'utf8'), 'canonical data');
        assert.equal(fs.readFileSync(path.join(root, '.env'), 'utf8'), 'PG_PASSWORD=keep-this-secret\n');
    });
}
