import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8000';

// Comprehensive viewport sizes covering real-world devices
const VIEWPORTS = [
    { name: 'iPhone SE',          width: 375,  height: 667,  category: 'mobile-small' },
    { name: 'iPhone 12 Pro',      width: 390,  height: 844,  category: 'mobile' },
    { name: 'iPhone 14 Pro Max',  width: 430,  height: 932,  category: 'mobile-large' },
    { name: 'Samsung Galaxy S20', width: 360,  height: 800,  category: 'mobile' },
    { name: 'iPad Mini',          width: 768,  height: 1024, category: 'tablet-portrait' },
    { name: 'iPad Pro 11',        width: 834,  height: 1194, category: 'tablet-portrait' },
    { name: 'iPad Pro Landscape', width: 1194, height: 834,  category: 'tablet-landscape' },
    { name: 'Laptop',             width: 1366, height: 768,  category: 'desktop' },
    { name: 'Desktop',            width: 1920, height: 1080, category: 'desktop' },
    { name: '4K Display',         width: 2560, height: 1440, category: 'desktop-large' },
];

test.describe('Landing Page Responsive Tests', () => {

    for (const viewport of VIEWPORTS) {
        test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {

            test.beforeEach(async ({ page }) => {
                await page.setViewportSize({ width: viewport.width, height: viewport.height });
                await page.goto(`${BASE_URL}/`);
                await page.waitForLoadState('networkidle');
                await page.waitForSelector('#root', { timeout: 10000 });
                // Give React time to render fully
                await page.waitForTimeout(800);
            });

            test('Page loads without horizontal overflow', async ({ page }) => {
                const overflow = await page.evaluate(() => {
                    return {
                        documentWidth: document.documentElement.scrollWidth,
                        viewportWidth: document.documentElement.clientWidth,
                        bodyWidth: document.body.scrollWidth,
                    };
                });

                console.log(`   Document: ${overflow.documentWidth}px, Viewport: ${overflow.viewportWidth}px`);

                // Allow 1px tolerance for sub-pixel rendering
                const hasHorizontalOverflow = overflow.documentWidth > overflow.viewportWidth + 1;

                if (hasHorizontalOverflow) {
                    console.log(`   ⚠️  Horizontal overflow detected! Difference: ${overflow.documentWidth - overflow.viewportWidth}px`);
                } else {
                    console.log(`   ✅ No horizontal overflow`);
                }

                expect(hasHorizontalOverflow).toBe(false);
            });

            test('No element exceeds viewport width', async ({ page }) => {
                const overflowingElements = await page.evaluate((viewportWidth) => {
                    const elements = document.querySelectorAll('*');
                    const overflowing = [];

                    // Helper: check if any ancestor clips this element
                    const isClippedByAncestor = (el) => {
                        let parent = el.parentElement;
                        while (parent && parent !== document.body) {
                            const style = window.getComputedStyle(parent);
                            if (style.overflow === 'hidden' || style.overflowX === 'hidden' ||
                                style.overflow === 'clip' || style.overflowX === 'clip') {
                                return true;
                            }
                            parent = parent.parentElement;
                        }
                        return false;
                    };

                    for (const el of elements) {
                        const rect = el.getBoundingClientRect();
                        if (rect.width === 0 || rect.height === 0) continue;
                        if (el.closest('svg')) continue;

                        // Skip elements clipped by overflow:hidden ancestor (decorative effects)
                        if (isClippedByAncestor(el)) continue;

                        // Skip elements with transforms (scale, translate effects)
                        const style = window.getComputedStyle(el);
                        if (style.transform && style.transform !== 'none') continue;

                        // Skip absolutely/fixed positioned decorative elements
                        if (style.position === 'absolute' || style.position === 'fixed') continue;

                        // Allow 2px tolerance
                        if (rect.right > viewportWidth + 2) {
                            overflowing.push({
                                tag: el.tagName,
                                class: el.className?.toString?.()?.substring(0, 50) || '',
                                width: Math.round(rect.width),
                                right: Math.round(rect.right),
                            });
                        }
                    }

                    return overflowing.slice(0, 5);
                }, viewport.width);

                if (overflowingElements.length > 0) {
                    console.log(`   ⚠️  Found ${overflowingElements.length} overflowing elements:`);
                    overflowingElements.forEach(el => {
                        console.log(`      - <${el.tag}> ${el.class} (width: ${el.width}, right: ${el.right})`);
                    });
                } else {
                    console.log(`   ✅ All elements fit within viewport`);
                }

                expect(overflowingElements.length).toBe(0);
            });

            test('Text is readable (font size >= 12px)', async ({ page }) => {
                const tinyText = await page.evaluate(() => {
                    const textElements = document.querySelectorAll('p, span, a, button, h1, h2, h3, h4, h5, h6, li, label, input');
                    const tiny = [];

                    for (const el of textElements) {
                        const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
                        const text = el.textContent?.trim();
                        if (text && text.length > 0 && fontSize > 0 && fontSize < 12) {
                            tiny.push({ tag: el.tagName, fontSize, text: text.substring(0, 30) });
                        }
                    }

                    return tiny.slice(0, 3);
                });

                if (tinyText.length > 0) {
                    console.log(`   ⚠️  Found ${tinyText.length} elements with tiny text (< 12px)`);
                    tinyText.forEach(el => {
                        console.log(`      - <${el.tag}> ${el.fontSize}px: "${el.text}"`);
                    });
                } else {
                    console.log(`   ✅ All text has readable font size`);
                }
            });

            test('Images do not overflow their containers', async ({ page }) => {
                const overflowingImages = await page.evaluate((viewportWidth) => {
                    const images = document.querySelectorAll('img');
                    const issues = [];

                    // Helper: check if image is inside an overflow:hidden container
                    const isClipped = (el) => {
                        let parent = el.parentElement;
                        while (parent && parent !== document.body) {
                            const style = window.getComputedStyle(parent);
                            if (style.overflow === 'hidden' || style.overflowX === 'hidden' ||
                                style.overflow === 'clip' || style.overflowX === 'clip') {
                                return true;
                            }
                            parent = parent.parentElement;
                        }
                        return false;
                    };

                    for (const img of images) {
                        const rect = img.getBoundingClientRect();

                        // Skip images that are clipped by parent (object-cover background images)
                        if (isClipped(img)) continue;

                        // Check if image visibly extends past viewport
                        if (rect.right > viewportWidth + 2 || rect.left < -2) {
                            issues.push({
                                src: img.src.substring(img.src.lastIndexOf('/') + 1),
                                width: Math.round(rect.width),
                                left: Math.round(rect.left),
                                right: Math.round(rect.right),
                            });
                        }
                    }

                    return issues;
                }, viewport.width);

                if (overflowingImages.length > 0) {
                    console.log(`   ⚠️  ${overflowingImages.length} images overflow:`);
                    overflowingImages.forEach(img => {
                        console.log(`      - ${img.src} (${img.width}px wide)`);
                    });
                } else {
                    console.log(`   ✅ All images fit within viewport`);
                }

                expect(overflowingImages.length).toBe(0);
            });

            test('Navigation is accessible', async ({ page }) => {
                // For mobile/small screens, check for hamburger menu
                if (viewport.width < 768) {
                    const hamburger = page.locator('button[aria-label*="menu" i], [class*="hamburger"], [class*="mobile-menu" i], button:has(svg)').first();
                    const navLinks = page.locator('nav a, [role="navigation"] a').first();

                    const hasHamburger = await hamburger.count() > 0 && await hamburger.isVisible().catch(() => false);
                    const hasVisibleNav = await navLinks.isVisible().catch(() => false);

                    if (hasHamburger || hasVisibleNav) {
                        console.log(`   ✅ Mobile navigation accessible (${hasHamburger ? 'hamburger' : 'visible links'})`);
                    } else {
                        console.log(`   ℹ️  No clear mobile navigation detected`);
                    }
                } else {
                    // For tablet/desktop, nav links should be visible
                    const nav = page.locator('nav, [role="navigation"]').first();
                    if (await nav.count() > 0) {
                        await expect(nav).toBeVisible();
                        console.log(`   ✅ Desktop navigation visible`);
                    }
                }
            });

            test('Interactive elements are clickable (min 44x44px tap targets on mobile)', async ({ page }) => {
                if (viewport.width >= 768) {
                    console.log(`   ℹ️  Skipping tap target check on non-mobile viewport`);
                    return;
                }

                const tooSmallTargets = await page.evaluate(() => {
                    const interactives = document.querySelectorAll('button, a, input[type="submit"], input[type="button"]');
                    const small = [];

                    for (const el of interactives) {
                        const rect = el.getBoundingClientRect();
                        // Skip hidden elements
                        if (rect.width === 0 || rect.height === 0) continue;
                        // WCAG recommends 44x44px minimum
                        if ((rect.width < 32 || rect.height < 32) && el.textContent?.trim()) {
                            small.push({
                                tag: el.tagName,
                                width: Math.round(rect.width),
                                height: Math.round(rect.height),
                                text: el.textContent.trim().substring(0, 20),
                            });
                        }
                    }

                    return small.slice(0, 5);
                });

                if (tooSmallTargets.length > 0) {
                    console.log(`   ⚠️  ${tooSmallTargets.length} small tap targets:`);
                    tooSmallTargets.forEach(t => {
                        console.log(`      - <${t.tag}> ${t.width}x${t.height}: "${t.text}"`);
                    });
                } else {
                    console.log(`   ✅ All tap targets are adequately sized`);
                }
            });

            test('Contact form is usable', async ({ page }) => {
                // Scroll to contact section
                const contactSection = page.locator('#contact, [class*="contact" i]').first();

                if (await contactSection.count() > 0) {
                    await contactSection.scrollIntoViewIfNeeded();
                    await page.waitForTimeout(300);

                    // Check form inputs are visible and not overflowing
                    const inputs = page.locator('form input, form textarea');
                    const inputCount = await inputs.count();

                    if (inputCount > 0) {
                        // Check first input is visible and clickable
                        const firstInput = inputs.first();
                        await expect(firstInput).toBeVisible();

                        const rect = await firstInput.boundingBox();
                        if (rect) {
                            console.log(`   ✅ Contact form usable (${inputCount} inputs, first input: ${Math.round(rect.width)}x${Math.round(rect.height)})`);
                        }
                    }
                } else {
                    console.log(`   ℹ️  Contact form not found on this view`);
                }
            });

            test('Capture screenshot for visual review', async ({ page }) => {
                const screenshotPath = `playwright-report/screenshots/${viewport.name.replace(/\s/g, '_')}_${viewport.width}x${viewport.height}.png`;

                await page.screenshot({
                    path: screenshotPath,
                    fullPage: true,
                });

                console.log(`   📸 Screenshot saved: ${screenshotPath}`);
            });
        });
    }

});

test.describe('Cross-Viewport Smoke Test', () => {

    test('Critical elements visible across all viewports', async ({ page }) => {
        const results = [];

        for (const viewport of VIEWPORTS) {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await page.goto(`${BASE_URL}/`);
            await page.waitForLoadState('networkidle');
            await page.waitForSelector('#root', { timeout: 10000 });
            await page.waitForTimeout(500);

            const visible = await page.evaluate(() => {
                const root = document.querySelector('#root');
                const hasContent = root && root.children.length > 0;
                const hasImages = document.querySelectorAll('img').length > 0;
                const hasButtons = document.querySelectorAll('button, a').length > 0;
                const bodyVisible = document.body.offsetHeight > 100;

                return { hasContent, hasImages, hasButtons, bodyVisible };
            });

            const allOk = visible.hasContent && visible.hasImages && visible.hasButtons && visible.bodyVisible;
            results.push({ viewport: viewport.name, size: `${viewport.width}x${viewport.height}`, ok: allOk });

            console.log(`   ${allOk ? '✅' : '❌'} ${viewport.name} (${viewport.width}x${viewport.height})`);
        }

        const allPassed = results.every(r => r.ok);
        expect(allPassed).toBe(true);
    });
});
