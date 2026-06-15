<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
        $table->id();
        $table->string('member_id')->unique()->nullable();
        $table->string('name')->nullable();
        $table->string('full_name')->nullable();
        $table->string('email')->unique();
        $table->timestamp('email_verified_at')->nullable();
        $table->string('password')->nullable();
        // Note: 'shareholder' added later (see 2026_05_12_000001_rename_investor_to_shareholder).
        // We include it in this original enum so that SQLite-based test DBs (which carry
        // forward the CHECK constraint from this CREATE) still accept it after the rename.
        $table->enum('role', ['admin', 'staff', 'investor', 'shareholder'])->default('investor');
        $table->string('provider')->nullable();
        $table->string('provider_id')->nullable();
        $table->string('avatar')->nullable();
        $table->boolean('is_approved')->default(true);
        $table->rememberToken();
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('users');
    }
};
