/**
 * Generate a multi-size favicon set from public/logo-kopssb.jpeg.
 *
 * Outputs into public/:
 *   - favicon.ico          (multi-size: 16, 32, 48)
 *   - favicon-16x16.png
 *   - favicon-32x32.png
 *   - favicon-96x96.png
 *   - apple-touch-icon.png (180x180)
 *   - android-chrome-192x192.png
 *   - android-chrome-512x512.png
 *
 * Run with: npm run favicons
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const pngToIco = require("png-to-ico").default;

const SRC = path.join(__dirname, "..", "public", "logo-kopssb.jpeg");
const OUT = path.join(__dirname, "..", "public");

const PNG_SIZES = [
  { name: "favicon-16x16.png",          size: 16  },
  { name: "favicon-32x32.png",          size: 32  },
  { name: "favicon-96x96.png",          size: 96  },
  { name: "apple-touch-icon.png",       size: 180 },
  { name: "android-chrome-192x192.png", size: 192 },
  { name: "android-chrome-512x512.png", size: 512 },
];

const ICO_SIZES = [16, 32, 48];

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`Source logo not found at ${SRC}`);
    process.exit(1);
  }
  console.log(`Source: ${path.relative(process.cwd(), SRC)}`);

  for (const { name, size } of PNG_SIZES) {
    const out = path.join(OUT, name);
    await sharp(SRC)
      .resize(size, size, { fit: "cover", position: "center" })
      .png({ compressionLevel: 9 })
      .toFile(out);
    console.log(`  PNG ${size}x${size} -> ${name}`);
  }

  const icoBuffers = await Promise.all(
    ICO_SIZES.map((s) =>
      sharp(SRC)
        .resize(s, s, { fit: "cover", position: "center" })
        .png()
        .toBuffer(),
    ),
  );
  const ico = await pngToIco(icoBuffers);
  fs.writeFileSync(path.join(OUT, "favicon.ico"), ico);
  console.log(`  ICO ${ICO_SIZES.join("+")} -> favicon.ico`);

  console.log("\nDone. Add to each <head>:");
  console.log(`  <link rel="icon" type="image/x-icon" href="/favicon.ico">`);
  console.log(`  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">`);
  console.log(`  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">`);
  console.log(`  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
