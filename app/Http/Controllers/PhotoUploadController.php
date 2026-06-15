<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class PhotoUploadController extends Controller
{
    /** Investor uploads their own photo */
    public function uploadOwn(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|max:8192|mimes:jpeg,jpg,png,webp',
        ]);

        $url = $this->store($request, Auth::user());

        return response()->json(['url' => $url, 'message' => 'Photo updated.']);
    }

    /** Staff uploads on behalf of a member */
    public function uploadForMember(Request $request, int $userId)
    {
        $request->validate([
            'photo' => 'required|image|max:8192|mimes:jpeg,jpg,png,webp',
        ]);

        $member = User::findOrFail($userId);
        $url    = $this->store($request, $member);

        AuditLog::record('photo.uploaded', 'user', $member->id, [
            'shareholder_id' => $member->shareholder_id,
            'name'      => $member->full_name ?? $member->name,
        ]);

        return response()->json(['url' => $url, 'message' => 'Photo updated.']);
    }

    /**
     * Stream the avatar through PHP so it renders without requiring the
     * public/storage symlink. Authenticated members can view avatars.
     */
    public function show(int $userId)
    {
        $user = User::findOrFail($userId);
        abort_unless($user->avatar, 404, 'No avatar uploaded.');

        // avatar is stored as either "/storage/avatars/..." (legacy) or "avatars/..."
        $rel = ltrim(str_replace('/storage/', '', $user->avatar), '/');

        $disk = Storage::disk('public');
        if (!$rel || !$disk->exists($rel)) {
            abort(404, 'Avatar file missing on disk.');
        }
        return $disk->response($rel, basename($rel), [
            'Cache-Control' => 'no-store, max-age=0',
        ], 'inline');
    }

    private function store(Request $request, User $user): string
    {
        // Delete old photo if stored locally
        if ($user->avatar) {
            $old = ltrim(str_replace('/storage/', '', $user->avatar), '/');
            if ($old && Storage::disk('public')->exists($old)) {
                Storage::disk('public')->delete($old);
            }
        }

        $path = $request->file('photo')->store("avatars/{$user->id}", 'public');

        // Store the relative path; the dashboard data controller wraps it in a
        // streamed-via-PHP URL so it works with or without the storage symlink.
        $user->update(['avatar' => $path]);

        // Return a clean URL; the SPA appends its own cache-buster.
        return '/files/avatar/' . $user->id;
    }
}


