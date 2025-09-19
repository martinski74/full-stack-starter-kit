<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    protected $fillable = ['name'];

    public function tools(): BelongsToMany
    {
        return $this->belongsToMany(Tool::class, 'role_tool')->withTimestamps();
    }
}


