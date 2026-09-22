import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOTS_DIR = 'C:\\Users\\bilal\\Gemeni_Cli\\deforestation-project\\docs\\screenshots';

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function capture() {
  console.log('🚀 Starting Chrome in remote debugging mode...');
  const tempProfile = path.join(process.env.TEMP || 'C:\\temp', 'chrome_cdp_profile_' + Date.now());
  
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=' + tempProfile,
    '--window-size=1440,900',
    '--disable-gpu',
    'http://localhost:3000/signin'
  ]);

  await sleep(3500);

  // Get Page WebSocket URL
  const listRes = await fetch('http://localhost:9222/json/list');
  const listData = await listRes.json();
  const pageTarget = listData.find(t => t.type === 'page') || listData[0];
  const wsUrl = pageTarget.webSocketDebuggerUrl;
  console.log('🔗 Connected to Chrome Page Target:', wsUrl);

  const ws = new WebSocket(wsUrl);

  let id = 1;
  const callbacks = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg);
      callbacks.delete(msg.id);
    }
  };

  await new Promise((resolve) => ws.onopen = resolve);

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      callbacks.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  // Enable Page domain
  await send('Page.enable');
  await send('Runtime.enable');

  // Helper to take screenshot of current page
  async function snap(filename, waitMs = 3000) {
    await sleep(waitMs);
    const res = await send('Page.captureScreenshot', { format: 'png' });
    if (!res || !res.result || !res.result.data) {
      console.error('Failed response for screenshot:', res);
      return;
    }
    const buffer = Buffer.from(res.result.data, 'base64');
    const filePath = path.join(SCREENSHOTS_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    console.log(`📸 Saved screenshot: ${filename} (${buffer.length} bytes)`);
  }

  // 1. Sign In Page
  console.log('Capturing Sign In page...');
  await snap('01_signin_page.png', 2500);

  // 2. Sign Up Page
  console.log('Capturing Sign Up page...');
  await send('Page.navigate', { url: 'http://localhost:3000/signup' });
  await snap('02_signup_page.png', 3000);

  // 3. Inject User Session into localStorage to unlock Dashboard
  console.log('Injecting session into localStorage...');
  await send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('token', 'mock_jwt_token_analyst');
      localStorage.setItem('currentUser', JSON.stringify({
        id: 1,
        name: 'Bilal Farid',
        email: 'bilal.farid@greenguard.org',
        role: 'Lead Backend & AI Geospatial Engineer',
        organization: 'GreenGuard Environmental Systems'
      }));
    `
  });

  // 4. Dashboard (Analysis Map & Controls)
  console.log('Capturing Dashboard page...');
  await send('Page.navigate', { url: 'http://localhost:3000/' });
  await snap('03_dashboard_analysis.png', 4500);

  // 5. Analysis History Page
  console.log('Capturing History page...');
  await send('Page.navigate', { url: 'http://localhost:3000/history' });
  await snap('04_history_reports.png', 3500);

  // 6. News & Environmental Articles
  console.log('Capturing News page...');
  await send('Page.navigate', { url: 'http://localhost:3000/news' });
  await snap('05_news_portal.png', 3500);

  // 7. Community Watchdog Hub
  console.log('Capturing Community page...');
  await send('Page.navigate', { url: 'http://localhost:3000/community' });
  await snap('06_community_hub.png', 3500);

  // 8. Contact & Complaint Dispatcher
  console.log('Capturing Complaint / Contact page...');
  await send('Page.navigate', { url: 'http://localhost:3000/contact' });
  await snap('07_contact_complaint.png', 3500);

  ws.close();
  chrome.kill();
  console.log('🎉 All 7 real screenshots captured successfully!');
  process.exit(0);
}

capture().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
