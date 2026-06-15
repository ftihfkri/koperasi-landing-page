<?php
// Migration: create_notification_replies_table.php
// Run: php artisan migrate

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_replies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notification_id')->constrained('admin_notifications')->onDelete('cascade');
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            $table->string('sender_role', 20); // 'admin' or 'staff'
            $table->text('message');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_replies');
    }
};