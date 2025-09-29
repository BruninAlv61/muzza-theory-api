// src/menu/products/products.schema.ts
import { z } from 'zod'

const productsSchema = z.object({
  productName: z
    .string()
    .min(3, {
      message: 'El nombre del producto debe tener al menos 3 caracteres'
    })
    .max(100, {
      message: 'El nombre del producto debe tener como máximo 100 caracteres'
    }),

  productDescription: z
    .string()
    .min(10, {
      message: 'La descripción del producto debe tener al menos 10 caracteres'
    })
    .max(500, {
      message:
        'La descripción del producto debe tener como máximo 500 caracteres'
    }),

  productPrice: z.number().min(0, {
    message: 'El precio del producto debe ser un número positivo'
  }),

  productImages: z
    .array(
      z.string().url({
        message: 'Cada imagen debe ser una URL válida'
      })
    )
    .min(1, {
      message: 'Debe proporcionar al menos una imagen del producto'
    })
    .max(10, {
      message: 'Puede agregar como máximo 10 imágenes por producto'
    }),

  categoryId: z.string().uuid({
    message: 'El ID de la categoría debe ser un UUID válido'
  })
})

export const validateProduct = (input: unknown) => {
  return productsSchema.safeParse(input)
}

export const validatePartialProduct = (input: unknown) => {
  return productsSchema.partial().safeParse(input)
}