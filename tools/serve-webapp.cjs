const { spawn } = require('node:child_process');
const path = require('node:path');

const { getWebappPort, loadEnvironment } = require('./ports.cjs');

const workspaceRoot = path.resolve(__dirname, '..');

function createServeArgs(configuration, args = [], environment = process.env) {
    if (!['development', 'production'].includes(configuration)) throw new Error('Expected development or production configuration.');
    const portArgs = args.some((arg) => arg === '--port' || arg.startsWith('--port=')) ? [] : [`--port=${getWebappPort(environment)}`];
    return ['run', `coinage-webapp:serve-angular:${configuration}`, ...portArgs, ...args];
}

if (require.main === module) {
    try {
        loadEnvironment();
        const nxPackage = require.resolve('nx/package.json');
        const nxCli = path.resolve(path.dirname(nxPackage), require(nxPackage).bin.nx);
        const [configuration, ...args] = process.argv.slice(2);
        const child = spawn(process.execPath, [nxCli, ...createServeArgs(configuration, args)], { cwd: workspaceRoot, stdio: 'inherit' });
        for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
        child.on('error', (error) => {
            console.error(`Webapp startup failed: ${error.message}`);
            process.exitCode = 1;
        });
        child.on('exit', (code, signal) => {
            process.exitCode = code ?? (signal ? 1 : 0);
        });
    } catch (error) {
        console.error(`Webapp startup failed: ${error.message}`);
        process.exitCode = 1;
    }
}

module.exports = { createServeArgs };
