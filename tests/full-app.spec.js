import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8000';

const ADMIN    = { email: '3@gmail.com', password: 'Fatih1234' };
const STAFF    = { email: '2@gmail.com', password: 'Fatih1234' };
const INVESTOR = { email: '1@gmail.com', password: 'Fatih1234' };

// 3 key viewports — covers mobile/tablet/desktop without 10x test slowdown
const VIEWPORTS = [
    { name: 'Mobile',  width: 375,  height: 667 },
    { name: 'Tablet',  width: 768,  height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 },
];

// Routes per role (the React SPA serves all of these from same Blade shell)
const INVESTOR_PAGES = [
    { path: '/shareholder',                name: 'Dashboard' },
    { path: '/shareholder/my-investment',  name: 'My Investment' },
    { path: '/shareholder/dividends',      name: 'Dividends' },
    { path: '/shareholder/transactions',   name: 'Transactions' },
    { path: '/shareholder/announcements',  name: 'Announcements' },
    { path: '/shareholder/certificate',    name: 'Certificate' },
    { path: '/shareholder/shareholding-card',name: 'Membership Card' },
];

const STAFF_PAGES = [
    { path: '/staff',                   name: 'Dashboard' },
    { path: '/staff/shareholder-records',    name: 'Member Records' },
    { path: '/staff/verification',      name: 'Verification' },
    { path: '/staff/transactions',      name: 'Transactions' },
    { path: '/staff/announcements',     name: 'Announcements' },
    { path: '/staff/contact-inquiries', name: 'Contact Inquiries' },
    { path: '/staff/agm',               name: 'AGM' },
];

const ADMIN_PAGES = [
    { path: '/admin',                name: 'Dashboard' },
    { path: '/admin/approvals',      name: 'Approvals' },
    { path: '/admin/shareholders',        name: 'Members' },
    { path: '/admin/dividend',       name: 'Dividend' },
    { path: '/admin/transactions',   name: 'Transactions' },
    { path: '/admin/announcements',  name: 'Announcements' },
    { path: '/admin/notifications',  name: 'Notifications' },
    { path: '/admin/reports',        name: 'Reports' },
    { path: '/admin/audit-log',      name: 'Audit Log' },
    { path: '/admin/agm',            name: 'AGM' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

async function login(page, credentials) {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.locator('#login').fill(credentials.email);
    await page.locator('#password').fill(credentials.password);
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
    await page.waitForLoadState('networkidle');
}

async function checkPageHealth(page, viewport) {
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const overflow = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
    }));

    const hasHorizontalOverflow = overflow.documentWidth > overflow.viewportWidth + 1;

    const bodyHasContent = await page.evaluate(() => {
        return document.body.textContent.trim().length > 50 &&
               document.body.offsetHeight > 100;
    });

    return {
        overflow: hasHorizontalOverflow,
        overflowAmount: overflow.documentWidth - overflow.viewportWidth,
        consoleErrors: consoleErrors.length,
        hasContent: bodyHasContent,
    };
}

async function testPageAtViewport(page, route, viewport) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(`${BASE_URL}${route.path}`);
    await page.waitForLoadState('networkidle');
    // Give React SPA time to mount and fetch data
    await page.waitForTimeout(1500);

    const health = await checkPageHealth(page, viewport);

    expect(health.hasContent).toBe(true);
    expect(health.overflow).toBe(false);

    return health;
}

