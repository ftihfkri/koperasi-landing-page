<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Google Wallet Setup — KOP-SSB</title>
@include('partials.favicon')
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Outfit',sans-serif;background:#0d1a0d;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
  .card{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:36px;max-width:520px;width:100%}
  h1{font-size:20px;font-weight:700;margin-bottom:6px}
  .sub{font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:28px}
  .step{display:flex;gap:14px;margin-bottom:18px}
  .step-num{width:28px;height:28px;border-radius:50%;background:#1a3a4a;border:1px solid #4db6ff;color:#4db6ff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}
  .step-body{font-size:13px;line-height:1.7;color:rgba(255,255,255,0.75)}
  .step-body code{background:rgba(255,255,255,0.08);padding:2px 7px;border-radius:4px;font-family:'JetBrains Mono',monospace;font-size:11.5px;color:#4db6ff}
  .env-block{background:#0a100a;border:1px solid rgba(77,182,255,0.2);border-radius:8px;padding:14px 18px;margin-top:20px;font-family:'JetBrains Mono',monospace;font-size:11.5px;color:#4db6ff;line-height:1.8}
  .back{display:inline-block;margin-top:24px;font-size:12px;color:rgba(255,255,255,0.4);text-decoration:none}
  .back:hover{color:#4db6ff}
</style>
</head>
<body>
<div class="card">
  <div style="font-size:36px;margin-bottom:12px">🟢</div>
  <h1>Google Wallet Setup Required</h1>
  <div class="sub">Add these settings to enable Google Wallet passes.</div>

  <div class="step">
    <div class="step-num">1</div>
    <div class="step-body">Go to <strong>console.cloud.google.com</strong> → Create or select a project → Enable the <strong>Google Wallet API</strong></div>
  </div>
  <div class="step">
    <div class="step-num">2</div>
    <div class="step-body">IAM & Admin → Service Accounts → Create a service account → Add role <strong>Wallet Object Issuer</strong> → Create JSON key → save as <code>storage/app/google-wallet.json</code></div>
  </div>
  <div class="step">
    <div class="step-num">3</div>
    <div class="step-body">Go to <strong>pay.google.com/business/console</strong> → Register as an issuer → Copy your <strong>Issuer ID</strong></div>
  </div>
  <div class="step">
    <div class="step-num">4</div>
    <div class="step-body">Create a <strong>Generic Pass Class</strong> in the console → Copy the Class ID</div>
  </div>
  <div class="step">
    <div class="step-num">5</div>
    <div class="step-body">Add to your <code>.env</code>:</div>
  </div>

  <div class="env-block">
    GOOGLE_WALLET_CREDENTIALS={{ storage_path('app/google-wallet.json') }}<br>
    GOOGLE_WALLET_ISSUER_ID=3388000000012345678<br>
    GOOGLE_WALLET_CLASS_ID=kopssb_membership
  </div>

  <a class="back" href="javascript:history.back()">← Back to shareholding card</a>
</div>
</body>
</html>
