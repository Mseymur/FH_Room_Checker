<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('buildings', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // "AP152"
            $table->string('name')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('buildings');
    }
};