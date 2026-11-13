import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        ...nxE2EPreset(__dirname, {
            webServerCommands: { default: 'yarn nx run coinage-webapp:serve:development', production: 'yarn nx run coinage-webapp:serve:production' },
        }),
        /**
         * TODO(@nx/cypress): In Cypress v12,the testIsolation option is turned on by default.
         * This can cause tests to start breaking where not indended.
         * You should consider enabling this once you verify tests do not depend on each other
         * More Info: https://docs.cypress.io/guides/references/migration-guide#Test-Isolation
         **/
        testIsolation: false,
    },
});
