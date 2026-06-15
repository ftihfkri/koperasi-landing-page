<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ShareholderDashboardDataController;
use App\Http\Controllers\StaffDashboardDataController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\AdminDashboardDataController;
use App\Http\Controllers\StaffActionController;
use App\Http\Controllers\AdminActionController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\PhotoUploadController;
use App\Http\Controllers\AdminReportController;
use App\Http\Controllers\ShareholderVerificationController;
use App\Http\Controllers\WalletController;
use App\Http\Controllers\ContactInquiryController;
use Illuminate\Support\Facades\Route;

// ── Landing Page ──────────────────────────────────────────────
Route::get('/', function () {
    return view('landing');
});

// Client-side routes handled by the landing-page React Router
Route::get('/board-members', fn () => view('landing'));
Route::get('/governance', fn () => view('landing'));

// ── Contact Form ──────────────────────────────────────────────
Route::post('/contact', [ContactInquiryController::class, 'store']);

// Load Test Endpoints (Bypassing Auth)
Route::post('/test/manual-attend/{id}', [AdminActionController::class, 'agmManualAttend']);

// ── Guest routes ──────────────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::get('/register',  [RegisteredUserController::class,       'create'])->name('register');
    Route::post('/register', [RegisteredUserController::class,       'store']);
    Route::get('/login',     [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login',    [AuthenticatedSessionController::class, 'store']);

    // Pending approval page — shown after registration, before staff approves
    Route::get('/register/pending', function () {
        return view('auth.register-pending');
    })->name('register.pending');

    // Forgot / reset password
    Route::get('/forgot-password',          [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('/forgot-password',         [PasswordResetLinkController::class, 'store'])->name('password.email');
    Route::get('/reset-password/{token}',   [NewPasswordController::class,       'create'])->name('password.reset');
    Route::post('/reset-password',          [NewPasswordController::class,       'store'])->name('password.store');
});

// ── Google OAuth ───────────────────────────────────────────────
Route::get('/auth/google',          [SocialAuthController::class, 'redirectToGoogle'])->name('auth.google');
Route::get('/auth/google/callback', [SocialAuthController::class, 'handleGoogleCallback'])->name('auth.google.callback');

// ── Complete profile after OAuth ───────────────────────────────
Route::middleware('auth')->group(function () {
    Route::get('/profile/complete',  [SocialAuthController::class, 'showCompleteProfileForm'])->name('profile.complete');
    Route::post('/profile/complete', [SocialAuthController::class, 'saveCompleteProfile'])->name('profile.complete.save');
});

// ── Logout ────────────────────────────────────────────────────
Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

// ── Redirect after login (role-based) ────────────────────────
Route::middleware('auth')->get('/dashboard', [DashboardController::class, 'redirect'])
    ->name('dashboard');

// ── Announcement attachment download (all authenticated users) ─
Route::middleware('auth')->get('/files/announcement/{id}', [AnnouncementController::class, 'download'])
    ->name('announcement.download');

// ── Avatar served through PHP (works without public/storage symlink) ─
Route::middleware('auth')->get('/files/avatar/{userId}', [PhotoUploadController::class, 'show'])
    ->name('avatar.show');

// ── Public AGM attendance scan (no middleware — auth-aware inside controller) ─
Route::get('/attend/{token}', [AttendanceController::class, 'scan'])->name('attendance.scan');

// ── Public shareholder verification (no auth — shows status only, no financial data) ─
Route::get('/verify/{id}/{token}', [ShareholderVerificationController::class, 'show'])->name('shareholder.verify');

// ════════════════════════════════════════════════════════════
// SHAREHOLDER ROUTES
// Open to shareholder, staff AND admin — staff/admin are also shareholders
// ════════════════════════════════════════════════════════════
Route::middleware(['auth', 'approved'])
    ->get('/shareholder/dashboard-data', ShareholderDashboardDataController::class)
    ->name('shareholder.dashboard.data');

Route::middleware(['auth', 'approved', 'role:shareholder,staff,admin'])
    ->prefix('shareholder')
    ->name('shareholder.')
    ->group(function () {
        Route::get('/',                   [DashboardController::class, 'shareholder'])->name('dashboard');
        Route::get('/my-investment',      [DashboardController::class, 'shareholder'])->name('my-investment');
        Route::get('/dividends',          [DashboardController::class, 'shareholder'])->name('dividends-page');
        Route::get('/transactions',       [DashboardController::class, 'shareholder'])->name('transactions-page');
        Route::get('/announcements',      [DashboardController::class, 'shareholder'])->name('announcements-page');
        Route::get('/statement/download',   [ReportController::class,      'memberStatement'])->name('statement.download');
        Route::get('/certificate',           [DashboardController::class,   'shareholder'])->name('certificate-page');
        Route::get('/certificate/download',  [CertificateController::class, 'download'])->name('certificate.download');
        Route::get('/shareholding-card',     [DashboardController::class,   'shareholder'])->name('shareholding-card');
        Route::post('/profile/photo',        [PhotoUploadController::class, 'uploadOwn'])->name('photo.upload');
        Route::get('/wallet/apple',          [WalletController::class, 'apple'])->name('wallet.apple');
        Route::get('/wallet/google',         [WalletController::class, 'google'])->name('wallet.google');
    });

// ════════════════════════════════════════════════════════════
// STAFF ROUTES
// ════════════════════════════════════════════════════════════
Route::middleware(['auth', 'approved', 'role:staff,admin'])
    ->prefix('staff')
    ->name('staff.')
    ->group(function () {

        // Blade views (all render same blade, React handles routing)
        Route::get('/',                    [DashboardController::class, 'staff'])->name('dashboard');
        Route::get('/shareholder-records', [DashboardController::class, 'staff'])->name('shareholder-records');
        Route::get('/verification',        [DashboardController::class, 'staff'])->name('verification');
        Route::get('/transactions',        [DashboardController::class, 'staff'])->name('transactions-page');
        Route::get('/announcements',       [DashboardController::class, 'staff'])->name('announcements-page');
        Route::get('/contact-inquiries',   [DashboardController::class, 'staff'])->name('contact-inquiries-page');

        // Data API
        Route::get('/dashboard-data', StaffDashboardDataController::class)->name('dashboard.data');
        Route::get('/contact-inquiries/data', [ContactInquiryController::class, 'index'])->name('contact-inquiries.data');
        Route::post('/contact-inquiries/{id}/read', [ContactInquiryController::class, 'markAsRead'])->name('contact-inquiries.read');

        // Shareholder actions
        Route::get('/shareholders/search',            [StaffActionController::class, 'searchMembers'])->name('shareholders.search');
        Route::get('/shareholders/{userId}',          [StaffActionController::class, 'getMember'])->name('shareholders.show');
        Route::post('/shareholders/{userId}/approve', [StaffActionController::class, 'approveRegistration'])->name('shareholders.approve');
        Route::post('/shareholders/{userId}/photo',   [PhotoUploadController::class, 'uploadForMember'])->name('shareholders.photo');

        // Submit for admin approval
        Route::post('/submit/edit-member/{userId}',      [StaffActionController::class, 'submitEditMember'])->name('submit.edit-member');
        Route::post('/submit/toggle-status/{userId}',    [StaffActionController::class, 'submitToggleStatus'])->name('submit.toggle-status');
        Route::post('/submit/add-transaction/{userId}',  [StaffActionController::class, 'submitAddTransaction'])->name('submit.add-transaction');
        Route::post('/submit/edit-transaction/{txId}',   [StaffActionController::class, 'submitEditTransaction'])->name('submit.edit-transaction');
        Route::post('/submit/delete-transaction/{txId}', [StaffActionController::class, 'submitDeleteTransaction'])->name('submit.delete-transaction');
        Route::post('/submit/change-tabung/{userId}',    [StaffActionController::class, 'submitChangeTabung'])->name('submit.change-tabung');

        // Notifications / tickets
        Route::post('/notifications/{id}/read',   [StaffActionController::class, 'markNotifRead'])->name('notif.read');
        Route::post('/notifications/{id}/reply',  [StaffActionController::class, 'replyNotification'])->name('notif.reply');
        Route::post('/notifications/{id}/close',  [AdminActionController::class, 'closeTicket'])->name('notif.staff-close');
        Route::post('/notifications/{id}/reopen', [AdminActionController::class, 'reopenTicket'])->name('notif.staff-reopen');

        // Transactions reporting
        Route::get('/transactions/data',     [StaffActionController::class, 'getTransactions'])->name('transactions.data');
        Route::get('/transactions/download', [StaffActionController::class, 'downloadTransactions'])->name('transactions.download');

        // AGM blade view (staff sees their own dashboard shell)
        Route::get('/agm', [DashboardController::class, 'staff'])->name('agm');
    });

// ════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ════════════════════════════════════════════════════════════
Route::middleware(['auth', 'approved', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {

        // Blade views
        Route::get('/',              [DashboardController::class, 'admin'])->name('dashboard');
        Route::get('/approvals',     [DashboardController::class, 'admin'])->name('approvals');
        Route::get('/shareholders',  [DashboardController::class, 'admin'])->name('shareholders');
        Route::get('/dividend',      [DashboardController::class, 'admin'])->name('dividend');
        Route::get('/transactions',  [DashboardController::class, 'admin'])->name('transactions');
        Route::get('/announcements',  [DashboardController::class, 'admin'])->name('announcements');
        Route::get('/notifications',  [DashboardController::class, 'admin'])->name('notifications');
        Route::get('/reports',        [DashboardController::class, 'admin'])->name('reports');
        Route::get('/audit-log',      [DashboardController::class, 'admin'])->name('audit-log');

        // Data API
        Route::get('/dashboard-data', AdminDashboardDataController::class)->name('dashboard.data');

        // Approvals
        Route::post('/approvals/{id}/approve', [AdminActionController::class, 'approvePending'])->name('approvals.approve');
        Route::post('/approvals/{id}/reject',  [AdminActionController::class, 'rejectPending'])->name('approvals.reject');

        // Dividend
        Route::post('/dividend/set', [AdminActionController::class, 'setDividend'])->name('dividend.set');

        // Users / role management
        Route::get('/users/list',           [AdminActionController::class, 'usersList'])->name('users.list');
        Route::post('/users/{userId}/role', [AdminActionController::class, 'changeRole'])->name('users.role');

        // Notify staff / tickets
        Route::post('/notify-staff',                    [AdminActionController::class, 'notifyStaff'])->name('notify-staff');
        Route::post('/notifications/{id}/reply',        [AdminActionController::class, 'replyToStaff'])->name('notif.admin-reply');
        Route::post('/notifications/{id}/close',        [AdminActionController::class, 'closeTicket'])->name('notif.close');
        Route::post('/notifications/{id}/reopen',       [AdminActionController::class, 'reopenTicket'])->name('notif.reopen');
        Route::get('/notifications',                     [AdminActionController::class, 'listNotifications'])->name('notif.list');

        // Tabung Komitmen (admin direct set)
        Route::post('/tabung/set',            [AdminActionController::class, 'setTabung'])->name('tabung.set');
        Route::post('/tabung/delete',          [AdminActionController::class, 'deleteTabung'])->name('tabung.delete');

        // Excel uploads
        Route::post('/upload/dividend',      [AdminActionController::class, 'uploadDividend'])->name('upload.dividend');
        Route::post('/upload/tabung',        [AdminActionController::class, 'uploadTabung'])->name('upload.tabung');
        Route::post('/upload/dividend/undo', [AdminActionController::class, 'undoDividendUpload'])->name('upload.dividend.undo');
        Route::post('/upload/tabung/undo',   [AdminActionController::class, 'undoTabungUpload'])->name('upload.tabung.undo');

        // Dividend history management
        Route::delete('/dividend/{year}',     [AdminActionController::class, 'deleteDividendYear'])->name('dividend.delete');

        // Announcements
        Route::post('/announcements',             [AdminActionController::class, 'postAnnouncement'])->name('announcements.store');
        Route::post('/announcements/{id}/toggle', [AdminActionController::class, 'toggleAnnouncement'])->name('announcements.toggle');
        Route::delete('/announcements/{id}',      [AdminActionController::class, 'deleteAnnouncement'])->name('announcements.destroy');

        // Reports
        Route::get('/reports/financial-summary', [AdminReportController::class, 'financialSummary'])->name('reports.financial-summary');
        Route::get('/reports/audit-log',         [AdminReportController::class, 'auditLog'])->name('reports.audit-log');

        // AGM blade view (admin shell)
        Route::get('/agm', [DashboardController::class, 'admin'])->name('agm');
    });

// ── AGM API routes — accessible by both staff AND admin ──────
Route::middleware(['auth', 'approved', 'role:staff,admin'])
    ->prefix('admin/agm')
    ->name('admin.agm.')
    ->group(function () {
        Route::get('/list',            [AdminActionController::class, 'agmList'])->name('list');
        Route::post('/create',         [AdminActionController::class, 'agmCreate'])->name('create');
        Route::get('/{id}/attendance',     [AdminActionController::class, 'agmAttendance'])->name('attendance');
        Route::get('/{id}/members',        [AdminActionController::class, 'agmMemberSearch'])->name('members');
        Route::post('/{id}/manual-attend',              [AdminActionController::class, 'agmManualAttend'])->name('manual.attend');
        Route::delete('/{id}/attendance/{attendanceId}',[AdminActionController::class, 'agmRemoveAttendance'])->name('attendance.remove');
        Route::post('/{id}/toggle',                     [AdminActionController::class, 'agmToggle'])->name('toggle');
        Route::delete('/{id}',         [AdminActionController::class, 'agmDelete'])->name('delete');
        Route::get('/{id}/export',     [AdminActionController::class, 'agmExport'])->name('export');
    });