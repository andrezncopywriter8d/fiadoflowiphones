import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["src"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".md"]);
const mojibake = /Ã|Â|Æ|ƒ|â€|�/;
const failures = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path);
      continue;
    }
    if (!extensions.has(path.slice(path.lastIndexOf(".")))) continue;

    const text = readFileSync(path, "utf8");
    if (mojibake.test(text)) {
      failures.push(path);
    }
  }
}

for (const root of roots) {
  walk(root);
}

if (failures.length) {
  console.error("Mojibake/encoding artifacts found:");
  for (const file of failures) console.error(`- ${file}`);
  process.exit(1);
}

console.log("Text encoding check passed.");
