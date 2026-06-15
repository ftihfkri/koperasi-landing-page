<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('dividends', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('year');
            $table->decimal('rate', 5, 2);
            $table->decimal('amount', 14, 2)->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'year']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('dividends');
    }
};