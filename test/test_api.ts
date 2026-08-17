/**
 * GreenGuard 2.0 - Comprehensive End-to-End API Test Suite
 * Tests every backend endpoint against the running server.
 */

import { PendingUser, User } from '../src/models/index.js';

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('===============================================================');
  console.log('🧪 Starting GreenGuard 2.0 Backend End-to-End API Verification');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Health check
  await test('GET / - Server Status & Info', async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'online') throw new Error('Status is not online');
  });

  // 2. Health endpoint
  await test('GET /api/health - Service Health Check', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'healthy') throw new Error('Status is not healthy');
  });

  // 3. Auth Flow
  const testEmail = `test_analyst_${Date.now()}@greenguard.org`;
  let authToken = '';

  await test('POST /api/auth/signup - Register New User', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Tariq Test',
        email: testEmail,
        password: 'Password123!',
        organization: 'WWF Pakistan'
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `Status ${res.status}`);
    }
    const data = await res.json();
    if (!data.success) throw new Error('Signup was not successful');
  });

  await test('POST /api/auth/verify-otp - Activate Account', async () => {
    const pending = await PendingUser.findOne({ where: { email: testEmail } });
    if (!pending) throw new Error('Pending user record not found');
    const otpValue = pending.otp || pending.get('otp') as string;

    const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        otp: String(otpValue)
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `Status ${res.status}`);
    }
    const data = await res.json();
    if (!data.token) throw new Error('Token not returned');
    authToken = data.token;
  });

  await test('POST /api/auth/signin - Authenticate User', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123!'
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `Status ${res.status}`);
    }
    const data = await res.json();
    if (!data.token) throw new Error('Sign in failed');
  });

  // 4. Live Satellite Analysis (The core engine for waniah321/green-guard Dashboard)
  let analysisOutput: any = null;

  await test('POST /api/reports/analyze - Live Deforestation Detection', async () => {
    const res = await fetch(`${BASE_URL}/api/reports/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startYear: 2020,
        startPeriod: 'Jan-Mar',
        endYear: 2024,
        endPeriod: 'Oct-Dec',
        aoiName: 'Margalla Hills AOI',
        coordinates: [
          [33.725, 72.85],
          [33.805, 73.02],
          [33.818, 73.12],
          [33.75, 73.15],
          [33.71, 72.88]
        ]
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'success') throw new Error('Analysis status is not success');
    if (!data.before_image || !data.after_image || !data.overlay_image) {
      throw new Error('Bi-temporal images missing from analysis result');
    }
    if (!Array.isArray(data.logs) || data.logs.length === 0) {
      throw new Error('Sector detection logs missing');
    }
    console.log(`   📊 Deforested Area: ${data.deforestedArea} km² (${data.deforestationPercent}%) | Confidence: ${data.confidence * 100}%`);
    console.log(`   🌲 Sub-Sector Logs Generated: ${data.logs.length} sectors`);
    analysisOutput = data;
  });

  // 5. Save Report & Fetch History
  await test('POST /api/reports - Save Analysis to Database', async () => {
    const res = await fetch(`${BASE_URL}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        ...analysisOutput,
        name: 'Margalla Hills Automated Audit 2020-2024'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('Report save failed');
  });

  await test('GET /api/reports - Retrieve History Scans', async () => {
    const res = await fetch(`${BASE_URL}/api/reports`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.reports) || data.reports.length === 0) {
      throw new Error('Reports array is empty');
    }
  });

  // 6. News Search & Multidimensional Filtering
  await test('GET /api/news - Search & Category Filter', async () => {
    const res = await fetch(`${BASE_URL}/api/news?q=Sentinel&category=Satellite+Monitoring`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.articles)) {
      throw new Error('News query failed');
    }
    console.log(`   📰 Articles Found: ${data.articles.length} articles`);
  });

  // 7. Community Discussions & Upvotes
  let communityPostId: number | null = null;

  await test('POST /api/community/posts - Create Discussion', async () => {
    const res = await fetch(`${BASE_URL}/api/community/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        author: 'Dr. Tariq Mahmood',
        role: 'Conservation Biologist',
        title: 'Drone Verification of Pine Canopy Losses in MGH-422',
        category: 'Forest Protection',
        content: 'Ground survey confirmed the 22% canopy degradation detected by Sentinel-2.',
        location: 'Margalla Hills Sector MGH-422'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('Create discussion failed');
    communityPostId = data.post.id || data.post.get?.('id');
  });

  await test('POST /api/community/posts/:id/upvote - Upvote Discussion', async () => {
    if (!communityPostId) throw new Error('No post ID to upvote');
    const res = await fetch(`${BASE_URL}/api/community/posts/${communityPostId}/upvote`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || (data.upvotes !== 1 && data.post?.upvotes !== 1)) {
      throw new Error('Upvote increment failed');
    }
  });

  // 8. Official Complaint Email Dispatch
  await test('POST /api/send-complaint - Official Authority Notice Dispatch', async () => {
    const res = await fetch(`${BASE_URL}/api/send-complaint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderName: 'Tariq Mahmood',
        senderEmail: 'tariq.mahmood@example.com',
        complaintMessage: 'Urgent: Illegal commercial timber cutting detected in Sector MGH-422.',
        attachedReport: {
          name: 'Margalla Hills Canopy Delta Report',
          date: '14 Oct 2024',
          regionId: 'MGH-422',
          status: 'Critical',
          areaMonitored: '520.8 km²',
          forestPercentage: 78,
          deforestedPercentage: 22,
          summary: 'Multi-spectral Sentinel analysis detected 22% canopy degradation.'
        }
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('Complaint email dispatch failed');
  });

  console.log('===============================================================');
  console.log(`🎯 Test Run Completed: ${passed} Passed, ${failed} Failed`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
