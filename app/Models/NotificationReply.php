<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationReply extends Model
{
    protected $fillable = ['notification_id', 'sender_id', 'sender_role', 'message'];

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function notification()
    {
        return $this->belongsTo(AdminNotification::class, 'notification_id');
    }
}