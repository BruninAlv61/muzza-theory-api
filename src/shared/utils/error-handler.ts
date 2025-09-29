// src/shared/utils/error-handler.ts
import {
  type CrudOperation,
  EntityNotFoundError,
  DatabaseError,
  ProductNotFoundError,
  ProductDatabaseError,
  CategoryNotFoundError,
  CategoryDatabaseError
} from '../errors/crud.errors'

interface ErrorConfig {
  NotFoundError: new () => EntityNotFoundError
  DatabaseError: new (
    operation: CrudOperation,
    originalError?: Error
  ) => DatabaseError
  entityName: string
}

export const createErrorHandler = (config: ErrorConfig) => {
  return (error: unknown, res: any, operation: CrudOperation) => {
    console.error(`Error al ${operation} ${config.entityName}:`, error)

    if (error instanceof EntityNotFoundError) {
      return res.status(404).json({ error: error.message })
    }

    if (error instanceof DatabaseError) {
      return res.status(500).json({ error: error.message })
    }

    if (error instanceof Error) {
      return res.status(500).json({ error: error.message })
    }

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
