// src/shared/config.ts
process.loadEnvFile()

export const {
    DB_TOKEN,
    DB_URL
} = process.env