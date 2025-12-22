/**
 * Password Hash Generator
 *
 * Generates a bcrypt hash for the given password.
 *
 * Usage:
 *   bun run scripts/generate-password-hash.ts <password>
 *
 * Example:
 *   bun run scripts/generate-password-hash.ts mySecretPassword123
 *
 * Output:
 *   The bcrypt hash to use in AUTH_PASSWORD_HASH environment variable
 */

import bcrypt from "bcryptjs"

const password = process.argv[2]

if (!password) {
  console.log("\n[Error] No password provided\n")
  console.log("Usage: bun run scripts/generate-password-hash.ts <password>")
  console.log("Example: bun run scripts/generate-password-hash.ts mySecretPassword123\n")
  process.exit(1)
}

if (password.length < 8) {
  console.log("\n[Warning] Password should be at least 8 characters for security\n")
}

const saltRounds = 10
const hash = await bcrypt.hash(password, saltRounds)

console.log("\n----------------------------------------")
console.log("Password Hash Generated Successfully")
console.log("----------------------------------------\n")
console.log("Hash:")
console.log(hash)
console.log("\n----------------------------------------")
console.log("Add this to your .env file:")
console.log("----------------------------------------\n")
console.log(`AUTH_PASSWORD_HASH=${hash}`)
console.log("\n")
