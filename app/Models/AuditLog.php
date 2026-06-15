<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = [
        'causer_id', 'action', 'subject_type', 'subject_id', 'properties', 'ip_address',
    ];

    protected $casts = [
        'properties' => 'array',
    ];

    public function causer()
    {
        return $this->belongsTo(User::class, 'causer_id');
    }

    public static function record(
        string  $action,
        ?string $subjectType = null,
        ?int    $subjectId   = null,
        array   $properties  = []
    ): static {
        return static::create([
            'causer_id'    => auth()->id(),
            'action'       => $action,
            'subject_type' => $subjectType,
            'subject_id'   => $subjectId,
            'properties'   => $properties ?: null,
            'ip_address'   => request()->ip(),
        ]);
    }
}
