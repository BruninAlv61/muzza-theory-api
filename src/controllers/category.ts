import { Category, CategoryModel } from '../types.d'
import { validateCategory } from '../schemas/category.js'

export class CategoriesController {
  private categoriesModel: CategoryModel

  constructor({ categoriesModel }: { categoriesModel: CategoryModel }) {
    this.categoriesModel = categoriesModel
  }

  create = async (req, res) => {
    const result = validateCategory(req.body)

    if (!result.success) {
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    const newCategoria = await this.categoriesModel.create({
      input: result.data as Category
    })

    res.status(201).json({ newCategoria })
  }
}
