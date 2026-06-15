<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Rename DB-side identifiers that pair with the Investor->Shareholder
     * UI terminology refactor:
     *
     *   - users.role value 'investor' -> 'shareholder' (+ enum redefine)
     *   - users.member_id -> users.shareholder_id
     *   - users.membership_start_date -> users.shareholding_start_date
     *
     * Uses raw SQL because Laravel 9's Schema::renameColumn() requires
     * doctrine/dbal which isn't installed in this project.
     *
     * Uses CHANGE COLUMN syntax (not RENAME COLUMN) so it works on both
     * MySQL 5.7+ AND MariaDB. MariaDB only added RENAME COLUMN in 10.5.2;
     * MySQL added it in 8.0. CHANGE COLUMN has worked on both since
     * forever. Each step is wrapped in hasColumn() so the migration is
     * idempotent — safe to re-run if a previous attempt half-applied.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        // 1. Extend role enum (MySQL/MariaDB) to accept the new value
        //    alongside the old, so the UPDATE in step 2 doesn't violate
        //    the enum constraint.
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY role ENUM('admin','staff','investor','shareholder') NOT NULL DEFAULT 'shareholder'");
        }

        // 2. Migrate existing rows
        DB::table('users')->where('role', 'investor')->update(['role' => 'shareholder']);

        // 3. Tighten the enum (MySQL/MariaDB): drop the legacy 'investor'
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY role ENUM('admin','staff','shareholder') NOT NULL DEFAULT 'shareholder'");
        }

        // 4. Rename columns. CHANGE COLUMN syntax works on MySQL + MariaDB.
        if (Schema::hasColumn('users', 'member_id')) {
            if ($driver === 'mysql') {
                DB::statement('ALTER TABLE users CHANGE COLUMN member_id shareholder_id VARCHAR(255) NULL');
            } else {
                DB::statement('ALTER TABLE users RENAME COLUMN member_id TO shareholder_id');
            }
        }
        if (Schema::hasColumn('users', 'membership_start_date')) {
            if ($driver === 'mysql') {
                DB::statement('ALTER TABLE users CHANGE COLUMN membership_start_date shareholding_start_date DATE NULL');
            } else {
                DB::statement('ALTER TABLE users RENAME COLUMN membership_start_date TO shareholding_start_date');
            }
        }
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if (Schema::hasColumn('users', 'shareholder_id')) {
            if ($driver === 'mysql') {
                DB::statement('ALTER TABLE users CHANGE COLUMN shareholder_id member_id VARCHAR(255) NULL');
            } else {
                DB::statement('ALTER TABLE users RENAME COLUMN shareholder_id TO member_id');
            }
        }
        if (Schema::hasColumn('users', 'shareholding_start_date')) {
            if ($driver === 'mysql') {
                DB::statement('ALTER TABLE users CHANGE COLUMN shareholding_start_date membership_start_date DATE NULL');
            } else {
                DB::statement('ALTER TABLE users RENAME COLUMN shareholding_start_date TO membership_start_date');
            }
        }

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY role ENUM('admin','staff','investor','shareholder') NOT NULL DEFAULT 'investor'");
        }
        DB::table('users')->where('role', 'shareholder')->update(['role' => 'investor']);
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY role ENUM('admin','staff','investor') NOT NULL DEFAULT 'investor'");
        }
    }
};
