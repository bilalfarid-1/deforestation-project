import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOTS_DIR = 'C:\\Users\\bilal\\Gemeni_Cli\\deforestation-project\\docs\\screenshots';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function capture() {
  console.log('🚀 Launching Chrome to capture live scan results...');
  const tempProfile = path.join(process.env.TEMP || 'C:\\temp', 'chrome_cdp_profile_scan_' + Date.now());
  
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=' + tempProfile,
    '--window-size=1440,1100',
    '--disable-gpu',
    'http://localhost:3000/'
  ]);

  await sleep(3500);

  const listRes = await fetch('http://localhost:9222/json/list');
  const listData = await listRes.json();
  const pageTarget = listData.find(t => t.type === 'page') || listData[0];
  const wsUrl = pageTarget.webSocketDebuggerUrl;

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

  await send('Page.enable');
  await send('Runtime.enable');

  // Inject session
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

  await send('Page.navigate', { url: 'http://localhost:3000/' });
  await sleep(4000);

  // Click 'Run Analysis' button
  console.log('Clicking "Run Analysis" button...');
  await send('Runtime.evaluate', {
    expression: `
      const buttons = Array.from(document.querySelectorAll('button'));
      const runBtn = buttons.find(b => b.textContent.includes('Run Analysis'));
      if (runBtn) {
        runBtn.click();
      }
    `
  });

  // Wait for API response from localhost:5000 and rendering
  console.log('Waiting for live satellite detection API response...');
  await sleep(6000);

  // Capture screenshot of results (scroll down slightly to see logs if needed)
  const res = await send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(res.result.data, 'base64');
  const filePath = path.join(SCREENSHOTS_DIR, '03b_live_scan_detection_result.png');
  fs.writeFileSync(filePath, buffer);
  console.log(`📸 Saved live scan detection screenshot! (${buffer.length} bytes)`);

  ws.close();
  chrome.kill();
  process.exit(0);
}

capture().catch(err => {
  console.error('Error capturing scan result:', err);
  process.exit(1);
});
