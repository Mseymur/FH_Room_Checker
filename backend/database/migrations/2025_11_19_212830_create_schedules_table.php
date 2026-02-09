<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained()->onDelete('cascade');
            
            $table->dateTime('start_time');
            $table->dateTime('end_time');
            $table->enum('status', ['FREE', 'BUSY']);
            
            // Details (Merged)
            $table->string('title')->nullable();
            $table->string('teacher')->nullable();
            $table->string('class_name')->nullable();
            $table->string('color')->nullable();
            $table->string('external_id')->nullable();
            
            $table->timestamps();
            
            // Index for fast searching
            $table->index(['room_id', 'start_time']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('schedules');
    }
};