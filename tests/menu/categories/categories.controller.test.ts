// tests/menu/categories/categories.controller.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CategoriesController } from '../../../src/menu/categories/categories.controller.js'
import { CategoryNotFoundError, CategoryDatabaseError } from '../../../src/shared/errors/crud.errors.js'

describe('CategoriesController', () => {
  let controller: CategoriesController
  let mockModel: any
  let mockReq: any
  let mockRes: any

  beforeEach(() => {
    mockModel = {
      getAll: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }

    controller = new CategoriesController({ categoriesModel: mockModel })

    mockReq = {
      params: {},
      body: {}
    }

    mockRes = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis()
    }
  })

  describe('getAll', () => {
    it('Debería retornar todas las categorías', async () => {
      const mockCategories = [
        { categoryId: '123', categoryName: 'Pizzas' },
        { categoryId: '456', categoryName: 'Hamburguesas' }
      ]
      mockModel.getAll.mockResolvedValue(mockCategories)

      await controller.getAll(mockReq, mockRes)

      expect(mockModel.getAll).toHaveBeenCalled()
      expect(mockRes.json).toHaveBeenCalledWith({ categories: mockCategories })
    })

    it('Debería manejar errores de base de datos', async () => {
      const dbError = new CategoryDatabaseError('obtener')
      mockModel.getAll.mockRejectedValue(dbError)

      await controller.getAll(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ error: dbError.message })
    })
  })

  describe('getById', () => {
    it('Debería retornar una categoría por ID', async () => {
      const mockCategory = {
        categoryId: '123',
        categoryName: 'Pizzas',
        categoryDescription: 'Deliciosas pizzas',
        categoryImage: 'pizza.jpg'
      }
      mockReq.params = { id: '123' }
      mockModel.getById.mockResolvedValue(mockCategory)

      await controller.getById(mockReq, mockRes)

      expect(mockModel.getById).toHaveBeenCalledWith({ id: '123' })
      expect(mockRes.json).toHaveBeenCalledWith({ category: mockCategory })
    })

    it('Debería retornar 404 si la categoría no existe', async () => {
      mockReq.params = { id: '999' }
      mockModel.getById.mockResolvedValue(null)

      await controller.getById(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No se ha encontrado Categoría'
      })
    })

    it('Debería manejar errores de base de datos', async () => {
      mockReq.params = { id: '123' }
      const dbError = new CategoryDatabaseError('obtener')
      mockModel.getById.mockRejectedValue(dbError)

      await controller.getById(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ error: dbError.message })
    })
  })

  describe('create', () => {
    it('Debería crear una nueva categoría con datos válidos', async () => {
      const validInput = {
        categoryName: 'Postres',
        categoryDescription: 'Deliciosos postres caseros',
        categoryImage: 'https://example.com/postres.jpg'
      }
      const createdCategory = {
        categoryId: '789',
        ...validInput
      }

      mockReq.body = validInput
      mockModel.create.mockResolvedValue(createdCategory)

      await controller.create(mockReq, mockRes)

      expect(mockModel.create).toHaveBeenCalledWith({ input: validInput })
      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({ newCategoria: createdCategory })
    })

    it('Debería retornar 400 si los datos son inválidos', async () => {
      mockReq.body = {
        categoryName: 'AB', // Muy corto (min 3)
        categoryDescription: 'Desc',
        categoryImage: 'invalid-url'
      }

      await controller.create(mockReq, mockRes)

      expect(mockModel.create).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalled()
    })

    it('Debería retornar 400 si faltan campos requeridos', async () => {
      mockReq.body = {
        categoryName: 'Postres'
        // Faltan categoryDescription y categoryImage
      }

      await controller.create(mockReq, mockRes)

      expect(mockModel.create).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('Debería manejar errores de base de datos', async () => {
      const validInput = {
        categoryName: 'Postres',
        categoryDescription: 'Deliciosos postres caseros',
        categoryImage: 'https://example.com/postres.jpg'
      }
      mockReq.body = validInput

      const dbError = new CategoryDatabaseError('crear')
      mockModel.create.mockRejectedValue(dbError)

      await controller.create(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ error: dbError.message })
    })
  })

  describe('update', () => {
    it('Debería actualizar una categoría con datos válidos', async () => {
      const updateInput = {
        categoryName: 'Pizzas Gourmet'
      }
      const updatedCategory = {
        categoryId: '123',
        categoryName: 'Pizzas Gourmet',
        categoryDescription: 'Pizzas artesanales',
        categoryImage: 'pizza.jpg'
      }

      mockReq.params = { id: '123' }
      mockReq.body = updateInput
      mockModel.update.mockResolvedValue(updatedCategory)

      await controller.update(mockReq, mockRes)

      expect(mockModel.update).toHaveBeenCalledWith({
        id: '123',
        input: updateInput
      })
      expect(mockRes.json).toHaveBeenCalledWith({ updatedCategory })
    })

    it('Debería retornar 400 si los datos son inválidos', async () => {
      mockReq.params = { id: '123' }
      mockReq.body = {
        categoryName: 'AB', // Muy corto
        categoryImage: 'not-a-url'
      }

      await controller.update(mockReq, mockRes)

      expect(mockModel.update).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('Debería manejar CategoryNotFoundError', async () => {
      mockReq.params = { id: '999' }
      mockReq.body = { categoryName: 'Test' }

      mockModel.update.mockRejectedValue(new CategoryNotFoundError())

      await controller.update(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No se ha encontrado Categoría'
      })
    })

    it('Debería manejar errores de base de datos', async () => {
      mockReq.params = { id: '123' }
      mockReq.body = { categoryName: 'Test' }

      const dbError = new CategoryDatabaseError('actualizar')
      mockModel.update.mockRejectedValue(dbError)

      await controller.update(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ error: dbError.message })
    })
  })

  describe('delete', () => {
    it('Debería eliminar una categoría exitosamente', async () => {
      mockReq.params = { id: '123' }
      mockModel.delete.mockResolvedValue(true)

      await controller.delete(mockReq, mockRes)

      expect(mockModel.delete).toHaveBeenCalledWith({ id: '123' })
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Categoría eliminada exitosamente',
        deleted: true
      })
    })

    it('Debería retornar 500 si la eliminación falla (no afecta filas)', async () => {
      mockReq.params = { id: '123' }
      mockModel.delete.mockResolvedValue(false)

      await controller.delete(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'La categoría no pudo ser eliminada'
      })
    })

    it('Debería retornar 409 si la categoría tiene productos asociados', async () => {
      mockReq.params = { id: '123' }
      const constraintError = new Error(
        'No se puede eliminar la categoría porque tiene productos asociados'
      )
      mockModel.delete.mockRejectedValue(constraintError)

      await controller.delete(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(409)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: constraintError.message,
        code: 'REFERENCE_CONSTRAINT'
      })
    })

    it('Debería manejar CategoryNotFoundError', async () => {
      mockReq.params = { id: '999' }
      mockModel.delete.mockRejectedValue(new CategoryNotFoundError())

      await controller.delete(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No se ha encontrado Categoría'
      })
    })

    it('Debería manejar errores de base de datos', async () => {
      mockReq.params = { id: '123' }
      const dbError = new CategoryDatabaseError('eliminar')
      mockModel.delete.mockRejectedValue(dbError)

      await controller.delete(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ error: dbError.message })
    })
  })
})