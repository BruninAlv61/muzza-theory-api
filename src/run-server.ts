//src/run-server.ts
import { createApp } from './index.js'
import { CategoriesModel } from './menu/categories/categories.model.js'

createApp({ categoriesModel: CategoriesModel })
