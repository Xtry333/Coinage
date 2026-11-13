const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const { createBundlePlan, createBundle, bundleFiles, imageNames, sha256 } = require('./pi-bundle.cjs');
const { targets } = require('./project.json');
const { scripts } = require('../package.json');

function setup(t) {
    const parent = path.join(os.tmpdir(), 'opencode');
    fs.mkdirSync(parent, { recursive: true });
    const root = fs.mkdtempSync(path.join(parent, 'coinage-pi-bundle-test-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    fs.mkdirSync(path.join(root, 'docker'));
    fs.writeFileSync(path.join(root, 'docker-compose.pi.yml'), 'services:\r\n    coinage-api:\r\n        image: coinage-api:latest\r\n');
    fs.writeFileSync(path.join(root, 'docker/start-pi.sh'), '#!/bin/sh\r\necho start\r\n');
    fs.writeFileSync(path.join(root, 'docker/pi-README.md'), '# Pi bundle\r\n');
    fs.writeFileSync(path.join(root, '.env'), 'COINAGE_POSTGRES_PASSWORD=never-transfer-this-build-machine-secret\n');
    const calls = [];
    const docker = (args, options) => {
        calls.push({ args, options });
        if (args[0] === 'image' && args[1] === 'save') fs.writeFileSync(args[args.indexOf('--output') + 1], 'fake-image-archive');
    };
    return { root, calls, docker, log: () => undefined };
}

test('Pi plan always builds ARM64 local latest images and includes PostgreSQL without registry publishing or secrets', () => {
    const plan = createBundlePlan('folder with spaces/images.tar');
    assert.equal(plan.commands.length, 4);
    assert.deepEqual(imageNames, ['coinage-api:latest', 'coinage-webapp:latest', 'postgres:18.6-alpine']);
    for (const command of plan.commands) {
        assert.equal(command[command.indexOf('--platform') + 1], 'linux/arm64');
        assert.ok(!command.includes('--push'));
        assert.ok(!command.includes('--build-arg'));
        assert.ok(!command.includes('--secret'));
    }
    assert.deepEqual(plan.commands[2], ['pull', '--platform', 'linux/arm64', 'postgres:18.6-alpine']);
    assert.deepEqual(plan.commands[3], ['image', 'save', '--platform', 'linux/arm64', '--output', 'folder with spaces/images.tar', ...imageNames]);
    assert.equal(plan.commands[0][plan.commands[0].indexOf('--tag') + 1], 'coinage-api:latest');
    assert.equal(plan.commands[1][plan.commands[1].indexOf('--tag') + 1], 'coinage-webapp:latest');
});

test('creates exactly the five transferable files with checksums, Linux line endings, and no env/data', async (t) => {
    const fixture = setup(t);
    const destination = await createBundle(fixture);
    assert.equal(destination, path.join(fixture.root, 'dist', 'coinage-pi'));
    assert.deepEqual(fs.readdirSync(destination).sort(), [...bundleFiles].sort());
    assert.equal(fixture.calls.length, 4);
    assert.ok(fixture.calls.every(({ options }) => options.cwd === fixture.root));
    const checksumLines = fs.readFileSync(path.join(destination, 'SHA256SUMS'), 'utf8').trim().split('\n');
    assert.equal(checksumLines.length, 4);
    for (const line of checksumLines) {
        const [hash, filename] = line.split('  ');
        assert.equal(hash, await sha256(path.join(destination, filename)));
        assert.ok(!filename.includes('.env'));
    }
    for (const filename of ['start.sh', 'compose.yaml', 'README.md']) {
        const content = fs.readFileSync(path.join(destination, filename), 'utf8');
        assert.ok(!content.includes('\r'));
        assert.ok(!content.includes('never-transfer-this-build-machine-secret'));
    }
    assert.match(fs.readFileSync(path.join(fixture.root, '.env'), 'utf8'), /never-transfer/);
    assert.deepEqual(fs.readdirSync(path.join(fixture.root, 'dist')), ['coinage-pi']);
});

test('a later run replaces generated artifacts with the newest archive without user-managed versions', async (t) => {
    const fixture = setup(t);
    const destination = await createBundle(fixture);
    await createBundle({
        ...fixture,
        docker: (args) => {
            if (args[0] === 'image' && args[1] === 'save') fs.writeFileSync(args[args.indexOf('--output') + 1], 'newest-image-archive');
        },
    });
    assert.equal(fs.readFileSync(path.join(destination, 'images.tar'), 'utf8'), 'newest-image-archive');
    assert.match(fs.readFileSync(path.join(destination, 'SHA256SUMS'), 'utf8'), new RegExp(await sha256(path.join(destination, 'images.tar'))));
});

test('failed builds/exports leave the previous bundle intact and clean only their own staging directory', async (t) => {
    const fixture = setup(t);
    const destination = await createBundle(fixture);
    const previous = fs.readFileSync(path.join(destination, 'SHA256SUMS'), 'utf8');
    await assert.rejects(
        createBundle({
            ...fixture,
            docker: (args) => {
                if (args[0] === 'image' && args[1] === 'save') {
                    fs.writeFileSync(args[args.indexOf('--output') + 1], 'partial archive');
                    throw new Error('export failed');
                }
            },
        }),
        /export failed/,
    );
    assert.equal(fs.readFileSync(path.join(destination, 'images.tar'), 'utf8'), 'fake-image-archive');
    assert.equal(fs.readFileSync(path.join(destination, 'SHA256SUMS'), 'utf8'), previous);
    assert.deepEqual(fs.readdirSync(path.join(fixture.root, 'dist')), ['coinage-pi']);
});

test('refuses an output folder containing .env or user data rather than deleting or accidentally transferring it', async (t) => {
    const fixture = setup(t);
    const destination = path.join(fixture.root, 'dist/coinage-pi');
    fs.mkdirSync(destination, { recursive: true });
    fs.writeFileSync(path.join(destination, '.env'), 'keep-target-secret');
    await assert.rejects(createBundle(fixture), /unexpected entry: .env/);
    assert.equal(fixture.calls.length, 0);
    assert.equal(fs.readFileSync(path.join(destination, '.env'), 'utf8'), 'keep-target-secret');
});

test('rejects empty archives and cleans up incomplete output', async (t) => {
    const fixture = setup(t);
    await assert.rejects(
        createBundle({
            ...fixture,
            docker: (args) => {
                if (args[0] === 'image' && args[1] === 'save') fs.writeFileSync(args[args.indexOf('--output') + 1], '');
            },
        }),
        /empty image archive/,
    );
    assert.deepEqual(fs.readdirSync(path.join(fixture.root, 'dist')), []);
});

test('dry-run does not execute Docker, export files, or read/copy an env file', async (t) => {
    const fixture = setup(t);
    const lines = [];
    await createBundle({ ...fixture, dryRun: true, log: (line) => lines.push(line) });
    assert.equal(fixture.calls.length, 0);
    assert.ok(!fs.existsSync(path.join(fixture.root, 'dist')));
    assert.ok(lines.some((line) => line.includes('image save --platform linux/arm64')));
    assert.ok(!lines.join('\n').includes('never-transfer-this-build-machine-secret'));
});

test('one command packages production builds and cannot be skipped through Nx caching', () => {
    assert.equal(scripts['build:pi'], 'nx run coinage-tools:docker-bundle-pi');
    const target = targets['docker-bundle-pi'];
    assert.equal(target.cache, false);
    assert.equal(target.defaultConfiguration, 'production');
    assert.deepEqual(target.dependsOn, [{ projects: ['coinage-api', 'coinage-webapp'], target: 'build' }]);
});
