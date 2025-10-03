// src/menu/products/products.model.ts
import { db } from '../../shared/database/connection.js'
import { randomUUID } from 'node:crypto'
import {
  ProductNotFoundError,
  ProductDatabaseError,
  CRUD_OPERATIONS
} from '../../shared/errors/crud.errors.js'
import type { Product, ProductWithId, ProductId } from '../../shared/types.js'
import { createModuleLogger, logDbOperation } from '../../shared/utils/logger.js'

const logger = createModuleLogger('products-model')

export class ProductsModel {
  static async getAll(): Promise<ProductWithId[]> {
    const startTime = Date.now()
    
    try {
      logger.debug('Fetching all products')
      
      const products = await db.execute('SELECT * FROM products')
      
      const duration = Date.now() - startTime
      logDbOperation({
        operation: CRUD_OPERATIONS.GET,
        entity: 'products',
        success: true,
        duration
      })
      
      logger.info(
        { count: products.rows.length, duration },
        'Products fetched successfully'
      )
      
      return products.rows as unknown as ProductWithId[]
    } catch (error) {
      logDbOperation({
        operation: CRUD_OPERATIONS.GET,
        entity: 'products',
        success: false,
        error: error as Error
      })
      throw new ProductDatabaseError(CRUD_OPERATIONS.GET, error as Error)
    }
  }

  static async getById({ id }: { id: ProductId }): Promise<ProductWithId | null> {
    const startTime = Date.now()
    
    try {
      logger.debug({ productId: id }, 'Fetching product by ID')
      
      const result = await db.execute(
        'SELECT * FROM products WHERE productId = ?',
        [id]
      )

      const duration = Date.now() - startTime
      const found = result.rows.length > 0
      
      logDbOperation({
        operation: CRUD_OPERATIONS.GET,
        entity: 'product',
        id,
        success: true,
        duration
      })
      
      if (!found) {
        logger.warn({ productId: id, duration }, 'Product not found')
      } else {
        logger.info({ productId: id, duration }, 'Product fetched successfully')
      }

      return found ? (result.rows[0] as unknown as ProductWithId) : null
    } catch (error) {
      logDbOperation({
        operation: CRUD_OPERATIONS.GET,
        entity: 'product',
        id,
        success: false,
        error: error as Error
      })
      throw new ProductDatabaseError(CRUD_OPERATIONS.GET, error as Error)
    }
  }

  static async create({ input }: { input: Product }): Promise<ProductWithId> {
    const startTime = Date.now()
    const { productName, productDescription, productPrice, productImages, categoryId } = input

    try {
      logger.debug(
        { categoryId, productName },
        'Creating new product'
      )

      const existingCategory = await db.execute(
        `SELECT * FROM categories WHERE categoryId = ?`,
        [categoryId]
      )

      if (existingCategory.rows.length === 0) {
        logger.warn({ categoryId }, 'Category not found for product creation')
        throw new ProductNotFoundError()
      }

      const productId = randomUUID()

      await db.execute(
        `INSERT INTO products (productId, productName, productDescription, productPrice, productImages, categoryId) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [productId, productName, productDescription, productPrice, productImages, categoryId]
      )

      const duration = Date.now() - startTime
      logDbOperation({
        operation: CRUD_OPERATIONS.CREATE,
        entity: 'product',
        id: productId,
        success: true,
        duration
      })

      logger.info(
        { productId, productName, categoryId, duration },
        'Product created successfully'
      )

      return {
        productId,
        productName,
        productDescription,
        productPrice,
        productImages,
        categoryId
      }
    } catch (error) {
      if (error instanceof ProductNotFoundError) throw error

      logDbOperation({
        operation: CRUD_OPERATIONS.CREATE,
        entity: 'product',
        success: false,
        error: error as Error
      })
      throw new ProductDatabaseError(CRUD_OPERATIONS.CREATE, error as Error)
    }
  }

  static async update({
    id,
    input
  }: {
    id: ProductId
    input: Partial<Product>
  }): Promise<ProductWithId> {
    const startTime = Date.now()
    
    try {
      logger.debug(
        { productId: id, fieldsToUpdate: Object.keys(input) },
        'Updating product'
      )

      const existingProduct = await this.getById({ id })

      if (!existingProduct) {
        logger.warn({ productId: id }, 'Product not found for update')
        throw new ProductNotFoundError()
      }

      const updatedProduct = {
        productName: input.productName ?? existingProduct.productName,
        productDescription: input.productDescription ?? existingProduct.productDescription,
        productPrice: input.productPrice ?? existingProduct.productPrice,
        productImages: input.productImages ?? existingProduct.productImages,
        categoryId: input.categoryId ?? existingProduct.categoryId
      }

      await db.execute(
        `UPDATE products
         SET productName = ?, productDescription = ?, productPrice = ?, productImages = ?, categoryId = ?
         WHERE productId = ?`,
        [
          updatedProduct.productName,
          updatedProduct.productDescription,
          updatedProduct.productPrice,
          updatedProduct.productImages,
          updatedProduct.categoryId,
          id
        ]
      )

      const duration = Date.now() - startTime
      logDbOperation({
        operation: CRUD_OPERATIONS.UPDATE,
        entity: 'product',
        id,
        success: true,
        duration
      })

      logger.info(
        { productId: id, duration },
        'Product updated successfully'
      )

      return {
        productId: id,
        ...updatedProduct
      }
    } catch (error) {
      if (error instanceof ProductNotFoundError) throw error

      logDbOperation({
        operation: CRUD_OPERATIONS.UPDATE,
        entity: 'product',
        id,
        success: false,
        error: error as Error
      })
      throw new ProductDatabaseError(CRUD_OPERATIONS.UPDATE, error as Error)
    }
  }

  static async delete({ id }: { id: ProductId }): Promise<boolean> {
    const startTime = Date.now()
    
    try {
      logger.debug({ productId: id }, 'Deleting product')

      const existingProduct = await this.getById({ id })

      if (!existingProduct) {
        logger.warn({ productId: id }, 'Product not found for deletion')
        throw new ProductNotFoundError()
      }

      const result = await db.execute(
        'DELETE FROM products WHERE productId = ?',
        [id]
      )

      const duration = Date.now() - startTime
      const success = result.rowsAffected > 0
      
      logDbOperation({
        operation: CRUD_OPERATIONS.DELETE,
        entity: 'product',
        id,
        success,
        duration
      })

      if (success) {
        logger.info({ productId: id, duration }, 'Product deleted successfully')
      } else {
        logger.error({ productId: id }, 'Product deletion failed - no rows affected')
      }

      return success
    } catch (error) {
      if (error instanceof ProductNotFoundError) throw error

      logDbOperation({
        operation: CRUD_OPERATIONS.DELETE,
        entity: 'product',
        id,
        success: false,
        error: error as Error
      })
      throw new ProductDatabaseError(CRUD_OPERATIONS.DELETE, error as Error)
    }
  }
}