<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Dompdf\Dompdf;
use Dompdf\Options;

class CertificateController extends Controller
{
    public function show()
    {
        return app(\App\Http\Controllers\DashboardController::class)->shareholder();
    }

    public function download()
    {
        $user = Auth::user();

        // ── Shares Holding — EXACT same formula as ShareholderDashboardDataController ──
        //
        //   currentAccount = totalInvested + totalDividend - totalWithdrawal
        //
        //   totalInvested   = transactions where type = 'deposit'
        //   totalDividend   = transactions where type = 'dividend'
        //   totalWithdrawal = transactions where type = 'withdrawal'
        //
        // NOTE: Do NOT use $user->dividends()->sum('amount').
        // That relation points to the dividend_rates/dividends TABLE which stores
        // yearly rate records — NOT individual transaction credits.
        // The old code added it on top of transaction dividends → double-count → wrong PDF units.

        $transactions = $user->transactions()->get();

        $totalInvested   = (float) $transactions->where('type', 'deposit')->sum('amount');
        $totalDividend   = (float) $transactions->where('type', 'dividend')->sum('amount');
        $totalWithdrawal = (float) $transactions->where('type', 'withdrawal')->sum('amount');

        $sharesHolding = $totalInvested + $totalDividend - $totalWithdrawal;
        $shares        = (int) max(0, round($sharesHolding));
        $shareValue    = 1.00;
        $totalValue    = $shares * $shareValue;

        $certNo      = 'KSS-' . date('Y') . '-' . str_pad($user->id, 4, '0', STR_PAD_LEFT);
        $issueDate   = Carbon::now()->locale('ms')->isoFormat('D MMMM YYYY');
        $memberName  = strtoupper($user->full_name ?? $user->name);
        $shareholderId    = $user->shareholder_id ?? $user->id;
        $fmtRM       = fn($n) => 'RM ' . number_format($n, 2);

        // ── Logo — embed as base64 so it works on any hosting ──
        $logoBase64 = '';
        $logoCandidates = [
            public_path('images/kop-ssb-logo.png'),
            public_path('images/kop-ssb-logo.jpg'),
            public_path('images/kop-ssb-logo.jpeg'),
            public_path('images/logo.png'),
        ];
        foreach ($logoCandidates as $path) {
            if (file_exists($path)) {
                $mime       = str_ends_with($path, '.png') ? 'image/png' : 'image/jpeg';
                $logoBase64 = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($path));
                break;
            }
        }

        $amountWords = strtoupper($this->toMalayWords($totalValue));

        $html = $this->buildHtml(
            memberName:  $memberName,
            shareholderId:    $shareholderId,
            certNo:      $certNo,
            shares:      $shares,
            shareValue:  $shareValue,
            totalValue:  $totalValue,
            issueDate:   $issueDate,
            logoBase64:  $logoBase64,
            amountWords: $amountWords,
            fmtRM:       $fmtRM,
        );

        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', false);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        $filename = "Sijil_Saham_{$shareholderId}_{$certNo}.pdf";

