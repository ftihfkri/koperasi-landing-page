<?php

namespace App\Http\Controllers;

use App\Models\Dividend;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index()
    {
        return view('reports.index');
    }

    public function memberStatement()
    {
        $user = Auth::user();
        $rows = $user->transactions()->orderBy('transaction_date')->get(['transaction_date', 'type', 'amount', 'description']);

        return $this->streamCsv('member-statement-' . $user->shareholder_id . '.csv', ['Date', 'Type', 'Amount', 'Description'], $rows->map(function ($row) {
            return [
                optional($row->transaction_date)->format('Y-m-d'),
                ucfirst($row->type),
                number_format((float) $row->amount, 2, '.', ''),
                $row->description,
            ];
        })->all());
    }

    public function adminSummary(Request $request)
    {
        $year = $request->integer('year', now()->year);

        $rows = Transaction::with('user')
            ->whereYear('transaction_date', $year)
            ->orderBy('transaction_date')
            ->get();

        return $this->streamCsv('koperasi-summary-' . $year . '.csv', ['Date', 'Member ID', 'Name', 'Type', 'Amount', 'Description'], $rows->map(function ($row) {
            return [
                optional($row->transaction_date)->format('Y-m-d'),
                optional($row->user)->shareholder_id,
                optional($row->user)->display_name,
                ucfirst($row->type),
                number_format((float) $row->amount, 2, '.', ''),
                $row->description,
            ];
        })->all());
    }

    private function streamCsv(string $filename, array $headers, array $rows): StreamedResponse
    {
        return response()->streamDownload(function () use ($headers, $rows) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $headers);
            foreach ($rows as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }
}
