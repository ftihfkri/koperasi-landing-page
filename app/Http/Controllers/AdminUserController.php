<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class AdminUserController extends Controller
{
    public function index()
    {
        $users = User::orderBy('role')->orderBy('full_name')->paginate(20);
        return view('admin.users.index', compact('users'));
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'role' => 'required|in:admin,staff,shareholder',
            'is_approved' => 'required|boolean',
        ]);

        $wasApproved = $user->is_approved;
        $user->update($validated);

        if (!$wasApproved && $user->is_approved) {
            try {
                Mail::raw('Your Koperasi Sabah Softwoods account has been approved. You may now log in to the system.', function ($message) use ($user) {
                    $message->to($user->email)->subject('Koperasi Account Approved');
                });
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return back()->with('success', 'User access updated successfully.');
    }
}
