<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Category extends Model
{
    protected $fillable = ['name'];

    public function tools(): BelongsToMany
    {
        return $this->belongsToMany(Tool::class, 'category_tool')->withTimestamps();
    }
}
