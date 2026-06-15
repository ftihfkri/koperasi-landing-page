/**
 * One-shot UI rename: Investor / Member / Membership -> Shareholder / Shareholding.
 *
 * Replaces user-facing text in Blade views, React components, email
 * templates, and PHP controllers (for flash messages / email subjects).
 *
 * Uses word boundaries so that:
 *   - "remember", "remember_token" stay intact
 *   - "member_id", "membership_start_date" stay intact (code identifiers,
 *     handled in a later commit by a column-rename migration)
 *   - "InvestorDashboard" (component/class name) stays intact for now
 *   - "investor-dashboard-root" (DOM id) stays intact
 *
 * Run with: node scripts/rename-shareholder.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

// Directories to walk (recursively)
const TARGETS = [
  "resources/views",
  "resources/js/pages",
  "app/Mail",
  "app/Notifications",
];

// Files to explicitly include (outside TARGETS)
const EXTRA_FILES = [
  "resources/js/investor-dashboard.tsx", // we'll only rewrite text strings, not the import path
];

// Exact paths to skip entirely
const SKIP_FILES = new Set([
  // none for now
]);

// Allow only these extensions
const ALLOWED_EXT = new Set([".php", ".tsx", ".ts", ".jsx", ".js", ".blade.php"]);

// Replacement rules. ORDER MATTERS - longer/more specific first.
// Each rule is [regex, replacement]. \b = word boundary.
//
// We deliberately DO NOT replace lowercase "member" because that would
// hit "remember", "member_id" (snake-cased identifier), etc. The
// Title-Case and UPPER-CASE forms cover ~95% of visible UI text.
const RULES = [
  // Membership / membership-related
  [/\bMembership\b/g,  "Shareholding"],
  [/\bMEMBERSHIP\b/g,  "SHAREHOLDING"],
  [/\bmemberships\b/g, "shareholdings"],

  // Members plural
  [/\bMembers\b/g,     "Shareholders"],
  [/\bMEMBERS\b/g,     "SHAREHOLDERS"],

  // Member singular (Title Case + UPPER only — leaves "member_id" alone)
  [/\bMember\b/g,      "Shareholder"],
  [/\bMEMBER\b/g,      "SHAREHOLDER"],

  // Investor — Title Case + UPPER + plural
  [/\bInvestors\b/g,   "Shareholders"],
  [/\bINVESTORS\b/g,   "SHAREHOLDERS"],
  [/\bInvestor\b/g,    "Shareholder"],
  [/\bINVESTOR\b/g,    "SHAREHOLDER"],

  // Lowercase "investor" - only when it's clearly a standalone English
  // word (preceded/followed by whitespace, punctuation, or quote — NOT
  // by hyphen/slash/underscore which would mean it's part of a path
  // like "/investor/dashboard" or "investor-dashboard-root").
  [/(?<![\/\w-])investor(?![\/\w-])/g, "shareholder"],
  [/(?<![\/\w-])investors(?![\/\w-])/g, "shareholders"],

  // ─── Targeted lowercase phrases that appear as visible UI text.
  // Each is a full unique phrase so it can't collide with code identifiers.
  ["this member's account", "this shareholder's account"],
  ["No members match your search.", "No shareholders match your search."],
  ["Failed to load member data.", "Failed to load shareholder data."],
  ["Failed to load member. Please try again.", "Failed to load shareholder. Please try again."],
  ["No members yet.", "No shareholders yet."],
  ["⚠️ Could not load member data. Please try again.", "⚠️ Could not load shareholder data. Please try again."],
  ["Could not load member data. Please try again.", "Could not load shareholder data. Please try again."],
  [`Live Attendance — {selected.attendance_count} member{selected.attendance_count!==1?"s":""}`,
   `Live Attendance — {selected.attendance_count} shareholder{selected.attendance_count!==1?"s":""}`],
  ["Wait for members to scan the QR or use Manual Check-In below.",
   "Wait for shareholders to scan the QR or use Manual Check-In below."],
  ["Backup for members who cannot scan the QR — no internet, no phone, or elderly members.",
   "Backup for shareholders who cannot scan the QR — no internet, no phone, or elderly shareholders."],
  [`placeholder="Search by name or member ID…"`, `placeholder="Search by name or shareholder ID…"`],
  ["To modify member data, staff must submit a change request which admin approves.",
   "To modify shareholder data, staff must submit a change request which admin approves."],
  ["Loading member data…", "Loading shareholder data…"],
  ["Adds the amount in the file to each member's current Tabung",
   "Adds the amount in the file to each shareholder's current Tabung"],
  ["No tickets yet. Use the ⚠ button on transactions or members to raise a case.",
   "No tickets yet. Use the ⚠ button on transactions or shareholders to raise a case."],
  ["Create a meeting, project the QR code, members scan to mark attendance.",
   "Create a meeting, project the QR code, shareholders scan to mark attendance."],

  // Lowercase "membership" in visible text — preserves
  // membership_start_date / pass.my.kopssb.membership via the same
  // [\/\w-.] exclusion (note we also exclude '.' for Apple Pass Type IDs).
  [/(?<![\/\w.-])membership(?![\/\w.-])/g, "shareholding"],
];

function replaceAll(str, search, replacement) {
  // For non-regex string searches
  if (typeof search === "string") {
    return str.split(search).join(replacement);
  }
  return str.replace(search, replacement);
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function isAllowed(file) {
  if (SKIP_FILES.has(path.relative(ROOT, file))) return false;
  if (file.endsWith(".blade.php")) return true;
  return ALLOWED_EXT.has(path.extname(file));
}

function processFile(file) {
  const before = fs.readFileSync(file, "utf8");
  let after = before;
  let perRuleCounts = [];
  for (const [pat, sub] of RULES) {
    if (typeof pat === "string") {
      if (after.includes(pat)) {
        const count = after.split(pat).length - 1;
        perRuleCounts.push([pat.slice(0, 40) + (pat.length > 40 ? "…" : ""), count]);
        after = after.split(pat).join(sub);
      }
    } else {
      const matches = after.match(pat);
      const count = matches ? matches.length : 0;
      if (count > 0) perRuleCounts.push([pat.source, count]);
      after = after.replace(pat, sub);
    }
  }
  if (before === after) return null;
  fs.writeFileSync(file, after, "utf8");
  return { file: path.relative(ROOT, file), perRuleCounts };
}

const allFiles = new Set();
for (const t of TARGETS) {
  for (const f of walk(path.join(ROOT, t))) {
    if (isAllowed(f)) allFiles.add(f);
  }
}
for (const f of EXTRA_FILES) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) allFiles.add(p);
}

const changes = [];
for (const f of allFiles) {
  const r = processFile(f);
  if (r) changes.push(r);
}

if (changes.length === 0) {
  console.log("No changes.");
} else {
  console.log(`Updated ${changes.length} files:\n`);
  for (const c of changes) {
    const summary = c.perRuleCounts.map(([rule, n]) => `${rule}×${n}`).join(", ");
    console.log(`  ${c.file}   [${summary}]`);
  }
}
