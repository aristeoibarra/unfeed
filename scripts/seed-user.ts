/**
 * User Seed Script
 *
 * Creates or updates the single user for UnFeed authentication.
 *
 * Usage:
 *   bun run scripts/seed-user.ts <email> <password>
 *
 * Example:
 *   bun run scripts/seed-user.ts admin@example.com mySecretPassword123
 *
 * If user with email exists, password will be updated.
 */

import bcrypt from "bcryptjs"
import { prisma } from "../lib/db"

const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.log("\n[Error] Email and password required\n")
  console.log("Usage: bun run scripts/seed-user.ts <email> <password>")
  console.log("Example: bun run scripts/seed-user.ts admin@example.com mySecretPassword123\n")
  process.exit(1)
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  console.log("\n[Error] Invalid email format\n")
  process.exit(1)
}

// Validate password length
if (password.length < 8) {
  console.log("\n[Error] Password must be at least 8 characters\n")
  process.exit(1)
}

const saltRounds = 10
const passwordHash = await bcrypt.hash(password, saltRounds)

try {
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {
      passwordHash,
      updatedAt: new Date(),
    },
    create: {
      email: email.toLowerCase(),
      passwordHash,
    },
  })

  console.log("\n----------------------------------------")
  console.log("User Created/Updated Successfully")
  console.log("----------------------------------------\n")
  console.log(`Email: ${user.email}`)
  console.log(`ID: ${user.id}`)
  console.log(`Created: ${user.createdAt.toISOString()}`)
  console.log(`Updated: ${user.updatedAt.toISOString()}`)
  console.log("\n----------------------------------------")
  console.log("You can now login with these credentials")
  console.log("----------------------------------------\n")
} catch (error) {
  console.error("\n[Error] Failed to create user:", error)
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
