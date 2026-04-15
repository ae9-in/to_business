import { z } from 'zod'

export const createDeliverySchema = {
  body: z.object({
    shopId: z.string().optional(),
    deliveryDate: z.string().datetime(),
    productType: z.string().min(2),
    quantity: z.coerce.number().int().positive().optional(),
    price: z.coerce.number().positive().optional(),
    billFileName: z.string().trim().min(1).optional(),
    notes: z.string().optional(),
  }),
}

export const updateDeliverySchema = {
  body: createDeliverySchema.body.partial(),
}

export const listDeliveriesSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    shopId: z.string().optional(),
    deliveryDateFrom: z.string().datetime().optional(),
    deliveryDateTo: z.string().datetime().optional(),
    productType: z.string().optional(),
    assignedStaffId: z.string().optional(),
  }),
}

export const deliveryIdParamsSchema = {
  params: z.object({ id: z.string().min(1) }),
}
