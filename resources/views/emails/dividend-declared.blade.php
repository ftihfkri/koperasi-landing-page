<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body{font-family:Arial,sans-serif;color:#222;background:#f5f5f5;margin:0;padding:0}
.wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)}
.header{background:#1a4a1a;padding:28px 32px;text-align:center}
.header h1{color:#fff;font-size:20px;margin:0}
.body{padding:32px}
.body p{line-height:1.7;margin:0 0 16px}
.amount-box{background:#1a4a1a;color:#fff;border-radius:10px;padding:20px 24px;text-align:center;margin:20px 0}
.amount-box .label{font-size:12px;opacity:.7;letter-spacing:1px;text-transform:uppercase}
.amount-box .value{font-size:36px;font-weight:700;margin:6px 0}
.amount-box .sub{font-size:13px;opacity:.8}
.detail-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px}
.detail-row:last-child{border-bottom:none}
.btn{display:inline-block;background:#2d6a2d;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;margin-top:8px}
.footer{background:#f0f0f0;padding:16px 32px;font-size:11px;color:#888;text-align:center}
</style></head>
<body>
<div class="wrap">
  <div class="header">
    <h1>Dividend Declaration FY{{ $year }} — KOP-SSB</h1>
  </div>
  <div class="body">
    <p>Dear <strong>{{ $member->full_name ?? $member->name }}</strong>,</p>
    <p>The Board has approved the dividend for Financial Year {{ $year }}. Your dividend has been credited to your account.</p>
    <div class="amount-box">
      <div class="label">Your Dividend Amount</div>
      <div class="value">RM {{ number_format($amount, 2) }}</div>
      <div class="sub">FY{{ $year }} · {{ $rate }}% rate</div>
    </div>
    <div>
      <div class="detail-row"><span>Financial Year</span><strong>{{ $year }}</strong></div>
      <div class="detail-row"><span>Dividend Rate</span><strong>{{ $rate }}%</strong></div>
      <div class="detail-row"><span>Amount Credited</span><strong>RM {{ number_format($amount, 2) }}</strong></div>
      <div class="detail-row"><span>Shareholder ID</span><strong>{{ $member->shareholder_id }}</strong></div>
    </div>
    <a href="{{ url('/shareholder') }}" class="btn" style="margin-top:24px">View My Account →</a>
    <p style="margin-top:24px;font-size:12px;color:#888">This dividend has been recorded in your transaction history. Log in to the portal to view your full statement.</p>
  </div>
  <div class="footer">Koperasi Kakitangan Sabah Softwoods Berhad · KM 44, Jalan Tawau - Kalabakan, 91019 Tawau, Sabah</div>
</div>
</body>
</html>
