const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const { databaseImage } = require('./pi-bundle.cjs');

const settings = {
    COMPOSE_PROJECT_NAME: 'coinage-pi-config-test',
    COINAGE_POSTGRES_DB: 'fixture-db',
    COINAGE_POSTGRES_USER: 'fixture-user',
    COINAGE_POSTGRES_PASSWORD: 'fixture-db-secret',
    COINAGE_POSTGRES_HOST: 'old-host',
    COINAGE_POSTGRES_PORT: '12345',
    COINAGE_API_PORT: '13333',
    COINAGE_WEBAPP_PORT: '14200',
    PORT: '19999',
    COINAGE_API_JWT_SECRET: 'fixture-jwt-secret',
    COINAGE_ADMIN_USERNAME: 'fixture-admin',
    COINAGE_ADMIN_PASSWORD: 'fixture-admin-secret',
    RECEIPT_AI_PROVIDER: 'ollama',
    OLLAMA_BASE_URL: 'http://fixture-ai:11434',
};

function setup(t, overrides = {}) {
    const parent = path.join(os.tmpdir(), 'opencode');
    fs.mkdirSync(parent, { recursive: true });
    const root = fs.mkdtempSync(path.join(parent, 'coinage-pi-compose-test-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    fs.copyFileSync(path.join(__dirname, '../docker-compose.pi.yml'), path.join(root, 'compose.yaml'));
    const envContent =
        Object.entries({ ...settings, ...overrides })
            .map(([key, value]) => `${key}=${value}`)
            .join('\n') + '\n';
    fs.writeFileSync(path.join(root, '.env'), envContent);
    // Do not read this checkout's real .env or inherit runtime secrets from the test host.
    const environment = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(PG_|COINAGE_|COMPOSE_|RECEIPT_|OLLAMA_)/.test(key)));
    return { root, environment, envContent };
}

function config(fixture) {
    // No env-file flag: verify plain `docker compose` reads the target folder's .env.
    const result = spawnSync('docker', ['compose', 'config', '--format', 'json'], { cwd: fixture.root, env: fixture.environment, encoding: 'utf8' });
    if (result.error) throw result.error;
    return result;
}

test('standalone Compose uses local latest ARM64 images, never pulls/builds, and reuses target .env at runtime', (t) => {
    const fixture = setup(t);
    const result = config(fixture);
    assert.equal(result.status, 0, result.stderr);
    const { name, services } = JSON.parse(result.stdout);
    assert.equal(name, settings.COMPOSE_PROJECT_NAME);
    assert.equal(services['coinage-api'].image, 'coinage-api:latest');
    assert.equal(services['coinage-webapp'].image, 'coinage-webapp:latest');
    assert.equal(services['coinage-db'].image, databaseImage);
    for (const service of Object.values(services)) {
        assert.equal(service.platform, 'linux/arm64');
        assert.equal(service.pull_policy, 'never');
        assert.equal(service.build, undefined);
    }
    const api = services['coinage-api'];
    assert.equal(api.environment.COINAGE_POSTGRES_PASSWORD, settings.COINAGE_POSTGRES_PASSWORD);
    assert.equal(api.environment.COINAGE_API_JWT_SECRET, settings.COINAGE_API_JWT_SECRET);
    assert.equal(api.environment.RECEIPT_AI_PROVIDER, settings.RECEIPT_AI_PROVIDER);
    assert.equal(api.environment.OLLAMA_BASE_URL, settings.OLLAMA_BASE_URL);
    assert.equal(api.environment.COINAGE_POSTGRES_HOST, 'coinage-db');
    assert.equal(api.environment.COINAGE_POSTGRES_PORT, '5432');
    assert.equal(api.environment.COINAGE_API_PORT, settings.COINAGE_API_PORT);
    assert.equal(services['coinage-webapp'].environment.COINAGE_API_PORT, settings.COINAGE_API_PORT);
    assert.equal(services['coinage-db'].environment.POSTGRES_PASSWORD, settings.COINAGE_POSTGRES_PASSWORD);
    assert.equal(api.ports, undefined);
    assert.equal(services['coinage-db'].ports[0].host_ip, undefined);
    assert.equal(services['coinage-db'].ports[0].published, settings.COINAGE_POSTGRES_PORT);
    assert.equal(services['coinage-db'].ports[0].target, 5432);
    assert.equal(services['coinage-webapp'].ports[0].published, settings.COINAGE_WEBAPP_PORT);
    assert.equal(services['coinage-webapp'].ports[0].target, 80);
    assert.equal(api.volumes[0].type, 'bind');
    assert.equal(api.volumes[0].source, path.join(fixture.root, 'data', 'uploads'));
    assert.equal(api.volumes[0].target, '/app/api/uploads');
    assert.equal(services['coinage-db'].volumes[0].type, 'bind');
    assert.equal(services['coinage-db'].volumes[0].source, path.join(fixture.root, 'data', 'pg'));
    assert.equal(services['coinage-db'].volumes[0].target, '/var/lib/postgresql');
    assert.equal(fs.readFileSync(path.join(fixture.root, '.env'), 'utf8'), fixture.envContent);
});

test('Pi Compose defaults empty ports consistently for the API, nginx upstream, web, and PostgreSQL', (t) => {
    const result = config(setup(t, { COINAGE_POSTGRES_PORT: '', COINAGE_API_PORT: '', COINAGE_WEBAPP_PORT: '' }));
    assert.equal(result.status, 0, result.stderr);
    const { services } = JSON.parse(result.stdout);
    assert.equal(services['coinage-db'].ports[0].published, '5432');
    assert.equal(services['coinage-api'].environment.COINAGE_POSTGRES_PORT, '5432');
    assert.equal(services['coinage-api'].environment.COINAGE_API_PORT, '3333');
    assert.equal(services['coinage-webapp'].environment.COINAGE_API_PORT, '3333');
    assert.equal(services['coinage-webapp'].ports[0].published, '4200');
});

for (const key of ['COINAGE_POSTGRES_PASSWORD', 'COINAGE_API_JWT_SECRET', 'COINAGE_ADMIN_USERNAME', 'COINAGE_ADMIN_PASSWORD']) {
    test(`Pi Compose requires ${key} from the target .env rather than supplying a baked-in/default secret`, (t) => {
        const result = config(setup(t, { [key]: '' }));
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, new RegExp(key));
    });
}
