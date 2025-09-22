// src/models/categories.ts
import { db } from '../db/connection.js'
import { randomUUID } from 'crypto'
import type { Category, CategoryWithId, CategoryId } from '../types.d'

export class CategoriesModel {
  static async getAll(): Promise<CategoryWithId[]> {
    try {
      const categories = await db.execute('SELECT * FROM categories')

      return categories.rows as unknown as CategoryWithId[]
    } catch (error) {
      console.error('Error en base de datos al obtener categorías:', error)
      throw new Error('Error al obtener las categorías de la base de datos')
    }
  }

  static async getById({ id }: { id: CategoryId }): Promise<CategoryWithId | null> {
  try {
    const result = await db.execute('SELECT * FROM categories WHERE categoryId = ?', [id])
    
    return result.rows[0] ? result.rows[0] as unknown as CategoryWithId : null
  } catch (error) {
    console.error('Error al obtener la categoría:', error)
    throw new Error('Error al obtener la categoría de la base de datos')
  }
}

  static async create({ input }: { input: Category }): Promise<CategoryWithId> {
    const { categoryName, categoryDescription, categoryImage } = input

    const categoryId = randomUUID()

    try {
      await db.execute(
        `INSERT INTO categories
            (
                categoryId,
                categoryName,
                categoryDescription,
                categoryImage    
            )
            VALUES (?, ?, ?, ?)`,
        [categoryId, categoryName, categoryDescription, categoryImage]
      )

      return {
        categoryId,
        categoryName,
        categoryDescription,
        categoryImage
      } as CategoryWithId

    } catch (error) {
      console.error('Error en base de datos al crear categoría:', error)
      throw new Error('Error al crear la categoría en la base de datos')
    }
  }
}
