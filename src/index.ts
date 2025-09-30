// src/index.ts
import express from 'express'
import { createCategoriesRouter } from './menu/categories/categories.routes.js'
import { createProductsRouter } from './menu/products/products.routes.js'
import { createOffersRouter } from './menu/offers/offers.routes.js'
import { CategoryModel, ProductModel, OfferModel } from './shared/types.js'

export const createApp = ({ categoriesModel, productsModel, offersModel }: { categoriesModel: CategoryModel, productsModel: ProductModel, offersModel: OfferModel }) => {
    const app = express()
    
    app.use(express.json())
    app.disable('x-powered-by')

    app.use('/categories', createCategoriesRouter({ categoriesModel }))
    app.use('/products', createProductsRouter({ productsModel }))
    app.use('/offers', createOffersRouter({ offersModel }))

    app.get('/', (req, res) => {
      res.json({
        message: 'Muzza Theory',
        status: 'running',
        environment: process.env.NODE_ENV
      })
    })

    const PORT = process.env.PORT || 3000
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on http://localhost:${PORT}`)
    })
}