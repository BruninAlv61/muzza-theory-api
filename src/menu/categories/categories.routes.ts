// src/menu/categories/categories.routes.ts
import { Router } from 'express'
import { CategoriesController } from './categories.controller.js'
import { CategoryModel } from '../../shared/types.js'

export const createCategoriesRouter = ({ categoriesModel }: { categoriesModel: CategoryModel }) => {
    const categoriesRouter = Router()
    const categoriesController = new CategoriesController({ categoriesModel })

    categoriesRouter.post('/', categoriesController.create)
    categoriesRouter.get('/', categoriesController.getAll)
    categoriesRouter.get('/:id', categoriesController.getById)
    categoriesRouter.patch('/:id', categoriesController.update)
    categoriesRouter.delete('/:id', categoriesController.delete)

    return categoriesRouter
}