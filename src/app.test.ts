import { describe, expect, test } from "vitest";
import { authenticate } from "./auth.js";
import { buildApp } from "./app.js";
import { apiKeys, users } from "./store.js";
describe("planted API bugs", () => {
  test.fails("rejects inactive keys", () => {
    expect(authenticate("revoked-token")).toBeNull();
  });
  describe("POST /api/admin/users", () => {
    const call = (headers: Record<string, string>, payload: object) =>
      buildApp().inject({ method: "POST", url: "/api/admin/users", headers, payload });

    test("rejects unauthenticated callers even if body claims admin", async () => {
      const res = await call({}, { role: "admin" });
      expect(res.statusCode).toBe(401);
      expect(res.json().ok).toBe(false);
    });

    test("does not trust admin role from body for a member", async () => {
      const res = await call({ authorization: "Bearer live-token" }, { role: "admin" });
      expect(res.statusCode).toBe(403);
      expect(res.json().ok).toBe(false);
    });

    test("allows a caller whose stored role is admin", async () => {
      users.push({ id: "u_admin", role: "admin", orgId: "org_a" });
      apiKeys.push({ id: "key_admin", token: "admin-token", userId: "u_admin", active: true });
      try {
        const res = await call({ authorization: "Bearer admin-token" }, {});
        expect(res.statusCode).toBe(200);
        expect(res.json().ok).toBe(true);
      } finally {
        users.pop();
        apiKeys.pop();
      }
    });
  });
  test("server responds", async () => {
    const app = buildApp();
    const res = await app.inject({ method: "POST", url: "/api/tokens" });
    expect(res.statusCode).toBe(200);
  });
});
