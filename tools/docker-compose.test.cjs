const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const productionEnvironment = {
    COMPOSE_PROJECT_NAME: 'coinage-config-test',
    COINAGE_REGISTRY_USER: 'xtry333',
    COINAGE_IMAGE_TAG: 'test-release',
    COINAGE_WEBAPP_PORT: '4200',
    PG_DATABASE: 'test-db',
    PG_USER: 'test-user',
    PG_PASSWORD: 'fixture-only-db-password',
    COINAGE_API_JWT_SECRET: 'fixture-only-jwt-secret',
    COINAGE_ADMIN_USERNAME: 'test-admin',
    COINAGE_ADMIN_PASSWORD: 'fixture-only-admin-password',
};

function composeConfig(overrides = {}) {
    // `config` only resolves configuration: no daemon, containers, volumes or real secrets.
    const result = spawnSync('docker', ['compose', '--env-file', '.env.production.example', '-f', 'docker-compose.prod.yml', 'config', '--format', 'json'], {
        cwd: path.resolve(__dirname, '..'),
        env: { ...process.env, ...productionEnvironment, ...overrides },
        encoding: 'utf8',
    });
    if (result.error) throw result.error;
    return result;
}

test('production uses matching release images and publishes only the web port', () => {
    const result = composeConfig();
    assert.equal(result.status, 0, result.stderr);
    const { services } = JSON.parse(result.stdout);
    assert.equal(services['coinage-api'].image, 'ghcr.io/xtry333/coinage-api:test-release');
    assert.equal(services['coinage-webapp'].image, 'ghcr.io/xtry333/coinage-webapp:test-release');
    assert.equal(services['coinage-db'].ports, undefined);
    assert.equal(services['coinage-api'].ports, undefined);
    assert.equal(services['coinage-webapp'].ports.length, 1);
    assert.equal(services['coinage-api'].environment.NODE_ENV, 'production');
    assert.equal(services['coinage-api'].environment.PG_HOST, 'coinage-db');
    assert.equal(services['coinage-api'].environment.PG_PORT, '5432');
    assert.equal(services['coinage-db'].environment.POSTGRES_PASSWORD, productionEnvironment.PG_PASSWORD);
    assert.equal(services['coinage-api'].environment.PG_PASSWORD, productionEnvironment.PG_PASSWORD);
});

test('production persists PostgreSQL and uploads under data/', () => {
    const result = composeConfig();
    assert.equal(result.status, 0, result.stderr);
    const { services } = JSON.parse(result.stdout);
    const [uploads] = services['coinage-api'].volumes;
    assert.equal(uploads.type, 'bind');
    assert.equal(uploads.target, '/app/api/uploads');
    assert.equal(uploads.source, path.resolve(__dirname, '../data/uploads'));
    const [database] = services['coinage-db'].volumes;
    assert.equal(database.target, '/var/lib/postgresql');
    assert.equal(database.source, path.resolve(__dirname, '../data/pg'));
    assert.match(services['coinage-db'].healthcheck.test[1], /POSTGRES_DB/);
});

for (const filename of ['docker-compose.yml', 'docker-compose.dev.yml']) {
    test(`${filename} uses the same data/ layout as Pi and production`, (t) => {
        const parent = path.join(os.tmpdir(), 'opencode');
        fs.mkdirSync(parent, { recursive: true });
        const root = fs.mkdtempSync(path.join(parent, 'coinage-local-compose-test-'));
        t.after(() => fs.rmSync(root, { recursive: true, force: true }));
        fs.copyFileSync(path.join(__dirname, '..', filename), path.join(root, 'compose.yaml'));
        fs.writeFileSync(path.join(root, '.env'), 'PG_PASSWORD=fixture-only\n');
        const environment = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(PG_|COINAGE_|COMPOSE_)/.test(key)));
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

for (const key of ['COINAGE_IMAGE_TAG', 'PG_PASSWORD', 'COINAGE_API_JWT_SECRET', 'COINAGE_ADMIN_USERNAME', 'COINAGE_ADMIN_PASSWORD']) {
    test(`production refuses an empty ${key} instead of using an insecure default`, () => {
        const result = composeConfig({ [key]: '' });
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, new RegExp(key));
    });
}
