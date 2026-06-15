<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class AnnouncementController extends Controller
{
    public function index()
    {
        $announcements = Announcement::latest('published_at')->paginate(15);
        return view('announcements.index', compact('announcements'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'published_at' => 'nullable|date',
            'is_active' => 'nullable|boolean',
        ]);

        $announcement = Announcement::create([
            'title' => $validated['title'],
            'content' => $validated['content'],
            'published_at' => $validated['published_at'] ?? now(),
            'is_active' => $request->boolean('is_active', true),
            'created_by' => Auth::id(),
        ]);

        $users = User::where('is_approved', true)->pluck('email');
        foreach ($users as $email) {
            try {
                Mail::raw($announcement->content, function ($message) use ($email, $announcement) {
                    $message->to($email)->subject($announcement->title);
                });
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return back()->with('success', 'Announcement published successfully.');
    }

    public function download(int $id, \Illuminate\Http\Request $request)
    {
        $ann = Announcement::find($id);
        if (!$ann) {
            return response("Announcement #{$id} not found in database.", 404)
                ->header('Content-Type', 'text/plain');
        }
        if (!$ann->attachment_path) {
            return response("Announcement #{$id} has no attachment_path stored.", 404)
                ->header('Content-Type', 'text/plain');
        }

        $disk    = Storage::disk('public');
        $relPath = ltrim($ann->attachment_path, '/');

        if (!$disk->exists($relPath)) {
            $abs        = storage_path('app/public/'.$relPath);
            $exists     = file_exists($abs) ? 'yes' : 'no';
            $storageOk  = is_dir(storage_path('app/public')) ? 'yes' : 'no';
            $msg        = "Attachment file not found on disk.\n"
                        . "  attachment_path : {$ann->attachment_path}\n"
                        . "  resolved abs    : {$abs}\n"
                        . "  file_exists     : {$exists}\n"
                        . "  storage dir ok  : {$storageOk}\n";
            return response($msg, 404)->header('Content-Type', 'text/plain');
        }

        $name        = $ann->attachment_name ?? basename($relPath);
        $disposition = $request->boolean('download') ? 'attachment' : 'inline';

        return $disk->response($relPath, $name, [
            'Cache-Control' => 'no-store, max-age=0',
        ], $disposition);
    }
}
