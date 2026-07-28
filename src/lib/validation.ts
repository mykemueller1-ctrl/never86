import { z } from 'zod';

export const waitlistInput = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  restaurantName: z.string().optional(),
  role: z.string().optional(),
});
export type WaitlistInput = z.infer<typeof waitlistInput>;

export const invoiceInput = z.object({
  rawText: z.string().min(1),
  userId: z.string().default('default'),
  fileUrl: z.string().optional(),
});
export type InvoiceInput = z.infer<typeof invoiceInput>;

export const zReportInput = z.object({
  rawText: z.string().min(1),
  userId: z.string().default('default'),
});
export type ZReportInput = z.infer<typeof zReportInput>;
