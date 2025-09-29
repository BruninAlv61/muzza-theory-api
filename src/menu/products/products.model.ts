// src/menu/products/products.model.ts
import { db } from '../../shared/database/connection.js'
import { randomUUID } from 'node:crypto'
import {
  ProductNotFoundError,
  ProductDatabaseError,
  CRUD_OPERATIONS
} from '../../shared/errors/crud.errors.js'
import type { Product, ProductWithId, ProductId } from '../../shared/types.js'

export class ProductsModel {
  static async getAll(): Promise<ProductWithId[]> {
    try {
      const products = await db.execute('SELECT * FROM products')
      return products.rows as unknown as ProductWithId[]
    } catch (error) {
      console.error('Error al obtener los productos:', error)
      throw new ProductDatabaseError(CRUD_OPERATIONS.GET, error as Error)
    }
  }

  static async getById({
    id
  }: {
    id: ProductId
  }): Promise<ProductWithId | null> {
    try {
      const result = await db.execute(
        'SELECT * FROM products WHERE productId = ?',
        [id]
      )

      return result.rows[0]
        ? (result.rows[0] as unknown as ProductWithId)
        : null
    } catch (error) {
      console.error('Error al obtener el producto:', error)
      throw new ProductDatabaseError(CRUD_OPERATIONS.GET, error as Error)
    }
  }

  static async create({ input }: { input: Product }): Promise<ProductWithId> {
    const {
      productName,
      productDescription,
      productPrice,
      productImages,
      categoryId
    } = input

    try {
      const existingCategory = await db.execute(
        `SELECT * FROM categories WHERE categoryId = ?`,
        [categoryId]
      )

      if (existingCategory.rows.length === 0) {
        throw new ProductNotFoundError()
      }

      const productId = randomUUID()

      await db.execute(
        `INSERT INTO products (productId, productName, productDescription, productPrice, productImages, categoryId) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
        [
          productId,
          productName,
          productDescription,
          productPrice,
          productImages,
          categoryId
        ]
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

      console.error('Error al crear el producto:', error)
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
    try {
      const existingProduct = await this.getById({ id })

      if (!existingProduct) throw new ProductNotFoundError()

      const updatedProduct = {
        productName: input.productName ?? existingProduct.productName,
        productDescription:
          input.productDescription ?? existingProduct.productDescription,
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

      return {
        productId: id,
        ...updatedProduct
      }
    } catch (error) {
      if (error instanceof ProductNotFoundError) {
        throw error
      }

      console.error('Error al actualizar el producto', error)
      throw new ProductDatabaseError(CRUD_OPERATIONS.UPDATE, error as Error)
    }
  }

  static async delete({ id }: { id: ProductId }): Promise<boolean> {
    try {
      const existingProduct = await this.getById({ id })

      if (!existingProduct) {
        throw new ProductNotFoundError()
      }

      const result = await db.execute(
        'DELETE FROM products WHERE productId = ?',
        [id]
      )

      return result.rowsAffected > 0
    } catch (error) {
      if (error instanceof ProductNotFoundError) throw error

      console.error('Error al eliminar el producto', error)
      throw new ProductDatabaseError(CRUD_OPERATIONS.DELETE, error as Error)
    }
  }
}
