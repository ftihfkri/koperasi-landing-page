<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{

    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!Auth::check()) {
            abort(403, 'Unauthorized');
        }

        $allowed = [];
        foreach ($roles as $role) {
            foreach (explode(',', $role) as $r) {
                $allowed[] = trim($r);
            }
        }

        if (in_array(Auth::user()->role, $allowed)) {
            return $next($request);
        }

        abort(403, 'Forbidden — insufficient role.');
    }
}