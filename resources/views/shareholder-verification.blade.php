<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Shareholder Verification — KOP-SSB</title>
@include('partials.favicon')
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Outfit',sans-serif;background:#0d1a0d;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}

  .wrap{width:100%;max-width:420px}

  /* Top org strip */
  .org{display:flex;align-items:center;gap:12px;justify-content:center;margin-bottom:28px}
  .org img{width:48px;height:48px;object-fit:contain;filter:drop-shadow(0 2px 8px rgba(100,200,80,0.3))}
  .org-name{font-size:11px;font-weight:700;color:rgba(255,255,255,0.6);letter-spacing:1.5px;text-transform:uppercase;line-height:1.5}

  /* Card */
  .card{border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.06)}

  /* VALID state */
  .card.valid{background:linear-gradient(160deg,#0f2e0f 0%,#1a4a1a 50%,#0d2a0d 100%)}
  .card.invalid{background:linear-gradient(160deg,#2a0d0d 0%,#4a1a1a 50%,#2a0d0d 100%)}

  /* Glow top bar */
  .glow-bar{height:4px;width:100%}
  .valid .glow-bar{background:linear-gradient(90deg,#2d6a2d,#a3e635,#2d6a2d)}
  .invalid .glow-bar{background:linear-gradient(90deg,#6a2d2d,#e63535,#6a2d2d)}

  .inner{padding:32px 28px}

  /* Status badge */
  .status-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:30px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:24px}
  .valid .status-badge{background:rgba(163,230,53,0.12);border:1px solid rgba(163,230,53,0.35);color:#a3e635}
  .invalid .status-badge{background:rgba(230,53,53,0.12);border:1px solid rgba(230,53,53,0.35);color:#e63535}
  .status-dot{width:7px;height:7px;border-radius:50%}
  .valid .status-dot{background:#a3e635;box-shadow:0 0 8px #a3e635}
  .invalid .status-dot{background:#e63535;box-shadow:0 0 8px #e63535}

  /* Avatar */
  .avatar-wrap{display:flex;align-items:center;gap:16px;margin-bottom:24px}
  .avatar{width:72px;height:72px;border-radius:12px;overflow:hidden;flex-shrink:0;border:2px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:rgba(255,255,255,0.6);font-family:'JetBrains Mono',monospace}
  .avatar img{width:100%;height:100%;object-fit:cover}
  .name-block .member-name{font-size:20px;font-weight:700;color:#fff;line-height:1.2;margin-bottom:4px}
  .name-block .member-role{font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1.5px}

  /* Fields */
  .field{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.07)}
  .field:last-child{border-bottom:none}
  .field-label{font-size:10px;font-weight:600;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1.2px}
  .field-value{font-size:13px;font-weight:600;color:#fff;text-align:right;font-family:'JetBrains Mono',monospace}
  .field-value.green{color:#a3e635}
  .field-value.red{color:#e63535}

  /* Big icon for invalid */
  .invalid-icon{font-size:56px;margin-bottom:16px;text-align:center}
  .invalid-msg{font-size:14px;color:rgba(255,255,255,0.55);text-align:center;line-height:1.7;margin-bottom:4px}
  .invalid-sub{font-size:11px;color:rgba(255,255,255,0.3);text-align:center}

  /* Divider */
  .divider{height:1px;background:rgba(255,255,255,0.07);margin:20px 0}

  /* Verified at */
  .verified-at{font-size:10px;color:rgba(255,255,255,0.25);text-align:center;font-family:'JetBrains Mono',monospace;letter-spacing:.5px}

  /* Watermark shield */
  .shield{font-size:130px;position:absolute;right:-20px;bottom:-20px;opacity:0.03;pointer-events:none;user-select:none}

  .inner{position:relative;overflow:hidden}

  /* Check icon */
  .check-icon{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
  .valid .check-icon{background:rgba(163,230,53,0.2);color:#a3e635}

  /* Inactive warning */
  .inactive-warn{background:rgba(230,160,53,0.1);border:1px solid rgba(230,160,53,0.3);border-radius:8px;padding:10px 14px;font-size:11.5px;color:#e6a035;margin-top:16px;text-align:center}
</style>
</head>
<body>

<div class="wrap">
  <!-- Org header -->
  <div class="org">
    <img src="{{ asset('images/kop-ssb-logo.png') }}" alt="KOP-SSB" onerror="this.style.display='none'">
    <div class="org-name">Koperasi Kakitangan<br>Sabah Softwoods Berhad</div>
  </div>

  @if($valid)
  <div class="card valid">
    <div class="glow-bar"></div>
    <div class="inner">
      <div class="shield">🛡️</div>

      <!-- Verified badge -->
      <div>
        <span class="status-badge">
          <span class="status-dot"></span>
          ✓ Verified Shareholder
        </span>
      </div>

      <!-- Avatar + name -->
      <div class="avatar-wrap">
        <div class="avatar">
          @if($avatar)
            <img src="{{ $avatar }}" alt="Shareholder photo" onerror="this.style.display='none'">
          @else
            {{ strtoupper(substr($name ?? 'M', 0, 1)) }}
          @endif
        </div>
        <div class="name-block">
          <div class="member-name">{{ $name }}</div>
          <div class="member-role">{{ ucfirst($role ?? 'shareholder') }} · KOP-SSB</div>
        </div>
      </div>

      <!-- Fields -->
      <div>
        <div class="field">
          <span class="field-label">Shareholder ID</span>
          <span class="field-value green">{{ $member_id }}</span>
        </div>
        <div class="field">
          <span class="field-label">Status</span>
          <span class="field-value {{ $status === 'active' ? 'green' : 'red' }}">
            {{ ucfirst($status) }}
          </span>
        </div>
        <div class="field">
          <span class="field-label">Shareholder Since</span>
          <span class="field-value">{{ $since }}</span>
        </div>
        <div class="field">
          <span class="field-label">Duration</span>
          <span class="field-value">{{ $duration }}</span>
        </div>
      </div>

      @if($status !== 'active')
      <div class="inactive-warn">
        ⚠️ This shareholding is currently <strong>{{ $status }}</strong>. Please contact the cooperative office.
      </div>
      @endif

      <div class="divider"></div>
      <div class="verified-at">Verified at {{ $verified_at }} · KOP-SSB System</div>
    </div>
  </div>

  @else
  <div class="card invalid">
    <div class="glow-bar"></div>
    <div class="inner">
      <div class="invalid-icon">⚠️</div>
      <div class="invalid-msg">This verification link is <strong>invalid</strong> or has been tampered with.</div>
      <div class="invalid-sub">If you believe this is an error, please contact the cooperative office.</div>
      <div class="divider"></div>
      <div class="verified-at">Checked at {{ now()->format('d M Y, H:i:s') }} · KOP-SSB System</div>
    </div>
  </div>
  @endif

</div>
</body>
</html>
