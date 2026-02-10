import type { Request, Response, NextFunction } from "express";
import type { ParamsDictionary } from "express-serve-static-core";

type Params<T> = {
  [K in keyof T]: T[K];
};

type Fn<TBody = any, TParams = any, TQuery = any> = (
  request: Request<ParamsDictionary & Params<TParams>, any, TBody, TQuery>,
  response: Response,
  next: NextFunction
) => Promise<void>;

export const catchAsync =
  <TBody = any, TParams = any, TQuery = any>(fn: Fn<TBody, TParams, TQuery>) =>
  (
    req: Request<ParamsDictionary & Params<TParams>, any, TBody, TQuery>,
    res: Response,
    next: NextFunction
  ) =>
    fn(req, res, next).catch(next);
