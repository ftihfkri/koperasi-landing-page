<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('status', ['pending', 'active', 'inactive'])
                  ->default('pending')
                  ->after('is_approved');
        });

        // ── Backfill existing rows from is_approved ──────────────────────
        // is_approved = 1 AND has membership_start_date → active
        // is_approved = 1 AND no membership_start_date  → active (staff/admin)
        // is_approved = 0 AND has membership_start_date → inactive (was deactivated)
        // is_approved = 0 AND no membership_start_date  → pending (new registration)
        DB::statement("
            UPDATE users SET status = CASE
                WHEN is_approved = 1 THEN 'active'
                WHEN is_approved = 0 AND membership_start_date IS NOT NULL THEN 'inactive'
                ELSE 'pending'
            END
        ");
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};