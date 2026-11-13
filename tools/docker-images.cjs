const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { parseArgs: parseNodeArgs } = require('node:util');

const workspaceRoot = path.resolve(__dirname, '..');
const usage = `Usage: yarn build:docker [--platform linux/arm64] [--tag dev]
       yarn docker:publish --tag <release-or-commit> [--platform linux/arm64,linux/amd64]

Nx builds the required applications in production mode before running Docker.
Publish defaults to linux/arm64 and requires --tag or COINAGE_IMAGE_TAG (not latest).
COINAGE_REGISTRY_USER selects the lowercase GHCR namespace (default: xtry333).
Build loads images locally; publish builds and pushes directly, never retags old images.
--dry-run prints Docker commands without running them; Nx still builds the applications.`;

function createPlan(args, environment = process.env) {
    const { values, positionals, tokens } = parseNodeArgs({
        args,
        allowPositionals: true,
        tokens: true,
        options: {
            image: { type: 'string', default: 'all' },
            tag: { type: 'string' },
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
    if (positionals.length !== 1 || !['build', 'publish'].includes(action)) throw new Error(usage);
    if (!['all', 'api', 'webapp'].includes(values.image)) throw new Error('--image must be api, webapp, or all.');

    const namespace = environment.COINAGE_REGISTRY_USER ?? 'xtry333';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(namespace)) throw new Error('COINAGE_REGISTRY_USER must be a lowercase GitHub username or organization.');
    const publish = action === 'publish';
    const tag = values.tag ?? environment.COINAGE_IMAGE_TAG ?? (publish ? '' : 'dev');
    if (!/^[a-zA-Z0-9_][a-zA-Z0-9_.-]{0,127}$/.test(tag) || (publish && ['latest', 'dev'].includes(tag))) {
        throw new Error('Specify a release/commit tag with --tag or COINAGE_IMAGE_TAG; publishing latest/dev is not supported.');
    }
    const platform = values.platform ?? (publish ? 'linux/arm64' : undefined);
    if (platform && !/^linux\/(?:arm64|amd64)(?:,linux\/(?:arm64|amd64))*$/.test(platform)) {
        throw new Error('--platform must be linux/arm64, linux/amd64, or both separated by a comma.');
    }
    if (!publish && platform?.includes(',')) throw new Error('Local --load builds support one platform; use publish for multi-platform images.');

    const images = values.image === 'all' ? ['api', 'webapp'] : [values.image];
    const commands = images.map((image) => {
        const command = ['buildx', 'build', publish ? '--push' : '--load'];
        if (platform) command.push('--platform', platform);
        command.push('--tag', `ghcr.io/${namespace}/coinage-${image}:${tag}`);
        if (!publish) command.push('--tag', `coinage-${image}:latest`);
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
