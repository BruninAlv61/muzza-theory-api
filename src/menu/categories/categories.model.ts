// src/menu/categories/categories.model.ts
import { db } from '../../shared/database/connection.js'
import { randomUUID } from 'crypto'
import type {
  Category,
  CategoryWithId,
  CategoryId
} from '../../shared/types.js'
import {
  CategoryNotFoundError,
  CategoryDatabaseError,
  CRUD_OPERATIONS
} from '../../shared/errors/crud.errors.js'
import { createModuleLogger, logDbOperation } from '../../shared/utils/logger.js'

const logger = createModuleLogger('categories-model')

export class CategoriesModel {
  static async getAll(): Promise<CategoryWithId[]> {
    const startTime = Date.now()

    try {
      logger.debug('Fetching all categories')

      const categories = await db.execute('SELECT * FROM categories')

      const duration = Date.now() - startTime
      logDbOperation({
        operation: CRUD_OPERATIONS.GET,
        entity: 'categories',
        success: true,
        duration
      })

      logger.info(
        { count: categories.rows.length, duration },
        'Categories fetched successfully'
      )

      return categories.rows as unknown as CategoryWithId[]
    } catch (error) {
      logDbOperation({
        operation: CRUD_OPERATIONS.GET,
        entity: 'categories',
        success: false,
        error: error as Error
      })
      throw new CategoryDatabaseError(CRUD_OPERATIONS.GET, error as Error)
    }
  }

  static async getById({
    id
  }: {
    id: CategoryId
  }): Promise<CategoryWithId | null> {
    const startTime = Date.now()

    try {
      logger.debug({ categoryId: id }, 'Fetching category by ID')

      const result = await db.execute(
        'SELECT * FROM categories WHERE categoryId = ?',
        [id]
      )

      const duration = Date.now() - startTime
      const found = result.rows.length > 0

      logDbOperation({
        operation: CRUD_OPERATIONS.GET,
        entity: 'category',
        id,
        success: true,
        duration
      })

      if (!found) {
        logger.warn({ categoryId: id, duration }, 'Category not found')
      } else {
        logger.info({ categoryId: id, duration }, 'Category fetched successfully')
      }

      return found ? (result.rows[0] as unknown as CategoryWithId) : null
    } catch (error) {
      logDbOperation({
        operation: CRUD_OPERATIONS.GET,
        entity: 'category',
        id,
        success: false,
        error: error as Error
      })
      throw new CategoryDatabaseError(CRUD_OPERATIONS.GET, error as Error)
    }
  }

  static async create({ input }: { input: Category }): Promise<CategoryWithId> {
    const startTime = Date.now()
    const { categoryName, categoryDescription, categoryImage } = input
    const categoryId = randomUUID()

    try {
      logger.debug(
        { categoryName },
        'Creating new category'
      )

      await db.execute(
        `INSERT INTO categories
         (categoryId, categoryName, categoryDescription, categoryImage)
         VALUES (?, ?, ?, ?)`,
        [categoryId, categoryName, categoryDescription, categoryImage]
      )

      const duration = Date.now() - startTime
      logDbOperation({
        operation: CRUD_OPERATIONS.CREATE,
        entity: 'category',
        id: categoryId,
        success: true,
        duration
      })

      logger.info(
        { categoryId, categoryName, duration },
        'Category created successfully'
      )

      return {
        categoryId,
        categoryName,
        categoryDescription,
        categoryImage
      } as CategoryWithId
    } catch (error) {
      logDbOperation({
        operation: CRUD_OPERATIONS.CREATE,
        entity: 'category',
        success: false,
        error: error as Error
      })
      throw new CategoryDatabaseError(CRUD_OPERATIONS.CREATE, error as Error)
    }
  }

  static async update({
    id,
    input
  }: {
    id: CategoryId
    input: Partial<Category>
  }): Promise<CategoryWithId> {
    const startTime = Date.now()

    try {
      logger.debug(
        { categoryId: id, fieldsToUpdate: Object.keys(input) },
        'Updating category'
      )

      const existingCategory = await this.getById({ id })

      if (!existingCategory) {
        logger.warn({ categoryId: id }, 'Category not found for update')
        throw new CategoryNotFoundError()
      }

      const updatedCategory = {
        categoryName: input.categoryName ?? existingCategory.categoryName,
        categoryDescription: input.categoryDescription ?? existingCategory.categoryDescription,
        categoryImage: input.categoryImage ?? existingCategory.categoryImage
      }

      await db.execute(
        `UPDATE categories
         SET categoryName = ?, categoryDescription = ?, categoryImage = ?
         WHERE categoryId = ?`,
        [
          updatedCategory.categoryName,
          updatedCategory.categoryDescription,
          updatedCategory.categoryImage,
          id
        ]
      )

      const duration = Date.now() - startTime
      logDbOperation({
        operation: CRUD_OPERATIONS.UPDATE,
        entity: 'category',
        id,
        success: true,
        duration
      })

      logger.info(
        { categoryId: id, duration },
        'Category updated successfully'
      )

      return {
        categoryId: id,
        ...updatedCategory
      }
    } catch (error) {
      if (error instanceof CategoryNotFoundError) throw error

      logDbOperation({
        operation: CRUD_OPERATIONS.UPDATE,
        entity: 'category',
        id,
        success: false,
        error: error as Error
      })
      throw new CategoryDatabaseError(CRUD_OPERATIONS.UPDATE, error as Error)
    }
  }

  static async delete({ id }: { id: CategoryId }): Promise<boolean> {
    const startTime = Date.now()

    try {
      logger.debug({ categoryId: id }, 'Deleting category')

      const existingCategory = await this.getById({ id })

      if (!existingCategory) {
        logger.warn({ categoryId: id }, 'Category not found for deletion')
        throw new CategoryNotFoundError()
      }

      const productsWithCategory = await db.execute(
        'SELECT COUNT(*) as count FROM products WHERE categoryId = ?',
        [id]
      )

      const productCount = (productsWithCategory.rows[0] as any)?.count || 0

      if (productCount > 0) {
        logger.warn(
          { categoryId: id, productCount },
          'Cannot delete category with associated products'
        )
        throw new Error(
          'No se puede eliminar la categoría porque tiene productos asociados'
        )
      }

      const result = await db.execute(
        'DELETE FROM categories WHERE categoryId = ?',
        [id]
      )

      const duration = Date.now() - startTime
      const success = result.rowsAffected > 0

      logDbOperation({
        operation: CRUD_OPERATIONS.DELETE,
        entity: 'category',
        id,
        success,
        duration
      })

      if (success) {
        logger.info({ categoryId: id, duration }, 'Category deleted successfully')
      } else {
        logger.error({ categoryId: id }, 'Category deletion failed - no rows affected')
      }

      return success
    } catch (error) {
      if (
        error instanceof CategoryNotFoundError ||
        (error instanceof Error && error.message.includes('productos asociados'))
      ) {
        throw error
      }

      logDbOperation({
        operation: CRUD_OPERATIONS.DELETE,
        entity: 'category',
        id,
        success: false,
        error: error as Error
      })
      throw new CategoryDatabaseError(CRUD_OPERATIONS.DELETE, error as Error)
    }
  }
}