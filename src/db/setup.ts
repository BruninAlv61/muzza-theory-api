import { db } from './connection.js'

await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
        categoryId TEXT PRIMARY KEY,
        categoryName TEXT NOT NULL,
        categoryDescription TEXT NOT NULL,
        categoryImage TEXT NOT NULL
    )
`)

await db.execute(`
    CREATE TABLE IF NOT EXISTS products (
        productId TEXT PRIMARY KEY,
        productName TEXT NOT NULL,
        productDescription TEXT NOT NULL,
        productPrice REAL NOT NULL,
        productImages TEXT NOT NULL,
        categoryId TEXT NOT NULL,
        FOREIGN KEY (categoryId) REFERENCES categories(categoryId)
    )
`)