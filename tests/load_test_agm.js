const http = require('http');

const BASE_URL = 'http://localhost/Koperasi_combine_29_4_26/public';
const MEETING_ID = 2; // From our seeder
const TOKEN = '8053c7fafe8bd532d564ed5baca72e22'; // From our seeder

// Function to authenticate a user and get session cookies
async function loginAndGetCookie(email, password) {
    const loginUrl = `${BASE_URL}/login`;
    
    // First get CSRF cookie
    const getRes = await fetch(loginUrl);
    let cookies = getRes.headers.get('set-cookie') || '';
    
    // Extract XSRF-TOKEN and laravel_session
    const extractCookies = (cookieStr) => {
        return cookieStr.split(',').map(c => c.split(';')[0]).filter(c => c.includes('=')).join('; ');
    };
    
    let currentCookies = extractCookies(cookies);
    
    // Extract CSRF token from HTML
    const html = await getRes.text();
    const tokenMatch = html.match(/name="_token"\s+value="([^"]+)"/);
    const csrfToken = tokenMatch ? tokenMatch[1] : '';

    const postRes = await fetch(loginUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': currentCookies
        },
        body: new URLSearchParams({
            '_token': csrfToken,
            'email': email,
            'password': password
        }),
        redirect: 'manual'
    });

    const newCookies = postRes.headers.get('set-cookie');
    if (newCookies) {
        currentCookies = extractCookies(newCookies);
    }
    
    return { cookies: currentCookies, csrfToken };
}

async function runLoadTest() {
    console.log('--- STARTING KOP-SSB AGM LOAD TEST ---');
    console.log('Preparing 500 simultaneous attendance requests...\n');

    // 1. Prepare Admin session for manual attendance (250 requests)
    console.log('Authenticating Admin for manual attendance...');
    const adminSession = await loginAndGetCookie('admin_loadtest@gmail.com', 'Fatih1234');
    
    const manualPromises = [];
    console.log('Building 250 manual attendance requests...');
    for (let i = 1; i <= 250; i++) {
        // User IDs 1 to 250 (assuming LT Member 1-250)
        // Wait, User IDs might not start at 1. We should fetch them or assume they are created recently.
        // Let's just assume the 500 users are the most recent 500. We can do a quick check via Admin API.
    }
}

runLoadTest();
