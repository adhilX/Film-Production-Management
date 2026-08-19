import { z } from 'zod';

export const evaluationSchema = z.object({
  status: z.enum(['approved', 'changes-requested']),
  feedback: z.string().optional().or(z.literal('')),
  roleOverride: z.string().optional().or(z.literal('')),
}).refine(
  (data) => {
    if (data.status === 'changes-requested') {
      return !!data.feedback?.trim();
    }
    return true;
  },
  {
    message: 'Feedback is required when requesting changes.',
    path: ['feedback'],
  }
);

export type EvaluationFormData = z.infer<typeof evaluationSchema>;
