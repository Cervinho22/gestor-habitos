<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Habit extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'name', 
        'frequency',
        'current_streak',
        'last_completed_at',
    ];
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}