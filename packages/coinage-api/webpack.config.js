const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('node:path');

module.exports = () => {
    const production = process.env.NODE_ENV === 'production';

    return {
        context: __dirname,
        mode: production ? 'production' : 'development',
        output: {
            path: join(__dirname, '../../dist/packages/coinage-api'),
            filename: 'main.js',
        },
        plugins: [
            new NxAppWebpackPlugin({
                target: 'node',
                compiler: 'tsc',
                main: './src/main.ts',
                tsConfig: './tsconfig.app.json',
                assets: ['./src/assets'],
                generatePackageJson: production,
                // Nest adapters and the PostgreSQL driver are loaded dynamically.
                runtimeDependencies: ['@nestjs/platform-express', '@nestjs/platform-socket.io', 'pg'],
                outputHashing: 'none',
                sourceMap: true,
                optimization: production,
                extractLicenses: production,
                fileReplacements: production
                    ? [
                          {
                              replace: join(__dirname, 'src/environments/environment.ts'),
                              with: join(__dirname, 'src/environments/environment.prod.ts'),
                          },
                      ]
                    : [],
            }),
        ],
    };
};
