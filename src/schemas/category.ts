// src/schemas/category.ts
import { z } from 'zod'
import { type Category } from '../types.d'

const categoriesSchema = z.object({
  categoryName: z
    .string()
    .min(2, {
      message: 'El nombre de la categoría debe tener al menos 2 caracteres'
    })
    .max(40, {
      message: 'El nombre de la categoría debe tener como máximo 40 caracteres'
    }),
  categoryDescription: z
    .string()
    .min(10, {
      message:
        'La descripción de la categoría debe tener al menos 10 caracteres'
    })
    .max(255, {
      message:
        'La descripción de la categoría debe tener como máximo 255 caracteres'
    }),
  categoryImage: z
    .string()
    .url({
      message: 'La imagen de la categoría debe ser una URL válida'
    })
    .optional()
})


export const validateCategory = (input: Category) => {
  return categoriesSchema.safeParse(input)
}

export const validatePartialCategory = (input: Category) => {
  return categoriesSchema.partial().safeParse(input)
}