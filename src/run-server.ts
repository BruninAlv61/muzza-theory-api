//src/run-server.ts
import { createApp } from './index.js'
import { CategoriesModel } from './menu/categories/categories.model.js'
import { ProductsModel } from './menu/products/products.model.js'

createApp({
    categoriesModel: CategoriesModel,
    productsModel: ProductsModel
})
