import { z } from 'zod';

export const submissionSchema = z.object({
  locationDescription: z.string().max(500).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  county: z.string().max(100).optional().or(z.literal('')),
  state: z.string().length(2),
  observation: z.string().max(2000).optional().or(z.literal('')),
  evidenceType: z.enum(['official_document', 'official_sign', 'photo', 'news', 'other']),
  sourceUrl: z.string().url().max(2000).optional().or(z.literal('')),
  observedDate: z.string().date().optional().or(z.literal('')),
  contactEmail: z.string().email().max(255).optional().or(z.literal('')),
  rightToShareConfirmed: z
    .boolean()
    .refine((v) => v === true, { message: 'You must confirm you have the right to share this material' }),
});

export const correctionSchema = z.object({
  entityName: z.string().min(1).max(255),
  description: z.string().min(10).max(2000),
  contactEmail: z.string().email().max(255).optional().or(z.literal('')),
});

export const searchSchema = z.object({
  q: z.string().min(1).max(200),
});

export const filterSchema = z.object({
  state: z.string().length(2).optional(),
  entityType: z.string().optional(),
  vendor: z.string().optional(),
  status: z.string().optional(),
  sourceStrength: z.string().optional(),
  pointType: z.enum(['entity_level', 'exact', 'all']).optional(),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
export type CorrectionInput = z.infer<typeof correctionSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type FilterInput = z.infer<typeof filterSchema>;
