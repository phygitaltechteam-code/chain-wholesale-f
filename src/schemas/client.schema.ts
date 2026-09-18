import {z} from 'zod';

export const ClientSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  phoneNumber: z
    .string()
    .length(10, 'Phone number must be exactly 10 digits')
    .regex(/^\d+$/, 'Phone number must contain only digits'),
  address: z.string().min(1, 'Address is required'),
  openingBalance: z.number().default(0),
});

export type ClientFormData = z.infer<typeof ClientSchema>;

export const EditClientSchema = ClientSchema.extend({
  id: z.string().optional(),
});

export type EditClientFormData = z.infer<typeof EditClientSchema>;
