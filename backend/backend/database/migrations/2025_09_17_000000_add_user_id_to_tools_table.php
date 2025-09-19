<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tools', function (Blueprint $table) {
            if (!Schema::hasColumn('tools', 'user_id')) {
                $table->foreignId('user_id')->nullable()->after('difficulty')->constrained()->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('tools', function (Blueprint $table) {
            if (Schema::hasColumn('tools', 'user_id')) {
                $table->dropConstrainedForeignId('user_id');
            }
        });
    }
};


