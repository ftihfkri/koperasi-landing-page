/**
 * Phase 2 fix-up: catch the 'investor' literals that the structured
 * patterns in phase2-rename.js didn't match because of minor whitespace
 * differences (e.g., User::where('role','investor') vs ->where with space).
 *
 * Replaces every 'investor' and "investor" literal in app/ resources/
 * routes/ tests/ config/. Migration files are intentionally skipped
 * because they need to keep the literal 'investor' to update existing
 * rows correctly.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const TARGETS = ["app", "routes", "resources", "tests", "config", "database/seeders"];
const ALLOWED_EXT = new Set([".php", ".tsx", ".ts", ".jsx", ".js"]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const stat = fs.statSync(dir);
  if (stat.isFile()) { out.push(dir); return out; }
  for (const name of fs.readdirSync(dir)) walk(path.join(dir, name), out);
  return out;
}

function isAllowed(file) {
  if (file.endsWith(".blade.php")) return true;
  return ALLOWED_EXT.has(path.extname(file));
}

const changes = [];
for (const t of TARGETS) {
  for (const f of walk(path.join(ROOT, t))) {
    if (!isAllowed(f)) continue;
    const before = fs.readFileSync(f, "utf8");
    let after = before;
    // Replace 'investor' and "investor" (as quoted string literal).
    after = after.replace(/'investor'/g, "'shareholder'");
    after = after.replace(/"investor"/g, '"shareholder"');
    if (before !== after) {
      fs.writeFileSync(f, after, "utf8");
      changes.push(path.relative(ROOT, f));
    }
  }
}

if (!changes.length) console.log("No changes.");
else { console.log(`Updated ${changes.length} files:`); changes.forEach(c => console.log("  " + c)); }
