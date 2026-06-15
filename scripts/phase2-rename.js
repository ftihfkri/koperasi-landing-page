/**
 * Phase 2 of the Investor->Shareholder rename: code identifiers,
 * routes, class names, columns, DOM IDs.
 *
 * Files have already been git-mv'd. This script updates references
 * inside files: class names, role enum values, column accessors,
 * route helper calls, validation rule keys, form field names, etc.
 *
 * Run with: node scripts/phase2-rename.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const TARGETS = [
  "app",
  "routes",
  "resources/js",
  "resources/views",
  "database/migrations",
  "database/seeders",
  "config",
  "tests",
  "vite.config.js",
];

const SKIP_FILES = new Set([
  "scripts/phase2-rename.js",            // don't touch self
  "scripts/rename-shareholder.js",       // don't touch the earlier rename script
]);

const ALLOWED_EXT = new Set([
  ".php", ".tsx", ".ts", ".jsx", ".js", ".blade.php",
]);

// Order matters: longer / more specific replacements first.
// Each rule = [pattern, replacement]. Strings = literal substring,
// RegExp = regex.
const RULES = [
  // ── Class / file names ────────────────────────────────────────
  ["InvestorDashboardDataController",   "ShareholderDashboardDataController"],
  ["InvestorDashboardApiController",    "ShareholderDashboardApiController"],
  ["InvestorDashboard",                 "ShareholderDashboard"],
  ["MemberVerificationController",      "ShareholderVerificationController"],
  ["MembershipApproved",                "ShareholdingApproved"],

  // ── Vite entry / file paths in @vite() and imports ────────────
  ["resources/js/investor-dashboard.tsx", "resources/js/shareholder-dashboard.tsx"],
  ["./pages/investor/InvestorDashboard", "./pages/shareholder/ShareholderDashboard"],
  ["resources/js/pages/investor/",       "resources/js/pages/shareholder/"],
  ["investor-dashboard-root",            "shareholder-dashboard-root"],
  ["investor.dashboard",                 "shareholder.dashboard"], // route name + JS asset ref

  // ── Blade view paths ──────────────────────────────────────────
  ["view('investor.dashboard')",          "view('shareholder.dashboard')"],
  ["view(\"investor.dashboard\")",        "view(\"shareholder.dashboard\")"],
  ["view('emails.membership-approved')",  "view('emails.shareholding-approved')"],
  ["view(\"emails.membership-approved\")","view(\"emails.shareholding-approved\")"],
  ["view('member-verification')",         "view('shareholder-verification')"],
  ["view(\"member-verification\")",       "view(\"shareholder-verification\")"],
  ["view('members.index')",               "view('shareholders.index')"],
  ["view(\"members.index\")",             "view(\"shareholders.index\")"],

  // ── Route names ───────────────────────────────────────────────
  ["route('investor.",  "route('shareholder."],
  ["route(\"investor.", "route(\"shareholder."],
  ["route('admin.members", "route('admin.shareholders"],
  ["route(\"admin.members", "route(\"admin.shareholders"],
  ["route('staff.members", "route('staff.shareholders"],
  ["route(\"staff.members", "route(\"staff.shareholders"],
  ["route('member.verify", "route('shareholder.verify"],
  ["route(\"member.verify","route(\"shareholder.verify"],
  ["request()->routeIs('admin.members.*')", "request()->routeIs('admin.shareholders.*')"],
  ["request()->routeIs('staff.members.*')", "request()->routeIs('staff.shareholders.*')"],
  ["request()->routeIs(\"admin.members.*\")", "request()->routeIs(\"admin.shareholders.*\")"],
  ["request()->routeIs(\"staff.members.*\")", "request()->routeIs(\"staff.shareholders.*\")"],

  // ── URL paths (in fetch() calls, hrefs, etc.) ─────────────────
  // Note: only paths starting with /investor/ or /staff/member or /admin/members
  // get changed. Keep more-specific patterns first.
  [/\/investor\/dashboard-data/g, "/shareholder/dashboard-data"],
  [/\/investor\/wallet\//g,       "/shareholder/wallet/"],
  [/\/investor\/certificate/g,    "/shareholder/certificate"],
  [/\/investor\/statement/g,      "/shareholder/statement"],
  [/\/investor\/profile/g,        "/shareholder/profile"],
  [/\/investor\/membership-card/g,"/shareholder/shareholding-card"],
  [/\/investor\/dividends/g,      "/shareholder/dividends"],
  [/\/investor\/transactions/g,   "/shareholder/transactions"],
  [/\/investor\/announcements/g,  "/shareholder/announcements"],
  [/\/investor\/my-investment/g,  "/shareholder/my-investment"],
  [/\/investor\//g,               "/shareholder/"],
  [/\/investor(?=['"])/g,         "/shareholder"],
  [/\/staff\/member-records/g,    "/staff/shareholder-records"],
  [/\/staff\/members\//g,         "/staff/shareholders/"],
  [/\/staff\/members(?=['"\)?])/g,"/staff/shareholders"],
  [/\/admin\/members/g,           "/admin/shareholders"],

  // ── Middleware role:investor → role:shareholder ──────────────
  ["'role:investor,staff,admin'",  "'role:shareholder,staff,admin'"],
  ["\"role:investor,staff,admin\"","\"role:shareholder,staff,admin\""],
  ["'role:investor'",  "'role:shareholder'"],
  ["\"role:investor\"","\"role:shareholder\""],

  // ── Role value comparisons / assignments ──────────────────────
  ["=== 'investor'",     "=== 'shareholder'"],
  ["=== \"investor\"",   "=== \"shareholder\""],
  ["== 'investor'",      "== 'shareholder'"],
  ["== \"investor\"",    "== \"shareholder\""],
  ["!= 'investor'",      "!= 'shareholder'"],
  ["!= \"investor\"",    "!= \"shareholder\""],
  ["!== 'investor'",     "!== 'shareholder'"],
  ["!== \"investor\"",   "!== \"shareholder\""],
  ["'role' => 'investor'",   "'role' => 'shareholder'"],
  ["\"role\" => \"investor\"","\"role\" => \"shareholder\""],
  ["->where('role', 'investor')",   "->where('role', 'shareholder')"],
  ["->where(\"role\", \"investor\")","->where(\"role\", \"shareholder\")"],
  ["->whereIn('role', ['investor",   "->whereIn('role', ['shareholder"],
  ["'investor'\n",     "'shareholder'\n"], // dangling 'investor' literal at line end

  // ── Column references ────────────────────────────────────────
  // member_id → shareholder_id
  ["'member_id'",     "'shareholder_id'"],
  ["\"member_id\"",   "\"shareholder_id\""],
  ["->member_id",     "->shareholder_id"],
  ["[\"member_id\"]", "[\"shareholder_id\"]"],
  ["['member_id']",   "['shareholder_id']"],
  ["m.member_id",     "m.shareholder_id"],          // shorthand reads
  ["u.member_id",     "u.shareholder_id"],
  ["user.member_id",  "user.shareholder_id"],
  ["p.member_id",     "p.shareholder_id"],
  ["name=\"member_id\"", "name=\"shareholder_id\""],   // form fields
  ["name='member_id'",   "name='shareholder_id'"],
  ["id=\"member_id\"",   "id=\"shareholder_id\""],
  ["id='member_id'",     "id='shareholder_id'"],
  ["for=\"member_id\"",  "for=\"shareholder_id\""],
  ["for='member_id'",    "for='shareholder_id'"],
  ["old('member_id')",   "old('shareholder_id')"],
  ["old(\"member_id\")", "old(\"shareholder_id\")"],

  // membership_start_date → shareholding_start_date
  ["'membership_start_date'",     "'shareholding_start_date'"],
  ["\"membership_start_date\"",   "\"shareholding_start_date\""],
  ["->membership_start_date",     "->shareholding_start_date"],
  ["membership_start_date",       "shareholding_start_date"], // catch-all (after the above for safety)

  // ── TypeScript field names (member: string in types) ──────────
  // These are type definitions like `member:string` in TabungEntry/Tx
  // — kept as `member` (it's a join-style label, not an ID). Skip.

  // ── React state setters and types ────────────────────────────
  ["setMemberId", "setShareholderId"],
  ["memberId",    "shareholderId"],

  // ── Misc UI fragments (lowercase 'investor' in JSX visible text)
  ["KOP-SSB://member?id=", "KOP-SSB://shareholder?id="],
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const stat = fs.statSync(dir);
  if (stat.isFile()) { out.push(dir); return out; }
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    walk(p, out);
  }
  return out;
}

function isAllowed(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  if (SKIP_FILES.has(rel)) return false;
  if (file.endsWith(".blade.php")) return true;
  return ALLOWED_EXT.has(path.extname(file));
}

const allFiles = new Set();
for (const t of TARGETS) {
  for (const f of walk(path.join(ROOT, t))) {
    if (isAllowed(f)) allFiles.add(f);
  }
}

const changes = [];
for (const file of allFiles) {
  const before = fs.readFileSync(file, "utf8");
  let after = before;
  const hits = [];
  for (const [pat, sub] of RULES) {
    if (typeof pat === "string") {
      if (after.includes(pat)) {
        const count = after.split(pat).length - 1;
        hits.push(`${pat.slice(0, 36)}×${count}`);
        after = after.split(pat).join(sub);
      }
    } else {
      const m = after.match(pat);
      if (m) {
        hits.push(`${pat.source.slice(0, 36)}×${m.length}`);
        after = after.replace(pat, sub);
      }
    }
  }
  if (before !== after) {
    fs.writeFileSync(file, after, "utf8");
    changes.push({ file: path.relative(ROOT, file), hits });
  }
}

if (!changes.length) console.log("No changes.");
else {
  console.log(`Updated ${changes.length} files:\n`);
  for (const c of changes) {
    console.log(`  ${c.file}\n     ${c.hits.join(", ")}`);
  }
}
