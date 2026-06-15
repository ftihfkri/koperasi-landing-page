<?php

namespace App\Http\Controllers;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use ZipArchive;

class WalletController extends Controller
{
    // ── Apple Wallet ──────────────────────────────────────────────────────
    public function apple(Request $request)
    {
        $user = Auth::user();

        $passTypeId  = config('wallet.apple_pass_type_id');
        $teamId      = config('wallet.apple_team_id');
        $certPath    = config('wallet.apple_cert_path');
        $certPass    = config('wallet.apple_cert_password', '');
        $wwdrPath    = config('wallet.apple_wwdr_path');

        // If not configured, return setup page
        if (!$passTypeId || !$teamId) {
            return $this->appleSetupPage();
        }

        $verifyUrl = ShareholderVerificationController::urlFor($user);

        $memberSince = $user->shareholding_start_date
            ? Carbon::parse($user->shareholding_start_date)->format('d M Y')
            : Carbon::parse($user->created_at)->format('d M Y');

        // ── pass.json ────────────────────────────────────────────────────
        $pass = [
            'formatVersion'      => 1,
            'passTypeIdentifier' => $passTypeId,
            'serialNumber'       => (string) ($user->shareholder_id ?? $user->id),
            'teamIdentifier'     => $teamId,
            'organizationName'   => 'Koperasi Kakitangan Sabah Softwoods Berhad',
            'description'        => 'KOP-SSB Membership Card',
            'foregroundColor'    => 'rgb(255, 255, 255)',
            'backgroundColor'    => 'rgb(26, 74, 26)',
            'labelColor'         => 'rgb(163, 230, 53)',
            'logoText'           => 'KOP-SSB',
            'barcodes'           => [[
                'message'         => $verifyUrl,
                'format'          => 'PKBarcodeFormatQR',
                'messageEncoding' => 'iso-8859-1',
            ]],
            'generic' => [
                'primaryFields'   => [
                    ['key' => 'name',   'label' => 'MEMBER',    'value' => $user->full_name ?? $user->name],
                ],
                'secondaryFields' => [
                    ['key' => 'id',     'label' => 'MEMBER ID', 'value' => $user->shareholder_id ?? '—'],
                    ['key' => 'status', 'label' => 'STATUS',    'value' => ucfirst($user->status ?? 'active')],
                ],
                'auxiliaryFields' => [
                    ['key' => 'since',  'label' => 'MEMBER SINCE', 'value' => $memberSince],
                ],
                'backFields'      => [
                    ['key' => 'org',    'label' => 'ORGANISATION', 'value' => 'Koperasi Kakitangan Sabah Softwoods Berhad'],
                    ['key' => 'web',    'label' => 'WEBSITE',      'value' => 'www.kopssb.com.my'],
                    ['key' => 'email',  'label' => 'EMAIL',        'value' => 'info@kopssb.com.my'],
                    ['key' => 'verify', 'label' => 'VERIFY CARD',  'value' => $verifyUrl],
                ],
            ],
        ];

        $passJson = json_encode($pass, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

        // ── Generate icons with GD ────────────────────────────────────────
        $icons = $this->generateIcons();

        // ── manifest.json — SHA1 of every file in the pass ───────────────
        $manifest = [
            'pass.json'    => sha1($passJson),
            'icon.png'     => sha1($icons['icon']),
            'icon@2x.png'  => sha1($icons['icon2x']),
            'logo.png'     => sha1($icons['logo']),
            'logo@2x.png'  => sha1($icons['logo2x']),
        ];
        $manifestJson = json_encode($manifest, JSON_PRETTY_PRINT);

        // ── signature ─────────────────────────────────────────────────────
        $signature = $this->signManifest($manifestJson, $certPath, $certPass, $wwdrPath);

        // ── Build ZIP (pkpass) ────────────────────────────────────────────
        $tmpDir  = sys_get_temp_dir() . '/kopssb_pass_' . $user->id . '_' . time();
        $tmpFile = $tmpDir . '.pkpass';

        mkdir($tmpDir, 0755, true);
        file_put_contents($tmpDir . '/pass.json',    $passJson);
        file_put_contents($tmpDir . '/manifest.json', $manifestJson);
        file_put_contents($tmpDir . '/icon.png',     $icons['icon']);
        file_put_contents($tmpDir . '/icon@2x.png',  $icons['icon2x']);
        file_put_contents($tmpDir . '/logo.png',     $icons['logo']);
        file_put_contents($tmpDir . '/logo@2x.png',  $icons['logo2x']);
        if ($signature) {
            file_put_contents($tmpDir . '/signature', $signature);
        }

        $zip = new ZipArchive();
        $zip->open($tmpFile, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        foreach (scandir($tmpDir) as $f) {
            if ($f === '.' || $f === '..') continue;
            $zip->addFile($tmpDir . '/' . $f, $f);
        }
        $zip->close();

        $pkpassData = file_get_contents($tmpFile);

        // Cleanup
        array_map('unlink', glob($tmpDir . '/*'));
        rmdir($tmpDir);
        @unlink($tmpFile);

        $filename = 'KOP-SSB-' . ($user->shareholder_id ?? $user->id) . '.pkpass';

        return response($pkpassData, 200, [
            'Content-Type'        => 'application/vnd.apple.pkpass',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Content-Length'      => strlen($pkpassData),
        ]);
    }

    // ── Google Wallet ─────────────────────────────────────────────────────
    public function google(Request $request)
    {
        $user = Auth::user();

        $credentialsPath = config('wallet.google_credentials_path');
        $issuerId        = config('wallet.google_issuer_id');
        $classId         = config('wallet.google_class_id');

        if (!$credentialsPath || !$issuerId || !$classId) {
            return $this->googleSetupPage();
        }

        if (!file_exists($credentialsPath)) {
            return $this->googleSetupPage();
        }

        $credentials = json_decode(file_get_contents($credentialsPath), true);
        $privateKey  = $credentials['private_key'] ?? null;
        $serviceEmail = $credentials['client_email'] ?? null;

        if (!$privateKey || !$serviceEmail) {
            return $this->googleSetupPage();
        }

        $verifyUrl   = ShareholderVerificationController::urlFor($user);
        $objectId    = $issuerId . '.' . preg_replace('/[^a-zA-Z0-9_-]/', '-', $user->shareholder_id ?? $user->id);
        $memberSince = $user->shareholding_start_date
            ? Carbon::parse($user->shareholding_start_date)->format('d M Y')
            : Carbon::parse($user->created_at)->format('d M Y');

        $payload = [
            'iss' => $serviceEmail,
            'aud' => 'google',
            'typ' => 'savetowallet',
            'iat' => time(),
            'payload' => [
                'genericObjects' => [[
                    'id'              => $objectId,
                    'classId'         => $issuerId . '.' . $classId,
                    'genericType'     => 'GENERIC_TYPE_UNSPECIFIED',
                    'hexBackgroundColor' => '#1a4a1a',
                    'logo' => [
                        'sourceUri' => ['uri' => asset('images/kop-ssb-logo.png')],
                    ],
                    'cardTitle' => [
                        'defaultValue' => ['language' => 'en-US', 'value' => 'KOP-SSB'],
                    ],
                    'subheader' => [
                        'defaultValue' => ['language' => 'en-US', 'value' => 'Membership Card'],
                    ],
                    'header' => [
                        'defaultValue' => ['language' => 'en-US', 'value' => $user->full_name ?? $user->name],
                    ],
                    'textModulesData' => [
                        ['id' => 'shareholder_id', 'header' => 'MEMBER ID',    'body' => $user->shareholder_id ?? '—'],
                        ['id' => 'status',    'header' => 'STATUS',       'body' => ucfirst($user->status ?? 'active')],
                        ['id' => 'since',     'header' => 'MEMBER SINCE', 'body' => $memberSince],
                        ['id' => 'org',       'header' => 'ORGANISATION', 'body' => 'Koperasi Kakitangan Sabah Softwoods Berhad'],
                    ],
                    'barcode' => [
                        'type'  => 'QR_CODE',
                        'value' => $verifyUrl,
                    ],
                    'state' => 'ACTIVE',
                ]],
            ],
        ];

        $jwt = $this->signJwtRS256($payload, $privateKey);
        $saveUrl = 'https://pay.google.com/gp/v/save/' . $jwt;

        return redirect($saveUrl);
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    private function generateIcons(): array
    {
        $green = [26, 74, 26];

        $make = function (int $w, int $h) use ($green): string {
            $im = imagecreatetruecolor($w, $h);
            $bg = imagecolorallocate($im, $green[0], $green[1], $green[2]);
            $fg = imagecolorallocate($im, 163, 230, 53);
            imagefill($im, 0, 0, $bg);
            // Draw a simple 'K' initial
            $size = max(6, (int)($w * 0.4));
            $x    = (int)($w * 0.28);
            $y    = (int)($h * 0.72);
            imagestring($im, 5, $x, $y - $size, 'K', $fg);
            ob_start();
            imagepng($im);
            $data = ob_get_clean();
            imagedestroy($im);
            return $data;
        };

        return [
            'icon'   => $make(29,  29),
            'icon2x' => $make(58,  58),
            'logo'   => $make(160, 50),
            'logo2x' => $make(320, 100),
        ];
    }

    private function signManifest(string $manifestJson, ?string $certPath, string $certPass, ?string $wwdrPath): ?string
    {
        if (!$certPath || !file_exists($certPath)) {
            return null;
        }
        if ($wwdrPath && !file_exists($wwdrPath)) {
            return null;
        }

        $tmpManifest = tempnam(sys_get_temp_dir(), 'manifest_') . '.json';
        $tmpSig      = tempnam(sys_get_temp_dir(), 'signature_');
        file_put_contents($tmpManifest, $manifestJson);

        $cert    = file_get_contents($certPath);
        $privKey = openssl_pkey_get_private($cert, $certPass);
        $certRes = openssl_x509_read($cert);

        $extraCerts = $wwdrPath ? [file_get_contents($wwdrPath)] : [];

        $ok = openssl_pkcs7_sign(
            $tmpManifest,
            $tmpSig,
            $certRes,
            $privKey,
            [],
            PKCS7_BINARY | PKCS7_DETACHED,
            $wwdrPath
        );

        $signature = null;
        if ($ok) {
            // Extract DER-encoded signature from PEM PKCS7
            $sigContent = file_get_contents($tmpSig);
            $parts = explode("\n\n", $sigContent);
            if (isset($parts[1])) {
                $der = base64_decode(str_replace(["\n", "\r"], '', explode('-----', $parts[1])[0]));
                $signature = $der ?: null;
            }
        }

        @unlink($tmpManifest);
        @unlink($tmpSig);

        return $signature;
    }

    private function signJwtRS256(array $payload, string $privateKey): string
    {
        $header  = base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $body    = base64_encode(json_encode($payload));
        $signing = rtrim($header, '=') . '.' . rtrim($body, '=');

        $key = openssl_pkey_get_private($privateKey);
        openssl_sign($signing, $signature, $key, OPENSSL_ALGO_SHA256);

        $sig = rtrim(base64_encode($signature), '=');
        return $signing . '.' . $sig;
    }

    // ── Setup pages ───────────────────────────────────────────────────────
    private function appleSetupPage()
    {
        return response()->view('wallet.apple-setup', [], 200);
    }

    private function googleSetupPage()
    {
        return response()->view('wallet.google-setup', [], 200);
    }
}
