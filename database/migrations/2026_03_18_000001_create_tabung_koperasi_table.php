<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * tabung_komitmen stores ONE active amount per member.
     * Every time staff updates the amount, a new row is inserted
     * and the previous row's is_active is set to false.
     * The current amount = latest row where is_active = true.
     */
    public function up(): void
    {
        Schema::create('tabung_komitmen', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                  ->constrained()
                  ->cascadeOnDelete();

            // The fixed lump sum amount for this member
            $table->decimal('amount', 14, 2)->default(0);

            // Is this the currently active record for this member?
            $table->boolean('is_active')->default(true);

            // Who assigned / updated it (staff)
            $table->foreignId('assigned_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            // When this record became active
            $table->date('effective_date')->nullable();

            // Optional note (e.g. "Initial assignment" / "Board decision Apr 2026")
            $table->string('notes', 255)->nullable();

            $table->timestamps();

            // Quick lookup: get the current active amount for a member
            $table->index(['user_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tabung_komitmen');
    }
};