// src/menu/offers/offers.controller.ts
import { validateOffer, validatePartialOffer } from './offers.schema.js'
import type { OfferModel, Offer, OfferId } from '../../shared/types.js'
import { handleOfferError } from '../../shared/utils/error-handler.js'
import {
  CRUD_OPERATIONS,
  OfferNotFoundError
} from '../../shared/errors/crud.errors.js'

export class OffersController {
  private offersModel: OfferModel

  constructor({ offersModel }: { offersModel: OfferModel }) {
    this.offersModel = offersModel
  }

  getAll = async (req, res) => {
    try {
      const offers = await this.offersModel.getAll()
      res.json({ offers })
    } catch (error) {
      handleOfferError(error, res, CRUD_OPERATIONS.GET)
    }
  }

  getById = async (req, res) => {
    try {
      const { id } = req.params
      const offer = await this.offersModel.getById({
        id: id as OfferId
      })

      return offer
        ? res.json({ offer })
        : res.status(404).json({ error: new OfferNotFoundError().message })
    } catch (error) {
      handleOfferError(error, res, CRUD_OPERATIONS.GET)
    }
  }

  create = async (req, res) => {
    try {
      const result = validateOffer(req.body)

      if (!result.success) {
        return res.status(400).json({ error: JSON.parse(result.error.message) })
      }

      const newOffer = await this.offersModel.create({
        input: result.data as Offer
      })

      res.status(201).json({ newOffer })
    } catch (error) {
      handleOfferError(error, res, CRUD_OPERATIONS.CREATE)
    }
  }

  update = async (req, res) => {
    const result = validatePartialOffer(req.body)

    if (!result.success) {
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    try {
      const { id } = req.params
      const updatedOffer = await this.offersModel.update({
        id: id as OfferId,
        input: result.data as Partial<Offer>
      })

      res.json({ updatedOffer })
    } catch (error) {
      handleOfferError(error, res, CRUD_OPERATIONS.UPDATE)
    }
  }

  delete = async (req, res) => {
    try {
      const { id } = req.params
      const deleted = await this.offersModel.delete({
        id: id as OfferId
      })

      if (deleted) {
        res.status(200).json({
          message: 'Oferta eliminada exitosamente',
          deleted: true
        })
      } else {
        res.status(500).json({
          error: 'La oferta no pudo ser eliminada'
        })
      }
    } catch (error) {
      handleOfferError(error, res, CRUD_OPERATIONS.DELETE)
    }
  }
}