<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tool extends Model
{
    protected $fillable = [
        'name',
        'description',
        'documentation_url',
        'video_url',
        'difficulty',
        'user_id',
        'status',
    ];

    /**
     * Categories this tool belongs to.
     */
    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'category_tool')->withTimestamps();
    }

    /**
     * Roles associated with this tool.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_tool')->withTimestamps();
    }

    /**
     * Creator/owner of this tool.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
