<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ShareholdingApproved extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $member) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Your Shareholding Has Been Approved — KOP-SSB');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.membership-approved');
    }
}
