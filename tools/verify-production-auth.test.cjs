const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const { verifyProductionAuth } = require('./verify-production-auth.cjs');
const { targets } = require('../packages/coinage-webapp/project.json');

function createOutputs(t) {
    const parent = path.join(os.tmpdir(), 'opencode');
    fs.mkdirSync(parent, { recursive: true });
    const root = fs.mkdtempSync(path.join(parent, 'coinage-production-auth-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    for (const project of ['coinage-api', 'coinage-webapp']) {
        const directory = path.join(root, 'dist/packages', project);
        fs.mkdirSync(directory, { recursive: true });
        fs.writeFileSync(path.join(directory, 'main.js'), 'console.log("production");');
    }
    fs.writeFileSync(path.join(root, 'dist/packages/coinage-webapp/index.html'), '<app-root></app-root>');
    return root;
}

test('accepts production bundles without development authentication', (t) => {
    assert.equal(verifyProductionAuth(createOutputs(t)), 3);
});

test('permits empty production registration lists without the development controller', (t) => {
    const root = createOutputs(t);
    fs.writeFileSync(path.join(root, 'dist/packages/coinage-api/main.js'), 'exports.developmentAuthControllers = [];');

    assert.equal(verifyProductionAuth(root), 3);
});

for (const marker of ['/api/auth/forced-login', 'COINAGE_FORCED_LOGIN', 'forcedLogin()', 'Forced development login', 'DevelopmentAuthController']) {
    test(`rejects production JavaScript containing ${marker}`, (t) => {
        const root = createOutputs(t);
        fs.writeFileSync(path.join(root, 'dist/packages/coinage-api/main.js'), JSON.stringify(marker));

        assert.throws(() => verifyProductionAuth(root), /Development authentication found/);
    });
}

test('also scans nested browser chunks and emitted source maps', (t) => {
    const root = createOutputs(t);
    const directory = path.join(root, 'dist/packages/coinage-webapp/chunks');
    fs.mkdirSync(directory);
    fs.writeFileSync(path.join(directory, 'main.js.map'), JSON.stringify({ sourcesContent: ['COINAGE_FORCED_LOGIN'] }));

    assert.throws(() => verifyProductionAuth(root), /main\.js\.map/);
});

test('fails closed when an application has not been built', (t) => {
    const root = createOutputs(t);
    fs.unlinkSync(path.join(root, 'dist/packages/coinage-api/main.js'));

    assert.throws(() => verifyProductionAuth(root), /Missing production output/);
});

test('does not accept an empty browser build', (t) => {
    const root = createOutputs(t);
    fs.unlinkSync(path.join(root, 'dist/packages/coinage-webapp/main.js'));

    assert.throws(() => verifyProductionAuth(root), /Missing production JavaScript/);
});

test('production web builds replace the development provider entry point', () => {
    assert.ok(
        targets.build.configurations.production.fileReplacements.some(
            ({ replace, with: replacement }) =>
                replace === 'packages/coinage-webapp/src/app/auth/development-auth.ts' &&
                replacement === 'packages/coinage-webapp/src/app/auth/development-auth.prod.ts',
        ),
    );
    assert.equal(targets.build.configurations.development.fileReplacements, undefined);
});

test('only production API builds replace the development controller registration', () => {
    const directory = path.join(__dirname, '../packages/coinage-api');
    const source = fs.readFileSync(path.join(directory, 'webpack.config.js'), 'utf8');
    for (const production of [false, true]) {
        const context = {
            __dirname: directory,
            module: { exports: {} },
            process: { env: { NODE_ENV: production ? 'production' : 'development' } },
            require: (id) =>
                id === 'node:path'
                    ? path
                    : {
                          NxAppWebpackPlugin: class {
                              constructor(options) {
                                  this.options = options;
                              }
                          },
                      },
        };
        vm.runInNewContext(source, context);
        const { fileReplacements } = context.module.exports().plugins[0].options;
        assert.equal(
            fileReplacements.some(
                ({ replace, with: replacement }) =>
                    replace === path.join(directory, 'src/app/auth/development-auth.ts') &&
                    replacement === path.join(directory, 'src/app/auth/development-auth.prod.ts'),
            ),
            production,
        );
    }
});
