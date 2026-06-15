<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsApproved
{
    /**
     * Handle an incoming request.
     *
     * Two cases for investors with is_approved = 0:
     *
     *  1. New registration (no shareholding_start_date yet)
     *     → Redirect to /register/pending (waiting for staff to verify)
     *
     *  2. Previously active investor who was deactivated
     *     → Log out and redirect to login with error message
     *
     * Staff and admin are never blocked by this middleware.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if ($user && $user->role === 'shareholder') {

            if ($user->status === 'pending') {
                if ($request->routeIs('register.pending')) {
                    return $next($request);
                }
                return redirect()->route('register.pending');
            }

            if ($user->status === 'inactive') {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('login')
                    ->withErrors([
                        'email' => 'Your account has been deactivated. Please contact the cooperative office.',
                    ]);
            }
        }

        return $next($request);
    }
}