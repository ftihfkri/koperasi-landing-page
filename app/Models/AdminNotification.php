<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminNotification extends Model
{
    protected $fillable = ['from_admin', 'to_staff', 'about_user_id', 'message', 'is_read', 'title', 'ticket_type', 'reference_id', 'status'];
    protected $casts    = ['is_read' => 'boolean'];

    public function fromAdmin()  { return $this->belongsTo(User::class, 'from_admin'); }
    public function toStaff()    { return $this->belongsTo(User::class, 'to_staff'); }
    public function aboutUser()  { return $this->belongsTo(User::class, 'about_user_id'); }

    public function scopeUnread($q) { return $q->where('is_read', false); }
}