<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body{font-family:Arial,sans-serif;color:#222;background:#f5f5f5;margin:0;padding:0}
.wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)}
.header{background:#1a4a1a;padding:28px 32px;text-align:center}
.header img{height:60px}
.header h1{color:#fff;font-size:20px;margin:12px 0 0}
.body{padding:32px}
.body p{line-height:1.7;margin:0 0 16px}
.badge{display:inline-block;background:#d4f4e0;color:#1a5c1a;border:1px solid #6fcf97;border-radius:20px;padding:4px 14px;font-weight:700;font-size:13px;margin-bottom:20px}
.detail-box{background:#f5faf4;border-left:4px solid #2d6a2d;border-radius:0 8px 8px 0;padding:14px 18px;margin:20px 0;font-size:14px}
.detail-box strong{display:block;margin-bottom:4px;color:#1a2e1a}
.btn{display:inline-block;background:#2d6a2d;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;margin-top:8px}
.footer{background:#f0f0f0;padding:16px 32px;font-size:11px;color:#888;text-align:center}
</style></head>
<body>
<div class="wrap">
  <div class="header">
    <h1>Koperasi Kakitangan Sabah Softwoods Berhad</h1>
  </div>
  <div class="body">
    <span class="badge">✓ Shareholding Approved</span>
    <p>Dear <strong>{{ $member->full_name ?? $member->name }}</strong>,</p>
    <p>We are pleased to inform you that your shareholding application has been approved. You can now log in to the shareholder portal and access your account.</p>
    <div class="detail-box">
      <strong>Your Shareholder Details</strong>
      Shareholder ID: <strong>{{ $member->shareholder_id }}</strong><br>
      Name: {{ $member->full_name ?? $member->name }}<br>
      Status: Active
    </div>
    <a href="{{ url('/login') }}" class="btn">Log In to Portal →</a>
    <p style="margin-top:24px;font-size:12px;color:#888">If you have any questions, please contact the cooperative office.</p>
  </div>
  <div class="footer">Koperasi Kakitangan Sabah Softwoods Berhad · KM 44, Jalan Tawau - Kalabakan, 91019 Tawau, Sabah</div>
</div>
</body>
</html>
