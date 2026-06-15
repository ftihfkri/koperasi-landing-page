<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Financial Summary FY{{ $year }} — KOP-SSB</title>
@include('partials.favicon')
<style>
  *,*::before,*::after{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
  body{font-family:Arial,sans-serif;color:#1a2e1a;margin:0;padding:0;background:#fff;font-size:13px}
  @page{size:A4 landscape;margin:12mm}
  @media print{.no-print{display:none!important}body{padding:0}}
  .no-print{padding:12px 24px;background:#1a4a1a;display:flex;align-items:center;gap:16px}
  .no-print button{padding:8px 20px;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600}
  .print-btn{background:#a3e635;color:#1a2e1a}
  .close-btn{background:rgba(255,255,255,0.15);color:#fff}
  .page{max-width:1100px;margin:0 auto;padding:20px 28px}

  /* Header */
  .report-header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #1a4a1a;padding-bottom:14px;margin-bottom:20px}
  .report-header .logo-area{display:flex;align-items:center;gap:14px}
  .report-header img{height:56px;object-fit:contain}
  .report-header h1{font-size:17px;color:#1a4a1a;margin:0 0 2px;font-weight:800}
  .report-header .sub{font-size:11px;color:#5a7a5a}
  .report-header .fy-badge{background:#1a4a1a;color:#fff;border-radius:8px;padding:8px 18px;text-align:right}
  .report-header .fy-badge .fy-label{font-size:10px;opacity:.7;text-transform:uppercase;letter-spacing:1px}
  .report-header .fy-badge .fy-value{font-size:22px;font-weight:800;line-height:1}

  /* KPI grid */
  .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
  .kpi-card{background:#f5faf4;border:1px solid #c5d6c3;border-radius:8px;padding:14px 16px;border-left:4px solid #2d6a2d}
  .kpi-card.accent{border-left-color:#1d4ed8;background:#eff6ff}
  .kpi-card.gold{border-left-color:#c9a028;background:#fffbf0}
  .kpi-card.red{border-left-color:#c94040;background:#fef2f2}
  .kpi-label{font-size:10px;color:#5a7a5a;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px}
  .kpi-value{font-size:22px;font-weight:800;color:#1a2e1a;line-height:1}
  .kpi-sub{font-size:10px;color:#7a9a7a;margin-top:3px}

  /* Section */
  h2{font-size:13px;font-weight:700;color:#1a4a1a;border-bottom:1px solid #c5d6c3;padding-bottom:6px;margin:20px 0 12px;text-transform:uppercase;letter-spacing:.5px}

  /* Table */
  table{width:100%;border-collapse:collapse;font-size:12px}
  thead tr{background:#1a4a1a;color:#fff}
  thead th{padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.5px;font-weight:600}
  thead th.right{text-align:right}
  tbody tr:nth-child(even){background:#f8fdf7}
  tbody tr:hover{background:#edf8eb}
  tbody td{padding:7px 10px;border-bottom:1px solid #e8f5e4;vertical-align:middle}
  tbody td.right{text-align:right;font-family:'Courier New',monospace}
  tbody td.mono{font-family:'Courier New',monospace;font-size:11px}
  tfoot tr{background:#e8f5e4;font-weight:700}
  tfoot td{padding:8px 10px;border-top:2px solid #2d6a2d}

  .generated{text-align:right;font-size:10px;color:#aaa;margin-top:16px;border-top:1px solid #eee;padding-top:8px}
</style>
</head>
<body>

<div class="no-print">
  <button class="print-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
  <button class="close-btn" onclick="window.close()">✕ Close</button>
  <span style="color:#a3e635;font-size:13px;font-weight:600">Financial Summary FY{{ $year }}</span>
</div>

<div class="page">

  {{-- Header --}}
  <div class="report-header">
    <div class="logo-area">
      <img src="{{ asset('images/kop-ssb-logo.png') }}" alt="KOP-SSB" onerror="this.style.display='none'">
      <div>
        <h1>Koperasi Kakitangan Sabah Softwoods Berhad</h1>
        <div class="sub">Financial Summary Report · Generated {{ now()->format('d M Y, H:i') }}</div>
      </div>
    </div>
    <div class="fy-badge">
      <div class="fy-label">Financial Year</div>
      <div class="fy-value">{{ $year }}</div>
    </div>
  </div>

  {{-- KPI cards --}}
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Total Shareholders</div>
      <div class="kpi-value">{{ $totalMembers }}</div>
      <div class="kpi-sub">{{ $activeMembers }} active · {{ $pendingMembers }} pending · {{ $inactiveMembers }} inactive</div>
    </div>
    <div class="kpi-card accent">
      <div class="kpi-label">Net Deposit</div>
      <div class="kpi-value">RM {{ number_format($netDeposit, 2) }}</div>
      <div class="kpi-sub">Deposits − Withdrawals</div>
    </div>
    <div class="kpi-card gold">
      <div class="kpi-label">Dividends Paid (FY{{ $year }})</div>
      <div class="kpi-value">RM {{ number_format($dividendThisYear, 2) }}</div>
      <div class="kpi-sub">Rate: {{ $dividendRate }}%</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Tabung Komitmen</div>
      <div class="kpi-value">RM {{ number_format($totalTabung, 2) }}</div>
      <div class="kpi-sub">Active commitments (all shareholders)</div>
    </div>
  </div>

  <div class="kpi-grid" style="grid-template-columns:repeat(2,1fr)">
    <div class="kpi-card">
      <div class="kpi-label">Total Deposits</div>
      <div class="kpi-value">RM {{ number_format($totalDeposit, 2) }}</div>
    </div>
    <div class="kpi-card red">
      <div class="kpi-label">Total Withdrawals</div>
      <div class="kpi-value">RM {{ number_format($totalWithdrawal, 2) }}</div>
    </div>
  </div>

  {{-- Per-member table --}}
  <h2>Active Shareholder Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Shareholder ID</th>
        <th>Name</th>
        <th class="right">Deposit (RM)</th>
        <th class="right">Withdrawal (RM)</th>
        <th class="right">Net Deposit (RM)</th>
        <th class="right">Tabung (RM)</th>
        <th class="right">Dividend FY{{ $year }} (RM)</th>
      </tr>
    </thead>
    <tbody>
      @foreach($members as $i => $m)
      <tr>
        <td style="color:#7a9a7a;font-size:11px">{{ $i + 1 }}</td>
        <td class="mono">{{ $m['shareholder_id'] }}</td>
        <td style="font-weight:600">{{ $m['name'] }}</td>
        <td class="right">{{ number_format($m['deposit'], 2) }}</td>
        <td class="right" style="color:#c94040">{{ number_format($m['withdrawal'], 2) }}</td>
        <td class="right" style="font-weight:700">{{ number_format($m['net'], 2) }}</td>
        <td class="right">{{ number_format($m['tabung'], 2) }}</td>
        <td class="right" style="color:#1d4ed8;font-weight:700">{{ number_format($m['dividend_fy'], 2) }}</td>
      </tr>
      @endforeach
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3" style="font-weight:700">TOTAL ({{ $members->count() }} shareholders)</td>
        <td class="right">{{ number_format($members->sum('deposit'), 2) }}</td>
        <td class="right" style="color:#c94040">{{ number_format($members->sum('withdrawal'), 2) }}</td>
        <td class="right">{{ number_format($members->sum('net'), 2) }}</td>
        <td class="right">{{ number_format($members->sum('tabung'), 2) }}</td>
        <td class="right" style="color:#1d4ed8">{{ number_format($members->sum('dividend_fy'), 2) }}</td>
      </tr>
    </tfoot>
  </table>

  <div class="generated">
    This report was generated on {{ now()->format('d F Y \a\t H:i:s') }} by the KOP-SSB management system.
    Confidential — for internal use only.
  </div>

</div>
</body>
</html>
