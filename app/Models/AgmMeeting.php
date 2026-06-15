<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AgmMeeting extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'scheduled_at', 'location', 'notes',
        'qr_token', 'created_by', 'is_active',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'is_active'    => 'boolean',
    ];

    public function attendances() { return $this->hasMany(AgmAttendance::class, 'meeting_id'); }
    public function creator()     { return $this->belongsTo(User::class, 'created_by'); }

    public static function generateToken(): string
    {
        return bin2hex(random_bytes(16));
    }
}
