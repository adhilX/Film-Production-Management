import { z } from 'zod';

export const getBudgetSchema = (minAllocated: number) =>
  z.object({
    totalBudget: z
      .number()
      .min(0)
      .finite()
      .min(minAllocated, `Total budget cannot be less than allocated amount (${minAllocated})`),
    currency: z.string().min(1).max(10),
  });

export type BudgetFormValues = {
  totalBudget: number;
  currency: string;
};
