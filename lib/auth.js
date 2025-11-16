// lib/auth.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

export function signToken(user) {
  return jwt.sign({ userId: String(user._id), email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// helper that supports either bcrypt-hashed password or plain-text seed password
export async function comparePassword(plainPassword, stored) {
  if (!stored) return false;
  // if stored looks like bcrypt hash (start with $2a$ or $2b$), compare with bcrypt
  if (typeof stored === "string" && stored.startsWith("$2a$") || stored.startsWith("$2b$")) {
    return bcrypt.compare(plainPassword, stored);
  }
  // otherwise fallback to direct comparison (dev seed)
  return plainPassword === stored;
}
