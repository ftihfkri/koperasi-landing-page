<?php

namespace App\Http\Controllers;

use App\Models\AdminNotification;
use App\Models\AgmMeeting;
use App\Models\AgmAttendance;
use App\Models\Announcement;
use App\Models\Dividend;
use App\Models\TabungKomitmen;
use App\Models\PendingApproval;
use App\Mail\DividendDeclared;
use App\Mail\TransactionRecorded;
use App\Models\AuditLog;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class AdminActionController extends Controller
{
    /* ── Approve pending ─────────────────────────────────────────────── */
    public function approvePending(Request $request, int $id)
    {
        $v = $request->validate(['admin_remarks' => 'nullable|string|max:500']);
        $pending = PendingApproval::findOrFail($id);

        if ($pending->status !== 'pending') {
            return response()->json(['message' => 'Already reviewed.'], 422);
        }

        $pending->approve(Auth::id(), $v['admin_remarks'] ?? '');

        AuditLog::record('pending.approved', 'pending_approval', $pending->id, [
            'type'    => $pending->type,
            'member'  => $pending->targetUser?->shareholder_id,
        ]);

        // Email the member when a transaction is added to their account
        if ($pending->type === 'add_transaction' && $pending->targetUser) {
            $tx = Transaction::where('user_id', $pending->target_user_id)
                ->where('type', $pending->payload['type'] ?? '')
                ->latest()->first();
            if ($tx) {
                try { Mail::to($pending->targetUser->email)->send(new TransactionRecorded($pending->targetUser, $tx)); } catch (\Exception) {}
            }
        }

        return response()->json(['message' => 'Approved and applied successfully.']);
    }

    /* ── Reject pending ──────────────────────────────────────────────── */
    public function rejectPending(Request $request, int $id)
    {
        $v = $request->validate(['admin_remarks' => 'required|string|max:500']);
        $pending = PendingApproval::findOrFail($id);

        if ($pending->status !== 'pending') {
            return response()->json(['message' => 'Already reviewed.'], 422);
        }

        $pending->reject(Auth::id(), $v['admin_remarks']);

        AuditLog::record('pending.rejected', 'pending_approval', $pending->id, [
            'type'    => $pending->type,
            'member'  => $pending->targetUser?->shareholder_id,
            'reason'  => $v['admin_remarks'],
        ]);

        return response()->json(['message' => 'Rejected successfully.']);
    }

    /* ── Set Dividend (Calculate All) ───────────────────────────────────
     *
     * Formula:
     *   cut-off date  = 30 June of the declared FY
     *   qualifying    = current account balance ON OR BEFORE 30 Jun
     *                 + tabung komitmen (non-withdrawable, always full)
     *   dividend      = qualifying × (rate / 100)
     *
     * Transactions AFTER 30 Jun are ignored for this FY —
     * they naturally carry into the next year's calculation.
     * ─────────────────────────────────────────────────────────────────*/
    public function setDividend(Request $request)
    {
        $v = $request->validate([
            'year'       => 'required|integer|min:2000|max:2100',
            'percentage' => 'required|numeric|min:0|max:100',
        ]);

        $members = User::where('role', 'shareholder')
            ->where('status', 'active')
            ->get();

        // Cut-off: 30 June of the declared financial year
        $cutoff = Carbon::create((int) $v['year'], 6, 30)->endOfDay();

        DB::transaction(function () use ($members, $v, $cutoff) {
            foreach ($members as $member) {

                // ── Balance at cut-off date ─────────────────────────
                $balanceAtCutoff = (float) $member->transactions()
                    ->whereIn('type', ['deposit', 'dividend', 'withdrawal'])
                    ->where('transaction_date', '<=', $cutoff)
                    ->get()
                    ->sum(function ($tx) {
                        return $tx->type === 'withdrawal'
                            ? -(float) $tx->amount
                            : (float) $tx->amount;
                    });

                $qualifyingAccount = max(0, $balanceAtCutoff);

                // ── Tabung Komitmen (full amount, always included) ───
                $tabungKomitmen = 0.0;
                try {
                    $tabungKomitmen = (float) \App\Models\TabungKomitmen::currentAmountFor($member->id);
                } catch (\Exception $e) {
                    // Table may not exist on older installs
                }

                // ── Dividend amount ──────────────────────────────────
                $qualifyingBase = $qualifyingAccount + $tabungKomitmen;
                $amount         = round($qualifyingBase * ((float) $v['percentage'] / 100), 2);

                // ── Save to dividends table ──────────────────────────
                Dividend::updateOrCreate(
                    [
                        'user_id' => $member->id,
                        'year'    => $v['year'],
                    ],
                    [
                        'rate'   => $v['percentage'],
                        'amount' => $amount,
                    ]
                );

                // ── Save as a transaction (dated today — when admin clicked) ──
                Transaction::updateOrCreate(
                    [
                        'user_id'          => $member->id,
                        'type'             => 'dividend',
                        'description'      => 'Dividend for FY ' . $v['year'],
                    ],
                    [
                        'amount'           => $amount,
                        'transaction_date' => today()->toDateString(),
                    ]
                );
            }
        });

        AuditLog::record('dividend.set', null, null, [
            'year'       => $v['year'],
            'percentage' => $v['percentage'],
            'members'    => $members->count(),
        ]);

        // Email each member their dividend amount
        foreach ($members as $member) {
            $div = Dividend::where('user_id', $member->id)->where('year', $v['year'])->first();
            if ($div && $member->email) {
                try { Mail::to($member->email)->send(new DividendDeclared($member, $v['year'], $v['percentage'], (float)$div->amount)); } catch (\Exception) {}
            }
        }

        return response()->json([
            'message' => "Dividend for FY {$v['year']} at {$v['percentage']}% calculated for {$members->count()} shareholders. Cut-off: 30 Jun {$v['year']}.",
        ]);
    }

    /* ── Change user role ────────────────────────────────────────────── */
    public function changeRole(Request $request, int $userId)
    {
        $v    = $request->validate(['role' => 'required|in:admin,staff,shareholder']);
        $user = User::findOrFail($userId);
        $old  = $user->role;
        $user->update(['role' => $v['role']]);
        AuditLog::record('member.role_changed', 'user', $user->id, [
            'from' => $old, 'to' => $v['role'], 'shareholder_id' => $user->shareholder_id,
        ]);
        return response()->json(['message' => 'Role updated successfully.']);
    }

    /* ── Notify staff ────────────────────────────────────────────────── */
    public function notifyStaff(Request $request)
    {
        $request->validate([
            'to_staff'      => 'required|string',
            'about_user_id' => 'nullable|exists:users,id',
            'message'       => 'required|string|max:1000',
            'title'         => 'nullable|string|max:255',
            'ticket_type'   => 'nullable|string|in:general,transaction,member',
            'reference_id'  => 'nullable|integer',
        ]);

        $toStaff    = $request->to_staff;
        $message    = $request->message;
        $aboutId    = $request->about_user_id ?? null;
        $fromId     = Auth::id();
        $title      = $request->title ?? null;
        $ticketType = $request->ticket_type ?? 'general';
        $refId      = $request->reference_id ?? null;

        $payload = [
            'from_admin'    => $fromId,
            'about_user_id' => $aboutId,
            'message'       => $message,
            'title'         => $title,
            'ticket_type'   => $ticketType,
            'reference_id'  => $refId,
            'status'        => 'open',
        ];

        if ($toStaff === 'all') {
            $staffIds = User::where('role', 'staff')->pluck('id');
            foreach ($staffIds as $staffId) {
                AdminNotification::create(array_merge($payload, ['to_staff' => $staffId]));
            }
            $count = $staffIds->count();
            return response()->json(['message' => "Ticket raised for all {$count} staff members."]);
        }

        AdminNotification::create(array_merge($payload, ['to_staff' => (int) $toStaff]));
        return response()->json(['message' => 'Ticket raised for staff.']);
    }

    /* ── Close a ticket ──────────────────────────────────────────────── */
    public function closeTicket(int $id)
    {
        $notif = AdminNotification::findOrFail($id);
        $notif->update(['status' => 'closed']);
        return response()->json(['message' => 'Case closed.']);
    }

    /* ── Reopen a ticket ─────────────────────────────────────────────── */
    public function reopenTicket(int $id)
    {
        $notif = AdminNotification::findOrFail($id);
        $notif->update(['status' => 'open']);
        return response()->json(['message' => 'Case reopened.']);
    }

    /* ── Admin replies to a staff notification thread ───────────── */
    public function replyToStaff(Request $request, int $notifId)
    {
        $notif = AdminNotification::findOrFail($notifId);

        $request->validate(['message' => 'required|string|max:2000']);

        \App\Models\NotificationReply::create([
            'notification_id' => $notif->id,
            'sender_id'       => Auth::id(),
            'sender_role'     => 'admin',
            'message'         => $request->message,
        ]);

        return response()->json(['message' => 'Reply sent to staff.']);
    }

    /* ── Post announcement ───────────────────────────────────────────── */
    public function postAnnouncement(Request $request)
    {
        $v = $request->validate([
            'title'      => 'required|string|max:255',
            'content'    => 'required|string',
            'is_active'  => 'boolean',
            'attachment' => 'nullable|file|max:10240|mimes:pdf,jpg,jpeg,png,gif,doc,docx,xls,xlsx',
        ]);

        $attachPath = null;
        $attachName = null;
        if ($request->hasFile('attachment') && $request->file('attachment')->isValid()) {
            $file       = $request->file('attachment');
            $attachName = $file->getClientOriginalName();
            $attachPath = $file->store('announcements', 'public');
        }

        $ann = Announcement::create([
            'title'           => $v['title'],
            'content'         => $v['content'],
            'is_active'       => $v['is_active'] ?? true,
            'published_at'    => now(),
            'created_by'      => Auth::id(),
            'attachment_path' => $attachPath,
            'attachment_name' => $attachName,
        ]);

        return response()->json(['message' => 'Announcement posted.', 'id' => $ann->id]);
    }

    /* ── Toggle announcement ─────────────────────────────────────────── */
    public function toggleAnnouncement(int $id)
    {
        $ann = Announcement::findOrFail($id);
        $ann->update(['is_active' => !$ann->is_active]);
        return response()->json(['message' => 'Announcement updated.', 'is_active' => $ann->is_active]);
    }

    /* ── Delete announcement ─────────────────────────────────────────── */
    public function deleteAnnouncement(int $id)
    {
        $ann = Announcement::findOrFail($id);
        if ($ann->attachment_path) {
            Storage::disk('public')->delete($ann->attachment_path);
        }
        $ann->delete();
        return response()->json(['message' => 'Announcement deleted.']);
    }

    /* ── All users list ──────────────────────────────────────────────── */
    public function usersList(Request $request)
    {
        $q    = $request->get('q', '');
        $role = $request->get('role', '');
        $users = User::when($q, fn($query) => $query->where(function ($sq) use ($q) {
            $sq->where('full_name', 'like', "%{$q}%")
               ->orWhere('name', 'like', "%{$q}%")
               ->orWhere('shareholder_id', 'like', "%{$q}%")
               ->orWhere('email', 'like', "%{$q}%");
        }))
            ->when(in_array($role, ['admin', 'staff', 'shareholder'], true), fn($query) => $query->where('role', $role))
            ->orderBy('id')
            ->paginate(20);

        return response()->json([
            'data' => $users->map(fn($u) => [
                'id'          => $u->id,
                'name'        => $u->full_name ?? $u->name,
                'shareholder_id'   => $u->shareholder_id,
                'email'       => $u->email,
                'role'        => $u->role,
                'is_approved' => $u->is_approved,
                'status'      => $u->status ?? ($u->is_approved ? 'active' : 'pending'),
                'joined'      => $u->created_at?->format('d M Y'),
            ]),
            'total'     => $users->total(),
            'last_page' => $users->lastPage(),
        ]);
    }

    /* ── Add Tabung Komitmen for ALL investors (in-place, no archiving) ── */
    public function setTabung(Request $request)
    {
        $v = $request->validate([
            'amount' => 'required|numeric|min:0',
            'notes'  => 'nullable|string|max:255',
        ]);

        $investors = User::where('role', 'shareholder')->where('status', 'active')->get();
        $addAmount = (float) $v['amount'];
        $note      = $v['notes'] ?? ('Board decision — added RM ' . number_format($addAmount, 2));

        DB::transaction(function () use ($investors, $addAmount, $note) {
            foreach ($investors as $investor) {
                $active = TabungKomitmen::where('user_id', $investor->id)
                    ->where('is_active', true)
                    ->first();

                if ($active) {
                    // Update in-place — no archiving
                    $active->update([
                        'amount' => $active->amount + $addAmount,
                        'notes'  => $note,
                    ]);
                } else {
                    TabungKomitmen::create([
                        'user_id'        => $investor->id,
                        'amount'         => $addAmount,
                        'is_active'      => true,
                        'assigned_by'    => Auth::id(),
                        'effective_date' => Carbon::today()->toDateString(),
                        'notes'          => $note,
                    ]);
                }
            }
        });

        return response()->json([
            'message' => "Tabung Komitmen updated for {$investors->count()} shareholders. Added RM " . number_format($addAmount, 2) . " to each shareholder.",
        ]);
    }

    /* ── Delete all tabung records for an action (by notes+date) ── */
    public function deleteTabung(Request $request)
    {
        $v = $request->validate([
            'notes'          => 'nullable|string',
            'effective_date' => 'required|date',
        ]);

        DB::transaction(function () use ($v) {
            // Collect user_ids of active records about to be deleted
            $affectedUserIds = TabungKomitmen::where('effective_date', $v['effective_date'])
                ->where('notes', $v['notes'])
                ->where('is_active', true)
                ->pluck('user_id');

            TabungKomitmen::where('effective_date', $v['effective_date'])
                ->where('notes', $v['notes'])
                ->delete();

            // Reactivate the most recent previous record for each affected user
            foreach ($affectedUserIds as $userId) {
                $prev = TabungKomitmen::where('user_id', $userId)
                    ->where('is_active', false)
                    ->orderByDesc('id')
                    ->first();
                if ($prev) {
                    $prev->update(['is_active' => true]);
                }
            }
        });

        return response()->json(['message' => 'Tabung records deleted. Previous values restored.']);
    }

    /* ── Delete all dividends for a financial year ───────────────── */
    public function deleteDividendYear(int $year)
    {
        DB::transaction(function () use ($year) {
            // Get all user_ids that have dividend records for this year
            $userIds = Dividend::where('year', $year)->pluck('user_id');

            Dividend::where('year', $year)->delete();

            // Delete matching dividend transactions — description may be
            // "Dividend for FY 2025" (old) or "Dividend FY 2025 @ 5%" (upload)
            Transaction::where('type', 'dividend')
                ->whereIn('user_id', $userIds)
                ->where('description', 'LIKE', "%FY {$year}%")
                ->delete();
        });

        return response()->json(['message' => "Dividend records for FY {$year} deleted."]);
    }

    /* ── Upload Dividend (xlsx or csv) ──────────────────────────────
     *  Columns (row 1 = header):  user_id, year, rate, amount
     *  Creates one Dividend + one dividend Transaction per row.
     *  Skips rows where the same user_id + year already exists.
     *  Returns inserted_ids so the frontend can offer an Undo button.
     * ─────────────────────────────────────────────────────────────── */
    public function uploadDividend(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:5120',
        ]);

        $allRows = $this->parseUploadedFile($request->file('file'), true);

        if (empty($allRows)) {
            return response()->json(['message' => 'File is empty or unreadable.', 'errors' => [], 'inserted_ids' => []]);
        }

        // Validate header row
        $header = array_map(fn($h) => strtolower(trim((string) $h)), $allRows[0]);
        if (count($header) < 4) {
            return response()->json([
                'message' => 'Wrong file format. Expected 4 columns: user_id, year, rate, amount. Found only ' . count($header) . ' column(s).',
                'errors'  => [],
                'inserted_ids' => [],
            ]);
        }
        $expectedHeaders = ['user_id', 'year', 'rate', 'amount'];
        $headerErrors    = [];
        foreach ($expectedHeaders as $i => $expected) {
            $actual = $header[$i] ?? '';
            if ($actual === '') {
                $headerErrors[] = "Column " . ($i + 1) . " header is blank (expected '{$expected}').";
            } elseif (! str_contains($actual, $expected) && ! str_contains($expected, $actual)) {
                $headerErrors[] = "Column " . ($i + 1) . " header is '{$actual}' (expected '{$expected}') — is this the right file?";
            }
        }
        if (! empty($headerErrors)) {
            return response()->json([
                'message'      => 'File header does not match the expected format.',
                'errors'       => $headerErrors,
                'inserted_ids' => [],
            ]);
        }

        // Pre-validate data rows outside the transaction
        $rows        = array_slice($allRows, 1);
        $errors      = [];
        $validRows   = [];

        foreach ($rows as $i => $row) {
            $rowNum = $i + 2;

            // Skip fully blank rows
            if (empty(array_filter(array_map('trim', array_map('strval', $row))))) continue;

            if (count($row) < 4) {
                $errors[] = "Row {$rowNum}: only " . count($row) . " column(s) — expected 4.";
                continue;
            }

            $rawUserId = trim((string) $row[0]);
            $rawYear   = trim((string) $row[1]);

            if ($rawUserId === '') { $errors[] = "Row {$rowNum}: user_id is blank — skipped."; continue; }
            if ($rawYear   === '') { $errors[] = "Row {$rowNum}: year is blank — skipped."; continue; }

            $userId = (int) $rawUserId;
            $year   = (int) $rawYear;

            if (! $userId) { $errors[] = "Row {$rowNum}: user_id '{$rawUserId}' is not a valid number — skipped."; continue; }
            if (! $year)   { $errors[] = "Row {$rowNum}: year '{$rawYear}' is not a valid number — skipped."; continue; }

            $user = User::find($userId);
            if (! $user) { $errors[] = "Row {$rowNum}: user_id {$userId} not found."; continue; }

            $rate   = trim((string) $row[2]) !== '' ? (float) $row[2] : 0.0;
            $amount = trim((string) $row[3]) !== '' ? (float) $row[3] : 0.0;

            $validRows[] = compact('userId', 'year', 'rate', 'amount');
        }

        $inserted    = 0;
        $skipped     = 0;
        $insertedIds = [];

        DB::transaction(function () use ($validRows, &$inserted, &$skipped, &$insertedIds) {
            foreach ($validRows as $r) {
                if (Dividend::where('user_id', $r['userId'])->where('year', $r['year'])->exists()) {
                    $skipped++;
                    continue;
                }

                $div = Dividend::create([
                    'user_id' => $r['userId'],
                    'year'    => $r['year'],
                    'rate'    => $r['rate'],
                    'amount'  => $r['amount'],
                ]);

                $tx = Transaction::create([
                    'user_id'          => $r['userId'],
                    'type'             => 'dividend',
                    'amount'           => $r['amount'],
                    'transaction_date' => Carbon::today(),
                    'description'      => "Dividend FY {$r['year']} @ {$r['rate']}%",
                ]);

                $insertedIds[] = ['div_id' => $div->id, 'tx_id' => $tx->id];
                $inserted++;
            }
        });

        $msg = "Inserted {$inserted} dividend record(s).";
        if ($skipped) $msg .= " Skipped {$skipped} duplicate(s).";

        return response()->json([
            'message'      => $msg,
            'errors'       => $errors,
            'inserted_ids' => $insertedIds,
        ]);
    }

    /* ── Undo Dividend Upload ─────────────────────────────────────── */
    public function undoDividendUpload(Request $request)
    {
        $v = $request->validate([
            'inserted_ids'         => 'required|array',
            'inserted_ids.*.div_id' => 'required|integer',
            'inserted_ids.*.tx_id'  => 'required|integer',
        ]);

        $divIds = array_column($v['inserted_ids'], 'div_id');
        $txIds  = array_column($v['inserted_ids'], 'tx_id');

        DB::transaction(function () use ($divIds, $txIds) {
            Dividend::whereIn('id', $divIds)->delete();
            Transaction::whereIn('id', $txIds)->delete();
        });

        return response()->json([
            'message' => 'Upload reversed. ' . count($divIds) . ' dividend record(s) deleted.',
        ]);
    }

    /* ── Upload Tabung Komitmen (xlsx or csv) ────────────────────────
     *  Columns (row 1 = header):  user_id, amount
     *  Updates each member's existing active tabung record IN-PLACE by
     *  adding the file amount — no new record is created, no archiving.
     *  If a member has no active record, a new one is created.
     *  Returns undo_data so the Undo endpoint can restore original values.
     * ─────────────────────────────────────────────────────────────── */
    public function uploadTabung(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:5120',
        ]);

        $allRows = $this->parseUploadedFile($request->file('file'), true);

        if (empty($allRows)) {
            return response()->json(['message' => 'File is empty or unreadable.', 'errors' => [], 'undo_data' => []]);
        }

        // Validate header row
        $header = array_map(fn($h) => strtolower(trim((string) $h)), $allRows[0]);
        if (count($header) < 2) {
            return response()->json([
                'message'   => 'Wrong file format. Expected 2 columns: user_id, amount. Found only ' . count($header) . ' column(s).',
                'errors'    => [],
                'undo_data' => [],
            ]);
        }
        $expectedHeaders = ['user_id', 'amount'];
        $headerErrors    = [];
        foreach ($expectedHeaders as $i => $expected) {
            $actual = $header[$i] ?? '';
            if ($actual === '') {
                $headerErrors[] = "Column " . ($i + 1) . " header is blank (expected '{$expected}').";
            } elseif (! str_contains($actual, $expected) && ! str_contains($expected, $actual)) {
                $headerErrors[] = "Column " . ($i + 1) . " header is '{$actual}' (expected '{$expected}') — is this the right file?";
            }
        }
        if (! empty($headerErrors)) {
            return response()->json([
                'message'   => 'File header does not match the expected format.',
                'errors'    => $headerErrors,
                'undo_data' => [],
            ]);
        }

        // Pre-validate data rows
        $rows      = array_slice($allRows, 1);
        $errors    = [];
        $validRows = [];

        foreach ($rows as $i => $row) {
            $rowNum = $i + 2;

            // Skip fully blank rows
            if (empty(array_filter(array_map('trim', array_map('strval', $row))))) continue;

            if (count($row) < 2) {
                $errors[] = "Row {$rowNum}: only " . count($row) . " column(s) — expected 2.";
                continue;
            }

            $rawUserId = trim((string) $row[0]);
            if ($rawUserId === '') { $errors[] = "Row {$rowNum}: user_id is blank — skipped."; continue; }

            $userId = (int) $rawUserId;
            if (! $userId) { $errors[] = "Row {$rowNum}: user_id '{$rawUserId}' is not a valid number — skipped."; continue; }

            $user = User::find($userId);
            if (! $user) { $errors[] = "Row {$rowNum}: user_id {$userId} not found."; continue; }

            $amount = trim((string) $row[1]) !== '' ? (float) $row[1] : 0.0;

            $validRows[] = ['userId' => $userId, 'amount' => $amount];
        }

        $uploadLabel = 'Excel upload ' . Carbon::today()->format('d M Y');
        $updated     = 0;
        $undoData    = [];

        DB::transaction(function () use ($validRows, &$updated, &$undoData, $uploadLabel) {
            foreach ($validRows as $r) {
                $active = TabungKomitmen::where('user_id', $r['userId'])
                    ->where('is_active', true)
                    ->first();

                if ($active) {
                    // Store original values for undo, then update in-place — no archiving
                    $undoData[] = [
                        'tabung_id'       => $active->id,
                        'original_amount' => $active->amount,
                        'original_notes'  => $active->notes,
                        'was_new'         => false,
                    ];
                    $active->update([
                        'amount' => $active->amount + $r['amount'],   // ADD to existing
                        'notes'  => $uploadLabel,
                    ]);
                } else {
                    // No active record yet — create one
                    $newRecord = TabungKomitmen::create([
                        'user_id'        => $r['userId'],
                        'amount'         => $r['amount'],
                        'is_active'      => true,
                        'assigned_by'    => Auth::id(),
                        'effective_date' => Carbon::today()->toDateString(),
                        'notes'          => $uploadLabel,
                    ]);
                    $undoData[] = [
                        'tabung_id'       => $newRecord->id,
                        'original_amount' => null,
                        'original_notes'  => null,
                        'was_new'         => true,
                    ];
                }

                $updated++;
            }
        });

        $msg = "Added to Tabung Komitmen for {$updated} member(s).";

        return response()->json([
            'message'   => $msg,
            'errors'    => $errors,
            'undo_data' => $undoData,
        ]);
    }

    /* ── Undo Tabung Upload ───────────────────────────────────────── */
    public function undoTabungUpload(Request $request)
    {
        $v = $request->validate([
            'undo_data'                   => 'required|array',
            'undo_data.*.tabung_id'       => 'required|integer',
            'undo_data.*.original_amount' => 'nullable|numeric',
            'undo_data.*.original_notes'  => 'nullable|string',
            'undo_data.*.was_new'         => 'required|boolean',
        ]);

        DB::transaction(function () use ($v) {
            foreach ($v['undo_data'] as $item) {
                $record = TabungKomitmen::find($item['tabung_id']);
                if (! $record) continue;

                if ($item['was_new']) {
                    $record->delete();
                } else {
                    $record->update([
                        'amount' => $item['original_amount'],
                        'notes'  => $item['original_notes'] ?? '',
                    ]);
                }
            }
        });

        return response()->json([
            'message' => 'Upload reversed. Previous Tabung values restored.',
        ]);
    }

    /* ── File parser ─────────────────────────────────────────────────
     *  Supports .xlsx and .csv using only built-in PHP extensions.
     *  $includeHeader=true → row[0] is the header; false → header skipped.
     * ─────────────────────────────────────────────────────────────── */
    private function parseUploadedFile(\Illuminate\Http\UploadedFile $file, bool $includeHeader = false): array
    {
        $ext = strtolower($file->getClientOriginalExtension());

        if ($ext === 'xlsx' || $ext === 'xls') {
            return $this->parseXlsx($file->getRealPath(), $includeHeader);
        }

        // CSV / txt fallback
        $rows   = [];
        $handle = fopen($file->getRealPath(), 'r');
        $headerRow = fgetcsv($handle);
        if ($includeHeader && $headerRow !== false) {
            $rows[] = $headerRow;
        }
        while (($row = fgetcsv($handle)) !== false) {
            $rows[] = $row;
        }
        fclose($handle);
        return $rows;
    }

    private function parseXlsx(string $path, bool $includeHeader = false): array
    {
        $zip = new \ZipArchive();
        if ($zip->open($path) !== true) {
            return [];
        }

        // Build shared-strings lookup
        $sharedStrings = [];
        $ssXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($ssXml) {
            $ss = simplexml_load_string($ssXml);
            foreach ($ss->si as $si) {
                if (isset($si->t)) {
                    $sharedStrings[] = (string) $si->t;
                } else {
                    $text = '';
                    foreach ($si->r as $r) {
                        $text .= (string) $r->t;
                    }
                    $sharedStrings[] = $text;
                }
            }
        }

        // Read first worksheet
        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $zip->close();

        if (! $sheetXml) {
            return [];
        }

        $sheet   = simplexml_load_string($sheetXml);
        $allRows = [];

        foreach ($sheet->sheetData->row as $xmlRow) {
            $rowIdx  = (int) $xmlRow['r'] - 1;
            $rowData = [];

            foreach ($xmlRow->c as $cell) {
                $ref    = (string) $cell['r'];                   // e.g. "A1"
                $colIdx = $this->colToIndex(preg_replace('/\d/', '', $ref));
                $type   = (string) $cell['t'];
                $val    = isset($cell->v) ? (string) $cell->v : '';

                if ($type === 's') {
                    $val = $sharedStrings[(int) $val] ?? '';
                }

                $rowData[$colIdx] = $val;
            }

            if (! empty($rowData)) {
                $max = max(array_keys($rowData));
                for ($c = 0; $c <= $max; $c++) {
                    $rowData[$c] = $rowData[$c] ?? '';
                }
                ksort($rowData);
                $allRows[$rowIdx] = array_values($rowData);
            }
        }

        ksort($allRows);
        $allRows = array_values($allRows);
        return $includeHeader ? $allRows : array_slice($allRows, 1);
    }

    private function colToIndex(string $col): int
    {
        $index = 0;
        foreach (str_split(strtoupper($col)) as $char) {
            $index = $index * 26 + (ord($char) - ord('A') + 1);
        }
        return $index - 1;
    }

    /* ── AGM: list all meetings ─────────────────────────────────────────── */
    public function agmList()
    {
        $meetings = AgmMeeting::orderByDesc('scheduled_at')
            ->withCount('attendances')
            ->get()
            ->map(fn($m) => [
                'id'               => $m->id,
                'title'            => $m->title,
                'scheduled_at'     => $m->scheduled_at?->format('Y-m-d H:i'),
                'location'         => $m->location,
                'notes'            => $m->notes,
                'qr_token'         => $m->qr_token,
                'is_active'        => (bool) $m->is_active,
                'attendance_count' => $m->attendances_count,
                'created_at'       => $m->created_at?->format('Y-m-d'),
            ]);

        return response()->json(['meetings' => $meetings]);
    }

    /* ── AGM: create new meeting ────────────────────────────────────────── */
    public function agmCreate(Request $request)
    {
        $v = $request->validate([
            'title'        => 'required|string|max:200',
            'scheduled_at' => 'required|date',
            'location'     => 'nullable|string|max:200',
            'notes'        => 'nullable|string|max:1000',
        ]);

        $meeting = AgmMeeting::create([
            'title'        => $v['title'],
            'scheduled_at' => $v['scheduled_at'],
            'location'     => $v['location'] ?? null,
            'notes'        => $v['notes'] ?? null,
            'qr_token'     => AgmMeeting::generateToken(),
            'created_by'   => Auth::id(),
            'is_active'    => true,
        ]);

        return response()->json([
            'message' => 'Meeting created.',
            'meeting' => [
                'id'           => $meeting->id,
                'title'        => $meeting->title,
                'qr_token'     => $meeting->qr_token,
                'scheduled_at' => $meeting->scheduled_at->format('Y-m-d H:i'),
            ],
        ]);
    }

    /* ── AGM: live attendance list (for polling) ────────────────────────── */
    public function agmAttendance(int $id)
    {
        $meeting = AgmMeeting::findOrFail($id);

        $rows = AgmAttendance::where('meeting_id', $id)
            ->with('user:id,shareholder_id,full_name,name,email')
            ->orderByDesc('scanned_at')
            ->get()
            ->map(fn($a) => [
                'id'         => $a->id,
                'user_id'    => $a->user_id,
                'shareholder_id'  => $a->user->shareholder_id ?? '—',
                'name'       => $a->user->full_name ?? $a->user->name ?? '—',
                'email'      => $a->user->email ?? '',
                'scanned_at' => $a->scanned_at?->format('Y-m-d H:i:s'),
                'method'     => $a->method ?? 'qr',
            ]);

        return response()->json([
            'meeting' => [
                'id'        => $meeting->id,
                'title'     => $meeting->title,
                'is_active' => (bool) $meeting->is_active,
            ],
            'attendances' => $rows,
            'total'       => $rows->count(),
        ]);
    }

    /* ── AGM: search active members for manual attendance ──────────────── */
    public function agmMemberSearch(Request $request, int $id)
    {
        $q       = trim($request->get('q', ''));
        $meeting = AgmMeeting::findOrFail($id);

        $users = User::where('status', 'active')
            ->when($q, fn($query) => $query->where(function ($sq) use ($q) {
                $sq->where('full_name',  'like', "%{$q}%")
                   ->orWhere('name',     'like', "%{$q}%")
                   ->orWhere('shareholder_id','like', "%{$q}%");
            }))
            ->select('id', 'full_name', 'name', 'shareholder_id', 'role')
            ->orderByRaw("CASE WHEN shareholder_id = ? THEN 1 WHEN shareholder_id LIKE ? THEN 2 ELSE 3 END", [$q, "{$q}%"])
            ->orderBy('full_name')
            ->limit(30)
            ->get();

        $attendingIds = AgmAttendance::where('meeting_id', $id)
            ->whereIn('user_id', $users->pluck('id'))
            ->pluck('user_id')
            ->toArray();

        return response()->json([
            'members' => $users->map(fn($u) => [
                'id'          => $u->id,
                'name'        => $u->full_name ?? $u->name ?? '—',
                'shareholder_id'   => $u->shareholder_id ?? '—',
                'role'        => $u->role,
                'is_attending' => in_array($u->id, $attendingIds),
            ]),
        ]);
    }

    /* ── AGM: manual attendance (staff/admin marks someone as attended) ── */
    public function agmManualAttend(Request $request, int $id)
    {
        $v = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
        ]);

        $meeting = AgmMeeting::findOrFail($id);
        $user    = User::findOrFail($v['user_id']);

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Hanya ahli aktif yang boleh merekodkan kehadiran.',
            ], 422);
        }

        $attendance = AgmAttendance::firstOrCreate(
            ['meeting_id' => $meeting->id, 'user_id' => $user->id],
            [
                'scanned_at' => now(),
                'ip_address' => null,
                'method'     => 'manual',
                'marked_by'  => Auth::id() ?? 1,
            ]
        );

        $name = $user->full_name ?? $user->name ?? 'Member';

        return response()->json([
            'already_marked' => ! $attendance->wasRecentlyCreated,
            'message'        => $attendance->wasRecentlyCreated
                ? "{$name} telah direkodkan sebagai hadir."
                : "{$name} sudah pun direkodkan sebelum ini.",
            'attendance'     => [
                'id'         => $attendance->id,
                'user_id'    => $attendance->user_id,
                'shareholder_id'  => $user->shareholder_id ?? '—',
                'name'       => $name,
                'email'      => $user->email ?? '',
                'scanned_at' => $attendance->scanned_at?->format('Y-m-d H:i:s'),
                'method'     => $attendance->method ?? 'manual',
            ],
        ]);
    }

    /* ── AGM: remove a single attendance record ────────────────────────── */
    public function agmRemoveAttendance(int $meetingId, int $attendanceId)
    {
        AgmAttendance::where('meeting_id', $meetingId)
            ->where('id', $attendanceId)
            ->firstOrFail()
            ->delete();

        return response()->json(['message' => 'Attendance record removed.']);
    }

    /* ── AGM: toggle active state ───────────────────────────────────────── */
    public function agmToggle(int $id)
    {
        $m = AgmMeeting::findOrFail($id);
        $m->update(['is_active' => !$m->is_active]);

        return response()->json([
            'message'   => $m->is_active ? 'Meeting reopened.' : 'Meeting closed.',
            'is_active' => $m->is_active,
        ]);
    }

    /* ── AGM: delete meeting (also deletes attendances via cascade) ─────── */
    public function agmDelete(int $id)
    {
        AgmMeeting::findOrFail($id)->delete();
        return response()->json(['message' => 'Meeting deleted.']);
    }

    /* ── AGM: export attendance as CSV ──────────────────────────────────── */
    public function agmExport(int $id)
    {
        $meeting = AgmMeeting::findOrFail($id);
        $rows = AgmAttendance::where('meeting_id', $id)
            ->with('user:id,shareholder_id,full_name,name,email')
            ->orderBy('scanned_at')
            ->get();

        $filename = 'agm_' . $meeting->id . '_' . now()->format('Ymd_His') . '.csv';

        $callback = function () use ($meeting, $rows) {
            $h = fopen('php://output', 'w');
            fputcsv($h, ['Meeting', $meeting->title]);
            fputcsv($h, ['Scheduled', $meeting->scheduled_at?->format('Y-m-d H:i')]);
            fputcsv($h, []);
            fputcsv($h, ['#', 'Member ID', 'Name', 'Email', 'Scanned At']);
            foreach ($rows as $i => $r) {
                fputcsv($h, [
                    $i + 1,
                    $r->user->shareholder_id ?? '',
                    $r->user->full_name ?? $r->user->name ?? '',
                    $r->user->email ?? '',
                    $r->scanned_at?->format('Y-m-d H:i:s'),
                ]);
            }
            fclose($h);
        };

        return response()->stream($callback, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

}