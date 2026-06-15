<?php

namespace App\Http\Controllers;

use App\Mail\ShareholdingApproved;
use App\Models\AuditLog;
use App\Models\PendingApproval;
use App\Models\Transaction;
use App\Models\User;
use App\Models\TabungKomitmen;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

class StaffActionController extends Controller
{
    /* ── Member Search ───────────────────────────────────────────── */
    public function searchMembers(Request $request)
    {
        $q = $request->get('q', '');
        $members = User::when($q, fn($query) => $query->where(function($sq) use ($q) {
                $sq->where('full_name',  'like', "%{$q}%")
                   ->orWhere('name',      'like', "%{$q}%")
                   ->orWhere('shareholder_id', 'like', "%{$q}%")
                   ->orWhere('email',     'like', "%{$q}%");
            }))
            ->latest()->paginate(15);

        return response()->json([
            'data' => $members->map(fn($u) => [
                'id'           => $u->id,
                'name'         => $u->full_name ?? $u->name,
                'shareholder_id'    => $u->shareholder_id,
                'email'        => $u->email,
                'phone_number' => $u->phone_number,
                'is_approved'  => $u->is_approved,
                'status'       => $u->status ?? ($u->is_approved ? 'active' : 'pending'),
                'joined'       => $u->created_at ? \Carbon\Carbon::parse($u->created_at)->format('d M Y') : null,
                'start_date'   => $u->shareholding_start_date ? \Carbon\Carbon::parse($u->shareholding_start_date)->format('Y-m-d') : null,
                'deposit'      => (float) $u->transactions()->where('type','deposit')->sum('amount'),
                'dividend'     => (float) $u->transactions()->where('type','dividend')->sum('amount'),
                'tabung'       => Schema::hasTable('tabung_komitmen')
                    ? TabungKomitmen::currentAmountFor($u->id) : 0,
            ]),
            'total'        => $members->total(),
            'current_page' => $members->currentPage(),
            'last_page'    => $members->lastPage(),
        ]);
    }

    /* ── Member Detail (profile + transactions) ──────────────────── */
    public function getMember(int $userId)
    {
        $u = User::findOrFail($userId);
        $transactions = $u->transactions()->orderByDesc('transaction_date')->get()
            ->map(fn($t) => [
                'id'          => $t->id,
                'date'        => $t->transaction_date ? \Carbon\Carbon::parse($t->transaction_date)->format('Y-m-d') : null,
                'type'        => strtoupper($t->type),
                'amount'      => (float) $t->amount,
                'description' => $t->description,
            ]);

        $tabungHistory = [];
        if (Schema::hasTable('tabung_komitmen')) {
            $tabungHistory = $u->tabungKomitmen()->latest()->get()
                ->map(fn($r) => [
                    'id'             => $r->id,
                    'amount'         => (float) $r->amount,
                    'is_active'      => $r->is_active,
                    'effective_date' => $r->effective_date ? \Carbon\Carbon::parse($r->effective_date)->format('Y-m-d') : null,
                    'notes'          => $r->notes,
                    'created_at'     => $r->created_at ? \Carbon\Carbon::parse($r->created_at)->format('d M Y') : null,
                ])->toArray();
        }

        $totalDeposit    = (float) $u->transactions()->where('type','deposit')->sum('amount');
        $totalDividendTx = (float) $u->transactions()->where('type','dividend')->sum('amount');
        $totalWithdrawal = (float) $u->transactions()->where('type','withdrawal')->sum('amount');

        return response()->json([
            'profile' => [
                'id'           => $u->id,
                'shareholder_id'    => $u->shareholder_id,
                'name'         => $u->full_name ?? $u->name,
                'email'        => $u->email,
                'phone_number' => $u->phone_number,
                'is_approved'  => $u->is_approved,
                'status'       => $u->status ?? ($u->is_approved ? 'active' : 'pending'),
                'role'         => $u->role,
                'start_date'   => $u->shareholding_start_date ? \Carbon\Carbon::parse($u->shareholding_start_date)->format('Y-m-d') : null,
                'joined'       => $u->created_at ? \Carbon\Carbon::parse($u->created_at)->format('d M Y') : null,
            ],
            'summary' => [
                'current_account' => round($totalDeposit + $totalDividendTx - $totalWithdrawal, 2),
                'total_deposited' => round($totalDeposit - $totalWithdrawal, 2),
                'total_dividend'  => round($totalDividendTx, 2),
                'tabung'          => Schema::hasTable('tabung_komitmen')
                    ? TabungKomitmen::currentAmountFor($u->id) : 0,
            ],
            'transactions'   => $transactions,
            'tabung_history' => $tabungHistory,
        ]);
    }

