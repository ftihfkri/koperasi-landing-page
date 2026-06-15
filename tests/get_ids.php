<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$meeting = \App\Models\AgmMeeting::latest()->first();
$users = \App\Models\User::where('email', 'like', 'lt_member%')->take(500)->get(['id', 'email']);

$json = json_encode([
    'meeting_id' => $meeting->id,
    'qr_token' => $meeting->qr_token,
    'users' => $users->toArray()
]);
file_put_contents(__DIR__.'/test_data.json', $json);
