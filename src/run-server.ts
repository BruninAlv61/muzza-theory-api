//src/run-server.ts
import { createApp } from "./index.js"
import { CategoriesModel } from "./models/categories.js"

createApp({categoriesModel: CategoriesModel})