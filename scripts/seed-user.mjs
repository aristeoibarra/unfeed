/**
 * User Seed Script (Node.js compatible)
 *
 * Creates or updates the single user for UnFeed authentication.
 *
 * Usage:
 *   node scripts/seed-user.mjs <email> <password>
 *
 * Example:
 *   node scripts/seed-user.mjs admin@example.com mySecretPassword123
 */

import bcrypt from "bcryptjs"
import Database from "better-sqlite3"
import path from "path"
import { fileURLToPath } from "url"
import { randomBytes } from "crypto"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, "..", "prod.db")

const db = new Database(dbPath)

// Generate cuid-like ID
function cuid() {
  return 'c' + randomBytes(12).toString('hex')
}

const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.log("\n[Error] Email and password required\n")
  console.log("Usage: node scripts/seed-user.mjs <email> <password>")
  console.log("Example: node scripts/seed-user.mjs admin@example.com mySecretPassword123\n")
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
  const emailLower = email.toLowerCase()
  const now = new Date().toISOString()

  // Check if user exists
  const existing = db.prepare('SELECT * FROM User WHERE email = ?').get(emailLower)

  let user
  if (existing) {
    // Update existing user
    db.prepare('UPDATE User SET passwordHash = ?, updatedAt = ? WHERE email = ?')
      .run(passwordHash, now, emailLower)
    user = db.prepare('SELECT * FROM User WHERE email = ?').get(emailLower)
  } else {
    // Create new user
    const id = cuid()
    db.prepare('INSERT INTO User (id, email, passwordHash, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)')
      .run(id, emailLower, passwordHash, now, now)
    user = db.prepare('SELECT * FROM User WHERE id = ?').get(id)
  }

  console.log("\n----------------------------------------")
  console.log("User Created/Updated Successfully")
  console.log("----------------------------------------\n")
  console.log(`Email: ${user.email}`)
  console.log(`ID: ${user.id}`)
  console.log(`Created: ${user.createdAt}`)
  console.log(`Updated: ${user.updatedAt}`)
  console.log("\n----------------------------------------")
  console.log("You can now login with these credentials")
  console.log("----------------------------------------\n")
} catch (error) {
  console.error("\n[Error] Failed to create user:", error)
  process.exit(1)
} finally {
  db.close()
}
