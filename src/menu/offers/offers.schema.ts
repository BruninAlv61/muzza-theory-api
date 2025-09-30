// src/menu/offers/offers.schema.ts
import { z } from 'zod'

const offersSchema = z.object({
  productId: z.string().uuid({
    message: 'El ID del producto debe ser un UUID válido'
  }),
  offerDiscount: z
    .number()
    .min(0, {
      message: 'El descuento debe ser un número positivo'
    })
    .max(100, {
      message: 'El descuento no puede ser mayor a 100%'
    }),
  offerFinishDate: z.string().refine(
    (date) => {
      const offerDate = new Date(date)
      return !isNaN(offerDate.getTime()) && offerDate > new Date()
    },
    {
      message: 'La fecha de finalización debe ser válida y futura'
    }
  )
})

export const validateOffer = (input: unknown) => {
  return offersSchema.safeParse(input)
}

export const validatePartialOffer = (input: unknown) => {
  return offersSchema.partial().safeParse(input)
}