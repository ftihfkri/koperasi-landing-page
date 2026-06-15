<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$jar = new \GuzzleHttp\Cookie\CookieJar();
$baseUrl = 'http://localhost/Koperasi_combine_29_4_26/public';

$r1 = Http::withOptions(['cookies' => $jar])->get("$baseUrl/login");
preg_match('/name="_token"\s+value="([^"]+)"/', $r1->body(), $matches);
$token = $matches[1] ?? '';

$r2 = Http::withOptions(['cookies' => $jar])->asForm()->post("$baseUrl/login", [
    '_token' => $token,
    'email' => 'admin_loadtest@gmail.com',
    'password' => 'Fatih1234'
]);

$r3 = Http::withOptions(['cookies' => $jar])->get("$baseUrl/admin/agm/2/attendance");
echo "Status: " . $r3->status() . "\n";
echo "Body: " . substr($r3->body(), 0, 200) . "\n";
