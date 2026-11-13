const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const dotenv = require('dotenv');

const workspaceRoot = path.resolve(__dirname, '..');
const usage = `Usage: yarn db:dump [--output <file.dump>] [--container <name-or-id>]

Creates a PostgreSQL custom-format archive in backups/ by default.
Detects this checkout's running coinage-db container and reads PG_* settings
from the environment or .env, falling back to the container's POSTGRES_* values.
Existing output files are never overwritten. Receipt uploads are not included.`;

function parseArgs(args) {
    const options = {};
    for (let index = 0; index < args.length; index++) {
        const arg = args[index];
        if (arg === '--help' || arg === '-h') return { help: true };
        if (arg !== '--output' && arg !== '--container') throw new Error(`Unknown argument: ${arg}\n${usage}`);
        const value = args[++index];
        if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}.`);
        const name = arg.slice(2);
        if (options[name]) throw new Error(`${arg} can only be specified once.`);
        options[name] = value;
    }
    return options;
}

function runDocker(args, options = {}) {
    try {
        return execFileSync('docker', args, {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
            ...options,
        });
    } catch (error) {
        if (error.code === 'ENOENT') throw new Error('Docker is not installed or is not on PATH.');
        // Do not print the command environment or inspect output, which may contain credentials.
        const detail = error.stderr?.toString().trim();
        throw new Error(detail || 'Docker command failed. Check that Docker and PostgreSQL are running.');
    }
}

function normalizeDirectory(directory) {
    const normalized = path.resolve(directory);
    return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

function findContainer(root, name, docker) {
    if (name) {
        const [container] = JSON.parse(docker(['inspect', name]));
        if (!container?.State?.Running) throw new Error(`Container ${name} is not running.`);
        return container;
    }

    const ids = docker(['ps', '--filter', 'label=com.docker.compose.service=coinage-db', '--format', '{{.ID}}']).trim().split(/\s+/).filter(Boolean);
    const containers = ids.length ? JSON.parse(docker(['inspect', ...ids])) : [];
    const matches = containers.filter((container) => {
        const directory = container.Config?.Labels?.['com.docker.compose.project.working_dir'];
        return container.State?.Running && directory && normalizeDirectory(directory) === normalizeDirectory(root);
    });
    if (!matches.length) throw new Error('No running coinage-db container found for this checkout. Start PostgreSQL or pass --container <name-or-id>.');
    if (matches.length > 1) {
        throw new Error(
            `Multiple database containers match this checkout: ${matches.map((container) => container.Name.replace(/^\//, '')).join(', ')}. Choose one with --container.`,
        );
    }
    return matches[0];
}

function createDump({ output, container: containerName, root = workspaceRoot, environment = process.env, docker = runDocker, now = new Date() } = {}) {
    const envFile = path.join(root, '.env');
    const env = { ...(fs.existsSync(envFile) ? dotenv.parse(fs.readFileSync(envFile)) : {}), ...environment };
    const container = findContainer(root, containerName, docker);
    const containerEnv = Object.fromEntries(
        (container.Config?.Env || []).map((entry) => {
            const separator = entry.indexOf('=');
            return [entry.slice(0, separator), entry.slice(separator + 1)];
        }),
    );
    const username = env.COINAGE_POSTGRES_USER || containerEnv.POSTGRES_USER || 'postgres';
    const database = env.COINAGE_POSTGRES_DB || containerEnv.POSTGRES_DB || 'coinage-db';
    const password = env.COINAGE_POSTGRES_PASSWORD ?? containerEnv.POSTGRES_PASSWORD ?? '';
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const filename = `${database.replace(/[^a-zA-Z0-9_.-]/g, '_')}-${timestamp}.dump`;
    const outputFile = path.resolve(root, output || path.join('backups', filename));

    fs.mkdirSync(path.dirname(outputFile), { recursive: true, mode: 0o700 });
    let descriptor;
    try {
        descriptor = fs.openSync(outputFile, 'wx+', 0o600);
    } catch (error) {
        if (error.code === 'EEXIST') throw new Error(`Refusing to overwrite an existing file: ${outputFile}`);
        throw error;
    }

    let complete = false;
    try {
        // Node passes a binary file descriptor directly to Docker: no shell, TTY,
        // PowerShell redirection, password arguments, or temporary container files.
        docker(['exec', '--env', 'PGPASSWORD', container.Id, 'pg_dump', '--format=custom', '--no-password', `--username=${username}`, `--dbname=${database}`], {
            env: { ...environment, PGPASSWORD: password },
            stdio: ['ignore', descriptor, 'pipe'],
        });
        fs.fsyncSync(descriptor);
        const header = Buffer.alloc(5);
        fs.readSync(descriptor, header, 0, header.length, 0);
        if (header.toString('ascii') !== 'PGDMP') throw new Error('pg_dump did not produce a valid custom-format archive.');
        complete = true;
        return { outputFile, database, container: container.Name.replace(/^\//, ''), size: fs.fstatSync(descriptor).size };
    } finally {
        fs.closeSync(descriptor);
        if (!complete) fs.unlinkSync(outputFile);
    }
}

if (require.main === module) {
    try {
        const options = parseArgs(process.argv.slice(2));
        if (options.help) {
            console.log(usage);
        } else {
            const result = createDump(options);
            console.log(`Database dump created: ${result.outputFile}`);
            console.log(`Database: ${result.database}; container: ${result.container}; size: ${result.size} bytes.`);
        }
    } catch (error) {
        console.error(`Database dump failed: ${error.message}`);
        process.exitCode = 1;
    }
}

module.exports = { createDump, parseArgs };
