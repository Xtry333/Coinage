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

test('local builds load both images with local Compose aliases and consistent GHCR names', () => {
    const plan = createPlan(['build'], {});
    assert.deepEqual(plan.commands, [
        ['buildx', 'build', '--load', '--tag', 'ghcr.io/xtry333/coinage-api:dev', '--tag', 'coinage-api:latest', '--file', 'docker/api.Dockerfile', '.'],
        [
            'buildx',
            'build',
            '--load',
            '--tag',
            'ghcr.io/xtry333/coinage-webapp:dev',
            '--tag',
            'coinage-webapp:latest',
            '--file',
            'docker/webapp.Dockerfile',
            '.',
        ],
    ]);
    assert.equal(plan.dryRun, false);
});

test('publishing builds ARM64 images directly into the same versioned namespace used by Compose', () => {
    const plan = createPlan(['publish', '--tag', '2026.11.10-1'], {});
    assert.equal(plan.commands.length, 2);
    for (const command of plan.commands) {
        assert.ok(command.includes('--push'));
        assert.ok(!command.includes('--load'));
        assert.equal(command[command.indexOf('--platform') + 1], 'linux/arm64');
        assert.equal(command.filter((arg) => arg === '--tag').length, 1);
        assert.match(command[command.indexOf('--tag') + 1], /^ghcr\.io\/xtry333\/coinage-(api|webapp):2026\.11\.10-1$/);
    }
});

test('supports explicit ARM64 local builds, individual images, and environment configuration', () => {
    const plan = createPlan(['build', '--image=api', '--platform=linux/arm64'], { COINAGE_REGISTRY_USER: 'test-org', COINAGE_IMAGE_TAG: 'commit-abc123' });
    assert.equal(plan.commands.length, 1);
    assert.ok(plan.commands[0].includes('linux/arm64'));
    assert.ok(plan.commands[0].includes('ghcr.io/test-org/coinage-api:commit-abc123'));
    const published = createPlan(['publish', '--image', 'webapp'], { COINAGE_IMAGE_TAG: 'v1' });
    assert.equal(published.commands.length, 1);
    assert.ok(published.commands[0].includes('ghcr.io/xtry333/coinage-webapp:v1'));
});

test('CLI tag takes precedence over the environment and multi-platform publishing is supported', () => {
    const plan = createPlan(['publish', '--tag=v2', '--platform=linux/arm64,linux/amd64'], { COINAGE_IMAGE_TAG: 'v1' });
    assert.ok(plan.commands[0].includes('ghcr.io/xtry333/coinage-api:v2'));
    assert.ok(plan.commands[0].includes('linux/arm64,linux/amd64'));
});

test('rejects missing/mutable release tags and invalid registry names before Docker runs', () => {
    for (const tag of ['', 'latest', 'dev', '-invalid', 'with spaces', 'name/branch', 'x'.repeat(129)]) {
        assert.throws(() => createPlan(['publish', '--tag', tag], {}), /tag/);
    }
    for (const namespace of ['Xtry333', '', 'user/name', 'user;echo', '-user']) {
        assert.throws(() => createPlan(['build'], { COINAGE_REGISTRY_USER: namespace }), /lowercase/);
    }
});

test('rejects unsupported arguments, image names, and invalid platform/export combinations', () => {
    assert.throws(() => createPlan(['push'], {}), /Usage/);
    assert.throws(() => createPlan(['build', 'extra'], {}), /Usage/);
    assert.throws(() => createPlan(['build', '--unknown'], {}), /Unknown option/);
    assert.throws(() => createPlan(['build', '--image', 'other'], {}), /--image/);
    assert.throws(() => createPlan(['build', '--platform', 'windows/amd64'], {}), /--platform/);
    assert.throws(() => createPlan(['build', '--platform', 'linux/amd64,linux/arm64'], {}), /one platform/);
    assert.throws(() => createPlan(['build', '--image', 'api', '--image', 'webapp'], {}), /only be specified once/);
    assert.throws(() => createPlan(['publish', '--tag', 'v1', '--tag', 'v2'], {}), /only be specified once/);
});

test('dry runs and help never run Docker', () => {
    const plan = createPlan(['publish', '--tag', 'v1', '--dry-run'], {});
    const lines = [];
    buildImages(
        plan,
        () => assert.fail('Docker must not run'),
        (line) => lines.push(line),
    );
    assert.equal(lines.length, 2);
    assert.match(lines[0], /docker buildx build --push --platform linux\/arm64/);
    assert.deepEqual(createPlan(['--help'], {}), { help: true });
});

test('runs commands sequentially and stops after a failed image build', () => {
    const plan = createPlan(['publish', '--tag', 'v1'], {});
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

test('every Docker Nx target builds the corresponding apps in production and never caches a push', () => {
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
    for (const [name, command] of Object.entries(scripts).filter(([name]) => /^(build:docker|docker:(build|publish|push))/.test(name))) {
        assert.match(command, /^nx run coinage-tools:docker-(build|publish)/, name);
        assert.ok(!command.includes('npm_config_user'), name);
    }
});
