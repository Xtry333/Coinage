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
