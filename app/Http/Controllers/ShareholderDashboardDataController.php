<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use App\Http\Controllers\ShareholderVerificationController;

class ShareholderDashboardDataController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = Auth::user();

        // ── Raw data ─────────────────────────────────────────────────────
        $transactions = $user->transactions()
            ->orderBy('transaction_date')
            ->get();

        $dividendRecords = $user->dividends()
            ->orderByDesc('year')
            ->get();

        // ── Tabung Komitmen (active record assigned by staff) ─────────────
        $tabungKomitmen = 0.0;
        $tabungHistory  = collect();

        if (method_exists($user, 'tabungKomitmen')) {
            $tabungHistory  = $user->tabungKomitmen()->orderByDesc('effective_date')->get();
            $activeTabung   = $tabungHistory->firstWhere('is_active', true);
            $tabungKomitmen = (float) ($activeTabung?->amount ?? 0);
        }

        // ── Transaction totals ────────────────────────────────────────────
        $totalInvested      = (float) $transactions->where('type', 'deposit')->sum('amount');
        $totalDividend      = (float) $transactions->where('type', 'dividend')->sum('amount');
        $totalWithdrawal    = (float) $transactions->where('type', 'withdrawal')->sum('amount');

        // Total Deposit = Investment − Withdrawal  (net, no dividend)
        $totalDeposit   = $totalInvested - $totalWithdrawal;

        // Shares Holding = Investment + Dividend − Withdrawal
        $currentAccount = $totalInvested + $totalDividend - $totalWithdrawal;

        // ── Membership duration ───────────────────────────────────────────
        $membershipMonths = $user->shareholding_start_date
            ? Carbon::parse($user->shareholding_start_date)->diffInMonths(now())
            : 0;

        // ── Yearly Dividend — actual paid amount for the current FY ───────
        $latestDividendRecord = $dividendRecords->first();
        $yearlyDividendRate   = (float) ($latestDividendRecord?->rate ?? 0);
        $yearlyDividendAmount = 0.0;

        if ($latestDividendRecord) {
            $fy = (int) $latestDividendRecord->year;

            // Sum all dividend transactions within the FY calendar year
            $yearlyDividendAmount = (float) $transactions
                ->filter(function ($tx) use ($fy) {
                    return $tx->type === 'dividend'
                        && Carbon::parse($tx->transaction_date)->year === $fy;
                })
                ->sum('amount');

            // Fallback: most recent dividend transaction if none found in FY year
            if ($yearlyDividendAmount === 0.0) {
                $latest = $transactions
                    ->where('type', 'dividend')
                    ->sortByDesc('transaction_date')
                    ->first();
                $yearlyDividendAmount = (float) ($latest?->amount ?? 0);
            }
        }

        // ── Chart data — running balances over time ───────────────────────
        //
        // Keys returned:
        //   currentAccount = running BUY + dividend - withdrawal  (Shares Holding)
        //   invested       = running BUY - withdrawal             (Net Deposit)  ← FIXED
        //   dividend       = running dividend cumulative
        //   netDeposit     = alias of invested (same value, kept for compatibility)
        //   withdrawal     = running withdrawal cumulative
        //
        // Previously `invested` was raw BUY-only (no withdrawal deducted), causing
        // the Deposit line on the chart to be higher than the right-panel Total Deposit.
        // Now both use the same net formula: BUY − withdrawal.

        $runningInvested      = 0.0;
        $runningDividend      = 0.0;
        $runningWithdrawal    = 0.0;

        $chartData = $transactions
            ->groupBy(fn($tx) => Carbon::parse($tx->transaction_date)->format('Y-m'))
            ->map(function ($group, $month) use (
                &$runningInvested, &$runningDividend, &$runningWithdrawal
            ) {
                foreach ($group as $tx) {
                    if ($tx->type === 'deposit') $runningInvested   += (float) $tx->amount;
                    if ($tx->type === 'dividend')   $runningDividend   += (float) $tx->amount;
                    if ($tx->type === 'withdrawal') $runningWithdrawal += (float) $tx->amount;
                }

                $netDeposit = round($runningInvested - $runningWithdrawal, 2);

                return [
                    'date'           => $month,
                    'currentAccount' => round($runningInvested + $runningDividend - $runningWithdrawal, 2),
                    'invested'       => $netDeposit,
                    'netDeposit'     => $netDeposit,
                    'dividend'       => round($runningDividend, 2),
                    'withdrawal'     => round($runningWithdrawal, 2),
                ];
            })
            ->values();

        // ── Announcements ─────────────────────────────────────────────────
        $announcements = collect();
        try {
            $announcements = \App\Models\Announcement::where('is_active', true)
                ->orderByDesc('published_at')
                ->get()
                ->map(fn($a) => [
                    'id'              => $a->id,
                    'title'           => $a->title,
                    'content'         => $a->content,
                    'published_at'    => $a->published_at
                        ? Carbon::parse($a->published_at)->format('Y-m-d')
                        : null,
                    'attachment_name' => $a->attachment_name,
                    'attachment_url'  => $a->attachment_path ? "/files/announcement/{$a->id}" : null,
                    'attachment_ext'  => $a->attachment_path ? strtolower(pathinfo($a->attachment_path, PATHINFO_EXTENSION)) : null,
                ]);
        } catch (\Exception $e) {
            // Table may not exist yet — fail silently
        }

        // ── Response ──────────────────────────────────────────────────────
        return response()->json([
            'profile' => [
                'id'              => $user->id,
                'shareholder_id'       => $user->shareholder_id,
                'name'            => $user->full_name ?? $user->name,
                'email'           => $user->email,
                'phone_number'    => $user->phone_number,
                'avatar'          => $user->avatar ? '/files/avatar/'.$user->id : null,
                'startmembership' => $user->shareholding_start_date,
                'status'          => 'active',
                'verificationUrl' => ShareholderVerificationController::urlFor($user),
            ],
            'summary' => [
                'currentAccount'       => round($currentAccount, 2),
                'totalDeposit'         => round($totalDeposit, 2),
                'totalDividend'        => round($totalDividend, 2),
                'tabungKomitmen'       => round($tabungKomitmen, 2),
                'yearlyDividendAmount' => round($yearlyDividendAmount, 2),
                'yearlyDividendRate'   => $yearlyDividendRate,
                'membershipMonths'     => (int) $membershipMonths,
            ],
            'chartData'    => $chartData,
            'dividends'    => $dividendRecords->map(fn($d) => [
                'year'   => (int) $d->year,
                'rate'   => (float) $d->rate,
                'amount' => (float) $d->amount,
            ])->values(),
            'transactions' => $transactions
                ->sortByDesc('transaction_date')
                ->values()
                ->map(fn($tx) => [
                    'txId'        => $tx->id,
                    'date'        => $tx->transaction_date
                        ? Carbon::parse($tx->transaction_date)->format('Y-m-d')
                        : null,
                    'type'        => match ($tx->type) {
                        'deposit'    => 'DEPOSIT',
                        'dividend'   => 'DIVIDEND',
                        'withdrawal' => 'WITHDRAW',
                        default      => strtoupper($tx->type),
                    },
                    'amount'      => (float) $tx->amount,
                    'shareholder_id'   => $user->shareholder_id,
                    'description' => $tx->description,
                ]),
            'announcements' => $announcements->values(),
            'tabungHistory' => $tabungHistory->map(fn($r) => [
                'id'             => $r->id,
                'amount'         => (float) $r->amount,
                'is_active'      => (bool) $r->is_active,
                'effective_date' => $r->effective_date
                    ? Carbon::parse($r->effective_date)->format('Y-m-d')
                    : null,
                'notes'          => $r->notes,
                'assigned_by'    => $r->assigned_by ?? 'Staff',
                'created_at'     => Carbon::parse($r->created_at)->format('Y-m-d'),
            ])->values(),
        ]);
    }
}