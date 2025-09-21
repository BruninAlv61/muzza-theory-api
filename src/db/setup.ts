import { db } from './connection.js'

await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
        categoryId TEXT PRIMARY KEY,
        categoryName TEXT NOT NULL,
        categoryDescription TEXT NOT NULL,
        categoryImage TEXT NOT NULL
    )
`)