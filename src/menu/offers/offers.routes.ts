// src/menu/offers/offers.routes.ts
import { Router } from 'express'
import { OffersController } from './offers.controller.js'
import { OfferModel } from '../../shared/types.js'

export const createOffersRouter = ({ offersModel }: { offersModel: OfferModel }) => {
  const offersRouter = Router()
  const offersController = new OffersController({ offersModel })

  offersRouter.get('/', offersController.getAll)
  offersRouter.post('/', offersController.create)
  offersRouter.get('/:id', offersController.getById)
  offersRouter.patch('/:id', offersController.update)
  offersRouter.delete('/:id', offersController.delete)

  return offersRouter
}