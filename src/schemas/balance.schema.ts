// Zod schemas for balance and transaction validation

import { z } from 'zod';

export const TransactionSchema = z.object({
  date: z.string().datetime(),
  location: z.string(),
  type: z.enum(['debit', 'credit']),
  amount: z.number().int(),
  balance: z.number().int().nonnegative(),
});

export const BalanceSchema = z.object({
  cardNumber: z.string().length(16),
  balance: z.number().int().nonnegative(),
  status: z.enum(['active', 'blocked', 'expired']),
  lastUpdate: z.string().datetime(),
  transactions: z.array(TransactionSchema).optional(),
});

// Type inference from schemas
export type TransactionSchemaType = z.infer<typeof TransactionSchema>;
export type BalanceSchemaType = z.infer<typeof BalanceSchema>;
