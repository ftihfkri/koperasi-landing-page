import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import {
  INVESTOR_PROFILES,
  INVESTOR_TRANSACTIONS,
  type InvestorProfile,
  type InvestorTransaction,
} from "../../data/investors";

function money(n: number) {
  return `RM ${n.toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function monthsSince(dateStr: string) {
  const start = new Date(dateStr);
  const now = new Date();
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return Math.max(0, months);
}

export default function InvestorDashboard() {
  // ✅ mock logged-in investor
  const loggedInId = 101;

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  const investor: InvestorProfile | undefined = useMemo(() => {
    return INVESTOR_PROFILES.find((x) => x.id === loggedInId);
  }, [loggedInId]);

  const myTransactions: InvestorTransaction[] = useMemo(() => {
    return INVESTOR_TRANSACTIONS
      .filter((t) => t.investorId === loggedInId)
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date)); // oldest -> newest
  }, [loggedInId]);

  // Only BUY counts as investment
  const totalInvestment = useMemo(() => {
    return myTransactions
      .filter((t) => t.type === "BUY")
      .reduce((sum, t) => sum + t.transaction, 0);
  }, [myTransactions]);

  // Dividend = 10% of total BUY investment (simple estimate)
  const DIVIDEND_RATE = 0.10;
  const yearlyDividend = totalInvestment * DIVIDEND_RATE;

  const membershipMonths = useMemo(() => {
    return investor ? monthsSince(investor.startmembership) : 0;
  }, [investor]);

  // ✅ Chart: cumulative BUY balance over time
  const growthData = useMemo(() => {
    let running = 0;
    return myTransactions
      .filter((t) => t.type === "BUY")
      .map((t) => {
        running += t.transaction;
        return { month: t.date.slice(0, 7), value: running };
      });
  }, [myTransactions]);

  // ✅ Latest 5 (newest first)
  const recentTx = useMemo(() => {
    return myTransactions.slice().reverse().slice(0, 5);
  }, [myTransactions]);

  // ✅ Full history (newest first) + pagination
  const historyNewestFirst = useMemo(() => myTransactions.slice().reverse(), [myTransactions]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(historyNewestFirst.length / PAGE_SIZE));
  }, [historyNewestFirst.length]);

  const paginatedHistory = useMemo(() => {
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return historyNewestFirst.slice(start, start + PAGE_SIZE);
  }, [historyNewestFirst, page, totalPages]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(p, 1), totalPages));
  }, [totalPages]);

  if (!investor) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h1 className="text-xl font-semibold text-gray-900">Investor Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">Investor ID {loggedInId} not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Investor Dashboard</h1>
            <p className="text-sm text-gray-600">Individual portfolio view (Mock: ID {loggedInId})</p>
          </div>

          <div className="flex gap-2">
            <button className="rounded-xl border bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50">
              Download Statement
            </button>
            <button className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-black">
              Log out
            </button>
          </div>
        </div>

        {/* Profile + KPI cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
          {/* Profile */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 lg:col-span-1">
            <h2 className="text-base font-semibold text-gray-900">Profile</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ID</span>
                <span className="font-medium text-gray-900">{investor.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Start Membership</span>
                <span className="font-medium text-gray-900">{investor.startmembership}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-900">
                  {investor.status}
                </span>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 lg:col-span-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <p className="text-sm text-gray-600">Total Investment (BUY)</p>
              <p className="mt-2 text-xl font-semibold text-gray-900">{money(totalInvestment)}</p>
              <p className="mt-1 text-xs text-gray-500">{myTransactions.length} transactions</p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <p className="text-sm text-gray-600">Membership Duration</p>
              <p className="mt-2 text-xl font-semibold text-gray-900">{membershipMonths} months</p>
              <p className="mt-1 text-xs text-gray-500">Since {investor.startmembership}</p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <p className="text-sm text-gray-600">Status</p>
              <p className="mt-2 text-xl font-semibold text-gray-900">{investor.status}</p>
              <p className="mt-1 text-xs text-gray-500">Member record</p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <p className="text-sm text-gray-600">Yearly Dividend (10%)</p>
              <p className="mt-2 text-xl font-semibold text-green-600">{money(yearlyDividend)}</p>
              <p className="mt-1 text-xs text-gray-500">Estimated from total BUY</p>
            </div>
          </div>
        </div>

        {/* Chart + Recent transactions */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Growth chart */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Balance Growth (BUY Cumulative)</h2>
              <span className="text-sm text-gray-600">Mock data</span>
            </div>

            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
                  <Tooltip formatter={(v) => money(Number(v))} />
                  <Line type="monotone" dataKey="value" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent activity */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Recent Transactions</h2>
            <p className="mt-1 text-xs text-gray-500">Latest 5</p>

            <div className="mt-4 space-y-3">
              {recentTx.length === 0 ? (
                <p className="text-sm text-gray-600">No transactions found.</p>
              ) : (
                recentTx.map((t) => (
                  <div key={t.txId} className="rounded-xl bg-gray-50 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{money(t.transaction)}</p>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-700 ring-1 ring-gray-200">
                        {t.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{t.date}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* History + pagination */}
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Transaction History</h2>
              <p className="text-xs text-gray-500">Showing {PAGE_SIZE} per page • Newest first</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="rounded-xl border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>

              <span className="text-sm text-gray-700">
                Page <span className="font-medium">{page}</span> / {totalPages}
              </span>

              <button
                className="rounded-xl border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-600">
                <tr className="border-b">

                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Amount (RM)</th>
                </tr>
              </thead>

              <tbody className="text-gray-900">
                {paginatedHistory.length === 0 ? (
                  <tr>
                    <td className="py-3 pr-4" colSpan={4}>
                      No data.
                    </td>
                  </tr>
                ) : (
                  paginatedHistory.map((t) => (
                    <tr key={t.txId} className="border-b last:border-b-0">
                      <td className="py-3 pr-4">{t.date}</td>
                      <td className="py-3 pr-4">{t.type}</td>
                      <td className="py-3 pr-4">{money(t.transaction)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Later: connect to DB with backend pagination (best for thousands of records).
          </p>
        </div>
      </div>
    </div>
  );
}