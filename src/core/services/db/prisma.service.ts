import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "@prisma/client";
import {
  DATABASE_HOST,
  DATABASE_NAME,
  DATABASE_PASSWORD,
  DATABASE_PORT,
  DATABASE_USERNAME,
} from "@/common";

export class PrismaService {
  private prisma: PrismaClient;
  private adapter: PrismaMariaDb;

  constructor() {
    this.adapter = new PrismaMariaDb({
      host: DATABASE_HOST,
      port: parseInt(DATABASE_PORT),
      user: DATABASE_USERNAME,
      password: DATABASE_PASSWORD,
      database: DATABASE_NAME,
      connectionLimit: 5,
    });
    this.prisma = new PrismaClient({
      adapter: this.adapter,
    });
  }

  public async init() {
    await this.prisma.$connect();
  }

  public async destroy() {
    await this.prisma.$disconnect();
  }

  get client(): PrismaClient {
    return this.prisma;
  }
}

export const prismaServiceInstance = new PrismaService();
