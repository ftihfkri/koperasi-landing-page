// app/src/pages/investor/InvestorDashboard.tsx

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
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
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  return Math.max(0, months);
}

function sortByDateDesc(a: { date: string }, b: { date: string }) {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

function sortByDateAsc(a: { date: string }, b: { date: string }) {
  return new Date(a.date).getTime() - new Date(b.date).getTime();
}

export default function InvestorDashboard() {
  // ✅ Mock “logged-in investor”
  // Later replace this with AuthContext (user.id + user.ic4digit)
  const auth = { id: 101, ic4digit: 6401 };

  // Pagination settings
  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);

  // Dividend settings (simple demo calculation)
  const dividendRate = 0.1; //   10.00% (demo)
  const dividendYear = new Date().getFullYear(); // this year

  const profile: InvestorProfile | undefined = useMemo(() => {
    return (
      INVESTOR_PROFILES.find((p) => p.id === auth.id) ??
      INVESTOR_PROFILES.find((p) => p.ic4digit === auth.ic4digit)
    );
  }, [auth.id, auth.ic4digit]);

  const myTx: InvestorTransaction[] = useMemo(() => {
    if (!profile) return [];
    return INVESTOR_TRANSACTIONS
      .filter((t) => t.investorId === profile.id)
      .slice()
      .sort(sortByDateDesc);
  }, [profile]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0c1a0f] p-6 text-white">
        <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-black/40 p-6">
          <h1 className="text-xl font-semibold">Investor Dashboard</h1>
          <p className="mt-2 text-white/70">
            No profile found for this login. (Later this will come from DB)
          </p>
        </div>
      </div>
    );
  }

  // KPI calculations
  const membershipMonths = monthsSince(profile.startmembership);

  const totalInvested = myTx
    .filter((t) => t.type === "BUY")
    .reduce((sum, t) => sum + t.transaction, 0);

  const totalDividends = myTx
    .filter((t) => t.type === "DIVIDEND")
    .reduce((sum, t) => sum + t.transaction, 0);

  // ✅ Yearly dividend (simple demo):
  // “This year’s dividend estimate = Total Invested * rate”
  const yearlyDividendEstimate = totalInvested * dividendRate;

  // Transactions in the current year (optional info)
  const dividendsThisYear = myTx
    .filter((t) => t.type === "DIVIDEND" && new Date(t.date).getFullYear() === dividendYear)
    .reduce((sum, t) => sum + t.transaction, 0);

  // Recent 5
  const recentTx = myTx.slice(0, 5);

  // Pagination for full history
  const totalPages = Math.max(1, Math.ceil(myTx.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pagedTx = myTx.slice(startIndex, startIndex + PAGE_SIZE);

  // Chart 1: Cumulative balance over time (BUY adds, DIVIDEND adds too for demo)
  const growthData = useMemo(() => {
    const asc = myTx.slice().sort(sortByDateAsc);
    let balance = 0;

    return asc.map((t) => {
      // For demo: both BUY and DIVIDEND increase “portfolio value”
      balance += t.transaction;
      return {
        date: t.date,
        value: balance,
      };
    });
  }, [myTx]);

  // Chart 2: BUY vs DIVIDEND breakdown
  const pieData = useMemo(() => {
    const buy = totalInvested;
    const div = totalDividends;
    return [
      { name: "BUY", value: buy },
      { name: "DIVIDEND", value: div },
    ];
  }, [totalInvested, totalDividends]);

    const PIE_COLORS = ["#d2a855", "#4ade80"];

  return (
    <div className="min-h-screen bg-[#0c1a0f] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Investor Dashboard</h1>
            <p className="text-sm text-white/70">
              Individual dashboard (showing ID <span className="font-semibold">{profile.id}</span>)
            </p>
          </div>

          <div className="flex gap-2">
            <button className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
              Download Statement
            </button>
            <button className="rounded-xl bg-[#d2a855] px-4 py-2 text-sm font-medium text-black hover:opacity-90">
              Log out
            </button>
          </div>
        </div>

        {/* Profile + KPIs */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
          {/* Profile */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-5 lg:col-span-1">
            <h2 className="text-base font-semibold">Profile</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between text-white/80">
                <span>ID</span>
                <span className="font-medium text-white">{profile.id}</span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>Start Membership</span>
                <span className="font-medium text-white">{profile.startmembership}</span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>Status</span>
                <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-medium text-white">
                  {profile.status}
                </span>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <p className="text-sm text-white/70">Total Invested</p>
              <p className="mt-2 text-xl font-semibold">{money(totalInvested)}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <p className="text-sm text-white/70">Total Dividends</p>
              <p className="mt-2 text-xl font-semibold">{money(totalDividends)}</p>
            </div>

            {/* ✅ Added: Yearly Dividend */}
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <p className="text-sm text-white/70">
                Yearly Dividend ({Math.round(dividendRate * 100)}%)
              </p>
              <p className="mt-2 text-xl font-semibold">{money(yearlyDividendEstimate)}</p>
              <p className="mt-1 text-xs text-white/50">
                (demo calc: invested × rate)
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <p className="text-sm text-white/70">Membership Duration</p>
              <p className="mt-2 text-xl font-semibold">{membershipMonths} months</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Growth */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Portfolio Growth</h2>
              <span className="text-xs text-white/60">mock based on transactions</span>
            </div>

            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
                  <Tooltip formatter={(v) => money(Number(v))} />
                  <Line type="monotone" dataKey="value" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
            <h2 className="text-base font-semibold">BUY vs DIVIDEND</h2>
            <p className="mt-1 text-xs text-white/60">
              Dividend paid this year: <span className="font-semibold">{money(dividendsThisYear)}</span>
            </p>

            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">

                <PieChart>
                <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                stroke="#0c1a0f"
                strokeWidth={2}
                >
                    {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                </Pie>

                <Tooltip formatter={(v) => money(Number(v))} />
                <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent transactions (latest 5) */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent Transactions</h2>
            <span className="text-sm text-white/60">latest 5</span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-white/70">
                <tr className="border-b border-white/10">
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Amount</th>
                  <th className="py-3 pr-4">ID</th>
                </tr>
              </thead>
              <tbody>
                {recentTx.map((t) => (
                  <tr key={t.txId} className="border-b border-white/5 last:border-b-0">
                    <td className="py-3 pr-4">{t.date}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-white/10 px-2 py-1 text-xs">
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-medium">{money(t.transaction)}</td>
                    <td className="py-3 pr-4">{profile.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Full history with pagination (5 per page) */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold">Transaction History</h2>

            <div className="flex items-center gap-2 text-sm">
              <button
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 hover:bg-white/10 disabled:opacity-40"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
              >
                Prev
              </button>

              <span className="text-white/70">
                Page <span className="font-semibold text-white">{safePage}</span> / {totalPages}
              </span>

              <button
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 hover:bg-white/10 disabled:opacity-40"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
              >
                Next
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-white/70">
                <tr className="border-b border-white/10">
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Amount</th>
                  <th className="py-3 pr-4">ID</th>

                </tr>
              </thead>
              <tbody>
                {pagedTx.map((t) => (
                  <tr key={t.txId} className="border-b border-white/5 last:border-b-0">
                    <td className="py-3 pr-4">{t.date}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-white/10 px-2 py-1 text-xs">
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-medium">{money(t.transaction)}</td>
                    <td className="py-3 pr-4">{profile.id}</td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-white/50">
            Next step later: replace mock data with DB/API (thousands of investors since 2016).
          </p>
        </div>
      </div>
    </div>
  );
}
