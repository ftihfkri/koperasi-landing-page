<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agm_meetings', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->dateTime('scheduled_at');
            $table->string('location')->nullable();
            $table->text('notes')->nullable();
            $table->string('qr_token', 64)->unique();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agm_meetings');
    }
};
