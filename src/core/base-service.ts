import { PrismaClient } from "@prisma/client";

import { formatPrismaError } from "@/core/api/api-response";

export class BaseService<TDelegate extends { [key: string]: any }> {
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly model: TDelegate
  ) {}

  async create<TArgs extends Parameters<TDelegate["create"]>[0]>(
    args: TArgs
  ): Promise<ReturnType<TDelegate["create"]>> {
    try {
      return await this.model.create(args);
    } catch (err) {
      throw formatPrismaError(err);
    }
  }

  async findUnique<TArgs extends Parameters<TDelegate["findUnique"]>[0]>(
    args: TArgs
  ): Promise<ReturnType<TDelegate["findUnique"]>> {
    try {
      return await this.model.findUnique(args);
    } catch (err) {
      throw formatPrismaError(err);
    }
  }

  async findMany<TArgs extends Parameters<TDelegate["findMany"]>[0]>(
    args?: TArgs
  ): Promise<ReturnType<TDelegate["findMany"]>> {
    try {
      return await this.model.findMany(args);
    } catch (err) {
      throw formatPrismaError(err);
    }
  }

  async update<TArgs extends Parameters<TDelegate["update"]>[0]>(
    args: TArgs
  ): Promise<ReturnType<TDelegate["update"]>> {
    try {
      return await this.model.update(args);
    } catch (err) {
      throw formatPrismaError(err);
    }
  }

  async hardDelete<TArgs extends Parameters<TDelegate["delete"]>[0]>(
    args: TArgs
  ): Promise<ReturnType<TDelegate["delete"]>> {
    try {
      return await this.model.delete(args);
    } catch (err) {
      throw formatPrismaError(err);
    }
  }

  async paginate<
    TArgs extends Parameters<TDelegate["findMany"]>[0] & {
      page?: number;
      limit?: number;
    }
  >(
    args: TArgs
  ): Promise<{
    data: ReturnType<TDelegate["findMany"]>;
    total: number;
    page: number;
    pageCount: number;
  }> {
    try {
      const { page = 1, limit = 10, ...rest } = args;
      const skip = (page - 1) * limit;

      // Clean count args: remove skip/take/orderBy as .count() doesn't accept them
      const countArgs = { ...(rest as any) };
      delete countArgs.skip;
      delete countArgs.take;
      delete countArgs.orderBy;

      const [data, total] = await this.prisma.$transaction([
        this.model.findMany({ ...rest, skip, take: limit }),
        this.model.count(countArgs),
      ]);

      return {
        data,
        total,
        page,
        pageCount: Math.ceil(total / limit),
      };
    } catch (err) {
      throw formatPrismaError(err);
    }
  }

  async transaction<T>(
    callback: (
      tx: Omit<
        PrismaClient,
        | "$connect"
        | "$disconnect"
        | "$on"
        | "$transaction"
        | "$use"
        | "$extends"
      >
    ) => Promise<T>
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(callback);
    } catch (err) {
      throw formatPrismaError(err);
    }
  }

  get delegate(): TDelegate {
    return this.model;
  }
}
