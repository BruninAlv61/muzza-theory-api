// src/shared/config.ts
process.loadEnvFile()

export const {
    DB_TOKEN,
    DB_URL,
    NODE_ENV,
    LOG_LEVEL
} = process.env