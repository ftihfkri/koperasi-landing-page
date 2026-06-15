<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TabungKomitmen extends Model
{
    use HasFactory;

    protected $table = 'tabung_komitmen';

    protected $fillable = [
        'user_id',
        'amount',
        'is_active',
        'assigned_by',
        'effective_date',
        'notes',
    ];

    protected $casts = [
        'amount'         => 'decimal:2',
        'is_active'      => 'boolean',
        'effective_date' => 'date',
    ];

    /* ── Relationships ── */

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    /* ── Scopes ── */

    /** Only the currently active record for a member */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /** Full history ordered newest first */
    public function scopeHistory($query)
    {
        return $query->orderByDesc('created_at');
    }

    /* ── Static helpers ── */

    /**
     * Get the current active Tabung Koperasi amount for a user.
     * Returns 0.00 if no record exists yet.
     */
    public static function currentAmountFor(int $userId): float
    {
        $record = static::where('user_id', $userId)
            ->where('is_active', true)
            ->latest()
            ->first();

        return $record ? (float) $record->amount : 0.0;
    }

    /**
     * Staff assigns / updates the Tabung Koperasi amount for a member.
     * Deactivates all previous records and inserts a new active one.
     *
     * Usage:
     *   TabungKomitmen::setForUser(
     *       userId: $member->id,
     *       amount: 150.00,
     *       assignedBy: Auth::id(),
     *       notes: 'Board decision Apr 2026',
     *   );
     */
    public static function setForUser(
        int    $userId,
        float  $amount,
        ?int   $assignedBy = null,
        string $notes = ''
    ): static {
        // Deactivate all existing active records for this member
        static::where('user_id', $userId)
              ->where('is_active', true)
              ->update(['is_active' => false]);

        // Insert new active record
        return static::create([
            'user_id'        => $userId,
            'amount'         => $amount,
            'is_active'      => true,
            'assigned_by'    => $assignedBy,
            'effective_date' => now()->toDateString(),
            'notes'          => $notes,
        ]);
    }
}