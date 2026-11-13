const { getApiPort, loadEnvironment } = require('../../tools/ports.cjs');

loadEnvironment();
const port = getApiPort();

module.exports = {
    '/ws/**': { target: `ws://localhost:${port}`, ws: true },
    '/api/**': { target: `http://localhost:${port}`, secure: false },
    '/socket.io/**': { target: `ws://localhost:${port}`, ws: true },
};
