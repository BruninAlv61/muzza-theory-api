import { db } from '../db/connection.js'
import { randomUUID } from 'crypto'
import { type Category, CategoryWithId } from '../types.d'

export class CategoriesModel {
  static async create({ input }: { input: Category}) {
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
    } catch (error) {
      throw new Error('Error al crear la categoría')
    }
     return {
      categoryId,
      categoryName,
      categoryDescription,
      categoryImage
    } as CategoryWithId
  }
}
