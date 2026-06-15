<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body{font-family:Arial,sans-serif;color:#222;background:#f5f5f5;margin:0;padding:0}
.wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)}
.header{background:#1a4a1a;padding:28px 32px;text-align:center}
.header h1{color:#fff;font-size:20px;margin:0}
.body{padding:32px}
.body p{line-height:1.7;margin:0 0 16px}
.type-badge{display:inline-block;padding:4px 14px;border-radius:20px;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px}
.type-deposit{background:#d4f4e0;color:#1a5c1a;border:1px solid #6fcf97}
.type-dividend{background:#dbeafe;color:#1e40af;border:1px solid #93c5fd}
.type-withdrawal{background:#fde8e8;color:#8b2020;border:1px solid #f5b5b5}
.detail-box{background:#f5faf4;border-left:4px solid #2d6a2d;border-radius:0 8px 8px 0;padding:14px 18px;margin:20px 0}
.detail-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e8f5e4;font-size:14px}
.detail-row:last-child{border-bottom:none}
.btn{display:inline-block;background:#2d6a2d;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;margin-top:8px}
.footer{background:#f0f0f0;padding:16px 32px;font-size:11px;color:#888;text-align:center}
</style></head>
<body>
<div class="wrap">
  <div class="header">
    <h1>Transaction Recorded — KOP-SSB</h1>
  </div>
  <div class="body">
    <span class="type-badge type-{{ $transaction->type }}">{{ ucfirst($transaction->type) }}</span>
    <p>Dear <strong>{{ $member->full_name ?? $member->name }}</strong>,</p>
    <p>A transaction has been recorded on your account. Please review the details below.</p>
    <div class="detail-box">
      <div class="detail-row"><span>Type</span><strong>{{ ucfirst($transaction->type) }}</strong></div>
      <div class="detail-row"><span>Amount</span><strong>RM {{ number_format($transaction->amount, 2) }}</strong></div>
      <div class="detail-row"><span>Date</span><strong>{{ \Carbon\Carbon::parse($transaction->transaction_date)->format('d M Y') }}</strong></div>
      @if($transaction->description)
      <div class="detail-row"><span>Description</span><strong>{{ $transaction->description }}</strong></div>
      @endif
      <div class="detail-row"><span>Shareholder ID</span><strong>{{ $member->shareholder_id }}</strong></div>
    </div>
    <a href="{{ url('/shareholder/transactions') }}" class="btn">View My Transactions →</a>
    <p style="margin-top:24px;font-size:12px;color:#888">If you did not expect this transaction, please contact the cooperative office immediately.</p>
  </div>
  <div class="footer">Koperasi Kakitangan Sabah Softwoods Berhad · KM 44, Jalan Tawau - Kalabakan, 91019 Tawau, Sabah</div>
</div>
</body>
</html>
