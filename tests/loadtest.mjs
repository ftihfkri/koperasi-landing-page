import fs from 'fs';

const BASE_URL = 'http://localhost/Koperasi_combine_29_4_26/public';
const MEETING_ID = 2; // the meeting created by seeder
const QR_TOKEN = '8053c7fafe8bd532d564ed5baca72e22';

// Utility to parse cookies
function extractCookies(cookieHeader) {
    if (!cookieHeader) return '';
    // Handle multiple Set-Cookie headers correctly
    const cookies = Array.isArray(cookieHeader) ? cookieHeader : cookieHeader.split(/,(?=\s*[a-zA-Z0-9_-]+\=)/);
    return cookies.map(c => c.split(';')[0]).join('; ');
}

// Function to login and return cookie string and csrf token
async function login(email, password) {
    // 1. Get login page for CSRF token and initial session cookie
    const getRes = await fetch(`${BASE_URL}/login`);
    const html = await getRes.text();
    const tokenMatch = html.match(/name="_token"\s+value="([^"]+)"/);
    const csrfToken = tokenMatch ? tokenMatch[1] : '';
    
    let cookies = extractCookies(getRes.headers.get('set-cookie'));

    // 2. Post login
    const params = new URLSearchParams();
    params.append('_token', csrfToken);
    params.append('email', email);
    params.append('password', password);

    const postRes = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': cookies
        },
        body: params,
        redirect: 'manual'
    });

    const newCookies = extractCookies(postRes.headers.get('set-cookie'));
    if (newCookies) cookies = newCookies;

    return { cookies, csrfToken };
}

async function run() {
    console.log('--- STARTING NODE.JS LOAD TEST ---');
    console.log('Authenticating Admin...');
    
    const adminAuth = await login('admin_loadtest@gmail.com', 'Fatih1234');
    if (!adminAuth.cookies.includes('kop_ssb_session')) {
        console.error('Admin login failed.');
        return;
    }
    console.log('Admin authenticated.');

    console.log('Authenticating 500 members... (this takes ~10 seconds)');
    const memberAuths = [];
    
    // We login 500 members sequentially or in chunks
    const chunk = 50;
    for (let i = 1; i <= 500; i += chunk) {
        const promises = [];
        for (let j = 0; j < chunk; j++) {
            const memberNum = i + j;
            if (memberNum > 500) break;
            promises.push(
                login(`lt_member${memberNum}@example.com`, 'password123')
                    .then(auth => ({ id: memberNum, ...auth }))
            );
        }
        const results = await Promise.all(promises);
        memberAuths.push(...results);
        console.log(`  Authenticated ${Math.min(i + chunk - 1, 500)} members...`);
    }

    console.log('FIRING 500 CONCURRENT REQUESTS (250 Manual via Admin, 250 Scanned via Members)...');
    
    // Read generated test data
    const testData = JSON.parse(fs.readFileSync('tests/test_data.json', 'utf8'));
    const meetingId = testData.meeting_id;
    const qrToken = testData.qr_token;
    const users = testData.users;

    const startTime = Date.now();
    const requests = [];

    // 1. Prepare 1 Manual Attendances (Admin marks members 0 to 0)
    for (let i = 0; i < 1; i++) {
        const userId = users[i].id;
        // The admin manual attend POST uses JSON body in our backend! Actually it uses form data but accepts JSON too.
        requests.push(
            fetch(`${BASE_URL}/admin/agm/${meetingId}/manual-attend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': adminAuth.cookies,
                    'X-CSRF-TOKEN': adminAuth.csrfToken // assuming CSRF might be enforced
                },
                body: JSON.stringify({
                    _token: adminAuth.csrfToken,
                    user_id: userId
                }),
                redirect: 'manual'
            }).then(async r => ({ type: 'manual', status: r.status, body: await r.text() }))
        );
    }

    // 2. Prepare 1 Scanned Attendances (Members 250 to 250 scan the QR token)
    for (let i = 250; i < 251; i++) {
        const memberAuth = memberAuths[i - 250]; // memberAuths array has 500, we just use the matching one
        if (!memberAuth) continue;
        
        requests.push(
            fetch(`${BASE_URL}/attend/${qrToken}`, {
                method: 'GET',
                headers: {
                    'Cookie': memberAuth.cookies
                },
                redirect: 'manual'
            }).then(async r => ({ type: 'scan', status: r.status, body: await r.text() }))
        );
    }

    // Fire all concurrently
    const responses = await Promise.all(requests);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    let manualSuccess = 0;
    let manualFail = 0;
    let scanSuccess = 0;
    let scanFail = 0;

    let firstManualError = null;
    let firstScanError = null;

    for (const r of responses) {
        if (r.type === 'manual') {
            if (r.status === 200) manualSuccess++; else {
                manualFail++;
                if (!firstManualError) firstManualError = r;
            }
        } else {
            if (r.status === 200) scanSuccess++; else {
                scanFail++;
                if (!firstScanError) firstScanError = r;
            }
        }
    }

    console.log(`\nRequests completed in ${duration} seconds.`);
    console.log(`Manual Attendance: ${manualSuccess} Succeeded, ${manualFail} Failed.`);
    console.log(`Scanned Attendance: ${scanSuccess} Succeeded, ${scanFail} Failed.`);
    
    if (firstManualError) console.log("First Manual Error Status: ", firstManualError.status, firstManualError.body);
    if (firstScanError) console.log("First Scan Error Status: ", firstScanError.status, firstScanError.body);
}

run();
