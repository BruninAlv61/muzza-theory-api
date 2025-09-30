// src/shared/types.d.ts
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

export type Product = {
  productName: string
  productDescription: string
  productPrice: number
  productImages: string
  categoryId: CategoryId
}

export type ProductId = UUID
export type ProductWithId = Product & { productId: ProductId }
export interface ProductModel extends CrudModel<Product, ProductWithId, ProductId> {}

export type Offer = {
  productId: ProductId
  offerDiscount: number
  offerFinishDate: string
}

export type OfferId = UUID
export type OfferWithId = Offer & { offerId: OfferId }
export type OfferFormatedResponse = OfferWithId & { product: ProductWithId }

export interface OfferModel extends CrudModel<Offer, OfferFormatedResponse, OfferId> {}
