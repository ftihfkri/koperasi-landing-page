<?php

return [

    // ── Apple Wallet ──────────────────────────────────────────────────────
    // 1. Sign in to developer.apple.com → Certificates, IDs & Profiles
    // 2. Create a "Pass Type ID" (e.g. pass.my.kopssb.membership)
    // 3. Download the .p12 certificate, convert to PEM:
    //    openssl pkcs12 -in certificate.p12 -out certificate.pem -nodes
    // 4. Download WWDR certificate from Apple (G4):
    //    https://developer.apple.com/certificationauthority/AppleWWDRCAG4.cer
    //    openssl x509 -inform DER -in AppleWWDRCAG4.cer -out wwdr.pem

    'apple_pass_type_id'   => env('APPLE_PASS_TYPE_ID', ''),       // e.g. pass.my.kopssb.membership
    'apple_team_id'        => env('APPLE_TEAM_ID', ''),            // 10-char Apple Team ID
    'apple_cert_path'      => env('APPLE_CERT_PATH', ''),          // absolute path to certificate.pem
    'apple_cert_password'  => env('APPLE_CERT_PASSWORD', ''),      // cert password (if set during export)
    'apple_wwdr_path'      => env('APPLE_WWDR_PATH', ''),          // absolute path to wwdr.pem

    // ── Google Wallet ─────────────────────────────────────────────────────
    // 1. Go to console.cloud.google.com → Create project → Enable "Google Wallet API"
    // 2. Create a service account → download JSON key → save to storage/app/google-wallet.json
    // 3. Go to pay.google.com/business/console → Get your Issuer ID
    // 4. Create a Generic Pass Class → copy the Class ID

    'google_credentials_path' => env('GOOGLE_WALLET_CREDENTIALS', storage_path('app/google-wallet.json')),
    'google_issuer_id'        => env('GOOGLE_WALLET_ISSUER_ID', ''),   // numeric issuer ID
    'google_class_id'         => env('GOOGLE_WALLET_CLASS_ID', ''),    // e.g. kopssb_membership
];
