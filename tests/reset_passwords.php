<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Reset all three test users to the real password: Fatih1234
$emails = ['1@gmail.com', '2@gmail.com', '3@gmail.com'];
foreach ($emails as $email) {
    $user = App\Models\User::where('email', $email)->first();
    if ($user) {
        $user->password = bcrypt('Fatih1234');
        $user->save();
        echo "Reset: {$user->email} (role: {$user->role}) -> Fatih1234" . PHP_EOL;
    } else {
        echo "NOT FOUND: {$email}" . PHP_EOL;
    }
}
echo "Done." . PHP_EOL;
