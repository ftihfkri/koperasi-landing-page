<?php

namespace App\Http\Controllers;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ShareholderVerificationController extends Controller
{
    public static function tokenFor(User $user): string
    {
        return substr(hash_hmac('sha256', $user->id . '|' . $user->shareholder_id, config('app.key')), 0, 32);
    }

    public static function urlFor(User $user): string
    {
        return url('/verify/' . $user->id . '/' . self::tokenFor($user));
    }

    public function show(Request $request, int $id, string $token)
    {
        $user = User::find($id);

        if (!$user || !hash_equals(self::tokenFor($user), $token)) {
            return view('member-verification', ['valid' => false]);
        }

        $memberSince = $user->shareholding_start_date
            ? Carbon::parse($user->shareholding_start_date)
            : Carbon::parse($user->created_at);

        $duration = $memberSince->diff(now());
        $durationStr = $duration->y > 0
            ? $duration->y . ' year' . ($duration->y > 1 ? 's' : '') . ($duration->m > 0 ? ', ' . $duration->m . ' month' . ($duration->m > 1 ? 's' : '') : '')
            : ($duration->m > 0 ? $duration->m . ' month' . ($duration->m > 1 ? 's' : '') : 'Less than a month');

        return view('member-verification', [
            'valid'       => true,
            'name'        => $user->full_name ?? $user->name,
            'shareholder_id'   => $user->shareholder_id ?? '—',
            'status'      => $user->status ?? ($user->is_approved ? 'active' : 'pending'),
            'since'       => $memberSince->format('d F Y'),
            'duration'    => $durationStr,
            'role'        => $user->role,
            'verified_at' => now()->format('d M Y, H:i:s'),
            'avatar'      => $user->avatar,
        ]);
    }
}
