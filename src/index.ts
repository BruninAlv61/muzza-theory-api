// src/index.ts
import express from 'express'
import { createCategoriesRouter } from './menu/categories/categories.routes.js'
import { CategoryModel } from './shared/types.js'

export const createApp = ({ categoriesModel }: { categoriesModel: CategoryModel}) => {
    const app = express()
    
    app.use(express.json())
    app.disable('x-powered-by')

    app.use('/categories', createCategoriesRouter({ categoriesModel }))
    
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