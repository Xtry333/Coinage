const assert = require('node:assert/strict');
const { test } = require('node:test');

const { createPlan, buildImages } = require('./docker-images.cjs');
const { targets } = require('./project.json');
const common = require('../libs/common/project.json');
const units = require('../libs/common/src/lib/units/project.json');
const interfaces = require('../libs/interfaces/project.json');
const nxConfig = require('../nx.json');
const { scripts } = require('../package.json');
const { targets: apiTargets } = require('../packages/coinage-api/project.json');
const { compilerOptions } = require('../tsconfig.base.json');

test('shared libraries are registered and source/dependency changes participate in build hashes', () => {
    assert.equal(nxConfig.pluginsConfig['@nx/js'].analyzeSourceFiles, true);
    assert.equal(nxConfig.pluginsConfig['@nx/js'].analyzePackageJson, true);
    for (const input of ['^default', '{workspaceRoot}/package.json', '{workspaceRoot}/yarn.lock']) {
        assert.ok(nxConfig.targetDefaults.build.inputs.includes(input));
    }
    for (const [alias, project] of [
        ['@app/common', common],
        ['@app/common-units', units],
        ['@app/interfaces', interfaces],
    ]) {
        assert.equal(project.projectType, 'library');
        assert.equal(compilerOptions.paths[alias][0], `${project.sourceRoot}/index.ts`);
    }
});

test('local builds load both images with only the local Compose names', () => {
    const plan = createPlan(['build']);
    assert.deepEqual(plan.commands, [
        ['buildx', 'build', '--load', '--tag', 'coinage-api:latest', '--file', 'docker/api.Dockerfile', '.'],
        ['buildx', 'build', '--load', '--tag', 'coinage-webapp:latest', '--file', 'docker/webapp.Dockerfile', '.'],
    ]);
    assert.equal(plan.dryRun, false);
});

test('supports explicit ARM64 and AMD64 local builds and individual images', () => {
    for (const platform of ['linux/arm64', 'linux/amd64']) {
        for (const image of ['api', 'webapp']) {
            const plan = createPlan(['build', `--image=${image}`, `--platform=${platform}`]);
            assert.deepEqual(plan.commands, [
                ['buildx', 'build', '--load', '--platform', platform, '--tag', `coinage-${image}:latest`, '--file', `docker/${image}.Dockerfile`, '.'],
            ]);
        }
    }
});

test('rejects unsupported arguments, image names, and invalid platform/export combinations', () => {
    assert.throws(() => createPlan(['publish']), /Usage/);
    assert.throws(() => createPlan(['push']), /Usage/);
    assert.throws(() => createPlan(['build', 'extra']), /Usage/);
    for (const option of ['--unknown', '--push', '--tag']) {
        assert.throws(() => createPlan(['build', option]), /Unknown option/);
    }
    assert.throws(() => createPlan(['build', '--image', 'other']), /--image/);
    for (const platform of ['', 'windows/amd64', 'linux/amd64,linux/arm64']) {
        assert.throws(() => createPlan(['build', '--platform', platform]), /--platform/);
    }
    assert.throws(() => createPlan(['build', '--image', 'api', '--image', 'webapp']), /only be specified once/);
    assert.throws(() => createPlan(['build', '--platform', 'linux/arm64', '--platform', 'linux/amd64']), /only be specified once/);
});

test('dry runs and help never run Docker', () => {
    const plan = createPlan(['build', '--platform', 'linux/arm64', '--dry-run']);
    const lines = [];
    buildImages(
        plan,
        () => assert.fail('Docker must not run'),
        (line) => lines.push(line),
    );
    assert.equal(lines.length, 2);
    assert.match(lines[0], /docker buildx build --load --platform linux\/arm64/);
    assert.deepEqual(createPlan(['--help']), { help: true });
});

test('runs commands sequentially and stops after a failed image build', () => {
    const plan = createPlan(['build']);
    const calls = [];
    buildImages(
        plan,
        (command) => calls.push(command),
        () => undefined,
    );
    assert.deepEqual(calls, plan.commands);
    let count = 0;
    assert.throws(
        () =>
            buildImages(
                plan,
                () => {
                    count++;
                    throw new Error('build failed');
                },
                () => undefined,
            ),
        /build failed/,
    );
    assert.equal(count, 1);
});

test('every Docker Nx target builds the corresponding apps in production and never caches Docker operations', () => {
    for (const [name, target] of Object.entries(targets).filter(([name]) => name.startsWith('docker-'))) {
        assert.equal(target.cache, false, name);
        assert.equal(target.defaultConfiguration, 'production', name);
        assert.deepEqual(target.configurations.production, {}, name);
        const expected = name.endsWith('-api') ? ['coinage-api'] : name.endsWith('-webapp') ? ['coinage-webapp'] : ['coinage-api', 'coinage-webapp'];
        assert.deepEqual(target.dependsOn, [{ projects: expected, target: 'build' }], name);
    }
    // Nx dependency tasks use their own default when the parent configuration is implicit.
    assert.equal(apiTargets.build.defaultConfiguration, 'production');
    assert.equal(apiTargets.serve.options.buildTarget, 'coinage-api:build:development');
    for (const [name, command] of Object.entries(scripts).filter(([name]) => /^(build:docker|docker:build)/.test(name))) {
        assert.match(command, /^nx run coinage-tools:docker-build/, name);
    }
});

test('only local builds and the Pi bundle are exposed as Docker Nx targets', () => {
    assert.deepEqual(
        Object.keys(targets).filter((name) => name.startsWith('docker-')).sort(),
        ['docker-build', 'docker-build-api', 'docker-build-webapp', 'docker-bundle-pi'],
    );
    assert.ok(!Object.keys(scripts).some((name) => /^docker:(publish|push|prod:|buildx-push)/.test(name)));
});
