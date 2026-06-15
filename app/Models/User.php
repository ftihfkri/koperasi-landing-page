<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'shareholder_id',
        'name',
        'full_name',
        'email',
        'phone_number',
        'password',
        'role',
        'provider',
        'provider_id',
        'avatar',
        'is_approved',
        'status',
        'shareholding_start_date',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at'     => 'datetime',
            'password'              => 'hashed',
            'is_approved'           => 'boolean',
            'shareholding_start_date' => 'date',
        ];
    }

    /* ── Relationships ── */
public function dividends()
    {
        return $this->hasMany(Dividend::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Full audit history of all Tabung Koperasi records (newest first).
     * Use this to show the history log.
     */
    public function tabungKomitmen()
    {
        return $this->hasMany(TabungKomitmen::class)->latest();
    }

    /**
     * Only the single currently active Tabung Koperasi record.
     * This gives the current fixed lump sum amount.
     */
    public function activeTabung()
    {
        return $this->hasOne(TabungKomitmen::class)
                    ->where('is_active', true)
                    ->latest();
    }

    /**
     * Convenience accessor — returns the current RM amount directly.
     * Usage: $user->tabung_amount  →  e.g. 100.00
     */
    public function getTabungAmountAttribute(): float
    {
        return TabungKomitmen::currentAmountFor($this->id);
    }

    /* ── Accessors ── */

    public function getDisplayNameAttribute(): string
    {
        return $this->full_name ?: ($this->name ?: $this->email);
    }
}