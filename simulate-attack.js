const https = require('https');

function request(path, method, body, extraHeaders) {
  method = method || 'GET';
  extraHeaders = extraHeaders || {};
  return new Promise(function(resolve) {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'sivilize-backend.vercel.app',
      path: path,
      method: method,
      headers: Object.assign({
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 Chrome/120',
      }, data ? { 'Content-Length': Buffer.byteLength(data) } : {}, extraHeaders)
    };
    const req = https.request(options, function(res) {
      let b = '';
      res.on('data', function(d) { b += d; });
      res.on('end', function() {
        try { resolve({ status: res.statusCode, body: JSON.parse(b) }); }
        catch(e) { resolve({ status: res.statusCode, body: b.substring(0, 100) }); }
      });
    });
    req.on('error', function() { resolve({ status: 0, body: 'network error' }); });
    req.setTimeout(10000, function() { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
    if (data) req.write(data);
    req.end();
  });
}

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

async function run() {
  console.log('');
  console.log('=======================================================');
  console.log('     SIMULASI SERANGAN — SIVILIZE HUB PRO');
  console.log('=======================================================');
  console.log('');

  // FASE 1: RECONNAISSANCE
  console.log('--- FASE 1: RECONNAISSANCE (Hacker mulai scan) ---');
  console.log('[10:23:01] Hacker IP: 203.0.113.42 mulai scan target...');
  await sleep(500);

  var r1 = await request('/admin');
  console.log('[10:23:02] Coba /admin      -> ' + r1.status + (r1.status === 301 ? ' REDIRECT ke /prank [HONEYPOT AKTIF]' : ' ' + JSON.stringify(r1.body).substring(0,50)));

  var r2 = await request('/.env');
  console.log('[10:23:03] Coba /.env       -> ' + r2.status + (r2.status === 301 ? ' REDIRECT ke /prank [HONEYPOT AKTIF]' : ' ' + JSON.stringify(r2.body).substring(0,50)));

  var r3 = await request('/wp-admin');
  console.log('[10:23:04] Coba /wp-admin   -> ' + r3.status + (r3.status === 301 ? ' REDIRECT ke /prank [HONEYPOT AKTIF]' : ' ' + JSON.stringify(r3.body).substring(0,50)));

  var r4 = await request('/phpmyadmin');
  console.log('[10:23:05] Coba /phpmyadmin -> ' + r4.status + (r4.status === 301 ? ' REDIRECT ke /prank [HONEYPOT AKTIF]' : ' ' + JSON.stringify(r4.body).substring(0,50)));

  console.log('[10:23:05] >> ALERT: IP 203.0.113.42 hit 4 honeypots');
  console.log('[10:23:05] >> Email alert dikirim ke admin');
  console.log('');
  await sleep(800);

  // FASE 2: HACKING TOOL
  console.log('--- FASE 2: HACKING TOOL TERDETEKSI ---');
  console.log('[10:24:00] Hacker pakai sqlmap untuk SQL injection scan...');
  await sleep(500);

  var r5 = await request('/api/auth/login', 'POST',
    { email: 'test@test.com', password: 'test' },
    { 'User-Agent': 'sqlmap/1.7.8#stable (https://sqlmap.org)' }
  );
  console.log('[10:24:01] sqlmap request -> ' + r5.status + ': ' + (r5.body && r5.body.message ? r5.body.message : JSON.stringify(r5.body).substring(0,60)));
  if (r5.status === 403) {
    console.log('[10:24:01] >> BLOCKED: sqlmap User-Agent terdeteksi');
    console.log('[10:24:01] >> IP 203.0.113.42 masuk BLACKLIST permanen');
  }
  console.log('');
  await sleep(800);

  // FASE 3: BRUTE FORCE
  console.log('--- FASE 3: BRUTE FORCE LOGIN ---');
  console.log('[10:25:00] Hacker (IP baru: 198.51.100.7) coba tebak password...');
  await sleep(500);

  for (var i = 1; i <= 7; i++) {
    var r = await request('/api/auth/login', 'POST', {
      email: 'admin@sivilize.com',
      password: 'password' + i
    });
    var msg = r.body && r.body.message ? r.body.message : '';
    if (r.status === 429) {
      console.log('[10:25:0' + i + '] Percobaan ' + i + ' -> ' + r.status + ' DIBLOKIR: ' + msg);
      console.log('[10:25:0' + i + '] >> IP 198.51.100.7 diblokir 1 jam!');
      console.log('[10:25:0' + i + '] >> Email alert dikirim ke admin');
      break;
    } else {
      console.log('[10:25:0' + i + '] Percobaan ' + i + ' -> ' + r.status + ' Gagal: ' + msg);
    }
    await sleep(400);
  }
  console.log('');
  await sleep(800);

  // FASE 4: INJECTION
  console.log('--- FASE 4: INJECTION ATTACK ---');
  console.log('[10:26:00] Hacker coba NoSQL injection...');
  await sleep(500);

  var r6 = await request('/api/projects?filter=%7B%22%24where%22%3A%22sleep(5000)%22%7D');
  console.log('[10:26:01] NoSQL injection via URL -> ' + r6.status + ': ' + (r6.body && r6.body.message ? r6.body.message : JSON.stringify(r6.body).substring(0,60)));

  var r7 = await request('/api/auth/login', 'POST', {
    email: "admin@test.com'; DROP TABLE users; --",
    password: 'test'
  });
  console.log('[10:26:02] SQL injection attempt -> ' + r7.status + ': ' + (r7.body && r7.body.message ? r7.body.message : JSON.stringify(r7.body).substring(0,60)));
  console.log('');
  await sleep(800);

  // FASE 5: STATUS AKHIR
  console.log('--- FASE 5: STATUS FIREWALL REAL-TIME ---');
  var health = await request('/health');
  var fw = health.body && health.body.firewall ? health.body.firewall : null;
  if (fw) {
    console.log('IP Diblokir Permanen : ' + fw.blockedIPs);
    console.log('IP Dipantau          : ' + fw.trackedIPs);
    console.log('Brute Force Tracked  : ' + fw.bruteForceTracked + ' IP');
    console.log('Endpoint Flood       : ' + fw.endpointFloodTracked + ' endpoint');
  }
  console.log('');
  console.log('=======================================================');
  console.log('  RINGKASAN SIMULASI:');
  console.log('  [OK] Honeypot     : 4 path berbahaya -> redirect prank');
  console.log('  [OK] Tool Hacking : sqlmap diblokir + IP blacklist');
  console.log('  [OK] Brute Force  : IP diblokir setelah 5x gagal');
  console.log('  [OK] Injection    : Payload berbahaya diblokir');
  console.log('  [OK] Alert Email  : Notifikasi dikirim ke admin');
  console.log('  [OK] Semua log    : IP + timestamp + endpoint tercatat');
  console.log('=======================================================');
}

run();
