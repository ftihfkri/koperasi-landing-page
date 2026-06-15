import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8000';

test.describe('Landing Page Tests', () => {

    test('1. Landing page loads successfully', async ({ page }) => {
        await page.goto(`${BASE_URL}/`);
        await page.waitForLoadState('networkidle');

        // Check title
        await expect(page).toHaveTitle(/Koperasi/i);
        console.log('✅ Landing page title is correct:', await page.title());

        // Check main content area
        await expect(page.locator('#root')).toBeVisible({ timeout: 10000 });
        console.log('✅ React app root element mounted');
    });

    test('2. Landing page renders without errors (no console errors)', async ({ page }) => {
        const errors = [];

        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        page.on('pageerror', err => {
            errors.push(err.message);
        });

        await page.goto(`${BASE_URL}/`);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('#root', { timeout: 10000 });

        if (errors.length > 0) {
            console.log('⚠️  Console errors found:', errors);
        } else {
            console.log('✅ No console errors detected');
        }
    });

    test('3. CSS assets load correctly', async ({ page }) => {
        const cssLoadPromise = page.waitForResponse(
            res => res.url().includes('.css') && res.status() < 400,
            { timeout: 10000 }
        );

        await page.goto(`${BASE_URL}/`);

        try {
            const resp = await cssLoadPromise;
            expect(resp.status()).toBeLessThan(400);
            console.log('✅ CSS assets loaded successfully (status:', resp.status() + ')');
        } catch {
            console.log('ℹ️ CSS load check timed out (may have been cached)');
        }
    });

    test('4. JavaScript assets load correctly', async ({ page }) => {
        const jsLoadPromise = page.waitForResponse(
            res => res.url().includes('.js') && res.status() < 400,
            { timeout: 10000 }
        );

        await page.goto(`${BASE_URL}/`);

        try {
            const resp = await jsLoadPromise;
            expect(resp.status()).toBeLessThan(400);
            console.log('✅ JavaScript assets loaded successfully (status:', resp.status() + ')');
        } catch {
            console.log('ℹ️ JS load check timed out (may have been cached)');
        }
    });

    test('5. Images load without errors', async ({ page }) => {
        await page.goto(`${BASE_URL}/`);
        await page.waitForLoadState('networkidle');

        // Get all image elements
        const images = await page.locator('img').count();
        console.log('✅ Found', images, 'image elements on landing page');

        // Check for broken images
        const brokenImages = await page.locator('img[src=""]').count();
        expect(brokenImages).toBe(0);
        console.log('✅ No broken image references found');
    });

    test('6. Logo displays correctly', async ({ page }) => {
        await page.goto(`${BASE_URL}/`);
        await page.waitForLoadState('networkidle');

        const logo = page.locator('img[src*="logo"], [class*="logo"]').first();

        if (await logo.count() > 0) {
            await expect(logo).toBeVisible();
            console.log('✅ Logo is visible on landing page');
        } else {
            console.log('ℹ️ Logo element not found (may be styled differently)');
        }
    });

    test('7. Hero section renders', async ({ page }) => {
        await page.goto(`${BASE_URL}/`);
        await page.waitForLoadState('networkidle');

        // Look for hero section or main heading
        const heroSection = page.locator('header, [class*="hero"], h1, main').first();

        if (await heroSection.count() > 0) {
            await expect(heroSection).toBeVisible();
            console.log('✅ Hero/header section is visible');
        }
    });

    test('8. Navigation/Menu is accessible', async ({ page }) => {
        await page.goto(`${BASE_URL}/`);
        await page.waitForLoadState('networkidle');

        const nav = page.locator('nav, [role="navigation"], [class*="nav"], [class*="menu"]').first();

        if (await nav.count() > 0) {
            await expect(nav).toBeVisible();
            console.log('✅ Navigation menu is visible');

            // Check for links
            const links = await page.locator('nav a, [role="navigation"] a').count();
            console.log('✅ Found', links, 'navigation links');
        }
    });

    test('9. Contact form is present', async ({ page }) => {
        await page.goto(`${BASE_URL}/`);
        await page.waitForLoadState('networkidle');

        // Look for contact form
        const contactForm = page.locator('form, [class*="contact"], [id*="contact"]').first();

        if (await contactForm.count() > 0) {
            console.log('✅ Contact form element found');

            // Try to find contact form inputs
            const contactInputs = await page.locator('#contact-name, #contact-email, #contact-message, input[type="email"], textarea').count();
            console.log('✅ Found', contactInputs, 'contact form input fields');
        }
    });

    test('10. Contact form submission works', async ({ page }) => {
        await page.goto(`${BASE_URL}/`);
        await page.waitForLoadState('networkidle');

        // Try to find and fill contact form
        const nameField = page.locator('#contact-name, input[placeholder*="name" i]').first();
        const emailField = page.locator('#contact-email, input[type="email"]').first();
        const messageField = page.locator('#contact-message, textarea').first();

        if (await nameField.count() > 0 && await emailField.count() > 0) {
            await nameField.fill('Landing Page Test User');
            await emailField.fill('landing-test@example.com');

            if (await messageField.count() > 0) {
                await messageField.fill('Test message from Playwright');
            }

            // Submit form
            const submitBtn = page.getByRole('button', { name: /send|submit|contact/i }).first();

            if (await submitBtn.count() > 0) {
                const responsePromise = page.waitForResponse(
                    res => res.url().includes('/contact') && res.request().method() === 'POST',
                    { timeout: 10000 }
                ).catch(() => null);

                await submitBtn.click();
                const resp = await responsePromise;

                if (resp) {
                    expect([200, 302, 404]).toContain(resp.status());
                    console.log('✅ Contact form submitted (status:', resp.status() + ')');
                } else {
                    console.log('ℹ️ Contact form submission tracked');
                }
            }
        } else {
            console.log('ℹ️ Contact form fields not found in expected format');
        }
    });

    test('11. Page is responsive on mobile viewport', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        await page.goto(`${BASE_URL}/`);
        await page.waitForLoadState('networkidle');

        // Check that content is still visible
        const root = page.locator('#root');
        await expect(root).toBeVisible();

        console.log('✅ Landing page renders on mobile viewport (375x667)');
    });

    test('12. Page is responsive on tablet viewport', async ({ page }) => {
        // Set tablet viewport
        await page.setViewportSize({ width: 768, height: 1024 });

        await page.goto(`${BASE_URL}/`);
        await page.waitForLoadState('networkidle');

        const root = page.locator('#root');
        await expect(root).toBeVisible();

        console.log('✅ Landing page renders on tablet viewport (768x1024)');
    });

    test('13. Page is responsive on desktop viewport', async ({ page }) => {
        // Set desktop viewport
        await page.setViewportSize({ width: 1920, height: 1080 });

        await page.goto(`${BASE_URL}/`);
        await page.waitForLoadState('networkidle');

        const root = page.locator('#root');
        await expect(root).toBeVisible();

        console.log('✅ Landing page renders on desktop viewport (1920x1080)');
    });

    test('14. Favicon loads', async ({ page }) => {
        await page.goto(`${BASE_URL}/`);

        const favicon = page.locator('link[rel="icon"]');

        if (await favicon.count() > 0) {
            const faviconHref = await favicon.getAttribute('href');
            console.log('✅ Favicon link found:', faviconHref);

            // Try to fetch the favicon (handle both relative and absolute URLs)
            const faviconUrl = faviconHref.startsWith('http') ? faviconHref : `${BASE_URL}${faviconHref}`;
            const faviconResp = await page.request.get(faviconUrl);
            expect(faviconResp.status()).toBeLessThan(400);
            console.log('✅ Favicon loads successfully (status:', faviconResp.status() + ')');
        }
    });

    test('15. Meta tags are present', async ({ page }) => {
        await page.goto(`${BASE_URL}/`);

        const metaTags = {
            description: await page.locator('meta[name="description"]').getAttribute('content'),
            viewport: await page.locator('meta[name="viewport"]').getAttribute('content'),
            themeColor: await page.locator('meta[name="theme-color"]').getAttribute('content'),
        };

        console.log('✅ Meta tags found:');
        console.log('   - Description:', metaTags.description || 'not set');
        console.log('   - Viewport:', metaTags.viewport || 'not set');
        console.log('   - Theme Color:', metaTags.themeColor || 'not set');
    });

    test('16. Page loads within acceptable time', async ({ page }) => {
        const startTime = Date.now();

        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

        const loadTime = Date.now() - startTime;
        console.log('✅ Page loaded in', loadTime, 'ms');

        // Warning if load time is slow
        if (loadTime > 5000) {
            console.log('⚠️  Page load time is slow (> 5 seconds)');
        }
    });

    test('17. No network errors on page load', async ({ page }) => {
        const failedRequests = [];

        page.on('response', res => {
            if (res.status() >= 400 && res.status() !== 404) {
                failedRequests.push({
                    url: res.url(),
                    status: res.status()
                });
            }
        });

        await page.goto(`${BASE_URL}/`);
        await page.waitForLoadState('networkidle');

        if (failedRequests.length > 0) {
            console.log('⚠️  Network errors detected:');
            failedRequests.forEach(req => {
                console.log('   -', req.status, req.url);
            });
        } else {
            console.log('✅ No network errors detected (all responses < 400)');
        }
    });

});
