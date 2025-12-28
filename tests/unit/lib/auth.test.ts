import { describe, it, expect, vi, beforeEach } from "vitest";

// Set env before any imports
process.env.AUTH_SECRET = "test-secret-key-that-is-at-least-32-characters-long";
process.env.AUTH_SESSION_DAYS = "7";

// Store for mock tokens - must be outside vi.mock for access in tests
const mockTokens = new Map<string, { email: string }>();

// Mock jose with class-based implementation inside factory
vi.mock("jose", () => {
  class MockSignJWT {
    private payload: { email: string };

    constructor(payload: { email: string }) {
      this.payload = payload;
    }

    setProtectedHeader() {
      return this;
    }
    setIssuedAt() {
      return this;
    }
    setExpirationTime() {
      return this;
    }
    async sign() {
      const token = `mock-token-${Date.now()}-${Math.random()}`;
      return token;
    }
  }

  return {
    SignJWT: MockSignJWT,
    jwtVerify: async (token: string) => {
      if (
        token === "invalid-token" ||
        token === "a.b.c" ||
        token.endsWith(".fake")
      ) {
        throw new Error("Invalid token");
      }
      // For valid mock tokens, extract email from a predictable format
      if (token.startsWith("mock-token-")) {
        return { payload: { email: "test@example.com" } };
      }
      throw new Error("Unknown token");
    },
  };
});

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

import { createToken, verifyToken } from "@/lib/auth";

describe("lib/auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTokens.clear();
  });

  describe("createToken", () => {
    it("creates a valid token string", async () => {
      const email = "test@example.com";
      const token = await createToken(email);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("creates different tokens for different emails", async () => {
      const token1 = await createToken("user1@example.com");
      const token2 = await createToken("user2@example.com");

      expect(token1).not.toBe(token2);
    });
  });

  describe("verifyToken", () => {
    it("verifies a valid token and returns payload", async () => {
      const email = "test@example.com";
      const token = await createToken(email);
      const payload = await verifyToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.email).toBe(email);
    });

    it("returns null for invalid token", async () => {
      const payload = await verifyToken("invalid-token");
      expect(payload).toBeNull();
    });

    it("returns null for malformed JWT", async () => {
      const payload = await verifyToken("a.b.c");
      expect(payload).toBeNull();
    });

    it("returns null for token signed with different secret", async () => {
      const fakeToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ.fake";
      const payload = await verifyToken(fakeToken);
      expect(payload).toBeNull();
    });
  });
});
