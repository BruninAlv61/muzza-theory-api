// tests/menu/offers/offers.controller.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OffersController } from '../../../src/menu/offers/offers.controller.js'
import {
  OfferNotFoundError,
  OfferDatabaseError,
  ProductNotFoundError,
  DuplicateOfferError
} from '../../../src/shared/errors/crud.errors.js'

describe('OffersController', () => {
  let controller: OffersController
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

    controller = new OffersController({ offersModel: mockModel })

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
    it('Debería retornar todas las ofertas', async () => {
      const mockOffers = [
        {
          offerId: '123',
          productId: '456',
          offerDiscount: 20,
          offerFinishDate: '2025-12-31',
          product: {
            productId: '456',
            productName: 'Pizza Margarita',
            productDescription: 'Deliciosa pizza',
            productPrice: 100,
            productImages: 'image.jpg',
            categoryId: '789'
          }
        },
        {
          offerId: '321',
          productId: '654',
          offerDiscount: 15,
          offerFinishDate: '2025-11-30',
          product: {
            productId: '654',
            productName: 'Hamburguesa Clásica',
            productDescription: 'Hamburguesa jugosa',
            productPrice: 80,
            productImages: 'burger.jpg',
            categoryId: '987'
          }
        }
      ]
      mockModel.getAll.mockResolvedValue(mockOffers)

      await controller.getAll(mockReq, mockRes)

      expect(mockModel.getAll).toHaveBeenCalled()
      expect(mockRes.json).toHaveBeenCalledWith({ offers: mockOffers })
    })

    it('Debería manejar errores de base de datos', async () => {
      const dbError = new OfferDatabaseError('obtener')
      mockModel.getAll.mockRejectedValue(dbError)

      await controller.getAll(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ error: dbError.message })
    })
  })

  describe('getById', () => {
    it('Debería retornar una oferta por ID', async () => {
      const mockOffer = {
        offerId: '123',
        productId: '456',
        offerDiscount: 25,
        offerFinishDate: '2025-12-31',
        product: {
          productId: '456',
          productName: 'Pizza Margarita',
          productDescription: 'Deliciosa pizza',
          productPrice: 100,
          productImages: 'image.jpg',
          categoryId: '789'
        }
      }
      mockReq.params = { id: '123' }
      mockModel.getById.mockResolvedValue(mockOffer)

      await controller.getById(mockReq, mockRes)

      expect(mockModel.getById).toHaveBeenCalledWith({ id: '123' })
      expect(mockRes.json).toHaveBeenCalledWith({ offer: mockOffer })
    })

    it('Debería retornar 404 si la oferta no existe', async () => {
      mockReq.params = { id: '999' }
      mockModel.getById.mockResolvedValue(null)

      await controller.getById(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No se ha encontrado Oferta'
      })
    })

    it('Debería manejar errores de base de datos', async () => {
      mockReq.params = { id: '123' }
      const dbError = new OfferDatabaseError('obtener')
      mockModel.getById.mockRejectedValue(dbError)

      await controller.getById(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ error: dbError.message })
    })
  })

  describe('create', () => {
    it('Debería crear una nueva oferta con datos válidos', async () => {
      const validInput = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        offerDiscount: 20,
        offerFinishDate: '2025-12-31'
      }
      const createdOffer = {
        offerId: '789e1234-e89b-12d3-a456-426614174000',
        ...validInput,
        product: {
          productId: validInput.productId,
          productName: 'Pizza Margarita',
          productDescription: 'Deliciosa pizza',
          productPrice: 100,
          productImages: 'image.jpg',
          categoryId: '456'
        }
      }

      mockReq.body = validInput
      mockModel.create.mockResolvedValue(createdOffer)

      await controller.create(mockReq, mockRes)

      expect(mockModel.create).toHaveBeenCalledWith({ input: validInput })
      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({ newOffer: createdOffer })
    })

    it('Debería retornar 400 si el descuento es negativo', async () => {
      mockReq.body = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        offerDiscount: -5,
        offerFinishDate: '2025-12-31'
      }

      await controller.create(mockReq, mockRes)

      expect(mockModel.create).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalled()
    })

    it('Debería retornar 400 si el descuento es mayor a 100', async () => {
      mockReq.body = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        offerDiscount: 150,
        offerFinishDate: '2025-12-31'
      }

      await controller.create(mockReq, mockRes)

      expect(mockModel.create).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('Debería retornar 400 si la fecha es pasada', async () => {
      mockReq.body = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        offerDiscount: 20,
        offerFinishDate: '2020-01-01'
      }

      await controller.create(mockReq, mockRes)

      expect(mockModel.create).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('Debería retornar 400 si el productId no es un UUID válido', async () => {
      mockReq.body = {
        productId: 'invalid-uuid',
        offerDiscount: 20,
        offerFinishDate: '2025-12-31'
      }

      await controller.create(mockReq, mockRes)

      expect(mockModel.create).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('Debería retornar 400 si faltan campos requeridos', async () => {
      mockReq.body = {
        offerDiscount: 20
        // Faltan productId y offerFinishDate
      }

      await controller.create(mockReq, mockRes)

      expect(mockModel.create).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('Debería manejar ProductNotFoundError', async () => {
      const validInput = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        offerDiscount: 20,
        offerFinishDate: '2025-12-31'
      }
      mockReq.body = validInput

      const productError = new ProductNotFoundError()
      mockModel.create.mockRejectedValue(productError)

      await controller.create(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({ error: productError.message })
    })

    it('Debería manejar DuplicateOfferError', async () => {
      const validInput = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        offerDiscount: 20,
        offerFinishDate: '2025-12-31'
      }
      mockReq.body = validInput

      const duplicateError = new DuplicateOfferError()
      mockModel.create.mockRejectedValue(duplicateError)

      await controller.create(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(409)
      expect(mockRes.json).toHaveBeenCalledWith({ error: duplicateError.message })
    })

    it('Debería manejar errores de base de datos', async () => {
      const validInput = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        offerDiscount: 20,
        offerFinishDate: '2025-12-31'
      }
      mockReq.body = validInput

      const dbError = new OfferDatabaseError('crear')
      mockModel.create.mockRejectedValue(dbError)

      await controller.create(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ error: dbError.message })
    })
  })

  describe('update', () => {
    it('Debería actualizar una oferta con datos válidos', async () => {
      const updateInput = {
        offerDiscount: 30
      }
      const updatedOffer = {
        offerId: '123',
        productId: '456',
        offerDiscount: 30,
        offerFinishDate: '2025-12-31',
        product: {
          productId: '456',
          productName: 'Pizza Margarita',
          productDescription: 'Deliciosa pizza',
          productPrice: 100,
          productImages: 'image.jpg',
          categoryId: '789'
        }
      }

      mockReq.params = { id: '123' }
      mockReq.body = updateInput
      mockModel.update.mockResolvedValue(updatedOffer)

      await controller.update(mockReq, mockRes)

      expect(mockModel.update).toHaveBeenCalledWith({
        id: '123',
        input: updateInput
      })
      expect(mockRes.json).toHaveBeenCalledWith({ updatedOffer })
    })

    it('Debería retornar 400 si los datos son inválidos', async () => {
      mockReq.params = { id: '123' }
      mockReq.body = {
        offerDiscount: 150 // Mayor a 100
      }

      await controller.update(mockReq, mockRes)

      expect(mockModel.update).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('Debería manejar OfferNotFoundError', async () => {
      mockReq.params = { id: '999' }
      mockReq.body = { offerDiscount: 25 }

      mockModel.update.mockRejectedValue(new OfferNotFoundError())

      await controller.update(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No se ha encontrado Oferta'
      })
    })

    it('Debería manejar ProductNotFoundError al cambiar producto', async () => {
      mockReq.params = { id: '123' }
      mockReq.body = {
        productId: '999e4567-e89b-12d3-a456-426614174000'
      }

      mockModel.update.mockRejectedValue(new ProductNotFoundError())

      await controller.update(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No se ha encontrado Producto'
      })
    })

    it('Debería manejar DuplicateOfferError al cambiar producto', async () => {
      mockReq.params = { id: '123' }
      mockReq.body = {
        productId: '456e4567-e89b-12d3-a456-426614174000'
      }

      mockModel.update.mockRejectedValue(new DuplicateOfferError())

      await controller.update(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(409)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Ya existe una oferta activa para este producto'
      })
    })

    it('Debería manejar errores de base de datos', async () => {
      mockReq.params = { id: '123' }
      mockReq.body = { offerDiscount: 25 }

      const dbError = new OfferDatabaseError('actualizar')
      mockModel.update.mockRejectedValue(dbError)

      await controller.update(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ error: dbError.message })
    })
  })

  describe('delete', () => {
    it('Debería eliminar una oferta exitosamente', async () => {
      mockReq.params = { id: '123' }
      mockModel.delete.mockResolvedValue(true)

      await controller.delete(mockReq, mockRes)

      expect(mockModel.delete).toHaveBeenCalledWith({ id: '123' })
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Oferta eliminada exitosamente',
        deleted: true
      })
    })

    it('Debería retornar 500 si la eliminación falla (no afecta filas)', async () => {
      mockReq.params = { id: '123' }
      mockModel.delete.mockResolvedValue(false)

      await controller.delete(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'La oferta no pudo ser eliminada'
      })
    })

    it('Debería manejar OfferNotFoundError', async () => {
      mockReq.params = { id: '999' }
      mockModel.delete.mockRejectedValue(new OfferNotFoundError())

      await controller.delete(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No se ha encontrado Oferta'
      })
    })

    it('Debería manejar errores de base de datos', async () => {
      mockReq.params = { id: '123' }
      const dbError = new OfferDatabaseError('eliminar')
      mockModel.delete.mockRejectedValue(dbError)

      await controller.delete(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ error: dbError.message })
    })
  })
})