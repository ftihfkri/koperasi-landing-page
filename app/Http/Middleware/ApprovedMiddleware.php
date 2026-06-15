<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class ApprovedMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check() && !Auth::user()->is_approved) {
            Auth::logout();

            return redirect()->route('login')->withErrors([
                'login' => 'Your account is still waiting for approval.',
            ]);
        }

        return $next($request);
    }
}