<?php

namespace App\Mail;

use App\Models\Transaction;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TransactionRecorded extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User        $member,
        public Transaction $transaction,
    ) {}

    public function envelope(): Envelope
    {
        $type = ucfirst($this->transaction->type);
        return new Envelope(subject: "Transaction Recorded: {$type} — KOP-SSB");
    }

    public function content(): Content
    {
        return new Content(view: 'emails.transaction-recorded');
    }
}
