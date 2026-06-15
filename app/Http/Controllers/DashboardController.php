<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\Dividend;
use App\Models\Transaction;
use App\Models\User;
use App\Support\DashboardMetrics;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function redirect()
    {
        $user = Auth::user();

        // If the user just logged in after scanning an AGM QR, send them straight back.
        if (session()->has('agm_pending_token')) {
            $token = session()->pull('agm_pending_token');
            return redirect()->route('attendance.scan', ['token' => $token]);
        }

        return match ($user->role) {
            'admin' => redirect()->route('admin.dashboard'),
            'staff' => redirect()->route('staff.dashboard'),
            default => redirect()->route('shareholder.dashboard'),
        };
    }

    public function admin()
    {
        $stats = DashboardMetrics::totals();
        $recentMembers = User::where('role', 'shareholder')->latest()->take(8)->get();
        $recentTransactions = Transaction::with('user')->latest('transaction_date')->take(10)->get();
        $announcements = Announcement::latest('published_at')->take(5)->get();

        return view('admin.dashboard', compact('stats', 'recentMembers', 'recentTransactions', 'announcements'));
    }

    public function staff()
    {
        $stats = DashboardMetrics::totals();
        $recentMembers = User::where('role', 'shareholder')->latest()->take(8)->get();
        $recentTransactions = Transaction::with('user')->latest('transaction_date')->take(10)->get();

        return view('staff.dashboard', compact('stats', 'recentMembers', 'recentTransactions'));
    }

    public function shareholder()
    {
        $user = Auth::user();
        $deposits = $user->transactions()->where('type','deposit')->latest('transaction_date')->get();
        $dividends = $user->dividends()->latest('year')->get();
        $transactions = $user->transactions()->latest('transaction_date')->paginate(10);
        $announcements = Announcement::where('is_active', true)->latest('published_at')->take(5)->get();

        $totalDeposit = (float) $user->transactions()->where('type','deposit')->sum('amount');
        $totalDividend = (float) $user->dividends()->sum('amount');
        $membershipMonths = $user->shareholding_start_date
        ? \Carbon\Carbon::parse($user->shareholding_start_date)->diffInMonths(now())
        : 0;

        $dateFmt = \DB::connection()->getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', transaction_date)"
            : "DATE_FORMAT(transaction_date, '%Y-%m')";

        $growthData = Transaction::selectRaw("$dateFmt as label, SUM(amount) as total")
            ->where('user_id', $user->id)
            ->where('type', 'deposit')
            ->groupBy('label')
            ->orderBy('label')
            ->get();

        return view('shareholder.dashboard', compact(
            'user',
            'deposits',
            'dividends',
            'transactions',
            'announcements',
            'totalDeposit',
            'totalDividend',
            'membershipMonths',
            'growthData'
        ));
    }
}