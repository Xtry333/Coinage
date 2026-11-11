const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { parseArgs } = require('node:util');

const { buildImages } = require('./docker-images.cjs');

const workspaceRoot = path.resolve(__dirname, '..');
const platform = 'linux/arm64';
const databaseImage = 'postgres:18.6-alpine';
const imageNames = ['coinage-api:latest', 'coinage-webapp:latest', databaseImage];
const assets = { 'compose.yaml': 'docker-compose.pi.yml', 'start.sh': 'docker/start-pi.sh', 'README.md': 'docker/pi-README.md' };
const bundleFiles = ['images.tar', ...Object.keys(assets), 'SHA256SUMS'];

function createBundlePlan(archive) {
    return {
        commands: [
            ...['api', 'webapp'].map((image) => [
                'buildx',
                'build',
                '--platform',
                platform,
                '--load',
                '--tag',
                `coinage-${image}:latest`,
                '--file',
                `docker/${image}.Dockerfile`,
                '.',
            ]),
            ['pull', '--platform', platform, databaseImage],
            ['image', 'save', '--platform', platform, '--output', archive, ...imageNames],
        ],
    };
}

function checkDestination(destination) {
    if (!fs.existsSync(destination)) return;
    if (!fs.lstatSync(destination).isDirectory() || fs.lstatSync(destination).isSymbolicLink()) throw new Error('Bundle output must be a regular directory.');
    for (const name of fs.readdirSync(destination)) {
        const entry = fs.lstatSync(path.join(destination, name));
        if (!bundleFiles.includes(name) || !entry.isFile() || entry.isSymbolicLink()) {
            throw new Error(
                `Refusing to overwrite bundle output containing an unexpected entry: ${name}. Keep .env and persistent data only on the target Pi.`,
            );
        }
    }
}

async function sha256(filename) {
    const hash = createHash('sha256');
    for await (const chunk of fs.createReadStream(filename)) hash.update(chunk);
    return hash.digest('hex');
}

function runDocker(args, options) {
    const result = spawnSync('docker', args, { ...options, stdio: 'inherit' });
    if (result.error) throw new Error(`Cannot run Docker: ${result.error.message}`);
    if (result.status !== 0) throw new Error(`Docker command failed (${result.signal || result.status}).`);
}

async function createBundle({ root = workspaceRoot, docker = runDocker, log = console.log, dryRun = false } = {}) {
    const destination = path.join(root, 'dist', 'coinage-pi');
    checkDestination(destination);
    if (dryRun) {
        buildImages({ ...createBundlePlan(path.join(destination, 'images.tar')), dryRun: true }, docker, log);
        log(`Would write ${bundleFiles.join(', ')} to ${destination}. No .env files or data are copied.`);
        return destination;
    }

    fs.mkdirSync(path.dirname(destination), { recursive: true });
    const staging = fs.mkdtempSync(path.join(path.dirname(destination), '.coinage-pi-'));
    try {
        // Whitelist deployment assets. Never read/copy any build machine .env or data.
        for (const [name, source] of Object.entries(assets)) {
            fs.writeFileSync(path.join(staging, name), fs.readFileSync(path.join(root, source), 'utf8').replace(/\r\n/g, '\n'));
        }
        const archive = path.join(staging, 'images.tar');
        buildImages(createBundlePlan(archive), (args) => docker(args, { cwd: root }), log);
        if (!fs.statSync(archive).isFile() || fs.statSync(archive).size === 0) throw new Error('Docker produced an empty image archive.');
        const checksums = [];
        for (const name of bundleFiles.filter((name) => name !== 'SHA256SUMS')) {
            checksums.push(`${await sha256(path.join(staging, name))}  ${name}`);
        }
        fs.writeFileSync(path.join(staging, 'SHA256SUMS'), `${checksums.join('\n')}\n`);

        // A failed build/export leaves the previous bundle intact. Only generated
        // files are replaced after all images and assets are ready.
        checkDestination(destination);
        fs.mkdirSync(destination, { recursive: true });
        for (const name of bundleFiles) fs.renameSync(path.join(staging, name), path.join(destination, name));
        log(`Pi bundle ready: ${destination}`);
        log('Copy its five files into the target folder, keep the existing .env/data, then run: sh start.sh');
        return destination;
    } finally {
        fs.rmSync(staging, { recursive: true, force: true });
    }
}

if (require.main === module) {
    (async () => {
        const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean' }, help: { type: 'boolean', short: 'h' } } });
        if (values.help)
            console.log('Usage: yarn build:pi [--dry-run]\nBuilds a self-contained ARM64 bundle in dist/coinage-pi, using local latest images and no secrets.');
        else await createBundle({ dryRun: values['dry-run'] });
    })().catch((error) => {
        console.error(`Pi bundle failed: ${error.message}`);
        process.exitCode = 1;
    });
}

module.exports = { createBundlePlan, createBundle, bundleFiles, imageNames, databaseImage, sha256 };
