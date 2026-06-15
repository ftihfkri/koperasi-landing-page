<?php

namespace App\Http\Controllers;

use App\Models\AdminNotification;
use App\Models\PendingApproval;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

class StaffDashboardDataController extends Controller
{
    public function __invoke(Request $request)
    {
        $staff = Auth::user();

        // ── KPI — staff only manages investors ───────────────────────
        $totalMembers    = User::count();
        $activeMembers   = User::where('status', 'active')->count();
        $inactiveMembers = User::where('status', 'inactive')->count();
        $pendingMembers  = User::where('status', 'pending')->count();

        // Accounts to verify = investors with status pending (new registrations awaiting staff approval)
        $accountsToVerify = User::where('status', 'pending')->count();

        $txThisMonth = Transaction::whereMonth('transaction_date', now()->month)
            ->whereYear('transaction_date', now()->year)
            ->count();

        $txToday = Transaction::whereDate('transaction_date', today())->count();

        $pendingAdmin = PendingApproval::where('submitted_by', $staff->id)
            ->where('status', 'pending')
            ->count();

        $unreadCount = AdminNotification::where('to_staff', $staff->id)
            ->where('is_read', false)
            ->count();

        $notifications = AdminNotification::where('to_staff', $staff->id)
            ->with('fromAdmin:id,full_name,name', 'aboutUser:id,full_name,name,shareholder_id')
            ->latest()->take(50)->get()
            ->map(fn($n) => [
                'id'           => $n->id,
                'title'        => $n->title,
                'message'      => $n->message,
                'ticket_type'  => $n->ticket_type ?? 'general',
                'reference_id' => $n->reference_id,
                'status'       => $n->status ?? 'open',
                'from'         => $n->fromAdmin?->full_name ?? $n->fromAdmin?->name ?? 'Admin',
                'about'        => $n->aboutUser
                    ? ($n->aboutUser->full_name ?? $n->aboutUser->name)
                    : null,
                'about_id'     => $n->about_user_id,
                'is_read'      => $n->is_read,
                'created_at'   => $n->created_at
                    ? Carbon::parse($n->created_at)->format('d M Y H:i')
                    : null,
                'replies'      => \App\Models\NotificationReply::where('notification_id', $n->id)
                    ->with('sender:id,full_name,name,role')
                    ->orderBy('created_at')
                    ->get()
                    ->map(fn($r) => [
                        'id'          => $r->id,
                        'message'     => $r->message,
                        'sender_name' => $r->sender?->full_name ?? $r->sender?->name ?? '—',
                        'sender_role' => $r->sender_role,
                        'created_at'  => Carbon::parse($r->created_at)->format('d M Y H:i'),
                    ])->toArray(),
            ]);

        // ── Investor members only (staff manages investors) ──────────
        $allMembers = User::orderBy('id')
            ->get()
            ->map(fn($u) => [
                'id'          => $u->id,
                'name'         => $u->full_name ?? $u->name,
                'shareholder_id'    => $u->shareholder_id,
                'email'        => $u->email,
                'phone_number' => $u->phone_number,
                'role'         => $u->role,
                'is_approved'  => $u->is_approved,
                'status'       => $u->status ?? ($u->is_approved ? 'active' : 'pending'),
                'joined'      => $u->created_at
                    ? Carbon::parse($u->created_at)->format('d M Y')
                    : null,
                'start_date'  => $u->shareholding_start_date
                    ? Carbon::parse($u->shareholding_start_date)->format('Y-m-d')
                    : null,
                'deposit'     => (float) $u->transactions()
                    ->where('type', 'deposit')->sum('amount'),
                'dividend'    => (float) $u->transactions()
                    ->where('type', 'dividend')->sum('amount'),
                'tabung'      => Schema::hasTable('tabung_komitmen')
                    ? \App\Models\TabungKomitmen::currentAmountFor($u->id)
                    : 0,
                'tx_count'    => $u->transactions()->count(),
            ]);

        // ── Pending verifications = investors with status pending ─────
        $newRegistrations = User::where('status', 'pending')
            ->latest()
            ->get()
            ->map(fn($u) => [
                'id'     => $u->id,
                'name'   => $u->full_name ?? $u->name,
                'mid'    => $u->shareholder_id,
                'email'  => $u->email,
                'joined' => $u->created_at
                    ? Carbon::parse($u->created_at)->format('d M Y')
                    : null,
            ]);

        // ── Recent transactions ───────────────────────────────────────
        $recentTx = Transaction::with('user:id,full_name,name,shareholder_id')
            ->latest('transaction_date')
            ->take(10)
            ->get()
            ->map(fn($t) => [
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

        // ── My pending approvals ──────────────────────────────────────
        $myPending = PendingApproval::where('submitted_by', $staff->id)
            ->with('targetUser:id,full_name,name,shareholder_id')
            ->latest()
            ->take(20)
            ->get()
            ->map(fn($p) => [
                'id'         => $p->id,
                'type'       => $p->type,
                'member'     => $p->targetUser?->full_name ?? $p->targetUser?->name ?? '—',
                'mid'        => $p->targetUser?->shareholder_id ?? '—',
                'payload'    => $p->payload,
                'remarks'    => $p->remarks,
                'status'     => $p->status,
                'admin_note' => $p->admin_remarks,
                'created_at' => $p->created_at
                    ? Carbon::parse($p->created_at)->format('d M Y H:i')
                    : null,
            ]);

        // ── Announcements (published only) ──────────────────────────
        $announcements = \App\Models\Announcement::where('is_active', true)
            ->orderByDesc('published_at')
            ->get()
            ->map(fn($a) => [
                'id'              => $a->id,
                'title'           => $a->title,
                'content'         => $a->content,
                'published_at'    => $a->published_at
                    ? \Carbon\Carbon::parse($a->published_at)->format('d M Y')
                    : null,
                'attachment_name' => $a->attachment_name,
                'attachment_url'  => $a->attachment_path ? "/files/announcement/{$a->id}" : null,
                'attachment_ext'  => $a->attachment_path ? strtolower(pathinfo($a->attachment_path, PATHINFO_EXTENSION)) : null,
            ]);

        return response()->json([
            'kpi' => [
                'total_members'      => $totalMembers,
                'active_members'     => $activeMembers,
                'inactive_members'   => $inactiveMembers,
                'pending_members'    => $pendingMembers,
                'accounts_to_verify' => $accountsToVerify,
                'tx_this_month'      => $txThisMonth,
                'tx_today'           => $txToday,
                'pending_admin'      => $pendingAdmin,
                'unread_notif'       => $unreadCount,
            ],
            'all_members'         => $allMembers,
            'new_registrations'   => $newRegistrations,
            'recent_transactions' => $recentTx,
            'my_pending'          => $myPending,
            'notifications'       => $notifications,
            'announcements'       => $announcements,
        ]);
    }
}