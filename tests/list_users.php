<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$users = App\Models\User::select('id','name','email','role','status','shareholder_id')->orderBy('role')->get();
foreach ($users as $u) {
    echo $u->role . ' | ' . $u->email . ' | member_id:' . $u->shareholder_id . ' | status:' . $u->status . PHP_EOL;
}
echo "Total: " . $users->count() . PHP_EOL;
