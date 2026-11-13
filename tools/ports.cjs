const path = require('node:path');

const dotenv = require('dotenv');

const workspaceRoot = path.resolve(__dirname, '..');

function loadEnvironment(root = workspaceRoot, environment = process.env) {
    // Keep shell/Nx overrides; never print runtime settings or copy them into a browser build.
    const result = dotenv.config({ path: path.join(root, '.env'), processEnv: environment, quiet: true });
    if (result.error && result.error.code !== 'ENOENT') throw result.error;
    return environment;
}

function readPort(value, fallback, name) {
    if (value === undefined || value === '') return fallback;
    const port = Number(value);
    if (!/^\d+$/.test(value) || !Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error(`${name} must be an integer between 1 and 65535.`);
    }
    return port;
}

function getApiPort(environment = process.env) {
    return readPort(environment.COINAGE_API_PORT || environment.PORT, 3333, 'COINAGE_API_PORT (or PORT)');
}

function getWebappPort(environment = process.env) {
    return readPort(environment.COINAGE_WEBAPP_PORT, 4200, 'COINAGE_WEBAPP_PORT');
}

module.exports = { loadEnvironment, getApiPort, getWebappPort };
