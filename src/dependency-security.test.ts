import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lockfile = JSON.parse(
  readFileSync(resolve(repositoryRoot, "package-lock.json"), "utf8"),
) as {
  packages: Record<string, { version?: string }>;
};

const patchedVersions: Record<string, string> = {
  fastify: "5.12.8",
  "fast-uri": "3.1.9",
  "find-my-way": "9.7.0",
  postcss: "8.5.18",
  "source-map-js": "1.2.2",
  tinypool: "2.1.2",
  vite: "7.3.7",
  zod: "4.6.6",
};

function isAtLeast(actual: string, minimum: string) {
  const actualParts = actual.split(".").map((part) => Number.parseInt(part, 10));
  const minimumParts = minimum.split(".").map((part) => Number.parseInt(part, 10));

  for (let index = 0; index < minimumParts.length; index += 1) {
    const actualPart = actualParts[index] ?? 0;
    const minimumPart = minimumParts[index] ?? 0;
    if (actualPart !== minimumPart) return actualPart > minimumPart;
  }

  return true;
}

test("uses patched versions of the security-sensitive dependencies", () => {
  for (const [name, minimum] of Object.entries(patchedVersions)) {
    const installed = lockfile.packages[`node_modules/${name}`]?.version;

    expect(installed, `${name} is present in the lockfile`).toBeTruthy();
    expect(
      isAtLeast(installed as string, minimum),
      `${name}@${installed} must be at least ${minimum}`,
    ).toBe(true);
  }
});
