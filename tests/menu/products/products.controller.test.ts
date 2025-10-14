// tests/menu/products/products.controller.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProductsController } from '../../../src/menu/products/products.controller.js'
import {
  ProductNotFoundError,
  ProductDatabaseError,
  CategoryNotFoundError
} from '../../../src/shared/errors/crud.errors.js'

describe('ProductsController', () => {
  let controller: ProductsController
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

    controller = new ProductsController({ productsModel: mockModel })

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
    it('Debería retornar todos los productos', async () => {
      const mockProducts = [
        {
          productId: '123',
          productName: 'Pizza Margarita',
          productDescription: 'Deliciosa pizza con mozzarella',
          productPrice: 100,
          productImages: '["image1.jpg","image2.jpg"]',
          categoryId: '456'
        },
        {
          productId: '789',
          productName: 'Hamburguesa Clásica',
          productDescription: 'Hamburguesa con carne y vegetales',
          productPrice: 80,
          productImages: '["burger.jpg"]',
          categoryId: '456'
        }
      ]
      mockModel.getAll.mockResolvedValue(mockProducts)

      await controller.getAll(mockReq, mockRes)

      expect(mockModel.getAll).toHaveBeenCalled()
      expect(mockRes.json).toHaveBeenCalledWith({ products: mockProducts })
    })

    it('Debería manejar errores de base de datos', async () => {
      const dbError = new ProductDatabaseError('obtener')
      mockModel.getAll.mockRejectedValue(dbError)

      await controller.getAll(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ error: dbError.message })
    })
  })

  describe('getById', () => {
    it('Debería retornar un producto por ID', async () => {
      const mockProduct = {
        productId: '123',
        productName: 'Pizza Margarita',
        productDescription: 'Deliciosa pizza con mozzarella',
        productPrice: 100,
        productImages: '["image1.jpg","image2.jpg"]',
        categoryId: '456'
      }
      mockReq.params = { id: '123' }
      mockModel.getById.mockResolvedValue(mockProduct)

      await controller.getById(mockReq, mockRes)

      expect(mockModel.getById).toHaveBeenCalledWith({ id: '123' })
      expect(mockRes.json).toHaveBeenCalledWith({ product: mockProduct })
    })

    it('Debería retornar 404 si el producto no existe', async () => {
      mockReq.params = { id: '999' }
      mockModel.getById.mockResolvedValue(null)

      await controller.getById(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No se ha encontrado Producto'
      })
    })

    it('Debería manejar errores de base de datos', async () => {
      mockReq.params = { id: '123' }
      const dbError = new ProductDatabaseError('obtener')
      mockModel.getById.mockRejectedValue(dbError)

      await controller.getById(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ error: dbError.message })
    })
  })

  describe('create', () => {
    it('Debería crear un nuevo producto con datos válidos', async () => {
      const validInput = {
        productName: 'Pizza Napolitana',
        productDescription: 'Pizza con tomate, mozzarella y albahaca fresca',
        productPrice: 120,
        productImages: ['https://example.com/pizza1.jpg', 'https://example.com/pizza2.jpg'],
        categoryId: '123e4567-e89b-12d3-a456-426614174000'
      }
      const createdProduct = {
        productId: '789',
        productName: validInput.productName,
        productDescription: validInput.productDescription,
        productPrice: validInput.productPrice,
        productImages: JSON.stringify(validInput.productImages),
        categoryId: validInput.categoryId
      }

      mockReq.body = validInput
      mockModel.create.mockResolvedValue(createdProduct)

      await controller.create(mockReq, mockRes)

      expect(mockModel.create).toHaveBeenCalledWith({
        input: {
          ...validInput,
          productImages: JSON.stringify(validInput.productImages)
        }
      })
      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({
        newProduct: {
          ...createdProduct,
          productImages: validInput.productImages
        }
      })
    })

    it('Debería retornar 400 si el nombre es muy corto', async () => {
      mockReq.body = {
        productName: 'AB',
        productDescription: 'Descripción válida del producto',
        productPrice: 100,
        productImages: ['https://example.com/image.jpg'],
        categoryId: '123e4567-e89b-12d3-a456-426614174000'
      }

      await controller.create(mockReq, mockRes)

      expect(mockModel.create).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalled()
    })

    it('Debería retornar 400 si la descripción es muy corta', async () => {
      mockReq.body = {
        productName: 'Pizza Napolitana',
        productDescription: 'Corta',
        productPrice: 100,
        productImages: ['https://example.com/image.jpg'],
        categoryId: '123e4567-e89b-12d3-a456-426614174000'
      }

      await controller.create(mockReq, mockRes)

      expect(mockModel.create).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('Debería retornar 400 si el precio es negativo', async () => {
      mockReq.body = {
        productName: 'Pizza Napolitana',
        productDescription: 'Descripción válida del producto',
        productPrice: -50,
        productImages: ['https://example.com/image.jpg'],
        categoryId: '123e4567-e89b-12d3-a456-426614174000'
      }

      await controller.create(mockReq, mockRes)

      expect(mockModel.create).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('Debería retornar 400 si no hay imágenes', async () => {
      mockReq.body = {
        productName: 'Pizza Napolitana',
        productDescription: 'Descripción válida del producto',
        productPrice: 100,
        productImages: [],
        categoryId: '123e4567-e89b-12d3-a456-426614174000'
      }

      await controller.create(mockReq, mockRes)

      expect(mockModel.create).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('Debería retornar 400 si hay más de 10 imágenes', async () => {
      mockReq.body = {
        productName: 'Pizza Napolitana',
        productDescription: 'Descripción válida del producto',
        productPrice: 100,
        productImages: Array(11).fill('https://example.com/image.jpg'),
        categoryId: '123e4567-e89b-12d3-a456-426614174000'
      }

      await controller.create(mockReq, mockRes)

      expect(mockModel.create).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('Debería retornar 400 si las imágenes no son URLs válidas', async () => {
      mockReq.body = {
        productName: 'Pizza Napolitana',
        productDescription: 'Descripción válida del producto',
        productPrice: 100,
        productImages: ['not-a-url', 'invalid-image'],
        categoryId: '123e4567-e89b-12d3-a456-426614174000'
      }

      await controller.create(mockReq, mockRes)

      expect(mockModel.create).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('Debería retornar 400 si el categoryId no es un UUID válido', async () => {
      mockReq.body = {
        productName: 'Pizza Napolitana',
        productDescription: 'Descripción válida del producto',
        productPrice: 100,
        productImages: ['https://example.com/image.jpg'],
        categoryId: 'invalid-uuid'
      }

      await controller.create(mockReq, mockRes)

      expect(mockModel.create).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('Debería retornar 400 si faltan campos requeridos', async () => {
      mockReq.body = {
        productName: 'Pizza Napolitana',
        productPrice: 100
        // Faltan otros campos
      }

      await controller.create(mockReq, mockRes)

      expect(mockModel.create).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('Debería manejar CategoryNotFoundError', async () => {
      const validInput = {
        productName: 'Pizza Napolitana',
        productDescription: 'Descripción válida del producto',
        productPrice: 100,
        productImages: ['https://example.com/image.jpg'],
        categoryId: '123e4567-e89b-12d3-a456-426614174000'
      }
      mockReq.body = validInput

      const categoryError = new CategoryNotFoundError()
      mockModel.create.mockRejectedValue(categoryError)

      await controller.create(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({ error: categoryError.message })
    })

    it('Debería manejar errores de base de datos', async () => {
      const validInput = {
        productName: 'Pizza Napolitana',
        productDescription: 'Descripción válida del producto',
        productPrice: 100,
        productImages: ['https://example.com/image.jpg'],
        categoryId: '123e4567-e89b-12d3-a456-426614174000'
      }
      mockReq.body = validInput

      const dbError = new ProductDatabaseError('crear')
      mockModel.create.mockRejectedValue(dbError)

      await controller.create(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ error: dbError.message })
    })
  })

  describe('update', () => {
    it('Debería actualizar un producto con datos válidos', async () => {
      const updateInput = {
        productName: 'Pizza Napolitana Premium',
        productPrice: 150
      }
      const updatedProduct = {
        productId: '123',
        productName: 'Pizza Napolitana Premium',
        productDescription: 'Descripción original',
        productPrice: 150,
        productImages: '["image.jpg"]',
        categoryId: '456'
      }

      mockReq.params = { id: '123' }
      mockReq.body = updateInput
      mockModel.update.mockResolvedValue(updatedProduct)

      await controller.update(mockReq, mockRes)

      expect(mockModel.update).toHaveBeenCalledWith({
        id: '123',
        input: {
          productName: updateInput.productName,
          productPrice: updateInput.productPrice,
          productImages: undefined
        }
      })
      expect(mockRes.json).toHaveBeenCalledWith({ updatedProduct })
    })

    it('Debería actualizar las imágenes del producto', async () => {
      const updateInput = {
        productImages: ['https://example.com/new-image1.jpg', 'https://example.com/new-image2.jpg']
      }
      const updatedProduct = {
        productId: '123',
        productName: 'Pizza Napolitana',
        productDescription: 'Descripción',
        productPrice: 100,
        productImages: JSON.stringify(updateInput.productImages),
        categoryId: '456'
      }

      mockReq.params = { id: '123' }
      mockReq.body = updateInput
      mockModel.update.mockResolvedValue(updatedProduct)

      await controller.update(mockReq, mockRes)

      expect(mockModel.update).toHaveBeenCalledWith({
        id: '123',
        input: {
          productImages: JSON.stringify(updateInput.productImages)
        }
      })
      expect(mockRes.json).toHaveBeenCalledWith({ updatedProduct })
    })

    it('Debería retornar 400 si los datos son inválidos', async () => {
      mockReq.params = { id: '123' }
      mockReq.body = {
        productName: 'AB',
        productPrice: -10
      }

      await controller.update(mockReq, mockRes)

      expect(mockModel.update).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('Debería manejar ProductNotFoundError', async () => {
      mockReq.params = { id: '999' }
      mockReq.body = { productName: 'Test' }

      mockModel.update.mockRejectedValue(new ProductNotFoundError())

      await controller.update(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No se ha encontrado Producto'
      })
    })

    it('Debería manejar CategoryNotFoundError al cambiar categoría', async () => {
      mockReq.params = { id: '123' }
      mockReq.body = {
        categoryId: '999e4567-e89b-12d3-a456-426614174999'
      }

      mockModel.update.mockRejectedValue(new CategoryNotFoundError())

      await controller.update(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No se ha encontrado Categoría'
      })
    })

    it('Debería manejar errores de base de datos', async () => {
      mockReq.params = { id: '123' }
      mockReq.body = { productName: 'Test' }

      const dbError = new ProductDatabaseError('actualizar')
      mockModel.update.mockRejectedValue(dbError)

      await controller.update(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ error: dbError.message })
    })
  })

  describe('delete', () => {
    it('Debería eliminar un producto exitosamente', async () => {
      mockReq.params = { id: '123' }
      mockModel.delete.mockResolvedValue(true)

      await controller.delete(mockReq, mockRes)

      expect(mockModel.delete).toHaveBeenCalledWith({ id: '123' })
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Producto eliminado exitosamente',
        deleted: true
      })
    })

    it('Debería retornar 500 si la eliminación falla (no afecta filas)', async () => {
      mockReq.params = { id: '123' }
      mockModel.delete.mockResolvedValue(false)

      await controller.delete(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'El producto no pudo ser eliminado'
      })
    })

    it('Debería retornar 409 si el producto tiene ofertas asociadas', async () => {
      mockReq.params = { id: '123' }
      const constraintError = new Error(
        'No se puede eliminar el producto porque tiene ofertas asociadas'
      )
      mockModel.delete.mockRejectedValue(constraintError)

      await controller.delete(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: constraintError.message
      })
    })

    it('Debería manejar ProductNotFoundError', async () => {
      mockReq.params = { id: '999' }
      mockModel.delete.mockRejectedValue(new ProductNotFoundError())

      await controller.delete(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No se ha encontrado Producto'
      })
    })

    it('Debería manejar errores de base de datos', async () => {
      mockReq.params = { id: '123' }
      const dbError = new ProductDatabaseError('eliminar')
      mockModel.delete.mockRejectedValue(dbError)

      await controller.delete(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ error: dbError.message })
    })
  })
})