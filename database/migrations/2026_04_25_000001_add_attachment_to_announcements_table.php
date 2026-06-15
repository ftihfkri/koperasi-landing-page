<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->string('attachment_path')->nullable()->after('is_active');
            $table->string('attachment_name')->nullable()->after('attachment_path');
        });
    }

    public function down()
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropColumn(['attachment_path', 'attachment_name']);
        });
    }
};
