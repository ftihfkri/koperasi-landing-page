<?php

namespace App\Http\Controllers;

use App\Models\ContactInquiry;
use Illuminate\Http\Request;

class ContactInquiryController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'message' => 'required|string',
        ]);

        ContactInquiry::create($validated);

        return response()->json([
            'message' => 'Your inquiry has been submitted successfully.',
        ]);
    }

    public function index()
    {
        $inquiries = ContactInquiry::latest()->paginate(15);

        $inquiries->getCollection()->transform(function ($i) {
            return [
                'id'         => $i->id,
                'name'       => $i->name,
                'email'      => $i->email,
                'phone'      => $i->phone,
                'message'    => $i->message,
                'is_read'    => (bool) $i->is_read,
                'read_at'    => $i->read_at ? $i->read_at->timezone(config('app.timezone'))->format('d M Y H:i') : null,
                'created_at' => $i->created_at ? $i->created_at->timezone(config('app.timezone'))->format('d M Y H:i') : null,
            ];
        });

        return $inquiries;
    }

    public function markAsRead($id)
    {
        $inquiry = ContactInquiry::findOrFail($id);
        $inquiry->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return response()->json(['message' => 'Marked as read']);
    }
}
