const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function loadLocale(locale) {
  const filename = path.join(process.cwd(), "src", "i18n", "messages", `${locale}.ts`);
  const source = fs.readFileSync(filename, "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const sandbox = { exports: {} };
  vm.runInNewContext(js, sandbox, { filename });
  return sandbox.exports[locale];
}

function flatten(value, prefix = "") {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flatten(item, `${prefix}[${index}]`));
  }
  if (value && typeof value === "object") {
    return Object.keys(value).flatMap((key) => flatten(value[key], prefix ? `${prefix}.${key}` : key));
  }
  return [prefix];
}

const locales = ["zh", "en", "ja"];
const keys = Object.fromEntries(locales.map((locale) => [locale, new Set(flatten(loadLocale(locale)))]));
const allKeys = new Set(locales.flatMap((locale) => [...keys[locale]]));
const failures = [];

for (const locale of locales) {
  const missing = [...allKeys].filter((key) => !keys[locale].has(key));
  if (missing.length) failures.push(`${locale} missing ${missing.length}: ${missing.slice(0, 20).join(", ")}`);
}

if (failures.length) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`i18n key parity passed: ${allKeys.size} leaf keys across ${locales.join(", ")}\n`);