    /* ── Approve new registration ────────────────────────────────── */
    public function approveRegistration(Request $request, int $userId)
    {
        $user = User::findOrFail($userId);

        // Activate the account so investor can now log in
        $user->is_approved = true;
        $user->status      = 'active';

        // Set shareholding_start_date to today if not already set
        if (! $user->shareholding_start_date) {
            $user->shareholding_start_date = today();
        }

        $user->save();

        AuditLog::record('member.approved', 'user', $user->id, [
            'shareholder_id' => $user->shareholder_id,
            'name'      => $user->full_name ?? $user->name,
        ]);

        try {
            Mail::to($user->email)->send(new ShareholdingApproved($user));
        } catch (\Exception) {}

        return response()->json([
            'message' => "Account for {$user->full_name} has been approved. They can now log in.",
        ]);
    }

    /* ── Submit: Edit Member ──────────────────────────────────────── */
    public function submitEditMember(Request $request, int $userId)
    {
        $v = $request->validate([
            'shareholder_id' => 'nullable|string|max:50',
            'full_name' => 'nullable|string|max:255',
            'remarks'   => 'nullable|string|max:500',
        ]);

        PendingApproval::create([
            'type'           => 'edit_member',
            'submitted_by'   => Auth::id(),
            'target_user_id' => $userId,
            'payload'        => array_filter([
                'shareholder_id' => $v['shareholder_id'] ?? null,
                'full_name' => $v['full_name'] ?? null,
            ]),
            'remarks' => $v['remarks'] ?? null,
        ]);

        return response()->json(['message' => 'Edit submitted for admin approval.']);
    }

    /* ── Submit: Toggle Status ───────────────────────────────────── */
    public function submitToggleStatus(Request $request, int $userId)
    {
        $v = $request->validate([
            'remarks' => 'nullable|string|max:500',
        ]);

        // Fetch current status from DB and TOGGLE it — never trust the frontend value
        $user = User::findOrFail($userId);
        // Toggle: active → inactive, anything else → active
        $newIsApproved = $user->status !== 'active'; // if currently active, new value = false (deactivate)

        PendingApproval::create([
            'type'           => 'toggle_status',
            'submitted_by'   => Auth::id(),
            'target_user_id' => $userId,
            'payload'        => ['is_approved' => $newIsApproved],
            'remarks'        => $v['remarks'] ?? null,
        ]);

        return response()->json(['message' => 'Status change submitted for admin approval.']);
    }

    /* ── Submit: Add Transaction ─────────────────────────────────── */
    public function submitAddTransaction(Request $request, int $userId)
    {
        $v = $request->validate([
            'type'             => 'required|in:deposit,dividend,withdrawal',
            'amount'           => 'required|numeric|min:0.01',
            'transaction_date' => 'required|date',
            'description'      => 'nullable|string|max:255',
            'remarks'          => 'nullable|string|max:500',
        ]);

        PendingApproval::create([
            'type'           => 'add_transaction',
            'submitted_by'   => Auth::id(),
            'target_user_id' => $userId,
            'payload'        => [
                'type'             => $v['type'],
                'amount'           => $v['amount'],
                'transaction_date' => $v['transaction_date'],
                'description'      => $v['description'] ?? null,
            ],
            'remarks' => $v['remarks'] ?? null,
        ]);

        return response()->json(['message' => 'Transaction submitted for admin approval.']);
    }

    /* ── Submit: Edit Transaction ────────────────────────────────── */
    public function submitEditTransaction(Request $request, int $txId)
    {
        $tx = Transaction::findOrFail($txId);
        $v  = $request->validate([
            'type'             => 'nullable|in:deposit,dividend,withdrawal',
            'amount'           => 'nullable|numeric|min:0.01',
            'transaction_date' => 'nullable|date',
            'description'      => 'nullable|string|max:255',
            'remarks'          => 'nullable|string|max:500',
        ]);

        PendingApproval::create([
            'type'             => 'edit_transaction',
            'submitted_by'     => Auth::id(),
            'target_user_id'   => $tx->user_id,
            'target_record_id' => $txId,
            'payload'          => array_filter([
                'type'             => $v['type']             ?? null,
                'amount'           => $v['amount']           ?? null,
                'transaction_date' => $v['transaction_date'] ?? null,
                'description'      => $v['description']      ?? null,
            ], fn($val) => !is_null($val)),
            'remarks' => $v['remarks'] ?? null,
        ]);

        return response()->json(['message' => 'Transaction edit submitted for admin approval.']);
    }

    /* ── Submit: Delete Transaction ──────────────────────────────── */
    public function submitDeleteTransaction(Request $request, int $txId)
    {
        $tx = Transaction::findOrFail($txId);
        $v  = $request->validate(['remarks' => 'nullable|string|max:500']);

        PendingApproval::create([
            'type'             => 'delete_transaction',
            'submitted_by'     => Auth::id(),
            'target_user_id'   => $tx->user_id,
            'target_record_id' => $txId,
            'payload'          => [
                'transaction_date' => $tx->transaction_date ? \Carbon\Carbon::parse($tx->transaction_date)->format('Y-m-d') : null,
                'amount'           => (float) $tx->amount,
                'type'             => $tx->type,
            ],
            'remarks' => $v['remarks'] ?? null,
        ]);

        return response()->json(['message' => 'Delete request submitted for admin approval.']);
    }

