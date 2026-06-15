const fs = require('fs');
const js = fs.readFileSync('public/landing/assets/index-kS62RZwQ.js', 'utf8');

// Search for all occurrences of "/contact" in the JS
let idx = 0;
let count = 0;
while ((idx = js.indexOf('/contact', idx)) !== -1) {
    const start = Math.max(0, idx - 150);
    const end = Math.min(js.length, idx + 150);
    console.log(`\n--- Match ${++count} at index ${idx} ---`);
    console.log(js.substring(start, end));
    idx += 1;
}

// Also search for fetch(
console.log('\n\n=== FETCH CALLS ===');
idx = 0;
while ((idx = js.indexOf('fetch(', idx)) !== -1) {
    const start = Math.max(0, idx - 50);
    const end = Math.min(js.length, idx + 200);
    console.log(`\n--- fetch at ${idx} ---`);
    console.log(js.substring(start, end));
    idx += 1;
    if (count > 20) break;
}