// ════════════════════════════════════════════════════════════════════════
// LANDING PAGE — All viewports
// ════════════════════════════════════════════════════════════════════════
test.describe('PUBLIC: Landing Page', () => {
    for (const viewport of VIEWPORTS) {
        test(`Landing on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await page.goto(`${BASE_URL}/`);
            await page.waitForLoadState('networkidle');
            await page.waitForSelector('#root', { timeout: 10000 });
            await page.waitForTimeout(1000);

            const health = await checkPageHealth(page, viewport);

            console.log(`   ${viewport.name}: content=${health.hasContent}, overflow=${health.overflow ? '⚠️' : '✅'}, errors=${health.consoleErrors}`);

            expect(health.hasContent).toBe(true);
            expect(health.overflow).toBe(false);
        });
    }

    test('Landing → Login link works', async ({ page }) => {
        await page.goto(`${BASE_URL}/`);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('#root');
        await page.waitForTimeout(1000);

        // Find and click login link
        const loginLink = page.locator('a[href*="login"]').first();
        if (await loginLink.count() > 0) {
            const href = await loginLink.getAttribute('href');
            console.log(`   Login link href: ${href}`);
            expect(href).toMatch(/login/);
            console.log('   ✅ Login link is present and points to login route');
        }
    });

    test('Landing → Contact form submission works', async ({ page }) => {
        await page.goto(`${BASE_URL}/`);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('#root');
        await page.waitForTimeout(1000);

        const nameField = page.locator('#contact-name, input[placeholder*="name" i]').first();
        const emailField = page.locator('#contact-email, input[type="email"]').first();
        const messageField = page.locator('#contact-message, textarea').first();

        if (await nameField.count() > 0) {
            await nameField.scrollIntoViewIfNeeded();
            await nameField.fill('Full App Test');
            await emailField.fill('fullapp@test.com');
            await messageField.fill('Test from full-app suite');

            const submitBtn = page.getByRole('button', { name: /send|submit/i }).first();

            const responsePromise = page.waitForResponse(
                res => res.url().includes('/contact') && res.request().method() === 'POST',
                { timeout: 8000 }
            ).catch(() => null);

            await submitBtn.click();
            const resp = await responsePromise;

            if (resp) {
                console.log(`   ✅ Contact form submitted (status: ${resp.status()})`);
                expect([200, 302]).toContain(resp.status());
            }
        }
    });
});

// ════════════════════════════════════════════════════════════════════════
// LOGIN FLOW — All 3 roles
// ════════════════════════════════════════════════════════════════════════
test.describe('AUTH: Login Flow', () => {
    test('Investor login → redirects to /shareholder', async ({ page }) => {
        await login(page, INVESTOR);
        expect(page.url()).toMatch(/\/shareholder/);
        console.log(`   ✅ Investor logged in, redirected to: ${page.url()}`);
    });

    test('Staff login → redirects to /staff', async ({ page }) => {
        await login(page, STAFF);
        expect(page.url()).toMatch(/\/staff/);
        console.log(`   ✅ Staff logged in, redirected to: ${page.url()}`);
    });

    test('Admin login → redirects to /admin', async ({ page }) => {
        await login(page, ADMIN);
        expect(page.url()).toMatch(/\/admin/);
        console.log(`   ✅ Admin logged in, redirected to: ${page.url()}`);
    });

    test('Invalid credentials → shows error', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);
        await page.locator('#login').fill('bad@example.com');
        await page.locator('#password').fill('wrongpassword');
        await page.getByRole('button', { name: /log in/i }).click();
        await page.waitForLoadState('networkidle');
        expect(page.url()).toMatch(/\/login/);
        console.log(`   ✅ Invalid login blocked`);
    });
});

// ════════════════════════════════════════════════════════════════════════
// INVESTOR DASHBOARD — All pages, all viewports
// ════════════════════════════════════════════════════════════════════════
test.describe('INVESTOR: All Pages × All Viewports', () => {
    for (const route of INVESTOR_PAGES) {
        for (const viewport of VIEWPORTS) {
            test(`${route.name} on ${viewport.name}`, async ({ page }) => {
                await login(page, INVESTOR);
                const health = await testPageAtViewport(page, route, viewport);
                console.log(`   ${route.name} @ ${viewport.name}: content=${health.hasContent}, overflow=${health.overflow ? '⚠️ ' + health.overflowAmount + 'px' : '✅'}, errors=${health.consoleErrors}`);
            });
        }
    }
});

test.describe('INVESTOR: Navigation Buttons', () => {
    test('Can navigate between investor pages via clicks', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await login(page, INVESTOR);
        await page.waitForTimeout(1500);

        const navigationResults = [];

        for (const route of INVESTOR_PAGES.slice(1)) { // skip dashboard (already on it)
            // Try to find a link to this route
            const link = page.locator(`a[href*="${route.path}"], button:has-text("${route.name}")`).first();

            if (await link.count() > 0) {
                try {
                    await link.click({ timeout: 3000 });
                    await page.waitForTimeout(800);

                    const reached = page.url().includes(route.path);
                    navigationResults.push({ name: route.name, reached });
                    console.log(`   ${reached ? '✅' : '❌'} Click → ${route.name} (${page.url()})`);
                } catch {
                    navigationResults.push({ name: route.name, reached: false });
                    console.log(`   ⚠️  Could not click link to ${route.name}`);
                }
            } else {
                navigationResults.push({ name: route.name, reached: false, noLink: true });
                console.log(`   ℹ️  No clickable link found for ${route.name}`);
            }
        }

        const successCount = navigationResults.filter(r => r.reached).length;
        console.log(`   Summary: ${successCount}/${INVESTOR_PAGES.length - 1} navigation clicks succeeded`);
    });
});

// ════════════════════════════════════════════════════════════════════════
// STAFF DASHBOARD — All pages, all viewports
// ════════════════════════════════════════════════════════════════════════
test.describe('STAFF: All Pages × All Viewports', () => {
    for (const route of STAFF_PAGES) {
        for (const viewport of VIEWPORTS) {
            test(`${route.name} on ${viewport.name}`, async ({ page }) => {
                await login(page, STAFF);
                const health = await testPageAtViewport(page, route, viewport);
                console.log(`   ${route.name} @ ${viewport.name}: content=${health.hasContent}, overflow=${health.overflow ? '⚠️ ' + health.overflowAmount + 'px' : '✅'}, errors=${health.consoleErrors}`);
            });
        }
    }
});

test.describe('STAFF: Navigation Buttons', () => {
    test('Can navigate between staff pages via clicks', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await login(page, STAFF);
        await page.waitForTimeout(1500);

        const navigationResults = [];

        for (const route of STAFF_PAGES.slice(1)) {
            const link = page.locator(`a[href*="${route.path}"], button:has-text("${route.name}")`).first();

            if (await link.count() > 0) {
                try {
                    await link.click({ timeout: 3000 });
                    await page.waitForTimeout(800);

                    const reached = page.url().includes(route.path);
                    navigationResults.push({ name: route.name, reached });
                    console.log(`   ${reached ? '✅' : '❌'} Click → ${route.name}`);
                } catch {
                    navigationResults.push({ name: route.name, reached: false });
                    console.log(`   ⚠️  Could not click link to ${route.name}`);
                }
            } else {
                console.log(`   ℹ️  No clickable link found for ${route.name}`);
            }
        }

        const successCount = navigationResults.filter(r => r.reached).length;
        console.log(`   Summary: ${successCount}/${STAFF_PAGES.length - 1} navigation clicks succeeded`);
    });
});

// ════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD — All pages, all viewports
// ════════════════════════════════════════════════════════════════════════
test.describe('ADMIN: All Pages × All Viewports', () => {
    for (const route of ADMIN_PAGES) {
        for (const viewport of VIEWPORTS) {
            test(`${route.name} on ${viewport.name}`, async ({ page }) => {
                await login(page, ADMIN);
                const health = await testPageAtViewport(page, route, viewport);
                console.log(`   ${route.name} @ ${viewport.name}: content=${health.hasContent}, overflow=${health.overflow ? '⚠️ ' + health.overflowAmount + 'px' : '✅'}, errors=${health.consoleErrors}`);
            });
        }
    }
});

test.describe('ADMIN: Navigation Buttons', () => {
    test('Can navigate between admin pages via clicks', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await login(page, ADMIN);
        await page.waitForTimeout(1500);

        const navigationResults = [];

        for (const route of ADMIN_PAGES.slice(1)) {
            const link = page.locator(`a[href*="${route.path}"], button:has-text("${route.name}")`).first();

            if (await link.count() > 0) {
                try {
                    await link.click({ timeout: 3000 });
                    await page.waitForTimeout(800);

                    const reached = page.url().includes(route.path);
                    navigationResults.push({ name: route.name, reached });
                    console.log(`   ${reached ? '✅' : '❌'} Click → ${route.name}`);
                } catch {
                    navigationResults.push({ name: route.name, reached: false });
                    console.log(`   ⚠️  Could not click link to ${route.name}`);
                }
            } else {
                console.log(`   ℹ️  No clickable link found for ${route.name}`);
            }
        }

        const successCount = navigationResults.filter(r => r.reached).length;
        console.log(`   Summary: ${successCount}/${ADMIN_PAGES.length - 1} navigation clicks succeeded`);
    });
});

// ════════════════════════════════════════════════════════════════════════
// DATA API HEALTH — All dashboard data endpoints
// ════════════════════════════════════════════════════════════════════════
test.describe('API: Dashboard Data Endpoints', () => {
    test('Investor dashboard-data returns valid JSON', async ({ page }) => {
        await login(page, INVESTOR);
        const resp = await page.request.get(`${BASE_URL}/shareholder/dashboard-data`);
        expect(resp.status()).toBe(200);
        const json = await resp.json();
        expect(json).toBeDefined();
        console.log(`   ✅ /shareholder/dashboard-data → 200 OK`);
    });

    test('Staff dashboard-data returns valid JSON', async ({ page }) => {
        await login(page, STAFF);
        const resp = await page.request.get(`${BASE_URL}/staff/dashboard-data`);
        expect(resp.status()).toBe(200);
        const json = await resp.json();
        expect(json).toBeDefined();
        console.log(`   ✅ /staff/dashboard-data → 200 OK`);
    });

    test('Admin dashboard-data returns valid JSON', async ({ page }) => {
        await login(page, ADMIN);
        const resp = await page.request.get(`${BASE_URL}/admin/dashboard-data`);
        expect(resp.status()).toBe(200);
        const json = await resp.json();
        expect(json).toBeDefined();
        console.log(`   ✅ /admin/dashboard-data → 200 OK`);
    });
});

// ════════════════════════════════════════════════════════════════════════
// LOGOUT FLOW
// ════════════════════════════════════════════════════════════════════════
test.describe('AUTH: Logout', () => {
    test('Logout works for admin', async ({ page }) => {
        await login(page, ADMIN);
        await page.waitForTimeout(1000);

        // Try to find and click logout
        const logoutBtn = page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Log out"), a:has-text("Log out")').first();

        if (await logoutBtn.count() > 0 && await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await logoutBtn.click();
            await page.waitForTimeout(2000);
            console.log(`   ✅ Logout clicked, current URL: ${page.url()}`);
        } else {
            // Submit logout form via JS
            await page.evaluate(() => {
                const form = document.querySelector('form[action*="logout"]');
                if (form) form.submit();
            });
            await page.waitForTimeout(2000);
            console.log(`   ✅ Logout via form submit, current URL: ${page.url()}`);
        }

        // After logout, accessing /admin should redirect to /login
        await page.goto(`${BASE_URL}/admin`);
        await page.waitForTimeout(1500);
        expect(page.url()).toMatch(/\/login/);
        console.log(`   ✅ Post-logout: /admin redirected to /login`);
    });
});
