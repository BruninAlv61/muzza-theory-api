// src/shared/utils/error-handler.ts
import { type CrudOperation, EntityNotFoundError, DatabaseError } from '../errors/crud.errors'
interface ErrorConfig {
  NotFoundError: new (id: string) => EntityNotFoundError
  DatabaseError: new (operation: CrudOperation, originalError?: Error) => DatabaseError
  entityName: string
}

export const createErrorHandler = (config: ErrorConfig) => {
  return (error: unknown, res: any, operation: CrudOperation) => {
    console.error(`Error al ${operation} ${config.entityName}:`, error)

    if (error instanceof config.NotFoundError) {
      return res.status(404).json({ error: error.message })
    }
    
    if (error instanceof config.DatabaseError) {
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

import { 
  CategoryNotFoundError, 
  CategoryDatabaseError,
} from '../errors/crud.errors'

export const handleCategoryError = createErrorHandler({
  NotFoundError: CategoryNotFoundError,
  DatabaseError: CategoryDatabaseError,
  entityName: 'categoría'
})