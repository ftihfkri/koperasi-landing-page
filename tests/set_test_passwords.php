<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Set known passwords for admin and staff for QA testing
$adminUser = App\Models\User::where('role', 'admin')->first();
$staffUser = App\Models\User::where('role', 'staff')->first();

if ($adminUser) {
    $adminUser->password = bcrypt('qa_admin_2024');
    $adminUser->save();
    echo "Admin set: " . $adminUser->email . " / qa_admin_2024" . PHP_EOL;
}

if ($staffUser) {
    $staffUser->password = bcrypt('qa_staff_2024');
    $staffUser->save();
    echo "Staff set: " . $staffUser->email . " / qa_staff_2024" . PHP_EOL;
}

echo "Done." . PHP_EOL;
