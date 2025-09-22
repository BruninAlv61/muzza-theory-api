// src/types.d.ts
export type UUID = `${string}-${string}-${string}-${string}-${string}`

export interface CrudModel<T, TWithId, TId = UUID> {
  getAll: () => Promise<TWithId[]>
  getById: (params: { id: TId }) => Promise<TWithId | null>
  create: (params: { input: T }) => Promise<TWithId>
  update: (params: { id: TId; input: Partial<T> }) => Promise<TWithId>
  delete: (params: { id: TId }) => Promise<boolean>
}

export type Category = {
  categoryName: string
  categoryDescription: string
  categoryImage: string
}

export type CategoryId = UUID
export type CategoryWithId = Category & { categoryId: CategoryId }
export interface CategoryModel extends CrudModel<Category, CategoryWithId, CategoryId> {}