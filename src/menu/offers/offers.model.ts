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
import { createModuleLogger, logDbOperation } from '../../shared/utils/logger.js'

const logger = createModuleLogger('offers-model')

export class OffersModel {
  static async getAll(): Promise<OfferFormatedResponse[]> {
    const startTime = Date.now()

    try {
      logger.debug('Fetching all offers')

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

      const duration = Date.now() - startTime
      logDbOperation({
        operation: CRUD_OPERATIONS.GET,
        entity: 'offers',
        success: true,
        duration
      })

      logger.info(
        { count: offers.rows.length, duration },
        'Offers fetched successfully'
      )

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
      logDbOperation({
        operation: CRUD_OPERATIONS.GET,
        entity: 'offers',
        success: false,
        error: error as Error
      })
      throw new OfferDatabaseError(CRUD_OPERATIONS.GET, error as Error)
    }
  }

  static async getById({ id }: { id: OfferId }): Promise<OfferFormatedResponse | null> {
    const startTime = Date.now()

    try {
      logger.debug({ offerId: id }, 'Fetching offer by ID')

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

      const duration = Date.now() - startTime
      const found = result.rows.length > 0

      logDbOperation({
        operation: CRUD_OPERATIONS.GET,
        entity: 'offer',
        id,
        success: true,
        duration
      })

      if (!found) {
        logger.warn({ offerId: id, duration }, 'Offer not found')
        return null
      }

      logger.info({ offerId: id, duration }, 'Offer fetched successfully')

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
      logDbOperation({
        operation: CRUD_OPERATIONS.GET,
        entity: 'offer',
        id,
        success: false,
        error: error as Error
      })
      throw new OfferDatabaseError(CRUD_OPERATIONS.GET, error as Error)
    }
  }

  static async create({ input }: { input: Offer }): Promise<OfferFormatedResponse> {
    const startTime = Date.now()
    const { productId, offerDiscount, offerFinishDate } = input

    try {
      logger.debug(
        { productId, offerDiscount, offerFinishDate },
        'Creating new offer'
      )

      const existingProduct = await db.execute(
        `SELECT * FROM products WHERE productId = ?`,
        [productId]
      )

      if (existingProduct.rows.length === 0) {
        logger.warn({ productId }, 'Product not found for offer creation')
        throw new ProductNotFoundError()
      }

      const existingOffer = await db.execute(
        `SELECT * FROM offers WHERE productId = ?`,
        [productId]
      )

      if (existingOffer.rows.length > 0) {
        logger.warn({ productId }, 'Duplicate offer - product already has an active offer')
        throw new DuplicateOfferError()
      }

      const offerId = randomUUID()

      await db.execute(
        `INSERT INTO offers (offerId, productId, offerDiscount, offerFinishDate) 
         VALUES (?, ?, ?, ?)`,
        [offerId, productId, offerDiscount, offerFinishDate]
      )

      const duration = Date.now() - startTime
      logDbOperation({
        operation: CRUD_OPERATIONS.CREATE,
        entity: 'offer',
        id: offerId,
        success: true,
        duration
      })

      logger.info(
        { offerId, productId, offerDiscount, duration },
        'Offer created successfully'
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

      logDbOperation({
        operation: CRUD_OPERATIONS.CREATE,
        entity: 'offer',
        success: false,
        error: error as Error
      })
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
    const startTime = Date.now()

    try {
      logger.debug(
        { offerId: id, fieldsToUpdate: Object.keys(input) },
        'Updating offer'
      )

      const existingOffer = await this.getById({ id })

      if (!existingOffer) {
        logger.warn({ offerId: id }, 'Offer not found for update')
        throw new OfferNotFoundError()
      }

      if (input.productId && input.productId !== existingOffer.productId) {
        const existingProduct = await db.execute(
          `SELECT * FROM products WHERE productId = ?`,
          [input.productId]
        )

        if (existingProduct.rows.length === 0) {
          logger.warn({ productId: input.productId }, 'Product not found for offer update')
          throw new ProductNotFoundError()
        }

        const productHasOffer = await db.execute(
          `SELECT * FROM offers WHERE productId = ? AND offerId != ?`,
          [input.productId, id]
        )

        if (productHasOffer.rows.length > 0) {
          logger.warn(
            { offerId: id, newProductId: input.productId },
            'Duplicate offer - new product already has an active offer'
          )
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

      const duration = Date.now() - startTime
      logDbOperation({
        operation: CRUD_OPERATIONS.UPDATE,
        entity: 'offer',
        id,
        success: true,
        duration
      })

      logger.info(
        { offerId: id, duration },
        'Offer updated successfully'
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

      logDbOperation({
        operation: CRUD_OPERATIONS.UPDATE,
        entity: 'offer',
        id,
        success: false,
        error: error as Error
      })
      throw new OfferDatabaseError(CRUD_OPERATIONS.UPDATE, error as Error)
    }
  }

  static async delete({ id }: { id: OfferId }): Promise<boolean> {
    const startTime = Date.now()

    try {
      logger.debug({ offerId: id }, 'Deleting offer')

      const existingOffer = await this.getById({ id })

      if (!existingOffer) {
        logger.warn({ offerId: id }, 'Offer not found for deletion')
        throw new OfferNotFoundError()
      }

      const result = await db.execute(
        'DELETE FROM offers WHERE offerId = ?',
        [id]
      )

      const duration = Date.now() - startTime
      const success = result.rowsAffected > 0

      logDbOperation({
        operation: CRUD_OPERATIONS.DELETE,
        entity: 'offer',
        id,
        success,
        duration
      })

      if (success) {
        logger.info({ offerId: id, duration }, 'Offer deleted successfully')
      } else {
        logger.error({ offerId: id }, 'Offer deletion failed - no rows affected')
      }

      return success
    } catch (error) {
      if (error instanceof OfferNotFoundError) throw error

      logDbOperation({
        operation: CRUD_OPERATIONS.DELETE,
        entity: 'offer',
        id,
        success: false,
        error: error as Error
      })
      throw new OfferDatabaseError(CRUD_OPERATIONS.DELETE, error as Error)
    }
  }
}