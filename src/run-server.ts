//src/run-server.ts
import { createApp } from './index.js'
import { CategoriesModel } from './menu/categories/categories.model.js'
import { ProductsModel } from './menu/products/products.model.js'
import { OffersModel } from './menu/offers/offers.model.js'

createApp({
    categoriesModel: CategoriesModel,
    productsModel: ProductsModel,
    offersModel: OffersModel
})
