import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { API_ENDPOINT_REGISTRY } from "./api-endpoints-registry";

function walkRouteFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const absolute = path.join(dir, entry);
    const stat = statSync(absolute);
    if (stat.isDirectory()) {
      files.push(...walkRouteFiles(absolute));
      continue;
    }
    if (entry === "route.ts") files.push(absolute);
  }

  return files;
}

function toApiPathPattern(filePath: string): string {
  const apiRoot = path.join(process.cwd(), "src", "app", "api");
  const relative = path.relative(apiRoot, filePath).replace(/\\/g, "/");
  const withoutRoute = relative.replace(/\/route\.ts$/, "");
  return `/api/${withoutRoute}`.replace(/\/+$/, "");
}

describe("API_ENDPOINT_REGISTRY", () => {
  it("covers all exported API route methods", () => {
    const apiRoot = path.join(process.cwd(), "src", "app", "api");
    const routeFiles = walkRouteFiles(apiRoot);
    const discovered = new Set<string>();

    for (const routeFile of routeFiles) {
      const source = readFileSync(routeFile, "utf-8");
      const matches = source.matchAll(/export async function (GET|POST|PATCH|DELETE)\s*\(/g);
      for (const match of matches) {
        const method = match[1];
        const pathPattern = toApiPathPattern(routeFile);
        discovered.add(`${method} ${pathPattern}`);
      }
    }

    const registered = new Set(
      API_ENDPOINT_REGISTRY.map((entry) => `${entry.method} ${entry.pathPattern}`),
    );

    expect(Array.from(registered).sort()).toEqual(Array.from(discovered).sort());
  });
});

