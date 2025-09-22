// src/errors/crud.errors.ts
export const CRUD_OPERATIONS = {
  CREATE: 'crear',
  GET: 'obtener',
  UPDATE: 'actualizar',
  DELETE: 'eliminar',
  SEARCH: 'buscar'
} as const

export type CrudOperation = typeof CRUD_OPERATIONS[keyof typeof CRUD_OPERATIONS]

export class EntityNotFoundError extends Error {
  constructor(entityName: string) {
    super(`No se ha encontrado ${entityName}`)
    this.name = 'EntityNotFoundError'
  }
}

export class DatabaseError extends Error {
  constructor(entityName: string, operation: CrudOperation, originalError?: Error) {
    super(`Error al ${operation} ${entityName.toLowerCase()} en la base de datos`)
    this.name = 'DatabaseError'
    this.cause = originalError
  }
}

export class CategoryNotFoundError extends EntityNotFoundError {
  constructor() {
    super('Categoría')
    this.name = 'CategoryNotFoundError'
  }
}

export class CategoryDatabaseError extends DatabaseError {
  constructor(operation: CrudOperation, originalError?: Error) {
    super('la categoría', operation, originalError)
    this.name = 'CategoryDatabaseError'
  }
}