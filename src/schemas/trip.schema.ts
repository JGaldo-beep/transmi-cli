// Zod schemas for trip planning validation

import { z } from 'zod';

export const TripSegmentSchema = z.object({
  from: z.string(),
  to: z.string(),
  route: z.string(),
  duration: z.number().int().nonnegative(),
  distance: z.number().nonnegative(),
  stops: z.number().int().nonnegative(),
});

export const TripPlanSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  segments: z.array(TripSegmentSchema),
  transfers: z.number().int().nonnegative(),
  totalDuration: z.number().int().nonnegative(),
  totalDistance: z.number().nonnegative(),
  estimatedCost: z.number().int().nonnegative(),
  accessibility: z.boolean(),
  departureTime: z.string().optional(),
  arrivalTime: z.string().optional(),
});

// Type inference from schemas
export type TripSegmentSchemaType = z.infer<typeof TripSegmentSchema>;
export type TripPlanSchemaType = z.infer<typeof TripPlanSchema>;
