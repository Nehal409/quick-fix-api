interface Config {
    port: number;
    jwt: {
        secret: string;
        expiresIn: string;
    };
    googleMaps: {
        apiKey: string;
    };
    gemini: {
        apiKey: string;
        flashModel: string;
        proModel: string;
        timeoutMs: number;
        maxRetries: number;
    };
}

export default (): Config => ({
    port: Number(process.env.PORT) || 3000,
    jwt: {
        secret: String(process.env.JWT_SECRET),
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    googleMaps: {
        apiKey: String(process.env.GOOGLE_MAPS_API_KEY),
    },
    gemini: {
        apiKey: String(process.env.GEMINI_API_KEY),
        flashModel: process.env.GEMINI_FLASH_MODEL || 'gemini-2.0-flash',
        proModel: process.env.GEMINI_PRO_MODEL || 'gemini-2.5-pro',
        timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS) || 15000,
        maxRetries: Number(process.env.GEMINI_MAX_RETRIES) || 2,
    },
});
