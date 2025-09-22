// src/types.d.ts
export type Category = {
  categoryName: string
  categoryDescription: string
  categoryImage: string
}

export type CategoryId = `${string}-${string}-${string}-${string}-${string}`

export type CategoryWithId = Category & {
  categoryId: CategoryId
}

export interface CategoryModel {
    getAll: () => Promise<CategoryWithId[]>
    getById: (params: {id: CategoryId}) => Promise<CategoryWithId>
    create: (params: {input: Category}) => Promise<CategoryWithId>
}