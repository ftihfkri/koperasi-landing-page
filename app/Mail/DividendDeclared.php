<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DividendDeclared extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User  $member,
        public int   $year,
        public float $rate,
        public float $amount,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Dividend FY{$this->year} Declared — KOP-SSB");
    }

    public function content(): Content
    {
        return new Content(view: 'emails.dividend-declared');
    }
}
