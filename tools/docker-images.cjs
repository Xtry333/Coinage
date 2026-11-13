const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { parseArgs: parseNodeArgs } = require('node:util');

const workspaceRoot = path.resolve(__dirname, '..');
const usage = `Usage: yarn build:docker [--image api|webapp|all] [--platform linux/arm64|linux/amd64]

Nx builds the required applications in production mode before running Docker.
Builds load coinage-api:latest and coinage-webapp:latest into local Docker.
Without --platform, Docker uses the builder's native platform.
--dry-run prints Docker commands without running them; Nx still builds the applications.`;

function createPlan(args) {
    const { values, positionals, tokens } = parseNodeArgs({
        args,
        allowPositionals: true,
        tokens: true,
        options: {
            image: { type: 'string', default: 'all' },
            platform: { type: 'string' },
            'dry-run': { type: 'boolean', default: false },
            help: { type: 'boolean', short: 'h' },
        },
    });
    if (values.help) return { help: true };
    const seen = new Set();
    for (const token of tokens.filter((token) => token.kind === 'option')) {
        if (seen.has(token.name)) throw new Error(`--${token.name} can only be specified once.`);
        seen.add(token.name);
    }
    const [action] = positionals;
    if (positionals.length !== 1 || action !== 'build') throw new Error(usage);
    if (!['all', 'api', 'webapp'].includes(values.image)) throw new Error('--image must be api, webapp, or all.');

    const platform = values.platform;
    if (platform !== undefined && !/^linux\/(?:arm64|amd64)$/.test(platform)) {
        throw new Error('--platform must specify one platform: linux/arm64 or linux/amd64.');
    }

    const images = values.image === 'all' ? ['api', 'webapp'] : [values.image];
    const commands = images.map((image) => {
        const command = ['buildx', 'build', '--load'];
        if (platform) command.push('--platform', platform);
        command.push('--tag', `coinage-${image}:latest`);
        command.push('--file', `docker/${image}.Dockerfile`, '.');
        return command;
    });
    return { commands, dryRun: values['dry-run'] };
}

function runDocker(args) {
    const result = spawnSync('docker', args, { cwd: workspaceRoot, stdio: 'inherit' });
    if (result.error) throw new Error(`Cannot run Docker: ${result.error.message}`);
    if (result.status !== 0) throw new Error(`Docker build failed (${result.signal || result.status}).`);
}

function buildImages(plan, docker = runDocker, log = console.log) {
    for (const command of plan.commands) {
        log(`docker ${command.join(' ')}`);
        if (!plan.dryRun) docker(command);
    }
}

if (require.main === module) {
    try {
        const plan = createPlan(process.argv.slice(2));
        if (plan.help) console.log(usage);
        else buildImages(plan);
    } catch (error) {
        console.error(`Docker workflow failed: ${error.message}`);
        process.exitCode = 1;
    }
}

module.exports = { createPlan, buildImages };