        return response($dompdf->output(), 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    private function buildHtml(
        string   $memberName,
        string   $shareholderId,
        string   $certNo,
        int      $shares,
        float    $shareValue,
        float    $totalValue,
        string   $issueDate,
        string   $logoBase64,
        string   $amountWords,
        \Closure $fmtRM,
    ): string {
        $sharesFormatted = number_format($shares);
        $shareValueFmt   = $fmtRM($shareValue);
        $totalValueFmt   = $fmtRM($totalValue);
        $totalStars      = '**** ' . $fmtRM($totalValue) . ' ****';
        $logoHtml        = $logoBase64
            ? '<img src="' . $logoBase64 . '" style="width:64px;height:56px;object-fit:contain;display:block;margin:0 auto 6px;" alt="Logo"/>'
            : '<div style="width:64px;height:56px;background:#2d6a2d;border-radius:8px;margin:0 auto 6px;"></div>';

        // Dompdf notes:
        // - Avoid position:absolute for layout (use only for watermark overlay)
        // - Avoid min-height (causes blank second page)
        // - Full-A4 trick: html+body height:100%, frame-outer height:100%,
        //   inner layout-table height:100% with a height:100% content row
        //   → bottom-band is pinned to the page bottom
        // - z-index not supported — layering via DOM order only

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  @page {
    margin: 10mm;
    size: A4 portrait;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: DejaVu Sans, sans-serif;
    background: #fff;
    font-size: 10.5px;
    color: #1a2e1a;
  }

  /* ── Outer gold frame — fixed to A4 content height (297mm - 10mm*2 margins) ── */
  .frame-outer {
    width: 100%;
    height: 277mm;
    border: 3pt solid #b8941e;
    border-collapse: collapse;
    background: #fdf8f0;
  }
  .frame-inner-td {
    border: 1pt solid #b8941e;
    padding: 0;
    height: 100%;
  }

  /* ── Inner layout table — fills the frame, 4 rows ── */
  .layout-table {
    width: 100%;
    height: 100%;
    border-collapse: collapse;
  }

  /* ── Header band (green top strip) ── */
  .top-band {
    background: #e8f5e4;
    padding: 6mm 10mm 5mm;
    text-align: center;
    border-bottom: 1pt solid #b8d4b4;
  }
  .coop-name {
    font-size: 13px;
    font-weight: bold;
    color: #1a4a1a;
    letter-spacing: 0.3px;
  }
  .coop-sub {
    font-size: 8px;
    color: #7a9a7a;
    margin-top: 2px;
  }

  /* ── Cert number row ── */
  .cert-no-td {
    background: #fdf8f0;
    padding: 4mm 10mm 0;
    text-align: right;
  }
  .cert-no-label {
    font-size: 7px;
    color: #7a9a7a;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .cert-no-value {
    font-size: 12px;
    font-weight: bold;
    color: #c9a028;
    letter-spacing: 1px;
  }

  /* ── Content cell (expands to fill remaining page height) ── */
  .content-td {
    height: 100%;
    vertical-align: top;
    padding: 8mm 10mm;
    background: #fdf8f0;
  }

  /* ── Dividers ── */
  .div-thick { border-top: 1.5pt solid #2d6a2d; margin: 0 6mm; }
  .div-thin  { border-top: 0.4pt solid #2d6a2d; margin: 1mm 6mm 0; }

  /* ── Badge ── */
  .badge-wrap { text-align: center; margin: 6mm 0 5mm; }
  .badge {
    background: #2d6a2d;
    color: #fff;
    font-weight: bold;
    font-size: 12px;
    padding: 4px 28px;
    letter-spacing: 2px;
    display: inline-block;
  }

  .intro { text-align: center; font-size: 10px; color: #555; margin-bottom: 6mm; }

  /* ── Member box ── */
  .member-box {
    border: 1pt solid #2d6a2d;
    background: #f0f9ee;
    padding: 12px 16px;
    text-align: center;
    margin: 0 0 7mm;
  }
  .member-id-badge {
    display: inline-block;
    background: #2d6a2d;
    color: #fff;
    font-size: 8px;
    font-weight: bold;
    padding: 2px 14px;
    margin-bottom: 6px;
    letter-spacing: 0.5px;
  }
  .member-name {
    font-size: 18px;
    font-weight: bold;
    color: #1a4a1a;
    margin-bottom: 4px;
  }
  .member-sub { font-size: 10px; color: #7a9a7a; }

  /* ── Share rows (table layout — reliable in Dompdf) ── */
  .share-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 0;
  }
  .share-table td {
    padding: 10px 12px;
    border: 0.5pt solid #c5d6c3;
    vertical-align: middle;
  }
  .share-table tr:nth-child(odd)  td { background: #e8f5e4; }
  .share-table tr:nth-child(even) td { background: #f5faf4; }
  .td-label {
    width: 45%;
    font-size: 9px;
    color: #4a6a4a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .td-value {
    font-size: 12.5px;
    font-weight: bold;
    color: #1a2e1a;
  }
  .td-value.highlight {
    font-size: 13.5px;
    color: #2d6a2d;
  }

  /* ── Stars ── */
  .stars {
    text-align: center;
    margin: 7mm 0 6mm;
    font-weight: bold;
    font-size: 12px;
    color: #c9a028;
    letter-spacing: 2px;
  }

  /* ── Body text ── */
  .body-text {
    text-align: center;
    font-size: 9.5px;
    color: #333;
    line-height: 1.9;
    margin-bottom: 6mm;
  }

  /* ── Issue date ── */
  .issue-date {
    text-align: center;
    font-size: 9.5px;
    color: #555;
    margin-bottom: 8mm;
  }

  .div-sig { border-top: 0.8pt solid #2d6a2d; margin: 0 6mm 8mm; }

  /* ── Signatures (table layout) ── */
  .sig-table {
    width: 100%;
    border-collapse: collapse;
  }
  .sig-table td {
    text-align: center;
    width: 33%;
    vertical-align: bottom;
    padding: 0 8px;
  }
  .sig-line {
    border-top: 0.8pt solid #1a4a1a;
    margin: 0 auto 3px;
    width: 80%;
    padding-top: 40px;
  }
  .sig-title { font-size: 8.5px; font-weight: bold; color: #1a4a1a; }
  .sig-sub   { font-size: 7.5px; color: #7a9a7a; margin-top: 1px; }

  /* ── Seal ── */
  .seal-wrap { text-align: center; }
  .seal {
    display: inline-block;
    width: 60px; height: 60px;
    border-radius: 50%;
    border: 2pt solid #c9a028;
    background: #fef3e2;
    padding-top: 12px;
    text-align: center;
  }
  .seal-text {
    font-size: 6px;
    font-weight: bold;
    color: #c9a028;
    line-height: 1.6;
  }

  /* ── Bottom band ── */
  .bottom-band {
    background: #e8f5e4;
    border-top: 1pt solid #b8d4b4;
    padding: 4mm 10mm;
    font-size: 7px;
    color: #888;
    font-style: italic;
    text-align: center;
  }
  .footer-siri {
    font-size: 7px;
    color: #999;
    text-align: left;
    margin-top: 2px;
  }

  /* ── CONTOH watermark — position:absolute only here, on a non-layout div ── */
  .wm-wrap {
    position: relative;
    height: 0;
    overflow: visible;
  }
  .watermark {
    position: absolute;
    top: -160px;
    left: 50%;
    width: 400px;
    margin-left: -200px;
    text-align: center;
    font-size: 72px;
    font-weight: 900;
    color: rgba(160,0,0,0.06);
    letter-spacing: 10px;
    transform: rotate(-35deg);
    white-space: nowrap;
    pointer-events: none;
  }
</style>
</head>
<body>

<table class="frame-outer" cellpadding="0" cellspacing="0">
  <tr>
    <td class="frame-inner-td">

      <!-- Inner layout table: 4 rows (top-band, cert-no, content, bottom-band) -->
      <table class="layout-table" cellpadding="0" cellspacing="0">

        <!-- Row 1: Green top band with logo -->
        <tr>
          <td class="top-band">
            {$logoHtml}
            <div class="coop-name">KOPERASI KAKITANGAN SABAH SOFTWOODS</div>
            <div class="coop-sub">Didaftarkan di bawah Akta Koperasi 1993</div>
          </td>
        </tr>

        <!-- Row 2: Cert number -->
        <tr>
          <td class="cert-no-td">
            <span class="cert-no-label">No. Sijil Saham &nbsp;</span>
            <span class="cert-no-value">{$certNo}</span>
          </td>
        </tr>

        <!-- Row 3: Main content — height:100% expands to fill remaining space -->
        <tr style="height:100%;">
          <td class="content-td">

            <!-- Dividers -->
            <div class="div-thick"></div>
            <div class="div-thin"></div>

            <!-- Badge -->
            <div class="badge-wrap">
              <span class="badge">SIJIL SAHAM</span>
            </div>

            <div class="intro">Dengan ini adalah diakui bahawa,</div>

            <!-- Member box -->
            <div class="member-box">
              <div class="member-id-badge">ID AHLI: {$shareholderId}</div>
              <div class="member-name">{$memberName}</div>
              <div class="member-sub">adalah pemilik sah saham-saham Koperasi ini.</div>
            </div>

            <!-- Share details -->
            <table class="share-table" cellpadding="0" cellspacing="0">
              <tr>
                <td class="td-label">Bilangan Saham</td>
                <td class="td-value">{$sharesFormatted} unit</td>
              </tr>
              <tr>
                <td class="td-label">Nilai Seunit</td>
                <td class="td-value">{$shareValueFmt}</td>
              </tr>
              <tr>
                <td class="td-label">Jumlah Nilai Saham</td>
                <td class="td-value highlight">{$totalValueFmt}</td>
              </tr>
            </table>

            <!-- Stars -->
            <div class="stars">{$totalStars}</div>

            <!-- Watermark (positioned relative to its zero-height wrapper) -->
            <div class="wm-wrap"><div class="watermark">CONTOH</div></div>

            <!-- Body text -->
            <div class="body-text">
              adalah pemilik sah saham-saham yang bernilai sebanyak RINGGIT MALAYSIA<br/>
              {$amountWords} SAHAJA dalam modal saham<br/>
              KOPERASI KAKITANGAN SABAH SOFTWOODS berhad tatakluk kepada Akta Koperasi 1993,<br/>
              Peraturan-peraturan dan Undang-undang Kecil Koperasi ini.
            </div>

            <div class="issue-date">
              Dimeterikan di bawah mohor Koperasi ini pada &nbsp;&nbsp; {$issueDate}
            </div>

            <div class="div-sig"></div>

            <!-- Signatures -->
            <table class="sig-table" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div class="sig-line"></div>
                  <div class="sig-title">Pengerusi Koperasi</div>
                  <div class="sig-sub">KOP. KAKITANGAN SABAH SOFTWOODS</div>
                </td>
                <td>
                  <div class="seal-wrap">
                    <div class="seal">
                      <div class="seal-text">MOHOR<br/>KOPERASI<br/>KOP-SSB</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="sig-line"></div>
                  <div class="sig-title">Setiausaha Koperasi</div>
                  <div class="sig-sub">KOP. KAKITANGAN SABAH SOFTWOODS</div>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Row 4: Green bottom band (pinned to page bottom) -->
        <tr>
          <td class="bottom-band">
            NOTA: Saham tersebut di atas tidak boleh dipindahmiliki jikalau Sijil ini tidak dikembalikan ke pejabat Koperasi ini.
            <div class="footer-siri">No. Siri Sijil: {$certNo}</div>
          </td>
        </tr>

      </table><!-- /layout-table -->

    </td>
  </tr>
</table>

</body>
</html>
HTML;
    }

    private function toMalayWords(float $amount): string
    {
        $ones = ['','SATU','DUA','TIGA','EMPAT','LIMA','ENAM','TUJUH','LAPAN','SEMBILAN',
                 'SEPULUH','SEBELAS','DUA BELAS','TIGA BELAS','EMPAT BELAS','LIMA BELAS',
                 'ENAM BELAS','TUJUH BELAS','LAPAN BELAS','SEMBILAN BELAS'];
        $tens = ['','','DUA PULUH','TIGA PULUH','EMPAT PULUH','LIMA PULUH',
                 'ENAM PULUH','TUJUH PULUH','LAPAN PULUH','SEMBILAN PULUH'];

        $below100 = function(int $n) use ($ones, $tens): string {
            if ($n < 20) return $ones[$n];
            return $tens[intdiv($n, 10)] . ($n % 10 ? ' ' . $ones[$n % 10] : '');
        };
        $below1000 = function(int $n) use ($ones, $below100): string {
            if ($n < 100) return $below100($n);
            $h   = intdiv($n, 100);
            $r   = $n % 100;
            $pre = $h === 1 ? 'SERATUS' : $ones[$h] . ' RATUS';
            return $pre . ($r ? ' ' . $below100($r) : '');
        };

        $n = (int) $amount;
        if ($n === 0) return 'SIFAR';
        $parts = [];
        if ($n >= 1000000) { $parts[] = $below1000(intdiv($n, 1000000)) . ' JUTA'; $n %= 1000000; }
        if ($n >= 1000)    { $parts[] = $below1000(intdiv($n, 1000))    . ' RIBU';  $n %= 1000; }
        if ($n > 0)        { $parts[] = $below1000($n); }
        return implode(' ', $parts);
    }
}