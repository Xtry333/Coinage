export function getApiPort(getEnvironment: (name: string) => string | undefined = (name) => process.env[name]): number {
    const value = getEnvironment('COINAGE_API_PORT') || getEnvironment('PORT');
    if (value === undefined || value === '') return 3333;
    const port = Number(value);
    if (!/^\d+$/.test(value) || !Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('COINAGE_API_PORT (or PORT) must be an integer between 1 and 65535.');
    }
    return port;
}
