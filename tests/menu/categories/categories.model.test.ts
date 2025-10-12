// tests/menu/categories/categories.model.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CategoriesModel } from '../../../src/menu/categories/categories.model.js'
import { db } from '../../../src/shared/database/connection.js'
import { CategoryNotFoundError, CategoryDatabaseError } from '../../../src/shared/errors/crud.errors.js'
import type { ResultSet } from '@libsql/client'
import { CategoryId } from '../../../src/shared/types.js'

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

describe('CategoriesModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('Debería retornar todas las categorías', async () => {
      const mockCategories = [
        {
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          categoryName: 'Pizzas',
          categoryDescription: 'Deliciosas pizzas artesanales',
          categoryImage: 'https://example.com/pizza.jpg'
        },
        {
          categoryId: '987e6543-e21b-12d3-a456-426614174999',
          categoryName: 'Hamburguesas',
          categoryDescription: 'Hamburguesas gourmet',
          categoryImage: 'https://example.com/burger.jpg'
        }
      ]

      vi.mocked(db.execute).mockResolvedValueOnce(
        createMockResultSet(mockCategories, 2)
      )

      const result = await CategoriesModel.getAll()

      expect(result).toEqual(mockCategories)
      expect(result).toHaveLength(2)
      expect(result[0].categoryName).toBe('Pizzas')
    })

    it('Debería retornar un array vacío si no hay categorías', async () => {
      vi.mocked(db.execute).mockResolvedValueOnce(createMockResultSet([], 0))

      const result = await CategoriesModel.getAll()

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('Debería lanzar CategoryDatabaseError en caso de error', async () => {
      vi.mocked(db.execute).mockRejectedValueOnce(new Error('Database error'))

      await expect(CategoriesModel.getAll()).rejects.toThrow(CategoryDatabaseError)
    })
  })

  describe('getById', () => {
    it('Debería retornar una categoría por ID', async () => {
      const mockCategory = {
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        categoryName: 'Pizzas',
        categoryDescription: 'Deliciosas pizzas artesanales',
        categoryImage: 'https://example.com/pizza.jpg'
      }

      vi.mocked(db.execute).mockResolvedValueOnce(
        createMockResultSet([mockCategory], 1)
      )

      const result = await CategoriesModel.getById({
        id: '123e4567-e89b-12d3-a456-426614174000'
      })

      expect(result).toEqual(mockCategory)
      expect(result?.categoryName).toBe('Pizzas')
    })

    it('Debería retornar null si la categoría no existe', async () => {
      vi.mocked(db.execute).mockResolvedValueOnce(createMockResultSet([], 0))

      const result = await CategoriesModel.getById({
        id: '123e4567-e89b-12d3-a456-426614174000'
      })

      expect(result).toBeNull()
    })

    it('Debería lanzar CategoryDatabaseError si hay un error de BD', async () => {
      vi.mocked(db.execute).mockRejectedValueOnce(new Error('Connection failed'))

      await expect(
        CategoriesModel.getById({ id: '123e4567-e89b-12d3-a456-426614174000' })
      ).rejects.toThrow(CategoryDatabaseError)
    })
  })

  describe('create', () => {
    it('Debería crear una nueva categoría', async () => {
      const input = {
        categoryName: 'Hamburguesas',
        categoryDescription: 'Hamburguesas gourmet',
        categoryImage: 'https://example.com/burger.jpg'
      }

      vi.mocked(db.execute).mockResolvedValueOnce(createMockResultSet([], 1))

      const result = await CategoriesModel.create({ input })

      expect(result).toMatchObject(input)
      expect(result.categoryId).toBeDefined()
      expect(result.categoryId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    })

    it('Debería lanzar CategoryDatabaseError si falla el INSERT', async () => {
      const input = {
        categoryName: 'Test',
        categoryDescription: 'Test description',
        categoryImage: 'https://example.com/test.jpg'
      }

      vi.mocked(db.execute).mockRejectedValueOnce(new Error('Insert failed'))

      await expect(CategoriesModel.create({ input })).rejects.toThrow(
        CategoryDatabaseError
      )
    })
  })

  describe('update', () => {
    const existingCategory = {
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
      categoryName: 'Pizzas',
      categoryDescription: 'Pizzas artesanales',
      categoryImage: 'https://example.com/pizza.jpg'
    }

    it('Debería actualizar campos individuales de una categoría', async () => {
      const updateInput = {
        categoryName: 'Pizzas Premium'
      }

      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([existingCategory], 1))
        .mockResolvedValueOnce(createMockResultSet([], 1))

      const result = await CategoriesModel.update({
        id: existingCategory.categoryId as CategoryId,
        input: updateInput
      })

      expect(result.categoryName).toBe('Pizzas Premium')
      expect(result.categoryDescription).toBe(existingCategory.categoryDescription)
      expect(result.categoryImage).toBe(existingCategory.categoryImage)
    })

    it('Debería actualizar todos los campos si se proporcionan', async () => {
      const fullUpdate = {
        categoryName: 'Pizzas Gourmet',
        categoryDescription: 'Las mejores pizzas de la ciudad',
        categoryImage: 'https://example.com/new-pizza.jpg'
      }

      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([existingCategory], 1))
        .mockResolvedValueOnce(createMockResultSet([], 1))

      const result = await CategoriesModel.update({
        id: existingCategory.categoryId as CategoryId,
        input: fullUpdate
      })

      expect(result).toMatchObject({
        categoryId: existingCategory.categoryId,
        ...fullUpdate
      })
    })

    it('Debería mantener valores originales si no se actualizan', async () => {
      const minimalUpdate = {
        categoryDescription: 'Nueva descripción'
      }

      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([existingCategory], 1))
        .mockResolvedValueOnce(createMockResultSet([], 1))

      const result = await CategoriesModel.update({
        id: existingCategory.categoryId as CategoryId,
        input: minimalUpdate
      })

      expect(result.categoryName).toBe(existingCategory.categoryName)
      expect(result.categoryDescription).toBe('Nueva descripción')
      expect(result.categoryImage).toBe(existingCategory.categoryImage)
    })

    it('Debería lanzar CategoryNotFoundError si la categoría no existe', async () => {
      vi.mocked(db.execute).mockResolvedValueOnce(createMockResultSet([], 0))

      await expect(
        CategoriesModel.update({
          id: '123e4567-e89b-12d3-a456-426614174000',
          input: { categoryName: 'Test' }
        })
      ).rejects.toThrow(CategoryNotFoundError)
    })

    it('Debería lanzar CategoryDatabaseError si falla el UPDATE', async () => {
      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([existingCategory], 1))
        .mockRejectedValueOnce(new Error('Update failed'))

      await expect(
        CategoriesModel.update({
          id: existingCategory.categoryId as CategoryId,
          input: { categoryName: 'Test' }
        })
      ).rejects.toThrow(CategoryDatabaseError)
    })
  })

  describe('delete', () => {
    const categoryId = '123e4567-e89b-12d3-a456-426614174000'
    const mockCategory = {
      categoryId,
      categoryName: 'Pizzas',
      categoryDescription: 'Pizzas artesanales',
      categoryImage: 'https://example.com/pizza.jpg'
    }

    it('Debería eliminar una categoría sin productos asociados', async () => {
      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([mockCategory], 1))
        .mockResolvedValueOnce(createMockResultSet([{ count: 0 }], 1))
        .mockResolvedValueOnce(createMockResultSet([], 1))

      const result = await CategoriesModel.delete({ id: categoryId })

      expect(result).toBe(true)
    })

    it('Debería lanzar CategoryNotFoundError si la categoría no existe', async () => {
      vi.mocked(db.execute).mockResolvedValueOnce(createMockResultSet([], 0))

      await expect(CategoriesModel.delete({ id: categoryId })).rejects.toThrow(
        CategoryNotFoundError
      )
    })

    it('Debería lanzar error si la categoría tiene productos asociados', async () => {
      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([mockCategory], 1))
        .mockResolvedValueOnce(createMockResultSet([{ count: 5 }], 1))

      await expect(CategoriesModel.delete({ id: categoryId })).rejects.toThrow(
        /productos asociados/
      )
    })

    it('Debería retornar false si el DELETE no afecta ninguna fila', async () => {
      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([mockCategory], 1))
        .mockResolvedValueOnce(createMockResultSet([{ count: 0 }], 1))
        .mockResolvedValueOnce(createMockResultSet([], 0))

      const result = await CategoriesModel.delete({ id: categoryId })

      expect(result).toBe(false)
    })

    it('Debería lanzar CategoryDatabaseError si hay un error de BD', async () => {
      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([mockCategory], 1))
        .mockResolvedValueOnce(createMockResultSet([{ count: 0 }], 1))
        .mockRejectedValueOnce(new Error('Delete failed'))

      await expect(CategoriesModel.delete({ id: categoryId })).rejects.toThrow(
        CategoryDatabaseError
      )
    })
  })
})