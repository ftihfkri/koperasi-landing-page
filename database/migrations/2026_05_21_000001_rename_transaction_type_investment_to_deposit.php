<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('transactions')) {
            return;
        }

        if (DB::connection()->getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE transactions MODIFY type ENUM('investment','deposit','dividend','withdrawal') NOT NULL");
            DB::table('transactions')->where('type', 'investment')->update(['type' => 'deposit']);
            DB::statement("ALTER TABLE transactions MODIFY type ENUM('deposit','dividend','withdrawal') NOT NULL");
        } else {
            DB::table('transactions')->where('type', 'investment')->update(['type' => 'deposit']);
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('transactions')) {
            return;
        }

        if (DB::connection()->getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE transactions MODIFY type ENUM('investment','deposit','dividend','withdrawal') NOT NULL");
            DB::table('transactions')->where('type', 'deposit')->update(['type' => 'investment']);
            DB::statement("ALTER TABLE transactions MODIFY type ENUM('investment','dividend','withdrawal') NOT NULL");
        } else {
            DB::table('transactions')->where('type', 'deposit')->update(['type' => 'investment']);
        }
    }
};
