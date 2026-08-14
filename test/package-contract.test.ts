import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { promisify } from "node:util";

const README_LINKED_DOCUMENTS = [
  "backlog/docs/specs/doc-1 - SLYE-MVP-specification.md",
  "backlog/docs/specs/doc-4 - SLYE-benchmark-results.md",
  "backlog/docs/runbooks/doc-2 - SLYE-sandbox-manual-checks.md",
];

const PACKAGE_FILES = [
  "src",
  "README.md",
  "backlog/docs/specs/doc-1 - SLYE-MVP-specification.md",
  "backlog/docs/specs/doc-4 - SLYE-benchmark-results.md",
  "backlog/docs/runbooks/doc-2 - SLYE-sandbox-manual-checks.md",
];

const PACKED_FILES = [
  "README.md",
  "backlog/docs/runbooks/doc-2 - SLYE-sandbox-manual-checks.md",
  "backlog/docs/specs/doc-1 - SLYE-MVP-specification.md",
  "backlog/docs/specs/doc-4 - SLYE-benchmark-results.md",
  "package.json",
  "src/config.ts",
  "src/index.ts",
  "src/model-rewrite.ts",
  "src/rewrite.ts",
];

const runCommand = promisify(execFile);

test("the package manifest declares its extension and README-linked governed documents and enforces the exact packed-file allowlist", async () => {
  const packageUrl = new URL("../package.json", import.meta.url);
  const packageJson = JSON.parse(await readFile(packageUrl, "utf8")) as {
    files: string[];
    pi: { extensions: string[] };
  };
  const extensionPath = "./src/index.ts";

  assert.deepEqual(packageJson.files, PACKAGE_FILES);
  assert.deepEqual(packageJson.pi.extensions, [extensionPath]);

  await access(new URL(extensionPath, packageUrl));
  await access(new URL("../README.md", import.meta.url));
  for (const documentPath of README_LINKED_DOCUMENTS) {
    await access(new URL(`../${documentPath}`, import.meta.url));
  }

  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  assert.ok(readme.includes("backlog/docs/specs/doc-1%20-%20SLYE-MVP-specification.md"));
  assert.ok(readme.includes("backlog/docs/specs/doc-4%20-%20SLYE-benchmark-results.md"));
  assert.ok(readme.includes("backlog/docs/runbooks/doc-2%20-%20SLYE-sandbox-manual-checks.md"));

  const packed = JSON.parse(
    (await runCommand("npm", ["pack", "--dry-run", "--json"], { cwd: new URL("../", import.meta.url) })).stdout,
  ) as Array<{ files: Array<{ path: string }> }>;
  const packedArchive = packed[0];
  if (!packedArchive) {
    throw new Error("npm pack did not return an archive");
  }
  assert.deepEqual(packedArchive.files.map((file) => file.path).sort(), PACKED_FILES);

  const extension = await import(new URL(extensionPath, packageUrl).href);
  assert.equal(typeof extension.default, "function");
});
