import { Router } from 'express'
import { CategoriesController } from '../controllers/category.js'
import { CategoryModel } from '../types.d'

export const createCategoriesRouter = ({ categoriesModel }: { categoriesModel: CategoryModel }) => {
    const categoriesRouter = Router()
    const categoriesController = new CategoriesController({ categoriesModel })

    categoriesRouter.post('/', categoriesController.create)

    return categoriesRouter
}