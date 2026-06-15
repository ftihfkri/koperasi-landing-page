<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admin_notifications', function (Blueprint $table) {
            $table->string('title', 255)->nullable()->after('message');
            $table->string('ticket_type', 20)->default('general')->after('title');
            $table->unsignedBigInteger('reference_id')->nullable()->after('ticket_type');
            $table->string('status', 20)->default('open')->after('reference_id');
        });
    }

    public function down(): void
    {
        Schema::table('admin_notifications', function (Blueprint $table) {
            $table->dropColumn(['title', 'ticket_type', 'reference_id', 'status']);
        });
    }
};
