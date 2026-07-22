// Zod schemas for route validation

import { z } from 'zod';

export const RouteTypeSchema = z.enum([
  'TransMilenio',
  'TransMiZonal',
  'Alimentador',
  'Complementario',
  'Especial',
]);

export const RouteStatusSchema = z.enum(['active', 'inactive', 'maintenance']);

// API Response schemas
export const ApiHorarioSchema = z.object({
  id: z.string(),
  tipoDia: z.string(),
  inicio: z.string(),
  fin: z.string(),
});

export const ApiTroncalSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  zona: z.string(),
  color: z.string(),
  esquemaPdf: z.string().nullable(),
});

export const ApiInformacionSchema = z.object({
  id: z.number(),
  esquema: z.string().nullable(),
  tabla: z.string().nullable(),
  mapa: z.string().nullable(),
  puntosParada: z.string().nullable(),
  plegable: z.string().nullable(),
  fechaActualizacion: z.string().nullable(),
  usuario: z.string().nullable(),
});

export const ApiRouteSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  tipo: RouteTypeSchema,
  color: z.string(),
  esquemaPdf: z.string().nullable(),
  horarios: z.array(ApiHorarioSchema),
  troncal: ApiTroncalSchema.nullable(),
  informacion: ApiInformacionSchema.nullable(),
  codigo: z.string(),
});

export const ApiRoutesResponseSchema = z.object({
  content: z.array(ApiRouteSchema),
  pageable: z.object({
    pageNumber: z.number(),
    pageSize: z.number(),
    sort: z.object({
      empty: z.boolean(),
      sorted: z.boolean(),
      unsorted: z.boolean(),
    }),
    offset: z.number(),
    paged: z.boolean(),
    unpaged: z.boolean(),
  }),
  totalPages: z.number(),
  totalElements: z.number(),
  last: z.boolean(),
  size: z.number(),
  number: z.number(),
  sort: z.object({
    empty: z.boolean(),
    sorted: z.boolean(),
    unsorted: z.boolean(),
  }),
  numberOfElements: z.number(),
  first: z.boolean(),
  empty: z.boolean(),
});

// Internal schemas
export const RouteSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  type: RouteTypeSchema,
  color: z.string(),
  status: RouteStatusSchema,
  troncal: z
    .object({
      id: z.number(),
      name: z.string(),
      zone: z.string(),
      color: z.string(),
    })
    .optional(),
});

export const HorarioSchema = z.object({
  dayType: z.string(),
  start: z.string(),
  end: z.string(),
});

export const RouteDetailsSchema = RouteSchema.extend({
  horarios: z.array(HorarioSchema),
  informacion: z
    .object({
      plegable: z.string().optional(),
      esquema: z.string().optional(),
      tabla: z.string().optional(),
      mapa: z.string().optional(),
    })
    .optional(),
  stations: z.array(z.string()).optional(),
  estimatedDuration: z.number().optional(),
});

// Type inference from schemas
export type RouteSchemaType = z.infer<typeof RouteSchema>;
export type RouteDetailsSchemaType = z.infer<typeof RouteDetailsSchema>;
export type HorarioSchemaType = z.infer<typeof HorarioSchema>;
export type ApiRouteSchemaType = z.infer<typeof ApiRouteSchema>;
export type ApiRoutesResponseSchemaType = z.infer<typeof ApiRoutesResponseSchema>;
