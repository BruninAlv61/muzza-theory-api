// tests/menu/offers/offers.model.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OffersModel } from '../../../src/menu/offers/offers.model.js'
import { db } from '../../../src/shared/database/connection.js'
import {
  OfferNotFoundError,
  OfferDatabaseError,
  ProductNotFoundError,
  DuplicateOfferError
} from '../../../src/shared/errors/crud.errors.js'
import type { ResultSet } from '@libsql/client'
import { Offer, OfferId } from '../../../src/shared/types.js'

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

describe('OffersModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('Debería retornar todas las ofertas con sus productos', async () => {
      const mockOffers = [
        {
          offerId: '123e4567-e89b-12d3-a456-426614174000',
          productId: '456e7890-e89b-12d3-a456-426614174001',
          offerDiscount: 20,
          offerFinishDate: '2025-12-31',
          productName: 'Pizza Margarita',
          productDescription: 'Deliciosa pizza',
          productPrice: 100,
          productImages: 'pizza.jpg',
          categoryId: '789e0123-e89b-12d3-a456-426614174002'
        },
        {
          offerId: '987e6543-e21b-12d3-a456-426614174999',
          productId: '654e3210-e89b-12d3-a456-426614174003',
          offerDiscount: 15,
          offerFinishDate: '2025-11-30',
          productName: 'Hamburguesa Clásica',
          productDescription: 'Hamburguesa jugosa',
          productPrice: 80,
          productImages: 'burger.jpg',
          categoryId: '321e9876-e89b-12d3-a456-426614174004'
        }
      ]

      vi.mocked(db.execute).mockResolvedValueOnce(
        createMockResultSet(mockOffers, 2)
      )

      const result = await OffersModel.getAll()

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        offerId: mockOffers[0].offerId,
        productId: mockOffers[0].productId,
        offerDiscount: mockOffers[0].offerDiscount,
        offerFinishDate: mockOffers[0].offerFinishDate,
        product: {
          productId: mockOffers[0].productId,
          productName: mockOffers[0].productName,
          productDescription: mockOffers[0].productDescription,
          productPrice: mockOffers[0].productPrice,
          productImages: mockOffers[0].productImages,
          categoryId: mockOffers[0].categoryId
        }
      })
    })

    it('Debería retornar un array vacío si no hay ofertas', async () => {
      vi.mocked(db.execute).mockResolvedValueOnce(createMockResultSet([], 0))

      const result = await OffersModel.getAll()

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('Debería lanzar OfferDatabaseError en caso de error', async () => {
      vi.mocked(db.execute).mockRejectedValueOnce(new Error('Database error'))

      await expect(OffersModel.getAll()).rejects.toThrow(OfferDatabaseError)
    })
  })

  describe('getById', () => {
    it('Debería retornar una oferta por ID con su producto', async () => {
      const mockOffer = {
        offerId: '123e4567-e89b-12d3-a456-426614174000',
        productId: '456e7890-e89b-12d3-a456-426614174001',
        offerDiscount: 25,
        offerFinishDate: '2025-12-31',
        productName: 'Pizza Margarita',
        productDescription: 'Deliciosa pizza',
        productPrice: 100,
        productImages: 'pizza.jpg',
        categoryId: '789e0123-e89b-12d3-a456-426614174002'
      }

      vi.mocked(db.execute).mockResolvedValueOnce(
        createMockResultSet([mockOffer], 1)
      )

      const result = await OffersModel.getById({
        id: '123e4567-e89b-12d3-a456-426614174000'
      })

      expect(result).toMatchObject({
        offerId: mockOffer.offerId,
        productId: mockOffer.productId,
        offerDiscount: mockOffer.offerDiscount,
        offerFinishDate: mockOffer.offerFinishDate,
        product: {
          productId: mockOffer.productId,
          productName: mockOffer.productName,
          productDescription: mockOffer.productDescription,
          productPrice: mockOffer.productPrice,
          productImages: mockOffer.productImages,
          categoryId: mockOffer.categoryId
        }
      })
    })

    it('Debería retornar null si la oferta no existe', async () => {
      vi.mocked(db.execute).mockResolvedValueOnce(createMockResultSet([], 0))

      const result = await OffersModel.getById({
        id: '123e4567-e89b-12d3-a456-426614174000'
      })

      expect(result).toBeNull()
    })

    it('Debería lanzar OfferDatabaseError si hay un error de BD', async () => {
      vi.mocked(db.execute).mockRejectedValueOnce(new Error('Connection failed'))

      await expect(
        OffersModel.getById({ id: '123e4567-e89b-12d3-a456-426614174000' })
      ).rejects.toThrow(OfferDatabaseError)
    })
  })

  describe('create', () => {
    const mockProduct = {
      productId: '456e7890-e89b-12d3-a456-426614174001',
      productName: 'Pizza Margarita',
      productDescription: 'Deliciosa pizza',
      productPrice: 100,
      productImages: 'pizza.jpg',
      categoryId: '789e0123-e89b-12d3-a456-426614174002'
    }

    it('Debería crear una nueva oferta', async () => {
      const input: Offer = {
        productId: '456e7890-e89b-12d3-a456-426614174001',
        offerDiscount: 20,
        offerFinishDate: '2025-12-31'
      }

      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([mockProduct], 1))
        .mockResolvedValueOnce(createMockResultSet([], 0))
        .mockResolvedValueOnce(createMockResultSet([], 1))

      const result = await OffersModel.create({ input })

      expect(result).toMatchObject({
        productId: input.productId,
        offerDiscount: input.offerDiscount,
        offerFinishDate: input.offerFinishDate,
        product: mockProduct
      })
      expect(result.offerId).toBeDefined()
      expect(result.offerId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    })

    it('Debería lanzar ProductNotFoundError si el producto no existe', async () => {
      const input: Offer = {
        productId: '999e7890-e89b-12d3-a456-426614174001',
        offerDiscount: 20,
        offerFinishDate: '2025-12-31'
      }

      vi.mocked(db.execute).mockResolvedValueOnce(createMockResultSet([], 0))

      await expect(OffersModel.create({ input })).rejects.toThrow(
        ProductNotFoundError
      )
    })

    it('Debería lanzar DuplicateOfferError si el producto ya tiene oferta', async () => {
      const input: Offer = {
        productId: '456e7890-e89b-12d3-a456-426614174001',
        offerDiscount: 20,
        offerFinishDate: '2025-12-31'
      }

      const existingOffer = {
        offerId: '123e4567-e89b-12d3-a456-426614174000',
        productId: input.productId,
        offerDiscount: 15,
        offerFinishDate: '2025-11-30'
      }

      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([mockProduct], 1))
        .mockResolvedValueOnce(createMockResultSet([existingOffer], 1))

      await expect(OffersModel.create({ input })).rejects.toThrow(
        DuplicateOfferError
      )
    })

    it('Debería lanzar OfferDatabaseError si falla el INSERT', async () => {
      const input: Offer = {
        productId: '456e7890-e89b-12d3-a456-426614174001',
        offerDiscount: 20,
        offerFinishDate: '2025-12-31'
      }

      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([mockProduct], 1))
        .mockResolvedValueOnce(createMockResultSet([], 0))
        .mockRejectedValueOnce(new Error('Insert failed'))

      await expect(OffersModel.create({ input })).rejects.toThrow(
        OfferDatabaseError
      )
    })
  })

  describe('update', () => {
    const existingOffer = {
      offerId: '123e4567-e89b-12d3-a456-426614174000',
      productId: '456e7890-e89b-12d3-a456-426614174001',
      offerDiscount: 20,
      offerFinishDate: '2025-12-31',
      productName: 'Pizza Margarita',
      productDescription: 'Deliciosa pizza',
      productPrice: 100,
      productImages: 'pizza.jpg',
      categoryId: '789e0123-e89b-12d3-a456-426614174002'
    }

    const mockProduct = {
      productId: existingOffer.productId,
      productName: existingOffer.productName,
      productDescription: existingOffer.productDescription,
      productPrice: existingOffer.productPrice,
      productImages: existingOffer.productImages,
      categoryId: existingOffer.categoryId
    }

    it('Debería actualizar el descuento de una oferta', async () => {
      const updateInput = {
        offerDiscount: 30
      }

      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([existingOffer], 1))
        .mockResolvedValueOnce(createMockResultSet([], 1))
        .mockResolvedValueOnce(createMockResultSet([mockProduct], 1))

      const result = await OffersModel.update({
        id: existingOffer.offerId as OfferId,
        input: updateInput
      })

      expect(result.offerFinishDate).toBe(existingOffer.offerFinishDate)
      expect(result.offerDiscount).toBe(updateInput.offerDiscount)
      expect(result.productId).toBe(existingOffer.productId)
    })

    it('Debería actualizar todos los campos si se proporcionan', async () => {
      const fullUpdate = {
        offerDiscount: 35,
        offerFinishDate: '2026-06-30'
      }

      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([existingOffer], 1))
        .mockResolvedValueOnce(createMockResultSet([], 1))
        .mockResolvedValueOnce(createMockResultSet([mockProduct], 1))

      const result = await OffersModel.update({
        id: existingOffer.offerId as OfferId,
        input: fullUpdate
      })

      expect(result).toMatchObject({
        offerId: existingOffer.offerId,
        productId: existingOffer.productId,
        offerDiscount: fullUpdate.offerDiscount,
        offerFinishDate: fullUpdate.offerFinishDate,
        product: mockProduct
      })
    })

    it('Debería cambiar el producto de una oferta', async () => {
      const newProduct = {
        productId: '999e7890-e89b-12d3-a456-426614174999',
        productName: 'Hamburguesa Premium',
        productDescription: 'Hamburguesa gourmet',
        productPrice: 120,
        productImages: 'burger.jpg',
        categoryId: '888e0123-e89b-12d3-a456-426614174888'
      }

      const updateInput = {
        productId: newProduct.productId
      }

      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([existingOffer], 1))
        .mockResolvedValueOnce(createMockResultSet([newProduct], 1))
        .mockResolvedValueOnce(createMockResultSet([], 0))
        .mockResolvedValueOnce(createMockResultSet([], 1))
        .mockResolvedValueOnce(createMockResultSet([newProduct], 1))

      const result = await OffersModel.update({
        id: existingOffer.offerId as OfferId,
        input: updateInput as Offer
      })

      expect(result.productId).toBe(newProduct.productId)
      expect(result.product).toMatchObject(newProduct)
    })

    it('Debería lanzar OfferNotFoundError si la oferta no existe', async () => {
      vi.mocked(db.execute).mockResolvedValueOnce(createMockResultSet([], 0))

      await expect(
        OffersModel.update({
          id: '999e4567-e89b-12d3-a456-426614174999',
          input: { offerDiscount: 25 }
        })
      ).rejects.toThrow(OfferNotFoundError)
    })

    it('Debería lanzar ProductNotFoundError si el nuevo producto no existe', async () => {
      const updateInput = {
        productId: '999e7890-e89b-12d3-a456-426614174999'
      }

      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([existingOffer], 1))
        .mockResolvedValueOnce(createMockResultSet([], 0))

      await expect(
        OffersModel.update({
          id: existingOffer.offerId as OfferId,
          input: updateInput as Offer
        }) 
      ).rejects.toThrow(ProductNotFoundError)
    })

    it('Debería lanzar DuplicateOfferError si el nuevo producto ya tiene oferta', async () => {
      const newProduct = {
        productId: '999e7890-e89b-12d3-a456-426614174999',
        productName: 'Hamburguesa Premium',
        productDescription: 'Hamburguesa gourmet',
        productPrice: 120,
        productImages: 'burger.jpg',
        categoryId: '888e0123-e89b-12d3-a456-426614174888'
      }

      const existingOfferForNewProduct = {
        offerId: '888e4567-e89b-12d3-a456-426614174888',
        productId: newProduct.productId,
        offerDiscount: 10,
        offerFinishDate: '2025-10-31'
      }

      const updateInput = {
        productId: newProduct.productId
      }

      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([existingOffer], 1))
        .mockResolvedValueOnce(createMockResultSet([newProduct], 1))
        .mockResolvedValueOnce(createMockResultSet([existingOfferForNewProduct], 1))

      await expect(
        OffersModel.update({
          id: existingOffer.offerId as OfferId,
          input: updateInput as Offer
        })
      ).rejects.toThrow(DuplicateOfferError)
    })

    it('Debería mantener el mismo producto si no se proporciona uno nuevo', async () => {
      const updateInput = {
        offerDiscount: 25
      }

      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([existingOffer], 1))
        .mockResolvedValueOnce(createMockResultSet([], 1))
        .mockResolvedValueOnce(createMockResultSet([mockProduct], 1))

      const result = await OffersModel.update({
        id: existingOffer.offerId as OfferId,
        input: updateInput
      })

      expect(result.productId).toBe(existingOffer.productId)
      expect(result.product).toMatchObject(mockProduct)
    })

    it('Debería lanzar OfferDatabaseError si falla el UPDATE', async () => {
      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([existingOffer], 1))
        .mockRejectedValueOnce(new Error('Update failed'))

      await expect(
        OffersModel.update({
          id: existingOffer.offerId as OfferId,
          input: { offerDiscount: 25 }
        })
      ).rejects.toThrow(OfferDatabaseError)
    })
  })

  describe('delete', () => {
    const offerId = '123e4567-e89b-12d3-a456-426614174000'
    const mockOffer = {
      offerId,
      productId: '456e7890-e89b-12d3-a456-426614174001',
      offerDiscount: 20,
      offerFinishDate: '2025-12-31',
      productName: 'Pizza Margarita',
      productDescription: 'Deliciosa pizza',
      productPrice: 100,
      productImages: 'pizza.jpg',
      categoryId: '789e0123-e89b-12d3-a456-426614174002'
    }

    it('Debería eliminar una oferta exitosamente', async () => {
      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([mockOffer], 1))
        .mockResolvedValueOnce(createMockResultSet([], 1))

      const result = await OffersModel.delete({ id: offerId })

      expect(result).toBe(true)
    })

    it('Debería lanzar OfferNotFoundError si la oferta no existe', async () => {
      vi.mocked(db.execute).mockResolvedValueOnce(createMockResultSet([], 0))

      await expect(OffersModel.delete({ id: offerId })).rejects.toThrow(
        OfferNotFoundError
      )
    })

    it('Debería retornar false si el DELETE no afecta ninguna fila', async () => {
      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([mockOffer], 1))
        .mockResolvedValueOnce(createMockResultSet([], 0))

      const result = await OffersModel.delete({ id: offerId })

      expect(result).toBe(false)
    })

    it('Debería lanzar OfferDatabaseError si hay un error de BD', async () => {
      vi.mocked(db.execute)
        .mockResolvedValueOnce(createMockResultSet([mockOffer], 1))
        .mockRejectedValueOnce(new Error('Delete failed'))

      await expect(OffersModel.delete({ id: offerId })).rejects.toThrow(
        OfferDatabaseError
      )
    })
  })
})