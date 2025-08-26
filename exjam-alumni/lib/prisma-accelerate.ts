import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// Singleton instance for Prisma with Accelerate
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create Prisma client with Accelerate extension
export const prismaAccelerate =
  globalThis.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  }).$extends(withAccelerate());

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prismaAccelerate as any;
}

export default prismaAccelerate;
