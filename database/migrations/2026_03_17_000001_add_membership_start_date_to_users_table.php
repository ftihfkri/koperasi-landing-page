<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Only add the column if it doesn't already exist
        if (!Schema::hasColumn('users', 'membership_start_date')) {
            Schema::table('users', function (Blueprint $table) {
                $table->date('membership_start_date')->nullable()->after('is_approved');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'membership_start_date')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('membership_start_date');
            });
        }
    }
};