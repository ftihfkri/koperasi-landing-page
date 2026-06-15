<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'login'    => ['required', 'string'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     * Accepts either email address OR shareholder_id in the 'login' field.
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $login    = $this->input('login');
        $password = $this->input('password');

        $authenticated = false;

        // Try email first
        if (filter_var($login, FILTER_VALIDATE_EMAIL)) {
            $authenticated = Auth::attempt([
                'email'    => $login,
                'password' => $password,
            ], $this->boolean('remember'));
        }

        // If not authenticated by email, try shareholder_id
        if (! $authenticated) {
            $authenticated = Auth::attempt([
                'shareholder_id' => $login,
                'password'  => $password,
            ], $this->boolean('remember'));
        }

        // If still not authenticated, try email anyway (catches non-email format emails)
        if (! $authenticated) {
            $authenticated = Auth::attempt([
                'email'    => $login,
                'password' => $password,
            ], $this->boolean('remember'));
        }

        if (! $authenticated) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'login' => __('These credentials do not match our records.'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'login' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->input('login')).'|'.$this->ip());
    }
}