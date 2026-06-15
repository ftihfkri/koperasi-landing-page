<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('agm_attendances', function (Blueprint $table) {
            $table->string('method', 10)->default('qr')->after('ip_address');
            $table->foreignId('marked_by')->nullable()->constrained('users')->nullOnDelete()->after('method');
        });
    }

    public function down(): void
    {
        Schema::table('agm_attendances', function (Blueprint $table) {
            $table->dropForeign(['marked_by']);
            $table->dropColumn(['method', 'marked_by']);
        });
    }
};
