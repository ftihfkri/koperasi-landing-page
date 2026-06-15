<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('dividend_rates', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('year')->unique();
            $table->decimal('percentage', 5, 2);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('dividend_rates');
    }
};
