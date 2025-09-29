// src/menu/categories/categories.controller.ts
import { validateCategory, validatePartialCategory } from './categories.schema.js'
import type { Category, CategoryModel, CategoryId } from '../../shared/types.js'
import { handleCategoryError } from '../../shared/utils/error-handler.js'
import { CategoryNotFoundError, CRUD_OPERATIONS } from '../../shared/errors/crud.errors.js'

export class CategoriesController {
  private categoriesModel: CategoryModel

  constructor({ categoriesModel }: { categoriesModel: CategoryModel }) {
    this.categoriesModel = categoriesModel
  }

  getAll = async (req, res) => {
    try {
      const categories = await this.categoriesModel.getAll()
      res.json({ categories })
    } catch (error) {
      handleCategoryError(error, res, CRUD_OPERATIONS.GET)
    }
  }

  getById = async (req, res) => {
    try {
      const { id } = req.params
      const category = await this.categoriesModel.getById({
        id: id as CategoryId
      })

      return category
        ? res.json({ category })
        : res.status(404).json({ error: new CategoryNotFoundError().message })
    } catch (error) {
      handleCategoryError(error, res, CRUD_OPERATIONS.GET)
    }
  }

  create = async (req, res) => {
    try {
      const result = validateCategory(req.body)

      if (!result.success) {
        return res.status(400).json({ error: JSON.parse(result.error.message) })
      }

      const newCategoria = await this.categoriesModel.create({
        input: result.data as Category
      })

      res.status(201).json({ newCategoria })
    } catch (error) {
      handleCategoryError(error, res, CRUD_OPERATIONS.CREATE)
    }
  }

  update = async (req, res) => {
    const result = validatePartialCategory(req.body)

    if (!result.success) {
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    try {
      const { id } = req.params
      const updatedCategory = await this.categoriesModel.update({
        id,
        input: result.data as Category
      })
      res.json({ updatedCategory })
    } catch (error) {
      handleCategoryError(error, res, CRUD_OPERATIONS.UPDATE)
    }
  }

  delete = async (req, res) => {
    try {
      const { id } = req.params
      const deleted = await this.categoriesModel.delete({
        id: id as CategoryId
      })

      if (deleted) {
        res.status(200).json({ 
          message: 'Categoría eliminada exitosamente',
          deleted: true 
        })
      } else {
        res.status(500).json({ 
          error: 'La categoría no pudo ser eliminada' 
        })
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('productos asociados')) {
        return res.status(409).json({ 
          error: error.message,
          code: 'REFERENCE_CONSTRAINT' 
        })
      }
      
      handleCategoryError(error, res, CRUD_OPERATIONS.DELETE)
    }
  }
}
