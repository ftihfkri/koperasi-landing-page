<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pending_approvals', function (Blueprint $table) {
            $table->id();
            $table->enum('type', [
                'edit_member',
                'add_transaction',
                'edit_transaction',
                'delete_transaction',
                'change_tabung',
                'toggle_status',
            ]);
            $table->foreignId('submitted_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('target_user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('target_record_id')->nullable();
            $table->json('payload');
            $table->text('remarks')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('admin_remarks')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->index(['status', 'type']);
            $table->index('target_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pending_approvals');
    }
};