const fs = require('node:fs');
const path = require('node:path');

const workspaceRoot = path.resolve(__dirname, '..');
const codeExtensions = new Set(['.js', '.mjs', '.cjs', '.map', '.html', '.json', '.ts']);
const developmentAuthMarker = /COINAGE_FORCED_|forced[-_]?login|Forced development login|DevelopmentAuthController\b/i;

function collectFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const filename = path.join(directory, entry.name);
        return entry.isDirectory() ? collectFiles(filename) : [filename];
    });
}

function verifyProductionAuth(root = workspaceRoot) {
    const outputs = [
        { directory: path.join(root, 'dist/packages/coinage-api'), entry: 'main.js' },
        { directory: path.join(root, 'dist/packages/coinage-webapp'), entry: 'index.html' },
    ];
    const leaks = [];
    let checked = 0;
    for (const { directory, entry } of outputs) {
        if (!fs.existsSync(path.join(directory, entry))) {
            throw new Error(`Missing production output: ${path.relative(root, path.join(directory, entry))}`);
        }

        const files = collectFiles(directory);
        if (!files.some((filename) => path.extname(filename) === '.js')) {
            throw new Error(`Missing production JavaScript: ${path.relative(root, directory)}`);
        }
        for (const filename of files) {
            if (!codeExtensions.has(path.extname(filename))) continue;
            checked++;
            if (developmentAuthMarker.test(fs.readFileSync(filename, 'utf8'))) {
                leaks.push(path.relative(root, filename));
            }
        }
    }
    if (leaks.length) {
        throw new Error(`Development authentication found in production output:\n${leaks.join('\n')}`);
    }
    return checked;
}

if (require.main === module) {
    try {
        const checked = verifyProductionAuth();
        console.log(`Verified ${checked} production files: no development authentication code, endpoints, or configuration markers.`);
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}

module.exports = { verifyProductionAuth };
