import { PrismaClient } from "./generated/prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import path from "path"

// Use absolute path to ensure database is found during build
const dbPath = path.join(process.cwd(), "prod.db")

const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`
})

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
