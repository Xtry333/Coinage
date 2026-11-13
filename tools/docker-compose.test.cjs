const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

for (const filename of ['docker-compose.yml', 'docker-compose.dev.yml']) {
    test(`${filename} uses the same data/ layout as the Pi bundle`, (t) => {
        const parent = path.join(os.tmpdir(), 'opencode');
        fs.mkdirSync(parent, { recursive: true });
        const root = fs.mkdtempSync(path.join(parent, 'coinage-local-compose-test-'));
        t.after(() => fs.rmSync(root, { recursive: true, force: true }));
        fs.copyFileSync(path.join(__dirname, '..', filename), path.join(root, 'compose.yaml'));
        fs.writeFileSync(path.join(root, '.env'), 'COINAGE_POSTGRES_PASSWORD=fixture-only\n');
        const environment = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(PG_|COINAGE_|COMPOSE_)/.test(key)));
        // `config` only resolves configuration: no daemon, containers, volumes or real secrets.
        const result = spawnSync('docker', ['compose', 'config', '--format', 'json'], { cwd: root, env: environment, encoding: 'utf8' });
        if (result.error) throw result.error;
        assert.equal(result.status, 0, result.stderr);
        const { services } = JSON.parse(result.stdout);
        const [database] = services['coinage-db'].volumes;
        assert.equal(database.type, 'bind');
        assert.equal(database.source, path.join(root, 'data', 'pg'));
        assert.equal(database.target, '/var/lib/postgresql');
        if (services['coinage-api']) {
            const [uploads] = services['coinage-api'].volumes;
            assert.equal(uploads.type, 'bind');
            assert.equal(uploads.source, path.join(root, 'data', 'uploads'));
            assert.equal(uploads.target, '/app/api/uploads');
        }
    });
}
