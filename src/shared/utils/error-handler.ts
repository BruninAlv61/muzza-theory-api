// src/shared/utils/error-handler.ts
import {
  type CrudOperation,
  EntityNotFoundError,
  DatabaseError,
  ProductNotFoundError,
  ProductDatabaseError,
  CategoryNotFoundError,
  CategoryDatabaseError,
  OfferNotFoundError,
  OfferDatabaseError,
  DuplicateOfferError
} from '../errors/crud.errors.js'
import { createModuleLogger } from './logger.js'

const logger = createModuleLogger('error-handler')

interface ErrorConfig {
  NotFoundError: new () => EntityNotFoundError
  DatabaseError: new (
    operation: CrudOperation,
    originalError?: Error
  ) => DatabaseError
  DuplicateError?: new () => Error
  entityName: string
}

export const createErrorHandler = (config: ErrorConfig) => {
  return (error: unknown, res: any, operation: CrudOperation) => {
    const errorContext = {
      operation,
      entity: config.entityName,
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error)
    }

    if (config.DuplicateError && error instanceof config.DuplicateError) {
      logger.warn(errorContext, `Duplicate ${config.entityName} error`)
      return res.status(409).json({ error: error.message })
    }

    if (error instanceof EntityNotFoundError) {
      logger.warn(errorContext, `${config.entityName} not found`)
      return res.status(404).json({ error: error.message })
    }

    if (error instanceof DatabaseError) {
      logger.error(
        { ...errorContext, cause: error.cause },
        `Database error during ${operation} ${config.entityName}`
      )
      return res.status(500).json({ error: error.message })
    }

    if (error instanceof Error) {
      logger.error(
        { ...errorContext, stack: error.stack },
        `Unexpected error during ${operation} ${config.entityName}`
      )
      return res.status(500).json({ error: error.message })
    }

    logger.error(
      { ...errorContext, rawError: error },
      `Unknown error type during ${operation} ${config.entityName}`
    )
    
    return res.status(500).json({
      error: `Error interno del servidor al ${operation} ${config.entityName}`
    })
  }
}

export const handleCategoryError = createErrorHandler({
  NotFoundError: CategoryNotFoundError,
  DatabaseError: CategoryDatabaseError,
  entityName: 'categoría'
})

export const handleProductError = createErrorHandler({
  NotFoundError: ProductNotFoundError,
  DatabaseError: ProductDatabaseError,
  entityName: 'producto'
})

export const handleOfferError = createErrorHandler({
  NotFoundError: OfferNotFoundError,
  DatabaseError: OfferDatabaseError,
  DuplicateError: DuplicateOfferError,
  entityName: 'oferta'
})