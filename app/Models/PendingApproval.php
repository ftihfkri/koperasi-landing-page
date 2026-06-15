<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PendingApproval extends Model
{
    protected $fillable = [
        'type', 'submitted_by', 'target_user_id', 'target_record_id',
        'payload', 'remarks', 'status', 'admin_remarks', 'reviewed_by', 'reviewed_at',
    ];

    protected $casts = [
        'payload'     => 'array',
        'reviewed_at' => 'datetime',
    ];

    public function submittedBy()  { return $this->belongsTo(User::class, 'submitted_by'); }
    public function targetUser()   { return $this->belongsTo(User::class, 'target_user_id'); }
    public function reviewedBy()   { return $this->belongsTo(User::class, 'reviewed_by'); }

    public function scopePending($q)  { return $q->where('status', 'pending'); }
    public function scopeApproved($q) { return $q->where('status', 'approved'); }
    public function scopeRejected($q) { return $q->where('status', 'rejected'); }

    /**
     * Admin approves — applies the change then marks as approved.
     */
    public function approve(int $adminId, string $adminRemarks = ''): void
    {
        $this->applyPayload();
        $this->update([
            'status'        => 'approved',
            'admin_remarks' => $adminRemarks,
            'reviewed_by'   => $adminId,
            'reviewed_at'   => now(),
        ]);
    }

    /**
     * Admin rejects — no change applied.
     */
    public function reject(int $adminId, string $adminRemarks = ''): void
    {
        $this->update([
            'status'        => 'rejected',
            'admin_remarks' => $adminRemarks,
            'reviewed_by'   => $adminId,
            'reviewed_at'   => now(),
        ]);
    }

    /**
     * Apply the payload changes to the actual records.
     */
    private function applyPayload(): void
    {
        $p = $this->payload;

        switch ($this->type) {

            case 'edit_member':
                User::where('id', $this->target_user_id)->update(
                    array_filter([
                        'shareholder_id'  => $p['shareholder_id']  ?? null,
                        'full_name'  => $p['full_name']  ?? null,
                        'name'       => $p['full_name']  ?? null,
                    ], fn($v) => !is_null($v))
                );
                break;

            case 'toggle_status':
                $isApproved = $p['is_approved'];
                User::where('id', $this->target_user_id)
                    ->update([
                        'is_approved' => $isApproved,
                        'status'      => $isApproved ? 'active' : 'inactive',
                    ]);
                break;

            case 'add_transaction':
                Transaction::create([
                    'user_id'          => $this->target_user_id,
                    'type'             => $p['type'],
                    'amount'           => $p['amount'],
                    'transaction_date' => $p['transaction_date'],
                    'description'      => $p['description'] ?? null,
                ]);
                break;

            case 'edit_transaction':
                Transaction::where('id', $this->target_record_id)->update(
                    array_filter([
                        'type'             => $p['type']             ?? null,
                        'amount'           => $p['amount']           ?? null,
                        'transaction_date' => $p['transaction_date'] ?? null,
                        'description'      => $p['description']      ?? null,
                    ], fn($v) => !is_null($v))
                );
                break;

            case 'delete_transaction':
                Transaction::where('id', $this->target_record_id)->delete();
                break;

            case 'change_tabung':
                TabungKomitmen::setForUser(
                    userId:     $this->target_user_id,
                    amount:     (float) $p['amount'],
                    assignedBy: $this->reviewed_by,
                    notes:      $p['notes'] ?? ('Approved from pending #' . $this->id),
                );
                break;
        }
    }
}