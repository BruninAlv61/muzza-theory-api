// tests/menu/products/products.model.test.ts
import { ProductsModel } from '../../../src/menu/products/products.model'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { db } from '../../../src/shared/database/connection'
import {
  ProductDatabaseError,
  ProductNotFoundError
} from '../../../src/shared/errors/crud.errors'
import type { ResultSet } from '@libsql/client'
import { CategoryId, ProductId } from '../../../src/shared/types'

vi.mock('../../../src/shared/database/connection.js', () => ({
  db: {
    execute: vi.fn()
  }
}))

const createMockResultSet = (rows: any[], rowsAffected = 0): ResultSet => ({
  columns: [],
  columnTypes: [],
  rows,
  rowsAffected,
  lastInsertRowid: undefined,
  toJSON: () => ({ columns: [], rows })
})

describe('ProductsModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('Debería retornar todos los productos', async () => {
      const mockProducts = [
        {
          productId: 'SJ12-123S-123S-CSDFC-12ED',
          productName: 'Pizza de champiñones',
          productDescription: 'Excelente pizza económica de champiñones',
          productPrice: 19000,
          productImages: '["https://ejemplo.com/imagen.png"]',
          categoryId: 'cat-123'
        }
      ]

      vi.mocked(db.execute).mockResolvedValueOnce(
        createMockResultSet(mockProducts, 1)
      )

      const result = await ProductsModel.getAll()

      expect(result).toEqual(mockProducts)
      expect(result).toHaveLength(1)
      expect(result[0].productName).toBe('Pizza de champiñones')
    })

    it('Debería lanzar ProductDatabaseError en caso de error', async () => {
      vi.mocked(db.execute).mockRejectedValueOnce(new Error('Database error'))

      await expect(ProductsModel.getAll()).rejects.toThrow(ProductDatabaseError)
    })

    it('Debería retornar un array vacío si no hay productos', async () => {
      vi.mocked(db.execute).mockResolvedValueOnce(createMockResultSet([], 0))

      const result = await ProductsModel.getAll()

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })
  })

  describe('getById', () => {
    it('Debería retornar un producto por id', async () => {
      const mockProduct = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        productName: 'Pizza Margarita',
        productDescription: 'Pizza clásica italiana',
        productPrice: 15000,
        productImages: '["https://ejemplo.com/pizza.jpg"]',
        categoryId: 'cat-123'
      }

      vi.mocked(db.execute).mockResolvedValueOnce(
        createMockResultSet([mockProduct], 1)
      )

      const result = await ProductsModel.getById({
        id: '123e4567-e89b-12d3-a456-426614174000'
      })

      expect(result).toEqual(mockProduct)
      expect(result?.productName).toBe('Pizza Margarita')
    })

    it('Debería retornar null si el producto no existe', async () => {
      vi.mocked(db.execute).mockResolvedValueOnce(createMockResultSet([], 0))

      const result = await ProductsModel.getById({
        id: '123e4567-e89b-12d3-a456-426614174000'
      })

      expect(result).toBeNull()
    })

    it('Debería lanzar ProductDatabaseError si hay un error de BD', async () => {
      vi.mocked(db.execute).mockRejectedValueOnce(new Error('Connection failed'))

      await expect(
        ProductsModel.getById({ id: '123e4567-e89b-12d3-a456-426614174000' })
      ).rejects.toThrow(ProductDatabaseError)
    })
  })

  describe('create', () => {
    it('Debería crear un nuevo producto con categoría válida', async () => {
      const input = {
        productName: 'Hamburguesa doble',
        productDescription: 'Hermosa hamburguesa doble',
        productPrice: 4999,
        productImages: '["https://ejemplo.com/image.png"]',
        categoryId: '23423a-asd2342d-dsad-d234d-dasd' as CategoryId
      }

      // Mock: categoría existe
      vi.mocked(db.execute)
        .mockResolvedValueOnce(
          createMockResultSet([{ categoryId: input.categoryId }], 1)
        )
        // Mock: insert exitoso
        .mockResolvedValueOnce(createMockResultSet([], 1))

      const result = await ProductsModel.create({ input })

      expect(result).toMatchObject(input)
      expect(result.productId).toBeDefined()
      expect(result.productId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    })

    it('Debería lanzar ProductNotFoundError si la categoría no existe', async () => {
      const input = {
        productName: 'Hamburguesa doble',
        productDescription: 'Hermosa hamburguesa doble',
        productPrice: 4999,
        productImages: '["https://ejemplo.com/image.png"]',
        categoryId: 'categoria-inexistente' as CategoryId
      }

      // Mock: categoría NO existe
      vi.mocked(db.execute).mockResolvedValueOnce(createMockResultSet([], 0))

      await expect(ProductsModel.create({ input })).rejects.toThrow(
        ProductNotFoundError
      )
    })

    it('Debería lanzar ProductDatabaseError si falla el INSERT', async () => {
      const input = {
        productName: 'Test',
        productDescription: 'Test description',
        productPrice: 1000,
        productImages: '["test.jpg"]',
        categoryId: 'cat-123' as CategoryId
      }

      // Mock: categoría existe
      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([{ categoryId: 'cat-123' }], 1))
        // Mock: INSERT falla
        .mockRejectedValueOnce(new Error('Insert failed'))

      await expect(ProductsModel.create({ input })).rejects.toThrow(
        ProductDatabaseError
      )
    })
  })

  describe('update', () => {
    const existingProduct = {
      productId: '123e4567-e89b-12d3-a456-426614174000',
      productName: 'Pizza Margarita',
      productDescription: 'Pizza clásica italiana',
      productPrice: 15000,
      productImages: '["https://ejemplo.com/pizza.jpg"]',
      categoryId: '987e6543-e21b-12d3-a456-426614174999' as CategoryId
    }

    it('Debería actualizar campos individuales de un producto', async () => {
      const updateInput = {
        productName: 'Pizza Margarita Premium',
        productPrice: 18000
      }

      // Mock: getById retorna producto existente
      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([existingProduct], 1))
        // Mock: UPDATE exitoso
        .mockResolvedValueOnce(createMockResultSet([], 1))

      const result = await ProductsModel.update({
        id: existingProduct.productId as ProductId,
        input: updateInput
      })

      expect(result.productName).toBe('Pizza Margarita Premium')
      expect(result.productPrice).toBe(18000)
      expect(result.productDescription).toBe(existingProduct.productDescription)
      expect(result.categoryId).toBe(existingProduct.categoryId)
    })

    it('Debería actualizar todos los campos si se proporcionan', async () => {
      const fullUpdate = {
        productName: 'Nuevo nombre',
        productDescription: 'Nueva descripción',
        productPrice: 20000,
        productImages: '["nueva.jpg"]',
        categoryId: 'new-cat-id' as CategoryId
      }

      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([existingProduct], 1))
        .mockResolvedValueOnce(createMockResultSet([], 1))

      const result = await ProductsModel.update({
        id: existingProduct.productId as ProductId,
        input: fullUpdate
      })

      expect(result).toMatchObject({
        productId: existingProduct.productId,
        ...fullUpdate
      })
    })

    it('Debería mantener valores originales si no se actualizan', async () => {
      const minimalUpdate = {
        productPrice: 16000
      }

      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([existingProduct], 1))
        .mockResolvedValueOnce(createMockResultSet([], 1))

      const result = await ProductsModel.update({
        id: existingProduct.productId as ProductId,
        input: minimalUpdate
      })

      expect(result.productName).toBe(existingProduct.productName)
      expect(result.productDescription).toBe(existingProduct.productDescription)
      expect(result.productPrice).toBe(16000)
      expect(result.productImages).toBe(existingProduct.productImages)
      expect(result.categoryId).toBe(existingProduct.categoryId)
    })

    it('Debería lanzar ProductNotFoundError si el producto no existe', async () => {
      // Mock: producto no existe
      vi.mocked(db.execute).mockResolvedValueOnce(createMockResultSet([], 0))

      await expect(
        ProductsModel.update({
          id: '123e4567-e89b-12d3-a456-426614174000',
          input: { productName: 'Test' }
        })
      ).rejects.toThrow(ProductNotFoundError)
    })

    it('Debería lanzar ProductDatabaseError si falla el UPDATE', async () => {
      // Mock: producto existe
      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([existingProduct], 1))
        // Mock: UPDATE falla
        .mockRejectedValueOnce(new Error('Update failed'))

      await expect(
        ProductsModel.update({
          id: existingProduct.productId as ProductId,
          input: { productName: 'Test' }
        })
      ).rejects.toThrow(ProductDatabaseError)
    })
  })

  describe('delete', () => {
    const productId = '123e4567-e89b-12d3-a456-426614174000'
    const mockProduct = {
      productId,
      productName: 'Test Product',
      productDescription: 'Test',
      productPrice: 1000,
      productImages: '[]',
      categoryId: 'cat-123'
    }

    it('Debería eliminar un producto exitosamente', async () => {
      // Mock: producto existe
      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([mockProduct], 1))
        // Mock: DELETE exitoso (rowsAffected = 1)
        .mockResolvedValueOnce(createMockResultSet([], 1))

      const result = await ProductsModel.delete({ id: productId })

      expect(result).toBe(true)
    })

    it('Debería lanzar ProductNotFoundError si el producto no existe', async () => {
      // Mock: producto NO existe
      vi.mocked(db.execute).mockResolvedValueOnce(createMockResultSet([], 0))

      await expect(ProductsModel.delete({ id: productId })).rejects.toThrow(
        ProductNotFoundError
      )
    })

    it('Debería retornar false si el DELETE no afecta ninguna fila', async () => {
      // Mock: producto existe en getById
      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([mockProduct], 1))
        // Mock: DELETE no afecta filas (rowsAffected = 0)
        .mockResolvedValueOnce(createMockResultSet([], 0))

      const result = await ProductsModel.delete({ id: productId })

      expect(result).toBe(false)
    })

    it('Debería lanzar ProductDatabaseError si hay un error de BD', async () => {
      // Mock: producto existe
      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([mockProduct], 1))
        // Mock: DELETE falla
        .mockRejectedValueOnce(new Error('Delete failed'))

      await expect(ProductsModel.delete({ id: productId })).rejects.toThrow(
        ProductDatabaseError
      )
    })
  })
})