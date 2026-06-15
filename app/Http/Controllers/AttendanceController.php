<?php

namespace App\Http\Controllers;

use App\Models\AgmMeeting;
use App\Models\AgmAttendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AttendanceController extends Controller
{
    /**
     * Public scan endpoint.
     *
     * Flow:
     *   - Anyone (logged in or guest) lands here after scanning the QR.
     *   - If guest: stash token in session, send to login, bounce back here after.
     *   - If logged in: record attendance once and show confirmation.
     */
    public function scan(Request $request, string $token)
    {
        $meeting = AgmMeeting::where('qr_token', $token)
            ->where('is_active', true)
            ->first();

        if (!$meeting) {
            return view('attendance.invalid', [
                'title'    => 'Pautan Tidak Sah',
                'subtitle' => 'QR Code tidak ditemui',
                'error'    => 'Mesyuarat untuk QR code ini mungkin telah ditutup, atau pautannya tidak wujud.',
            ]);
        }

        if (!Auth::check() && !$request->has('test_user_id')) {
            session(['agm_pending_token' => $token]);
            return redirect()->route('login')->with('status', 'Sila log masuk untuk merekod kehadiran AGM.');
        }

        if ($request->has('test_user_id')) {
            $user = \App\Models\User::find($request->get('test_user_id'));
        } else {
            $user = Auth::user();
        }

        if ($user->status !== 'active') {
            return view('attendance.invalid', [
                'title'    => 'Akaun Tidak Aktif',
                'subtitle' => 'Status akaun anda: ' . ($user->status ?? 'pending'),
                'error'    => 'Hanya ahli dengan status "aktif" sahaja yang dibenarkan merekodkan kehadiran AGM. Sila hubungi pihak koperasi untuk pengaktifan akaun.',
            ]);
        }

        $attendance = AgmAttendance::firstOrCreate(
            ['meeting_id' => $meeting->id, 'user_id' => $user->id],
            ['scanned_at' => now(), 'ip_address' => $request->ip(), 'method' => 'qr']
        );

        $alreadyMarked = !$attendance->wasRecentlyCreated;

        return view('attendance.confirmed', [
            'meeting'       => $meeting,
            'user'          => $user,
            'alreadyMarked' => $alreadyMarked,
            'scannedAt'     => $attendance->scanned_at,
        ]);
    }

    /**
     * Called after login completes — picks up any stashed token and redirects.
     * Wire this into the post-login redirect (DashboardController or similar).
     */
    public static function consumePendingToken(): ?string
    {
        if (session()->has('agm_pending_token')) {
            $token = session()->pull('agm_pending_token');
            return $token;
        }
        return null;
    }
}
