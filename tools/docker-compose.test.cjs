const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const cases = ['docker-compose.yml', 'docker-compose.dev.yml'].flatMap((filename) => [false, true].map((customPorts) => ({ filename, customPorts })));

for (const { filename, customPorts } of cases) {
    test(`${filename} uses the shared data/ layout and ${customPorts ? 'configured' : 'default'} ports`, (t) => {
        const parent = path.join(os.tmpdir(), 'opencode');
        fs.mkdirSync(parent, { recursive: true });
        const root = fs.mkdtempSync(path.join(parent, 'coinage-local-compose-test-'));
        t.after(() => fs.rmSync(root, { recursive: true, force: true }));
        fs.copyFileSync(path.join(__dirname, '..', filename), path.join(root, 'compose.yaml'));
        const ports = customPorts
            ? { COINAGE_POSTGRES_PORT: '15432', COINAGE_API_PORT: '13333', COINAGE_WEBAPP_PORT: '14200' }
            : { COINAGE_POSTGRES_PORT: '', COINAGE_API_PORT: '', COINAGE_WEBAPP_PORT: '' };
        const envContent =
            Object.entries({ COINAGE_POSTGRES_PASSWORD: 'fixture-only', ...ports })
                .map(([name, value]) => `${name}=${value}`)
                .join('\n') + '\n';
        fs.writeFileSync(path.join(root, '.env'), envContent);
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
        assert.equal(services['coinage-db'].ports[0].published, ports.COINAGE_POSTGRES_PORT || '5432');
        assert.equal(services['coinage-db'].ports[0].target, 5432);
        if (services['coinage-api']) {
            const apiPort = ports.COINAGE_API_PORT || '3333';
            assert.equal(services['coinage-api'].environment.COINAGE_API_PORT, apiPort);
            assert.equal(services['coinage-api'].ports[0].published, apiPort);
            assert.equal(services['coinage-api'].ports[0].target, Number(apiPort));
            assert.equal(services['coinage-api'].environment.COINAGE_POSTGRES_PORT, '5432');
            assert.equal(services['coinage-webapp'].environment.COINAGE_API_PORT, apiPort);
            assert.equal(services['coinage-webapp'].ports[0].published, ports.COINAGE_WEBAPP_PORT || '4200');
            assert.equal(services['coinage-webapp'].ports[0].target, 80);
            const [uploads] = services['coinage-api'].volumes;
            assert.equal(uploads.type, 'bind');
            assert.equal(uploads.source, path.join(root, 'data', 'uploads'));
            assert.equal(uploads.target, '/app/api/uploads');
        }
    });
}
