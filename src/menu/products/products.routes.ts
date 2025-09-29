import { Router } from 'express'
import { ProductsController } from './products.controller.js'
import { ProductModel } from '../../shared/types.js'

export const createProductsRouter = ({ productsModel }: { productsModel: ProductModel }) => {
    const productsRouter = Router()
    const productsController = new ProductsController({ productsModel })

    productsRouter.get('/', productsController.getAll)
    productsRouter.post('/', productsController.create)
    productsRouter.get('/:id', productsController.getById)
    productsRouter.patch('/:id', productsController.update)
    productsRouter.delete('/:id', productsController.delete)

    return productsRouter
}