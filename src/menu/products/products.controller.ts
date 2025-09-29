// src/menu/products/products.controller.ts
import { validateProduct, validatePartialProduct } from './products.schema.js'
import type { ProductModel, Product, ProductId } from '../../shared/types.js'
import { handleProductError } from '../../shared/utils/error-handler.js'
import {
  CRUD_OPERATIONS,
  ProductNotFoundError
} from '../../shared/errors/crud.errors.js'

export class ProductsController {
  private productsModel: ProductModel

  constructor({ productsModel }: { productsModel: ProductModel }) {
    this.productsModel = productsModel
  }

  getAll = async (req, res) => {
    try {
      const products = await this.productsModel.getAll()
      res.json({ products })
    } catch (error) {
      handleProductError(error, res, CRUD_OPERATIONS.GET)
    }
  }

  getById = async (req, res) => {
    try {
      const { id } = req.params
      const product = await this.productsModel.getById({
        id: id as ProductId
      })

      return product
        ? res.json({ product })
        : res.status(404).json({ error: new ProductNotFoundError().message })
    } catch (error) {
      handleProductError(error, res, CRUD_OPERATIONS.GET)
    }
  }

  create = async (req, res) => {
    try {
      const result = validateProduct(req.body)

      if (!result.success) {
        return res.status(400).json({ error: JSON.parse(result.error.message) })
      }

      const productData = {
        ...result.data,
        productImages: JSON.stringify(result.data.productImages)
      }

      const newProduct = await this.productsModel.create({
        input: productData as Product
      })

      const productResponse = {
        ...newProduct,
        productImages: JSON.parse(newProduct.productImages)
      }

      res.status(201).json({ newProduct: productResponse })
    } catch (error) {
      handleProductError(error, res, CRUD_OPERATIONS.CREATE)
    }
  }

  update = async (req, res) => {
    const result = validatePartialProduct(req.body)

    if (!result.success) {
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    try {
      const productData = {
        ...result.data,
        productImages: result.data.productImages
          ? JSON.stringify(result.data.productImages)
          : undefined
      }

      const { id } = req.params
      const updatedProduct = await this.productsModel.update({
        id,
        input: productData as Product
      })
      res.json({ updatedProduct })
    } catch (error) {
      handleProductError(error, res, CRUD_OPERATIONS.UPDATE)
    }
  }

  delete = async (req, res) => {
    try {
      const { id } = req.params
      const deleted = await this.productsModel.delete({
        id: id as ProductId
      })

      if (deleted) {
        res.status(200).json({
          message: 'Producto eliminado exitosamente',
          deleted: true
        })
      } else {
        res.status(500).json({
          error: 'El producto no pudo ser eliminado'
        })
      }
    } catch (error) {
      handleProductError(error, res, CRUD_OPERATIONS.DELETE)
    }
  }
}
