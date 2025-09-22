// src/models/categories.ts
import { db } from '../db/connection.js'
import { randomUUID } from 'crypto'
import type { Category, CategoryWithId, CategoryId } from '../types.d'
import { CategoryNotFoundError, CategoryDatabaseError, CRUD_OPERATIONS } from '../errors/crud.errors.js'

export class CategoriesModel {
  static async getAll(): Promise<CategoryWithId[]> {
    try {
      const categories = await db.execute('SELECT * FROM categories')
      return categories.rows as unknown as CategoryWithId[]
    } catch (error) {
      console.error('Error en base de datos al obtener categorías:', error)
      throw new CategoryDatabaseError(CRUD_OPERATIONS.GET, error as Error)
    }
  }

  static async getById({ id }: { id: CategoryId }): Promise<CategoryWithId | null> {
    try {
      const result = await db.execute(
        'SELECT * FROM categories WHERE categoryId = ?',
        [id]
      )

      return result.rows[0] 
        ? (result.rows[0] as unknown as CategoryWithId)
        : null
    } catch (error) {
      console.error('Error al obtener la categoría:', error)
      throw new CategoryDatabaseError(CRUD_OPERATIONS.GET, error as Error)
    }
  }

  static async create({ input }: { input: Category }): Promise<CategoryWithId> {
    const { categoryName, categoryDescription, categoryImage } = input
    const categoryId = randomUUID()

    try {
      await db.execute(
        `INSERT INTO categories
            (categoryId, categoryName, categoryDescription, categoryImage)
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
      throw new CategoryDatabaseError(CRUD_OPERATIONS.CREATE, error as Error)
    }
  }

  static async update({ id, input }: { id: CategoryId; input: Category }): Promise<CategoryWithId> {
    const { categoryName, categoryDescription, categoryImage } = input

    try {
      const existingCategory = await this.getById({ id })

      if (!existingCategory) throw new CategoryNotFoundError()

      await db.execute(
        `UPDATE categories
        SET categoryName = ?, categoryDescription = ?, categoryImage = ?
        WHERE categoryId = ?`,
        [categoryName, categoryDescription, categoryImage, id]
      )

      return {
        categoryId: id,
        categoryName,
        categoryDescription,
        categoryImage
      }
    } catch (error) {
      if (error instanceof CategoryNotFoundError) {
        throw error
      }
      
      console.error('Error al actualizar la categoría', error)
      throw new CategoryDatabaseError(CRUD_OPERATIONS.UPDATE, error as Error)
    }
  }

  static async delete({ id }: { id: CategoryId }): Promise<boolean> {
    try {
      // Primero verificar si existe
      const existingCategory = await this.getById({ id })

      if (!existingCategory) {
        throw new CategoryNotFoundError()
      }

      const productsWithCategory = await db.execute(
        'SELECT COUNT(*) as count FROM products WHERE categoryId = ?',
        [id]
      )
      
      const productCount = (productsWithCategory.rows[0] as any)?.count || 0
      
      if (productCount > 0) {
        throw new Error('No se puede eliminar la categoría porque tiene productos asociados')
      }

      // Proceder con la eliminación
      const result = await db.execute(
        'DELETE FROM categories WHERE categoryId = ?',
        [id]
      )

      // Verificar que se eliminó al menos una fila
      return result.rowsAffected > 0

    } catch (error) {
      // Si es nuestro error personalizado o de integridad referencial, lo re-lanzamos
      if (error instanceof CategoryNotFoundError || 
          (error instanceof Error && error.message.includes('productos asociados'))) {
        throw error
      }
      
      console.error('Error al eliminar la categoría', error)
      throw new CategoryDatabaseError(CRUD_OPERATIONS.DELETE, error as Error)
    }
  }
}
