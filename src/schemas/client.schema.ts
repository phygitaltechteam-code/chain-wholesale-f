import {z} from 'zod';

export const ClientSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be at most 15 digits'),
  address: z.string().min(1, 'Address is required'),
  openingBalance: z.number().default(0),
});

export type ClientFormData = z.infer<typeof ClientSchema>;

export const EditClientSchema = ClientSchema.extend({
  id: z.string().optional(),
});

export type EditClientFormData = z.infer<typeof EditClientSchema>;
