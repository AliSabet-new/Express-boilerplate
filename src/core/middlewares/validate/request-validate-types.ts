import { z } from "zod";
import type { RequestHandler } from "express";

export interface ValidateOptions<TBody, TQuery, TParams> {
  body?: z.ZodSchema<TBody>;
  query?: z.ZodSchema<TQuery>;
  params?: z.ZodSchema<TParams>;
}

export type RequestHandlerValidate<TBody, TParams, TQuery> = RequestHandler<
  TParams,
  any,
  TBody,
  TQuery
>;
