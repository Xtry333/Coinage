const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const ports = require('./ports.cjs');
const { createServeArgs } = require('./serve-webapp.cjs');
const { targets } = require('../packages/coinage-webapp/project.json');

test('native ports retain defaults, use configured values, and support the legacy API PORT fallback', () => {
    assert.equal(ports.getApiPort({}), 3333);
    assert.equal(ports.getWebappPort({}), 4200);
    assert.equal(ports.getApiPort({ COINAGE_API_PORT: '', PORT: '' }), 3333);
    assert.equal(ports.getWebappPort({ COINAGE_WEBAPP_PORT: '' }), 4200);
    assert.equal(ports.getApiPort({ COINAGE_API_PORT: '13333', PORT: '19999' }), 13333);
    assert.equal(ports.getApiPort({ PORT: '13334' }), 13334);
    assert.equal(ports.getWebappPort({ COINAGE_WEBAPP_PORT: '14200' }), 14200);
});

test('invalid configured ports fail rather than silently starting on another port', () => {
    for (const value of ['0', '-1', '65536', '1.5', '3333junk', 'not-a-port', ' ']) {
        assert.throws(() => ports.getApiPort({ COINAGE_API_PORT: value }), /COINAGE_API_PORT/);
        assert.throws(() => ports.getWebappPort({ COINAGE_WEBAPP_PORT: value }), /COINAGE_WEBAPP_PORT/);
    }
    assert.throws(() => ports.getApiPort({ PORT: 'invalid' }), /PORT/);
});

test('loads the root .env without overwriting shell values, and tolerates a missing .env', (t) => {
    const parent = path.join(os.tmpdir(), 'opencode');
    fs.mkdirSync(parent, { recursive: true });
    const root = fs.mkdtempSync(path.join(parent, 'coinage-ports-test-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    assert.deepEqual(ports.loadEnvironment(root, {}), {});
    fs.writeFileSync(path.join(root, '.env'), 'COINAGE_API_PORT=13333\nCOINAGE_WEBAPP_PORT=14200\n');
    const environment = ports.loadEnvironment(root, { COINAGE_WEBAPP_PORT: '14201' });
    assert.equal(ports.getApiPort(environment), 13333);
    assert.equal(ports.getWebappPort(environment), 14201);
});

test('the Nx webapp launcher passes the configured port to Angular in both configurations', () => {
    for (const configuration of ['development', 'production']) {
        assert.deepEqual(createServeArgs(configuration, [], { COINAGE_WEBAPP_PORT: '14200' }), [
            'run',
            `coinage-webapp:serve-angular:${configuration}`,
            '--port=14200',
        ]);
    }
    assert.deepEqual(createServeArgs('development', [], {}), ['run', 'coinage-webapp:serve-angular:development', '--port=4200']);
    assert.deepEqual(createServeArgs('development', ['--port=14201', '--host=0.0.0.0'], {}), [
        'run',
        'coinage-webapp:serve-angular:development',
        '--port=14201',
        '--host=0.0.0.0',
    ]);
    assert.deepEqual(createServeArgs('development', ['--port', '14202'], {}), ['run', 'coinage-webapp:serve-angular:development', '--port', '14202']);
    assert.throws(() => createServeArgs('other', [], {}), /configuration/);
});

test('the public Nx serve target uses the environment-aware launcher for both configurations', () => {
    assert.equal(targets.serve.executor, 'nx:run-commands');
    assert.equal(targets.serve.options.command, 'node tools/serve-webapp.cjs development');
    for (const configuration of ['development', 'production']) {
        assert.equal(targets.serve.configurations[configuration].command, `node tools/serve-webapp.cjs ${configuration}`);
    }
    assert.equal(targets.serve.readyWhen.logMatches, 'Local:');
    assert.equal(targets['serve-angular'].executor, '@angular/build:dev-server');
    assert.equal(targets['serve-angular'].options.proxyConfig, 'packages/coinage-webapp/proxy.conf.cjs');
});

test('the actual dev proxy uses the configured API port for REST and both WebSocket paths', () => {
    const source = fs.readFileSync(path.join(__dirname, '../packages/coinage-webapp/proxy.conf.cjs'), 'utf8');
    for (const environment of [{ COINAGE_API_PORT: '13333' }, { PORT: '13334' }, {}]) {
        const context = {
            module: { exports: {} },
            require: () => ({ getApiPort: () => ports.getApiPort(environment), loadEnvironment: () => environment }),
        };
        vm.runInNewContext(source, context);
        const proxy = context.module.exports;
        const port = ports.getApiPort(environment);
        assert.equal(proxy['/api/**'].target, `http://localhost:${port}`);
        for (const route of ['/ws/**', '/socket.io/**']) {
            assert.equal(proxy[route].target, `ws://localhost:${port}`);
            assert.equal(proxy[route].ws, true);
        }
    }
});

test('nginx renders only its API port at runtime and leaves nginx request variables intact', () => {
    const dockerfile = fs.readFileSync(path.join(__dirname, '../docker/webapp.Dockerfile'), 'utf8');
    const template = fs.readFileSync(path.join(__dirname, '../nginx.conf.template'), 'utf8');
    assert.match(dockerfile, /FROM nginx:alpine/);
    assert.match(dockerfile, /NGINX_ENVSUBST_OUTPUT_DIR=\/etc\/nginx/);
    assert.match(dockerfile, /NGINX_ENVSUBST_FILTER=\^COINAGE_API_PORT\$/m);
    assert.match(dockerfile, /COPY nginx\.conf\.template \/etc\/nginx\/templates\/nginx\.conf\.template/);
    assert.match(template, /server coinage-api:\$\{COINAGE_API_PORT\};/);
    for (const variable of ['$http_upgrade', '$connection_upgrade', '$host', '$remote_addr', '$uri']) {
        assert.ok(template.includes(variable));
    }
});
