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
    },
});
