<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('from_admin')->constrained('users')->cascadeOnDelete();
            $table->foreignId('to_staff')->constrained('users')->cascadeOnDelete();
            $table->foreignId('about_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('message');
            $table->boolean('is_read')->default(false);
            $table->timestamps();
            $table->index(['to_staff', 'is_read']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_notifications');
    }
};