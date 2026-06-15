<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AgmAttendance extends Model
{
    protected $fillable = [
        'meeting_id', 'user_id', 'scanned_at', 'ip_address', 'method', 'marked_by',
    ];

    protected $casts = [
        'scanned_at' => 'datetime',
    ];

    public function meeting() { return $this->belongsTo(AgmMeeting::class, 'meeting_id'); }
    public function user()    { return $this->belongsTo(User::class); }
}
