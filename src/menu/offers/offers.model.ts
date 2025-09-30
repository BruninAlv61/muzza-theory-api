// src/menu/offers/offers.model.ts
import { db } from '../../shared/database/connection.js'
import { randomUUID } from 'node:crypto'
import {
  ProductNotFoundError,
  OfferNotFoundError,
  OfferDatabaseError,
  DuplicateOfferError,
  CRUD_OPERATIONS
} from '../../shared/errors/crud.errors.js'
import type {
  Offer,
  OfferId,
  OfferFormatedResponse,
  ProductWithId
} from '../../shared/types.js'

export class OffersModel {
  static async getAll(): Promise<OfferFormatedResponse[]> {
    try {
      const offers = await db.execute(`
        SELECT 
          o.offerId,
          o.productId,
          o.offerDiscount,
          o.offerFinishDate,
          p.productId,
          p.productName,
          p.productDescription,
          p.productPrice,
          p.productImages,
          p.categoryId
        FROM offers o
        INNER JOIN products p ON o.productId = p.productId
      `)

      return offers.rows.map((row: any) => ({
        offerId: row.offerId,
        productId: row.productId,
        offerDiscount: row.offerDiscount,
        offerFinishDate: row.offerFinishDate,
        product: {
          productId: row.productId,
          productName: row.productName,
          productDescription: row.productDescription,
          productPrice: row.productPrice,
          productImages: row.productImages,
          categoryId: row.categoryId
        }
      })) as OfferFormatedResponse[]
    } catch (error) {
      console.error('Error al obtener las ofertas:', error)
      throw new OfferDatabaseError(CRUD_OPERATIONS.GET, error as Error)
    }
  }

  static async getById({ id }: { id: OfferId }): Promise<OfferFormatedResponse | null> {
    try {
      const result = await db.execute(
        `
        SELECT 
          o.offerId,
          o.productId,
          o.offerDiscount,
          o.offerFinishDate,
          p.productId,
          p.productName,
          p.productDescription,
          p.productPrice,
          p.productImages,
          p.categoryId
        FROM offers o
        INNER JOIN products p ON o.productId = p.productId
        WHERE o.offerId = ?
      `,
        [id]
      )

      if (result.rows.length === 0) return null

      const row = result.rows[0] as any

      return {
        offerId: row.offerId,
        productId: row.productId,
        offerDiscount: row.offerDiscount,
        offerFinishDate: row.offerFinishDate,
        product: {
          productId: row.productId,
          productName: row.productName,
          productDescription: row.productDescription,
          productPrice: row.productPrice,
          productImages: row.productImages,
          categoryId: row.categoryId
        }
      }
    } catch (error) {
      console.error('Error al obtener la oferta:', error)
      throw new OfferDatabaseError(CRUD_OPERATIONS.GET, error as Error)
    }
  }

  static async create({ input }: { input: Offer }): Promise<OfferFormatedResponse> {
    const { productId, offerDiscount, offerFinishDate } = input

    try {
      const existingProduct = await db.execute(
        `SELECT * FROM products WHERE productId = ?`,
        [productId]
      )

      if (existingProduct.rows.length === 0) {
        throw new ProductNotFoundError()
      }

      const existingOffer = await db.execute(
        `SELECT * FROM offers WHERE productId = ?`,
        [productId]
      )

      if (existingOffer.rows.length > 0) {
        throw new DuplicateOfferError()
      }

      const offerId = randomUUID()

      await db.execute(
        `INSERT INTO offers (offerId, productId, offerDiscount, offerFinishDate) 
         VALUES (?, ?, ?, ?)`,
        [offerId, productId, offerDiscount, offerFinishDate]
      )

      return {
        offerId,
        productId,
        product: existingProduct.rows[0] as unknown as ProductWithId,
        offerDiscount,
        offerFinishDate
      }
    } catch (error) {
      if (error instanceof ProductNotFoundError || error instanceof DuplicateOfferError) {
        throw error
      }

      console.error('Error al crear la oferta:', error)
      throw new OfferDatabaseError(CRUD_OPERATIONS.CREATE, error as Error)
    }
  }

  static async update({
    id,
    input
  }: {
    id: OfferId
    input: Partial<Offer>
  }): Promise<OfferFormatedResponse> {
    try {
      const existingOffer = await this.getById({ id })

      if (!existingOffer) throw new OfferNotFoundError()

      if (input.productId && input.productId !== existingOffer.productId) {
        const existingProduct = await db.execute(
          `SELECT * FROM products WHERE productId = ?`,
          [input.productId]
        )

        if (existingProduct.rows.length === 0) {
          throw new ProductNotFoundError()
        }

        const productHasOffer = await db.execute(
          `SELECT * FROM offers WHERE productId = ? AND offerId != ?`,
          [input.productId, id]
        )

        if (productHasOffer.rows.length > 0) {
          throw new DuplicateOfferError()
        }
      }

      const updatedOffer = {
        productId: input.productId ?? existingOffer.productId,
        offerDiscount: input.offerDiscount ?? existingOffer.offerDiscount,
        offerFinishDate: input.offerFinishDate ?? existingOffer.offerFinishDate
      }

      await db.execute(
        `UPDATE offers
         SET productId = ?, offerDiscount = ?, offerFinishDate = ?
         WHERE offerId = ?`,
        [
          updatedOffer.productId,
          updatedOffer.offerDiscount,
          updatedOffer.offerFinishDate,
          id
        ]
      )

      const productResult = await db.execute(
        `SELECT * FROM products WHERE productId = ?`,
        [updatedOffer.productId]
      )

      return {
        offerId: id,
        ...updatedOffer,
        product: productResult.rows[0] as unknown as ProductWithId
      }
    } catch (error) {
      if (
        error instanceof OfferNotFoundError || 
        error instanceof ProductNotFoundError ||
        error instanceof DuplicateOfferError
      ) {
        throw error
      }

      console.error('Error al actualizar la oferta:', error)
      throw new OfferDatabaseError(CRUD_OPERATIONS.UPDATE, error as Error)
    }
  }

  static async delete({ id }: { id: OfferId }): Promise<boolean> {
    try {
      const existingOffer = await this.getById({ id })

      if (!existingOffer) {
        throw new OfferNotFoundError()
      }

      const result = await db.execute(
        'DELETE FROM offers WHERE offerId = ?',
        [id]
      )

      return result.rowsAffected > 0
    } catch (error) {
      if (error instanceof OfferNotFoundError) throw error

      console.error('Error al eliminar la oferta:', error)
      throw new OfferDatabaseError(CRUD_OPERATIONS.DELETE, error as Error)
    }
  }
}