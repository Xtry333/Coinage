const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const { createDump, parseArgs } = require('./db-dump.cjs');

function setup(t) {
    const parent = path.join(os.tmpdir(), 'opencode');
    fs.mkdirSync(parent, { recursive: true });
    const root = fs.mkdtempSync(path.join(parent, 'coinage-db-dump-test-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const archive = Buffer.from([...'PGDMP'].map((character) => character.charCodeAt(0)).concat([0, 255, 128, 10, 13]));
    const container = {
        Id: 'database-id',
        Name: '/coinage-app-coinage-db-1',
        State: { Running: true },
        Config: {
            Labels: { 'com.docker.compose.project.working_dir': root },
            Env: ['POSTGRES_USER=container-user', 'POSTGRES_DB=container-db', 'POSTGRES_PASSWORD=container-test-password'],
        },
    };
    const calls = [];
    const docker = (args, options = {}) => {
        calls.push({ args, options });
        if (args[0] === 'ps') return 'database-id\n';
        if (args[0] === 'inspect') return JSON.stringify([container]);
        assert.equal(args[0], 'exec');
        fs.writeSync(options.stdio[1], archive);
        return '';
    };
    return { root, archive, metadata: container, calls, docker, environment: {}, now: new Date('2026-11-09T12:34:56.789Z') };
}

test('parses optional output/container arguments and help', () => {
    assert.deepEqual(parseArgs([]), {});
    assert.deepEqual(parseArgs(['--output', 'folder with spaces/pi.dump', '--container', 'postgres']), {
        output: 'folder with spaces/pi.dump',
        container: 'postgres',
    });
    assert.deepEqual(parseArgs(['--help']), { help: true });
});

test('rejects missing, unknown, and duplicate arguments', () => {
    assert.throws(() => parseArgs(['--output']), /Missing value/);
    assert.throws(() => parseArgs(['--unknown']), /Unknown argument/);
    assert.throws(() => parseArgs(['--output', 'a.dump', '--output', 'b.dump']), /only be specified once/);
});

test('creates a timestamped archive without altering binary bytes or exposing password arguments', (t) => {
    const fixture = setup(t);
    fs.writeFileSync(path.join(fixture.root, '.env'), 'PG_USER=coinage-db-admin\nPG_DATABASE=coinage-db\nPG_PASSWORD=local-test-password\n');

    const result = createDump(fixture);

    assert.equal(result.outputFile, path.join(fixture.root, 'backups', 'coinage-db-2026-11-09T12-34-56-789Z.dump'));
    assert.deepEqual(fs.readFileSync(result.outputFile), fixture.archive);
    const dump = fixture.calls.find(({ args }) => args[0] === 'exec');
    assert.ok(dump.args.includes('--username=coinage-db-admin'));
    assert.ok(dump.args.includes('--dbname=coinage-db'));
    assert.equal(dump.options.env.PGPASSWORD, 'local-test-password');
    assert.ok(!dump.args.join(' ').includes('local-test-password'));
    assert.ok(!dump.args.includes('-t'));
    if (process.platform !== 'win32') assert.equal(fs.statSync(result.outputFile).mode & 0o777, 0o600);
});

test('supports custom paths and explicit containers, with environment overrides', (t) => {
    const fixture = setup(t);
    fs.writeFileSync(path.join(fixture.root, '.env'), 'PG_USER=file-user\nPG_DATABASE=file-db\nPG_PASSWORD=file-test-password\n');
    const result = createDump({
        ...fixture,
        container: 'chosen-database',
        output: 'folder with spaces/pi.dump',
        environment: { PG_USER: 'override-user', PG_DATABASE: 'override-db', PG_PASSWORD: 'override-test-password' },
    });

    assert.equal(result.outputFile, path.join(fixture.root, 'folder with spaces', 'pi.dump'));
    assert.deepEqual(fixture.calls[0].args, ['inspect', 'chosen-database']);
    const dump = fixture.calls.find(({ args }) => args[0] === 'exec');
    assert.ok(dump.args.includes('--username=override-user'));
    assert.ok(dump.args.includes('--dbname=override-db'));
    assert.equal(dump.options.env.PGPASSWORD, 'override-test-password');
    assert.ok(!dump.args.join(' ').includes('override-test-password'));
});

test('falls back to container credentials and preserves equals signs in passwords', (t) => {
    const fixture = setup(t);
    fixture.metadata.Config.Env = ['POSTGRES_USER=container-user', 'POSTGRES_DB=container-db', 'POSTGRES_PASSWORD=container=test=password'];

    const result = createDump(fixture);

    assert.equal(result.database, 'container-db');
    const dump = fixture.calls.find(({ args }) => args[0] === 'exec');
    assert.ok(dump.args.includes('--username=container-user'));
    assert.ok(dump.args.includes('--dbname=container-db'));
    assert.equal(dump.options.env.PGPASSWORD, 'container=test=password');
});

test('respects an explicitly empty environment password instead of falling back', (t) => {
    const fixture = setup(t);
    fs.writeFileSync(path.join(fixture.root, '.env'), 'PG_PASSWORD=file-test-password\n');

    createDump({ ...fixture, environment: { PG_PASSWORD: '' } });

    const dump = fixture.calls.find(({ args }) => args[0] === 'exec');
    assert.equal(dump.options.env.PGPASSWORD, '');
});

test('refuses to overwrite an existing output', (t) => {
    const fixture = setup(t);
    const outputFile = path.join(fixture.root, 'existing.dump');
    fs.writeFileSync(outputFile, 'keep me');

    assert.throws(() => createDump({ ...fixture, output: outputFile }), /Refusing to overwrite/);
    assert.equal(fs.readFileSync(outputFile, 'utf8'), 'keep me');
    assert.ok(!fixture.calls.some(({ args }) => args[0] === 'exec'));
});

test('removes a partial archive if pg_dump fails', (t) => {
    const fixture = setup(t);
    const docker = (args, options) => {
        if (args[0] === 'exec') {
            fs.writeSync(options.stdio[1], 'partial archive');
            throw new Error('simulated pg_dump failure');
        }
        return fixture.docker(args, options);
    };

    assert.throws(() => createDump({ ...fixture, docker, output: 'failed.dump' }), /simulated pg_dump failure/);
    assert.ok(!fs.existsSync(path.join(fixture.root, 'failed.dump')));
});

test('rejects invalid archive output and cleans it up', (t) => {
    const fixture = setup(t);
    const docker = (args, options) => {
        if (args[0] === 'exec') return fs.writeSync(options.stdio[1], 'not a database dump');
        return fixture.docker(args, options);
    };

    assert.throws(() => createDump({ ...fixture, docker, output: 'invalid.dump' }), /valid custom-format archive/);
    assert.ok(!fs.existsSync(path.join(fixture.root, 'invalid.dump')));
});

test('does not automatically select a different checkout or a stopped container', (t) => {
    const fixture = setup(t);
    fixture.metadata.Config.Labels['com.docker.compose.project.working_dir'] = path.join(fixture.root, 'different-checkout');
    assert.throws(() => createDump(fixture), /No running coinage-db container/);
    fixture.metadata.State.Running = false;
    assert.throws(() => createDump({ ...fixture, container: 'stopped' }), /not running/);
});

test('requires explicit selection if multiple databases match this checkout', (t) => {
    const fixture = setup(t);
    const docker = (args) =>
        args[0] === 'ps' ? 'one\ntwo\n' : JSON.stringify([fixture.metadata, { ...fixture.metadata, Id: 'second-id', Name: '/second-database' }]);

    assert.throws(() => createDump({ ...fixture, docker }), /Multiple database containers/);
});
