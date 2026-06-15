<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\Dividend;
use App\Models\TabungKomitmen;
use App\Models\PendingApproval;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminDashboardDataController extends Controller
{
    public function __invoke(Request $request)
    {
        $fy = now()->year;

        // ── KPI ──────────────────────────────────────────────────────
        $totalMembers  = User::count();

        // Total current account = sum of all investor transactions
        $totalDeposit    = (float) Transaction::whereHas('user', fn($q)=>$q->where('role','shareholder'))
            ->where('type', 'deposit')->sum('amount');
        $totalDividendTx = (float) Transaction::whereHas('user', fn($q)=>$q->where('role','shareholder'))
            ->where('type', 'dividend')->sum('amount');
        $totalWithdrawal = (float) Transaction::whereHas('user', fn($q)=>$q->where('role','shareholder'))
            ->where('type', 'withdrawal')->sum('amount');
        $totalCurrentAccount = $totalDeposit + $totalDividendTx - $totalWithdrawal;

        $totalDividendPaidThisYear = (float) Dividend::where('year', $fy)->sum('amount');

        $txToday     = Transaction::whereDate('transaction_date', today())->count();
        $txThisMonth = Transaction::whereMonth('transaction_date', now()->month)
            ->whereYear('transaction_date', $fy)->count();

        $pendingApprovals  = PendingApproval::where('status', 'pending')->count();
        $activeAnnouncements = Announcement::where('is_active', true)->count();

        $latestDividend = Dividend::orderByDesc('year')->orderByDesc('updated_at')->first();
        $latestRate     = $latestDividend?->rate ?? 0;
        $latestRateYear = $latestDividend?->year ?? $fy;

        // Investor counts using status column
        $activeMembers   = User::where('status', 'active')->count();
        $inactiveMembers = User::where('status', 'inactive')->count();
        $pendingMembers  = User::where('status', 'pending')->count();
        $totalApproved   = $activeMembers;

        // Sum of every member's current active tabung amount
        $totalTabung = (float) TabungKomitmen::where('is_active', true)->sum('amount');

        // ── Monthly transaction volumes (last 6 months) ───────────────
        $dateFmt = \DB::connection()->getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', transaction_date)"
            : "DATE_FORMAT(transaction_date,'%Y-%m')";

        $monthlyVolume = Transaction::selectRaw(
                "$dateFmt as month, SUM(amount) as total, COUNT(*) as cnt"
            )->where('transaction_date','>=', now()->subMonths(6)->startOfMonth())
            ->groupBy('month')->orderBy('month')->get()
            ->map(fn($r) => ['month'=>$r->month,'total'=>(float)$r->total,'count'=>(int)$r->cnt]);

        // ── Recent Transactions ───────────────────────────────────────
        $recentTx = Transaction::with('user:id,full_name,name,shareholder_id')
            ->latest('transaction_date')->take(10)->get()
            ->map(fn($t) => [
                'id'     => $t->id,
                'date'   => $t->transaction_date?->format('Y-m-d'),
                'member' => $t->user?->full_name ?? $t->user?->name ?? '—',
                'mid'    => $t->user?->shareholder_id ?? '—',
                'type'   => strtoupper($t->type),
                'amount' => (float) $t->amount,
            ]);

        // ── Pending approvals list ────────────────────────────────────
        $pendingList = PendingApproval::where('status','pending')
            ->with([
                'submittedBy:id,full_name,name',
                'targetUser:id,full_name,name,shareholder_id',
            ])
            ->latest()->take(20)->get()
            ->map(fn($p) => [
                'id'          => $p->id,
                'type'        => $p->type,
                'staff'       => $p->submittedBy?->full_name ?? $p->submittedBy?->name ?? '—',
                'member'      => $p->targetUser?->full_name  ?? $p->targetUser?->name  ?? '—',
                'mid'         => $p->targetUser?->shareholder_id  ?? '—',
                'payload'     => $p->payload,
                'remarks'     => $p->remarks,
                'created_at'  => $p->created_at?->format('d M Y H:i'),
            ]);

        // ── Announcements ─────────────────────────────────────────────
        $announcements = Announcement::latest('published_at')->take(5)->get()
            ->map(fn($a) => [
                'id'              => $a->id,
                'title'           => $a->title,
                'content'         => \Illuminate\Support\Str::limit($a->content, 100),
                'is_active'       => $a->is_active,
                'published_at'    => $a->published_at?->format('d M Y'),
                'attachment_name' => $a->attachment_name,
                'attachment_url'  => $a->attachment_path ? "/files/announcement/{$a->id}" : null,
                'attachment_ext'  => $a->attachment_path ? strtolower(pathinfo($a->attachment_path, PATHINFO_EXTENSION)) : null,
            ]);

        // ── Dividend history (all FY records, distinct years) ────────
        $dividendHistory = Dividend::selectRaw('year, rate, SUM(amount) as total_amount, COUNT(*) as member_count, MAX(updated_at) as calculated_at')
            ->groupBy('year', 'rate')
            ->orderByDesc('year')
            ->get()
            ->map(fn($d) => [
                'year'          => $d->year,
                'rate'          => (float) $d->rate,
                'total_amount'  => round((float) $d->total_amount, 2),
                'member_count'  => (int) $d->member_count,
                'calculated_at' => $d->calculated_at
                    ? \Carbon\Carbon::parse($d->calculated_at)->format('d M Y')
                    : '—',
            ]);

        // ── Tabung Komitmen history — one row per admin action ────────
        // Group by notes+date to show one row per board announcement
        $tabungHistory = TabungKomitmen::selectRaw('notes, effective_date, MAX(amount) as sample_amount, COUNT(*) as member_count, MIN(id) as first_id, MAX(created_at) as created_at')
            ->groupBy('notes', 'effective_date')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($t) => [
                'id'           => $t->first_id,
                'amount'       => (float) $t->sample_amount,
                'member_count' => (int) $t->member_count,
                'notes'        => $t->notes,
                'date'         => $t->effective_date
                    ? \Carbon\Carbon::parse($t->effective_date)->format('d M Y')
                    : '—',
                'raw_date'     => $t->effective_date ?? null,
                'created_at'   => $t->created_at
                    ? \Carbon\Carbon::parse($t->created_at)->format('d M Y')
                    : '—',
            ]);

        // ── Ticket threads (for admin) ──────────────────────────────────
        $notifThreads = \App\Models\AdminNotification::with([
                'toStaff:id,full_name,name',
                'fromAdmin:id,full_name,name',
            ])
            ->latest()
            ->take(50)
            ->get()
            ->map(fn($n) => [
                'id'           => $n->id,
                'title'        => $n->title,
                'message'      => $n->message,
                'ticket_type'  => $n->ticket_type ?? 'general',
                'reference_id' => $n->reference_id,
                'status'       => $n->status ?? 'open',
                'to_staff'     => $n->toStaff?->full_name ?? $n->toStaff?->name ?? '—',
                'to_staff_id'  => $n->to_staff,
                'is_read'      => $n->is_read,
                'created_at'   => $n->created_at
                    ? \Carbon\Carbon::parse($n->created_at)->format('d M Y H:i')
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
                        'created_at'  => \Carbon\Carbon::parse($r->created_at)->format('d M Y H:i'),
                    ])->toArray(),
            ]);

        // ── Staff list for notifications ──────────────────────────────
        $staffList = User::where('role','staff')->get()
            ->map(fn($u) => ['id'=>$u->id,'name'=>$u->full_name??$u->name]);

        return response()->json([
            'kpi' => [
                'total_members'            => $totalMembers,
                'active_members'           => $activeMembers,
                'inactive_members'         => $inactiveMembers,
                'pending_members'          => $pendingMembers,
                'total_approved'           => $totalApproved,
                'total_current_account'    => round($totalCurrentAccount, 2),
                'total_dividend_this_year' => round($totalDividendPaidThisYear, 2),
                'tx_today'                 => $txToday,
                'tx_this_month'            => $txThisMonth,
                'pending_approvals'        => $pendingApprovals,
                'active_announcements'     => $activeAnnouncements,
                'latest_rate'              => (float) $latestRate,
                'latest_rate_year'         => $latestRateYear,
                'fy'                       => $fy,
                'total_tabung'             => round($totalTabung, 2),
            ],
            'monthly_volume'   => $monthlyVolume,
            'recent_tx'        => $recentTx,
            'pending_list'     => $pendingList,
            'announcements'    => $announcements,
            'staff_list'       => $staffList,
            'notif_threads'    => $notifThreads,
            'active_investor_count' => $activeMembers,
            'dividend_history' => $dividendHistory,
            'tabung_history'   => $tabungHistory,
        ]);
    }
}