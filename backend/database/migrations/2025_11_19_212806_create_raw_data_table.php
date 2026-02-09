<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('raw_data', function (Blueprint $table) {
            $table->id();
            // Connects to 'buildings' table
            $table->foreignId('building_id')->constrained()->onDelete('cascade');
            
            $table->longText('content'); // The JSON
            $table->string('hash', 32);  // The Fingerprint
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('raw_data');
    }
};