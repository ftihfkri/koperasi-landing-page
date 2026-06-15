/**
 * Optimize all images under public/landing/images/ in place.
 *
 * For each image:
 *   - Resize to MAX_WIDTH if wider (keeps aspect ratio)
 *   - PNG: re-encode with palette quantization (lossy but visually identical
 *     for illustrations) + max zlib compression
 *   - JPEG: re-encode with mozjpeg at quality 82, strip metadata
 *
 * Filenames and extensions are preserved so React config stays intact.
 *
 * Run with: npm run optimize-images
 *
 * Safety: assumes images are already committed to git. If something looks
 * off after running, `git checkout public/landing/images/` restores the
 * originals.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const IMAGES_DIR = path.join(__dirname, "..", "public", "landing", "images");
const MAX_WIDTH = 1600;
const JPEG_QUALITY = 82;
const PNG_QUALITY = 80;

// Skip images already smaller than this — they're likely fine.
const SKIP_IF_SMALLER_THAN = 200 * 1024; // 200 KB

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
};

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function fmtPct(p) {
  return `${(p * 100).toFixed(0)}%`;
}

async function walkImages(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkImages(full)));
    } else if (/\.(png|jpe?g)$/i.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

async function processImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const originalSize = fs.statSync(filePath).size;

  if (originalSize < SKIP_IF_SMALLER_THAN) {
    return { status: "skip", reason: "already small", originalSize };
  }

  const meta = await sharp(filePath).metadata();
  const willResize = meta.width > MAX_WIDTH;

  let pipeline = sharp(filePath).rotate(); // honor EXIF orientation
  if (willResize) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }

  let buf;
  if (ext === ".png") {
    buf = await pipeline
      .png({ quality: PNG_QUALITY, compressionLevel: 9, palette: true })
      .toBuffer();
  } else {
    buf = await pipeline
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();
  }

  // Only write if we actually shrank it; otherwise leave original alone.
  if (buf.length >= originalSize) {
    return { status: "skip", reason: "no improvement", originalSize };
  }

  fs.writeFileSync(filePath, buf);
  return {
    status: "ok",
    originalSize,
    newSize: buf.length,
    savings: 1 - buf.length / originalSize,
    resized: willResize,
    width: willResize ? MAX_WIDTH : meta.width,
  };
}

async function main() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`${C.yellow}Images directory not found: ${IMAGES_DIR}${C.reset}`);
    process.exit(1);
  }

  console.log(`${C.bold}Optimizing images in ${IMAGES_DIR}${C.reset}`);
  console.log(`${C.gray}  Max width: ${MAX_WIDTH}px · JPEG q=${JPEG_QUALITY} · PNG palette q=${PNG_QUALITY}${C.reset}\n`);

  const files = await walkImages(IMAGES_DIR);
  let totalBefore = 0;
  let totalAfter = 0;
  let processed = 0;
  let skipped = 0;

  for (const f of files) {
    const rel = path.relative(IMAGES_DIR, f);
    try {
      const r = await processImage(f);
      totalBefore += r.originalSize;
      if (r.status === "ok") {
        totalAfter += r.newSize;
        processed++;
        const arrow = `${fmtBytes(r.originalSize)} ${C.gray}→${C.reset} ${C.green}${fmtBytes(r.newSize)}${C.reset}`;
        const sav = `${C.green}-${fmtPct(r.savings)}${C.reset}`;
        const note = r.resized ? `${C.gray}(resized to ${r.width}px)${C.reset}` : "";
        console.log(`  ${C.green}✓${C.reset} ${rel.padEnd(34)} ${arrow} ${sav} ${note}`);
      } else {
        totalAfter += r.originalSize;
        skipped++;
        console.log(`  ${C.gray}-${C.reset} ${rel.padEnd(34)} ${C.gray}${fmtBytes(r.originalSize)} (${r.reason})${C.reset}`);
      }
    } catch (err) {
      console.error(`  ${C.yellow}✗${C.reset} ${rel}: ${err.message}`);
    }
  }

  const totalSavings = totalBefore > 0 ? 1 - totalAfter / totalBefore : 0;
  console.log();
  console.log(`${C.bold}${C.green}════════════════════════════════════════════════${C.reset}`);
  console.log(`${C.bold}  Optimized ${processed} files · skipped ${skipped}${C.reset}`);
  console.log(`${C.bold}  Before: ${fmtBytes(totalBefore)}   After: ${C.green}${fmtBytes(totalAfter)}${C.reset}${C.bold}   Saved: ${C.green}${fmtPct(totalSavings)} (${fmtBytes(totalBefore - totalAfter)})${C.reset}`);
  console.log(`${C.bold}${C.green}════════════════════════════════════════════════${C.reset}`);
  console.log();
  console.log(`${C.blue}Next:${C.reset}`);
  console.log(`  1. Spot-check a few images locally — they should look identical.`);
  console.log(`  2. ${C.gray}If anything looks wrong:${C.reset} git checkout public/landing/images/`);
  console.log(`  3. Commit: git add public/landing/images/ && git commit -m "perf: optimize landing images"`);
  console.log(`  4. Push: git push origin main`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
