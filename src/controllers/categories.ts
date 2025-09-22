// src/controllers/categories.ts
import { validateCategory } from '../schemas/categories.js'
import type { Category, CategoryModel, CategoryId } from '../types.d'

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
      console.error('Error al obtener la categoría:', error)
      res.status(500).json({
        error: 'Error interno del servidor al obtener las categorías'
      })
    }
      
  }

  getById = async (req, res) => {
  try {
    const { id } = req.params
    const category = await this.categoriesModel.getById({ id: id as CategoryId })
    
    return category 
      ? res.json({ category })
      : res.status(404).json({ error: 'Categoría no encontrada' })
      
  } catch (error) {
    console.error('Error al obtener categoría:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
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
      console.error('Error al crear categoría:', error)

      if (error instanceof Error) {
        res.status(500).json({ error: error.message })
      } else {
        res.status(500).json({ 
          error: 'Error interno del servidor al crear la categoría' 
        })
      }
    }
  }
}
