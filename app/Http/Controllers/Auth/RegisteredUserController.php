<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\View\View;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): View
    {
        return view('auth.register');
    }

    /**
     * Handle an incoming registration request.
     * New users are registered with is_approved = FALSE.
     * They must wait for staff to verify their account before logging in.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'shareholder_id'    => ['required', 'string', 'max:50', 'unique:users,shareholder_id'],
            'full_name'    => ['required', 'string', 'max:255'],
            'email'        => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email'],
            'phone_number' => ['nullable', 'string', 'max:20'],
            'password'     => ['required', 'confirmed', \Illuminate\Validation\Rules\Password::defaults()],
        ]);

        $user = User::create([
            'shareholder_id'    => $request->shareholder_id,
            'name'         => $request->full_name,
            'full_name'    => $request->full_name,
            'email'        => $request->email,
            'phone_number' => $request->phone_number,
            'password'     => Hash::make($request->password),
            'role'         => 'shareholder',
            'is_approved'  => false,   // ← NOT approved until staff verifies
        ]);

        // Do NOT log them in — redirect to a "pending approval" page instead
        return redirect()->route('register.pending')
            ->with('shareholder_id', $user->shareholder_id)
            ->with('name', $user->full_name);
    }
}
