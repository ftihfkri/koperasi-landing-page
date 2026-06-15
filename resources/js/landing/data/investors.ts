// app/src/data/investors.ts

export type InvestorProfile = {
  id: number;
  ic4digit: number;
  startmembership: string; // YYYY-MM-DD
  status: "active" | "inactive" | "pending";
};

export type TxType = "BUY" | "DIVIDEND";

export type InvestorTransaction = {
  txId: string;
  investorId: number;      // links to profile.id
  ic4digit: number;        // duplicated for easy checking
  type: TxType;
  transaction: number;     // RM amount
  date: string;            // YYYY-MM-DD
};

export const INVESTOR_PROFILES: InvestorProfile[] = [
  { id: 101, ic4digit: 6401, startmembership: "2016-04-12", status: "active" },
  { id: 102, ic4digit: 6101, startmembership: "2018-09-08", status: "active" },
  { id: 103, ic4digit: 5100, startmembership: "2020-01-02", status: "active" },
];

// 30 mock transactions total (10 per investorId: 101, 102, 103)
export const INVESTOR_TRANSACTIONS: InvestorTransaction[] = [
  // -------------------- ID 101 (10) --------------------
  { txId: "TX-101-001", investorId: 101, ic4digit: 6401, type: "BUY",      transaction: 200, date: "2024-04-05" },
  { txId: "TX-101-002", investorId: 101, ic4digit: 6401, type: "BUY",      transaction: 200, date: "2024-05-05" },
  { txId: "TX-101-003", investorId: 101, ic4digit: 6401, type: "BUY",      transaction: 200, date: "2024-06-05" },
  { txId: "TX-101-004", investorId: 101, ic4digit: 6401, type: "DIVIDEND", transaction: 120, date: "2024-12-31" },

  { txId: "TX-101-005", investorId: 101, ic4digit: 6401, type: "BUY",      transaction: 250, date: "2025-01-05" },
  { txId: "TX-101-006", investorId: 101, ic4digit: 6401, type: "BUY",      transaction: 250, date: "2025-02-05" },
  { txId: "TX-101-007", investorId: 101, ic4digit: 6401, type: "BUY",      transaction: 250, date: "2025-03-05" },
  { txId: "TX-101-008", investorId: 101, ic4digit: 6401, type: "DIVIDEND", transaction: 310, date: "2025-12-31" },

  { txId: "TX-101-009", investorId: 101, ic4digit: 6401, type: "BUY",      transaction: 300, date: "2026-01-10" },
  { txId: "TX-101-010", investorId: 101, ic4digit: 6401, type: "BUY",      transaction: 300, date: "2026-02-10" },

  // -------------------- ID 102 (10) --------------------
  { txId: "TX-102-001", investorId: 102, ic4digit: 6101, type: "BUY",      transaction: 150, date: "2024-03-15" },
  { txId: "TX-102-002", investorId: 102, ic4digit: 6101, type: "BUY",      transaction: 150, date: "2024-04-15" },
  { txId: "TX-102-003", investorId: 102, ic4digit: 6101, type: "BUY",      transaction: 150, date: "2024-05-15" },
  { txId: "TX-102-004", investorId: 102, ic4digit: 6101, type: "DIVIDEND", transaction: 90,  date: "2024-12-31" },

  { txId: "TX-102-005", investorId: 102, ic4digit: 6101, type: "BUY",      transaction: 180, date: "2025-02-20" },
  { txId: "TX-102-006", investorId: 102, ic4digit: 6101, type: "BUY",      transaction: 180, date: "2025-03-20" },
  { txId: "TX-102-007", investorId: 102, ic4digit: 6101, type: "BUY",      transaction: 180, date: "2025-04-20" },
  { txId: "TX-102-008", investorId: 102, ic4digit: 6101, type: "DIVIDEND", transaction: 210, date: "2025-12-31" },

  { txId: "TX-102-009", investorId: 102, ic4digit: 6101, type: "BUY",      transaction: 220, date: "2026-01-12" },
  { txId: "TX-102-010", investorId: 102, ic4digit: 6101, type: "BUY",      transaction: 220, date: "2026-02-12" },

  // -------------------- ID 103 (10) --------------------
  { txId: "TX-103-001", investorId: 103, ic4digit: 5100, type: "BUY",      transaction: 100, date: "2024-02-01" },
  { txId: "TX-103-002", investorId: 103, ic4digit: 5100, type: "BUY",      transaction: 100, date: "2024-03-01" },
  { txId: "TX-103-003", investorId: 103, ic4digit: 5100, type: "BUY",      transaction: 100, date: "2024-04-01" },
  { txId: "TX-103-004", investorId: 103, ic4digit: 5100, type: "DIVIDEND", transaction: 60,  date: "2024-12-31" },

  { txId: "TX-103-005", investorId: 103, ic4digit: 5100, type: "BUY",      transaction: 120, date: "2025-01-18" },
  { txId: "TX-103-006", investorId: 103, ic4digit: 5100, type: "BUY",      transaction: 120, date: "2025-02-18" },
  { txId: "TX-103-007", investorId: 103, ic4digit: 5100, type: "BUY",      transaction: 120, date: "2025-03-18" },
  { txId: "TX-103-008", investorId: 103, ic4digit: 5100, type: "DIVIDEND", transaction: 150, date: "2025-12-31" },

  { txId: "TX-103-009", investorId: 103, ic4digit: 5100, type: "BUY",      transaction: 140, date: "2026-01-22" },
  { txId: "TX-103-010", investorId: 103, ic4digit: 5100, type: "BUY",      transaction: 140, date: "2026-02-22" },
];