<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Apple Wallet Setup — KOP-SSB</title>
@include('partials.favicon')
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Outfit',sans-serif;background:#0d1a0d;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
  .card{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:36px;max-width:520px;width:100%}
  h1{font-size:20px;font-weight:700;margin-bottom:6px}
  .sub{font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:28px}
  .step{display:flex;gap:14px;margin-bottom:18px}
  .step-num{width:28px;height:28px;border-radius:50%;background:#1a4a1a;border:1px solid #a3e635;color:#a3e635;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}
  .step-body{font-size:13px;line-height:1.7;color:rgba(255,255,255,0.75)}
  .step-body code{background:rgba(255,255,255,0.08);padding:2px 7px;border-radius:4px;font-family:'JetBrains Mono',monospace;font-size:11.5px;color:#a3e635}
  .env-block{background:#0a120a;border:1px solid rgba(163,230,53,0.2);border-radius:8px;padding:14px 18px;margin-top:20px;font-family:'JetBrains Mono',monospace;font-size:11.5px;color:#a3e635;line-height:1.8}
  .back{display:inline-block;margin-top:24px;font-size:12px;color:rgba(255,255,255,0.4);text-decoration:none}
  .back:hover{color:#a3e635}
</style>
</head>
<body>
<div class="card">
  <div style="font-size:36px;margin-bottom:12px">🍎</div>
  <h1>Apple Wallet Setup Required</h1>
  <div class="sub">Add these 4 settings to your .env to enable Apple Wallet passes.</div>

  <div class="step">
    <div class="step-num">1</div>
    <div class="step-body">Sign in to <strong>developer.apple.com</strong> → Certificates, IDs & Profiles → Identifiers → <strong>Pass Type IDs</strong> → Register a new ID (e.g. <code>pass.my.kopssb.membership</code>)</div>
  </div>
  <div class="step">
    <div class="step-num">2</div>
    <div class="step-body">Create a certificate for that Pass Type ID. Export as <code>.p12</code>, then convert:<br>
    <code>openssl pkcs12 -in cert.p12 -out cert.pem -nodes</code></div>
  </div>
  <div class="step">
    <div class="step-num">3</div>
    <div class="step-body">Download Apple WWDR G4 certificate from Apple and convert:<br>
    <code>openssl x509 -inform DER -in AppleWWDRCAG4.cer -out wwdr.pem</code></div>
  </div>
  <div class="step">
    <div class="step-num">4</div>
    <div class="step-body">Add to your <code>.env</code>:</div>
  </div>

  <div class="env-block">
    APPLE_PASS_TYPE_ID=pass.my.kopssb.membership<br>
    APPLE_TEAM_ID=XXXXXXXXXX<br>
    APPLE_CERT_PATH=/absolute/path/to/cert.pem<br>
    APPLE_CERT_PASSWORD=<br>
    APPLE_WWDR_PATH=/absolute/path/to/wwdr.pem
  </div>

  <a class="back" href="javascript:history.back()">← Back to shareholding card</a>
</div>
</body>
</html>
