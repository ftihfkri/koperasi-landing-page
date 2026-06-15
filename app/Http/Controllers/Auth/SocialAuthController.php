<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback()
    {
        $socialUser = Socialite::driver('google')->user();

        return $this->handleSocialLogin($socialUser, 'google');
    }

    private function handleSocialLogin($socialUser, string $provider)
    {
        $email = $socialUser->getEmail();

        $user = User::where('email', $email)->first();

        if (!$user) {
            $user = User::create([
                'name'        => $socialUser->getName(),
                'email'       => $email,
                'provider'    => $provider,
                'provider_id' => $socialUser->getId(),
                'avatar'      => $socialUser->getAvatar(),
                'role'        => 'shareholder',
                'is_approved' => true,
                'status'      => 'active',
            ]);
        } else {
            $user->update([
                'provider'    => $provider,
                'provider_id' => $socialUser->getId(),
                'avatar'      => $socialUser->getAvatar(),
            ]);
        }

        // Block inactive accounts
        if ($user->status === 'inactive') {
            return redirect()->route('login')->withErrors([
                'login' => 'Your account has been deactivated. Please contact the cooperative office.',
            ]);
        }

        // Block pending accounts (manually registered but not yet approved)
        if ($user->status === 'pending') {
            return redirect()->route('register.pending');
        }

        Auth::login($user);

        if (empty($user->shareholder_id) || empty($user->full_name)) {
            return redirect()->route('profile.complete');
        }

        return match ($user->role) {
            'admin'  => redirect()->route('admin.dashboard'),
            'staff'  => redirect()->route('staff.dashboard'),
            default  => redirect()->route('shareholder.dashboard'),
        };
    }

    public function showCompleteProfileForm()
    {
        return view('auth.complete-profile');
    }

    public function saveCompleteProfile(Request $request)
    {
        $request->validate([
            'shareholder_id'    => 'required|string|max:50|unique:users,shareholder_id,' . Auth::id(),
            'full_name'    => 'required|string|max:255',
            'phone_number' => 'nullable|string|max:20',
        ]);

        $user = Auth::user();

        $user->update([
            'shareholder_id'    => $request->shareholder_id,
            'full_name'    => $request->full_name,
            'name'         => $request->full_name,
            'phone_number' => $request->phone_number,
        ]);

        return match ($user->role) {
            'admin'  => redirect()->route('admin.dashboard'),
            'staff'  => redirect()->route('staff.dashboard'),
            default  => redirect()->route('shareholder.dashboard'),
        };
    }
}
