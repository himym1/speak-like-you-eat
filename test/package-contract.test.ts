import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the Pi manifest resolves to an extension factory", async () => {
  const packageUrl = new URL("../package.json", import.meta.url);
  const packageJson = JSON.parse(await readFile(packageUrl, "utf8")) as {
    pi: { extensions: string[] };
  };
  const [extensionPath] = packageJson.pi.extensions;

  assert.equal(packageJson.pi.extensions.length, 1);
  assert.equal(extensionPath, "./src/index.ts");

  const extensionUrl = new URL(extensionPath, packageUrl);
  const extension = await import(extensionUrl.href);

  assert.equal(typeof extension.default, "function");
});