    /* ── Submit: Change Tabung ───────────────────────────────────── */
    public function submitChangeTabung(Request $request, int $userId)
    {
        $v = $request->validate([
            'amount'  => 'required|numeric|min:0',
            'notes'   => 'nullable|string|max:255',
            'remarks' => 'nullable|string|max:500',
        ]);

        PendingApproval::create([
            'type'           => 'change_tabung',
            'submitted_by'   => Auth::id(),
            'target_user_id' => $userId,
            'payload'        => [
                'amount' => $v['amount'],
                'notes'  => $v['notes'] ?? null,
            ],
            'remarks' => $v['remarks'] ?? null,
        ]);

        return response()->json(['message' => 'Tabung Koperasi change submitted for admin approval.']);
    }

    /* ── Mark notification as read ───────────────────────────────── */
    public function markNotifRead(int $notifId)
    {
        \App\Models\AdminNotification::where('id', $notifId)
            ->where('to_staff', Auth::id())
            ->update(['is_read' => true]);

        return response()->json(['message' => 'Marked as read.']);
    }

    /* ── Reply to a notification (staff → admin) ─────────────────── */
    public function replyNotification(Request $request, int $notifId)
    {
        $notif = \App\Models\AdminNotification::where('id', $notifId)
            ->where('to_staff', Auth::id())
            ->firstOrFail();

        $request->validate(['message' => 'required|string|max:2000']);

        \App\Models\NotificationReply::create([
            'notification_id' => $notif->id,
            'sender_id'       => Auth::id(),
            'sender_role'     => 'staff',
            'message'         => $request->message,
        ]);

        // Mark original as read when staff replies
        $notif->update(['is_read' => true]);

        return response()->json(['message' => 'Reply sent.']);
    }

    /* ── All Transactions (with filter) ─────────────────────────────── */
    public function getTransactions(Request $request)
    {
        $type      = $request->get('type', 'all');      // all, deposit, dividend, withdrawal
        $range     = $request->get('range', 'all');     // all, year, month, week
        $yearVal   = $request->get('year', now()->year);

        $query = Transaction::with('user:id,full_name,name,shareholder_id')
            ->orderByDesc('transaction_date');

        // Filter by type
        if ($type !== 'all') {
            $query->where('type', $type);
        }

        // Filter by time range
        if ($range === 'week') {
            $query->where('transaction_date', '>=', now()->startOfWeek());
        } elseif ($range === 'month') {
            $query->whereMonth('transaction_date', now()->month)
                  ->whereYear('transaction_date', now()->year);
        } elseif ($range === 'year') {
            $query->whereYear('transaction_date', $yearVal);
        }

        $transactions = $query->get()->map(fn($t) => [
            'id'     => $t->id,
            'date'   => $t->transaction_date
                ? Carbon::parse($t->transaction_date)->format('Y-m-d')
                : null,
            'member' => $t->user?->full_name ?? $t->user?->name ?? '—',
            'mid'    => $t->user?->shareholder_id ?? '—',
            'type'   => strtoupper($t->type),
            'amount' => (float) $t->amount,
            'desc'   => $t->description,
        ]);

        return response()->json([
            'transactions' => $transactions,
            'total'        => $transactions->count(),
            'filters'      => compact('type', 'range', 'yearVal'),
        ]);
    }

    /* ── Download Transactions as CSV ───────────────────────────────── */
    public function downloadTransactions(Request $request)
    {
        $type    = $request->get('type', 'all');
        $range   = $request->get('range', 'all');
        $yearVal = $request->get('year', now()->year);

        $query = Transaction::with('user:id,full_name,name,shareholder_id')
            ->orderByDesc('transaction_date');

        if ($type !== 'all') {
            $query->where('type', $type);
        }

        if ($range === 'week') {
            $query->where('transaction_date', '>=', now()->startOfWeek());
        } elseif ($range === 'month') {
            $query->whereMonth('transaction_date', now()->month)
                  ->whereYear('transaction_date', now()->year);
        } elseif ($range === 'year') {
            $query->whereYear('transaction_date', $yearVal);
        }

        $transactions = $query->get();

        // Build filename
        $label    = $type === 'all' ? 'All' : ucfirst($type);
        $rangeStr = match($range) {
            'week'  => 'Week_' . now()->startOfWeek()->format('Ymd'),
            'month' => 'Month_' . now()->format('Y-m'),
            'year'  => 'Year_' . $yearVal,
            default => 'All',
        };
        $filename = "KSS_Transactions_{$label}_{$rangeStr}.csv";

        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($transactions) {
            $handle = fopen('php://output', 'w');
            // CSV header
            fputcsv($handle, ['Date', 'Member', 'Member ID', 'Type', 'Amount (RM)', 'Description']);
            foreach ($transactions as $t) {
                fputcsv($handle, [
                    $t->transaction_date ? Carbon::parse($t->transaction_date)->format('Y-m-d') : '—',
                    $t->user?->full_name ?? $t->user?->name ?? '—',
                    $t->user?->shareholder_id ?? '—',
                    strtoupper($t->type),
                    number_format((float) $t->amount, 2),
                    $t->description ?? '',
                ]);
            }
            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

}