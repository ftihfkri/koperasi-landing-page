<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Dividend;
use App\Models\TabungKomitmen;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;

class AdminReportController extends Controller
{
    /** Financial summary — printable HTML page */
    public function financialSummary(Request $request)
    {
        $year = (int) $request->get('year', now()->year);

        $totalMembers    = User::where('role', 'shareholder')->count();
        $activeMembers   = User::where('role', 'shareholder')->where('status', 'active')->count();
        $pendingMembers  = User::where('role', 'shareholder')->where('status', 'pending')->count();
        $inactiveMembers = User::where('role', 'shareholder')->where('status', 'inactive')->count();

        $totalDeposit       = (float) Transaction::whereHas('user', fn($q) => $q->where('role', 'shareholder'))
            ->where('type', 'deposit')->sum('amount');
        $totalWithdrawal    = (float) Transaction::whereHas('user', fn($q) => $q->where('role', 'shareholder'))
            ->where('type', 'withdrawal')->sum('amount');
        $netDeposit         = $totalDeposit - $totalWithdrawal;

        $dividendThisYear   = (float) Dividend::where('year', $year)->sum('amount');
        $dividendRate       = Dividend::where('year', $year)->value('rate') ?? 0;
        $totalTabung        = (float) TabungKomitmen::where('is_active', true)->sum('amount');

        // Per-member summary
        $members = User::where('role', 'shareholder')
            ->where('status', 'active')
            ->orderBy('full_name')
            ->get()
            ->map(function ($u) use ($year) {
                $dep  = (float) $u->transactions()->where('type', 'deposit')->sum('amount');
                $wit  = (float) $u->transactions()->where('type', 'withdrawal')->sum('amount');
                $div  = (float) Dividend::where('user_id', $u->id)->where('year', $year)->value('amount') ?? 0;
                $tab  = (float) TabungKomitmen::where('user_id', $u->id)->where('is_active', true)->value('amount') ?? 0;
                return [
                    'shareholder_id'   => $u->shareholder_id ?? '—',
                    'name'        => $u->full_name ?? $u->name ?? '—',
                    'deposit'     => $dep,
                    'withdrawal'  => $wit,
                    'net'         => $dep - $wit,
                    'tabung'      => $tab,
                    'dividend_fy' => $div,
                ];
            });

        return view('reports.financial-summary', compact(
            'year', 'totalMembers', 'activeMembers', 'pendingMembers', 'inactiveMembers',
            'totalDeposit', 'totalWithdrawal', 'netDeposit',
            'dividendThisYear', 'dividendRate', 'totalTabung', 'members'
        ));
    }

    /** Audit log JSON for admin dashboard */
    public function auditLog(Request $request)
    {
        $logs = AuditLog::with('causer:id,full_name,name,role')
            ->latest()
            ->paginate(50);

        return response()->json([
            'logs' => $logs->map(fn($l) => [
                'id'           => $l->id,
                'action'       => $l->action,
                'subject_type' => $l->subject_type,
                'subject_id'   => $l->subject_id,
                'properties'   => $l->properties,
                'ip_address'   => $l->ip_address,
                'causer'       => $l->causer
                    ? ($l->causer->full_name ?? $l->causer->name ?? '—') . ' (' . $l->causer->role . ')'
                    : 'System',
                'created_at'   => $l->created_at?->format('d M Y H:i'),
            ]),
            'total'        => $logs->total(),
            'current_page' => $logs->currentPage(),
            'last_page'    => $logs->lastPage(),
        ]);
    }
}
