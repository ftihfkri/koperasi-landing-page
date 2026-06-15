<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('tabung_koperasi') && ! Schema::hasTable('tabung_komitmen')) {
            Schema::rename('tabung_koperasi', 'tabung_komitmen');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('tabung_komitmen') && ! Schema::hasTable('tabung_koperasi')) {
            Schema::rename('tabung_komitmen', 'tabung_koperasi');
        }
    }
};
