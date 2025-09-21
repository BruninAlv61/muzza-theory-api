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
    create: (params: {input: Category}) => Promise<CategoryWithId>
}