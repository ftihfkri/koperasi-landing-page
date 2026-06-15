import React, { useEffect, useState, useCallback, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { QRCodeSVG } from "../../lib/qrcode-react.js";

type ModalProps = {
  modal: string;
  mdata: any;
  profile: any;
  onClose: () => void;
  onSubmit: (url:string, body:any) => void;
};

const fmt0 = (n:number) => `RM ${Number(n||0).toLocaleString("en-MY",{minimumFractionDigits:2,maximumFractionDigits:2})}`;

const StaffModal = React.memo(({ modal, mdata, profile, onClose, onSubmit }: ModalProps) => {
  const mp = profile || mdata;
  const [type,        setType]        = useState(mdata?.type?.toLowerCase?.() || "deposit");
  const [amount,      setAmount]      = useState(mdata?.amount ? String(mdata.amount) : "");
  const [txDate,      setTxDate]      = useState(mdata?.transaction_date || new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState(mdata?.description || "");
  const [shareholderId,    setShareholderId]    = useState(mdata?.member_id || "");
  const [fullName,    setFullName]    = useState(mdata?.name || mdata?.full_name || "");
  const [tabungAmt,   setTabungAmt]   = useState(mdata?.tabung ? String(mdata.tabung) : "0");
  const [notes,       setNotes]       = useState("");
  const [remarks,     setRemarks]     = useState("");

  if (!modal) return null;

  const titles: Record<string,string> = {
    editMember:"Edit Shareholder Info", toggleStatus:"Toggle Shareholder Status",
    changeTabung:"Change Tabung Komitmen", addTx:"Add Transaction",
    editTx:"Edit Transaction", deleteTx:"Confirm Delete Transaction",
  };
  const uid = mp?.id;

  const handleSubmit = async () => {
    if (modal === "editMember")
      await onSubmit(`/staff/submit/edit-member/${uid}`, { member_id: shareholderId, full_name: fullName, remarks });
    else if (modal === "toggleStatus")
      await onSubmit(`/staff/submit/toggle-status/${uid}`, { is_approved: mdata?.status !== 'active', remarks });
    else if (modal === "changeTabung")
      await onSubmit(`/staff/submit/change-tabung/${uid}`, { amount: tabungAmt, notes, remarks });
    else if (modal === "addTx")
      await onSubmit(`/staff/submit/add-transaction/${uid}`, { type, amount, transaction_date: txDate, description, remarks });
    else if (modal === "editTx")
      await onSubmit(`/staff/submit/edit-transaction/${mdata?.id}`, { type, amount, transaction_date: txDate, description, remarks });
    else if (modal === "deleteTx")
      await onSubmit(`/staff/submit/delete-transaction/${mdata?.id}`, { remarks });
  };

  return (
    <div className="Mbg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="Mbox">
        <div className="Mhdr">
          <div className="Mtitle">{titles[modal] || "Action"}</div>
          <button className="Mclose" onClick={onClose}>✕</button>
        </div>
        <div className="Mbody">
          <div className="Al Al-o"><span>⚠️</span><span>This action requires <strong>admin approval</strong> before taking effect.</span></div>
          {mp && (
            <div style={{background:"#f5faf4",border:"1px solid #c5d6c3",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12.5,color:"#4a6a4a"}}>
              Shareholder: <strong style={{color:"#1a2e1a"}}>{mp.name || mp.full_name}</strong> &nbsp;·&nbsp;
              ID: <span style={{fontFamily:"JetBrains Mono,monospace",color:"#2d6a2d"}}>{mp.shareholder_id}</span>
            </div>
          )}
          {modal === "editMember" && (<>
            <label className="Fl">Shareholder ID</label>
            <input className="Fi" value={shareholderId} onChange={e => setShareholderId(e.target.value)} placeholder="Shareholder ID"/>
            <label className="Fl">Full Name</label>
            <input className="Fi" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full name"/>
          </>)}
          {modal === "toggleStatus" && (
            <div className={`Al ${mdata?.status === 'active' ? "Al-r" : "Al-g"}`}>
              <span>{mdata?.status === 'active' ? "🚫" : "✅"}</span>
              <span>This will <strong>{mdata?.status === 'active' ? "deactivate" : "activate"}</strong> this shareholder's account.</span>
            </div>
          )}
          {modal === "changeTabung" && (<>
            <label className="Fl">New Tabung Komitmen Amount (RM)</label>
            <input className="Fi" type="number" step="0.01" min="0" value={tabungAmt} onChange={e => setTabungAmt(e.target.value)}/>
            <label className="Fl">Notes (reason for change)</label>
            <input className="Fi" placeholder="e.g. Board decision Apr 2026…" value={notes} onChange={e => setNotes(e.target.value)}/>
          </>)}
          {(modal === "addTx" || modal === "editTx") && (<>
            <label className="Fl">Transaction Type</label>
            <select className="Fsel" value={type} onChange={e => setType(e.target.value)}>
              <option value="deposit">DEPOSIT</option>
              <option value="dividend">DIVIDEND (Dividend Received)</option>
              <option value="withdrawal">WITHDRAW (Withdrawal)</option>
            </select>
            <label className="Fl">Amount (RM)</label>
            <input className="Fi" type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 500.00"/>
            <label className="Fl">Date</label>
            <input className="Fi" type="date" value={txDate} onChange={e => setTxDate(e.target.value)}/>
            <label className="Fl">Description (optional)</label>
            <input className="Fi" placeholder="Optional note…" value={description} onChange={e => setDescription(e.target.value)}/>
          </>)}
          {modal === "deleteTx" && (
            <div className="Al Al-r">
              <span>🗑</span>
              <span>Request to <strong>permanently delete</strong> this transaction:<br/>
                <span style={{fontFamily:"JetBrains Mono,monospace"}}>{mdata?.type} — {fmt0(mdata?.amount || 0)} on {mdata?.date}</span>
              </span>
            </div>
          )}
          <label className="Fl">Your Remarks</label>
          <textarea className="Fta" placeholder="Reason for this change…" value={remarks} onChange={e => setRemarks(e.target.value)}/>
        </div>
        <div className="Mfoot">
          <button className="Btn Btn-o" onClick={onClose}>Cancel</button>
          <button className={`Btn ${modal === "deleteTx" ? "Btn-red" : "Btn-g"}`} onClick={handleSubmit}>
            {modal === "deleteTx" ? "🗑 Request Delete" : "Submit for Approval"}
          </button>
        </div>
      </div>
    </div>
  );
});

/* ── Types ── */
type Kpi    = { total_members:number; active_members:number; inactive_members:number; pending_members:number; accounts_to_verify:number; tx_this_month:number; tx_today:number; pending_admin:number; unread_notif:number; };
type Shareholder = { id:number; name:string; member_id:string; email:string; phone_number?:string|null; is_approved:boolean; status:'active'|'inactive'|'pending'; joined:string; start_date:string|null; deposit:number; dividend:number; tabung:number; tx_count:number; };
type Tx     = { id:number; date:string; member:string; mid:string; type:string; amount:number; desc?:string; };
type Reg    = { id:number; name:string; mid:string; email:string; joined:string; };
type Pend   = { id:number; type:string; member:string; mid:string; payload:any; remarks:string; status:string; admin_note?:string; created_at:string; };
type Notif  = { id:number; title?:string; message:string; ticket_type?:string; reference_id?:number|null; status?:string; from:string; about:string|null; about_id?:number|null; is_read:boolean; created_at:string; replies?:any[]; };
type Ann    = { id:number; title:string; content:string; published_at:string|null; attachment_name?:string; attachment_url?:string; };
/* ── Added announcements to DashData ── */
type DashData = { kpi:Kpi; all_members:Shareholder[]; new_registrations:Reg[]; recent_transactions:Tx[]; my_pending:Pend[]; notifications:Notif[]; announcements:Ann[]; };
type MemberDetail = { profile:any; summary:any; transactions:any[]; tabung_history:any[]; };

const fmt  = (n:number) => `RM ${Number(n||0).toLocaleString("en-MY",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const csrf = () => (window as any).LaravelCsrfToken || "";
const au   = () => (window as any).AuthUser || {};
const base = () => ((window as any).AppBase ?? "") as string;
const getPage = () => {
  const p = window.location.pathname;
  if (p.includes("/verification"))   return "verification";
  if (p.includes("/shareholder-records")) return "members";
  if (p.includes("/transactions"))   return "transactions";
  if (p.includes("/notifications"))  return "notifications";
  if (p.includes("/announcements"))  return "announcements";
  if (p.includes("/agm"))            return "agm";
  return "dashboard";
};
const postS = async (url:string, body:any, method="POST") => {
  const r = await fetch(base() + url, { method, credentials:"include", headers:{"Content-Type":"application/json","X-CSRF-TOKEN":csrf(),"Accept":"application/json"}, body:method==="DELETE"?undefined:JSON.stringify(body) });
  return r.json();
};
const post = async (url:string, body:any, method="POST") => {
  const r = await fetch(base() + url, {
    method, credentials:"include",
    headers:{"Content-Type":"application/json","X-CSRF-TOKEN":csrf(),"Accept":"application/json"},
    body: JSON.stringify(body),
  });
  return r.json();
};

/* ─────────────────── CSS ─────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#f0f9ee}::-webkit-scrollbar-thumb{background:#c5d6c3;border-radius:99px}
body{margin:0;padding:0}
.S{display:flex;height:100vh;overflow:hidden;font-family:'Outfit',sans-serif;background:#f5faf4;color:#1a2e1a}
.Sb{width:235px;background:#2d6a2d;display:flex;flex-direction:column;flex-shrink:0;box-shadow:2px 0 12px rgba(45,106,45,0.2);position:relative;overflow:hidden}
.Sb::before{content:'';position:absolute;top:0;left:0;right:0;height:180px;background:radial-gradient(ellipse at 50% 0%,rgba(255,255,255,0.08),transparent 70%);pointer-events:none}
.Sb-logo{padding:22px 20px;border-bottom:1px solid rgba(255,255,255,0.15);display:flex;align-items:center;gap:12px}
.Sb-lm{width:40px;height:40px;background:#fff;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 12px rgba(0,0,0,0.15);flex-shrink:0;padding:4px;overflow:hidden}
.Sb-lm img{width:100%;height:100%;object-fit:contain;border-radius:6px;display:block}
.Sb-lt{font-family:'Playfair Display',serif;font-size:14px;color:#fff;line-height:1.15;font-weight:700;letter-spacing:.5px}
.Sb-ls{font-family:'JetBrains Mono',monospace;font-size:8px;color:rgba(255,255,255,0.65);letter-spacing:.8px;text-transform:uppercase;margin-top:3px;line-height:1.35}
.Sb-user{margin:14px 14px 6px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:12px 13px;display:flex;align-items:center;gap:10px}
.Sb-av{width:34px;height:34px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#2d6a2d;flex-shrink:0}
.Sb-un{font-size:12.5px;font-weight:600;color:#fff}
.Sb-ur{font-family:'JetBrains Mono',monospace;font-size:9px;color:rgba(255,255,255,0.6);margin-top:1px}
.Sb-badge{margin-left:auto;background:rgba(255,255,255,0.2);color:#fff;font-size:8.5px;font-family:'JetBrains Mono',monospace;padding:2px 7px;border-radius:10px}
.Sb-nav{flex:1;padding:8px 12px;overflow-y:auto}
.Sb-sect{font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,0.45);padding:14px 8px 6px}
.Sb-link{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;margin-bottom:2px;transition:all 0.18s;position:relative;border:1px solid transparent;text-decoration:none;color:rgba(255,255,255,0.75);cursor:pointer}
.Sb-link:hover{background:rgba(255,255,255,0.1);color:#fff}
.Sb-link.on{background:rgba(255,255,255,0.18);border-color:rgba(255,255,255,0.3);color:#fff}
.Sb-link.on::before{content:'';position:absolute;left:0;top:25%;bottom:25%;width:3px;background:#fff;border-radius:0 3px 3px 0}
.Sb-ico{font-size:15px;width:18px;text-align:center;flex-shrink:0}
.Sb-txt{font-size:13px;font-weight:500}
.Sb-link.on .Sb-txt{font-weight:600}
.Sb-num{margin-left:auto;background:rgba(255,255,255,0.9);color:#2d6a2d;font-size:9px;font-weight:700;padding:1px 6px;border-radius:10px}
.Sb-num.red{background:#c94040;color:#fff}
.Sb-ft{padding:12px;border-top:1px solid rgba(255,255,255,0.15)}
.Sb-out{width:100%;background:transparent;border:1px solid rgba(255,255,255,0.25);border-radius:8px;padding:9px;color:rgba(255,255,255,0.7);font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;font-family:'Outfit',sans-serif;transition:all 0.2s}
.Sb-out:hover{background:rgba(255,255,255,0.1);color:#fff}
.Sb-out-mobile{display:none}
.Sb-out-mini{height:36px;padding:0 14px;border-radius:9px;border:1px solid #e8c5c5;background:#fff;color:#a83a3a;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;font-family:'Outfit',sans-serif;letter-spacing:.02em}
.Sb-out-mini:hover{background:#fdecec;border-color:#c97070}
.Smain{flex:1;display:flex;flex-direction:column;overflow:hidden}
.Stbar{background:#fff;border-bottom:1px solid #c5d6c3;padding:14px 26px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;box-shadow:0 1px 4px rgba(45,106,45,0.08)}
.Stbar-h{font-family:'Playfair Display',serif;font-size:19px;color:#1a2e1a;font-weight:600}
.Stbar-h span{color:#2d6a2d;font-style:italic}
.Stbar-sub{font-family:'JetBrains Mono',monospace;font-size:10px;color:#7a9a7a;margin-top:2px}
.Stbar-r{display:flex;align-items:center;gap:9px}
.Btn{display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;font-family:'Outfit',sans-serif;transition:all 0.2s;text-decoration:none;border:none;white-space:nowrap}
.Btn-o{background:transparent;border:1px solid #c5d6c3;color:#4a6a4a}.Btn-o:hover{border-color:#2d6a2d;color:#2d6a2d}
.Btn-g{background:#2d6a2d;color:#fff;box-shadow:0 4px 12px rgba(45,106,45,0.25)}.Btn-g:hover{background:#4a8c3f}
.Btn-gold{background:#c9a028;color:#fff}.Btn-red{background:#c94040;color:#fff}
.Btn-sm{padding:4px 10px;font-size:11px}
.Scont{flex:1;overflow-y:auto;padding:22px 26px 48px}
.Sgrid3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px}
.Sgrid2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
.Sgrid4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}
.Kcard{background:#fff;border:1px solid #c5d6c3;border-radius:13px;padding:18px;position:relative;overflow:hidden;transition:transform 0.2s,box-shadow 0.2s;box-shadow:0 2px 8px rgba(45,106,45,0.06)}
.Kcard:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(45,106,45,0.1)}
.Kcard::before{content:'';position:absolute;top:0;left:0;right:0;height:3px}
.Kcard.kg::before{background:linear-gradient(90deg,#2d6a2d,#4a8c3f)}
.Kcard.ko::before{background:linear-gradient(90deg,#c9a028,#f0cc60)}
.Kcard.kr::before{background:linear-gradient(90deg,#c94040,#e06060)}
.Kcard.kt::before{background:linear-gradient(90deg,#3aadad,#6ee0e0)}
.Kbg{position:absolute;right:14px;top:12px;font-size:32px;opacity:0.07}
.Klbl{font-size:11px;color:#7a9a7a;font-weight:500;margin-bottom:7px}
.Kval{font-family:'Playfair Display',serif;font-size:26px;color:#1a2e1a;letter-spacing:-0.5px;margin-bottom:6px}
.Kval.g{color:#2d6a2d}.Kval.o{color:#e07820}.Kval.r{color:#c94040}
.Ksub{font-size:11px;color:#7a9a7a;display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.chip{display:inline-flex;align-items:center;font-size:10px;font-weight:600;padding:2px 7px;border-radius:20px}
.cg{background:#e8f5e4;color:#2d6a2d}.co{background:#fef3e2;color:#e07820}.cr{background:#fdecea;color:#c94040}.ct{background:#e0f5f5;color:#2a9a9a}
.Tc{background:#fff;border:1px solid #c5d6c3;border-radius:13px;overflow:hidden;box-shadow:0 2px 8px rgba(45,106,45,0.06)}
.Tc-hdr{padding:14px 18px 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e8f5e4;background:#fff}
.Tc-title{font-family:'Playfair Display',serif;font-size:14px;color:#1a2e1a;font-weight:600}
.Tc-sub{font-size:10.5px;color:#7a9a7a;margin-top:1px}
.Tc-link{font-size:11.5px;color:#2d6a2d;cursor:pointer;font-weight:500;text-decoration:none}.Tc-link:hover{color:#4a8c3f}
.Stbl{width:100%;border-collapse:collapse}
.Stbl thead th{font-family:'Outfit',sans-serif;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#4a6a4a;padding:12px 16px;text-align:left;border-bottom:2px solid #c5d6c3;background:#f0f9ee}
.Stbl tbody td{padding:13px 16px;font-size:13px;color:#1a2e1a;border-bottom:1px solid #f0f9ee;vertical-align:middle}
.Stbl tbody tr:last-child td{border-bottom:none}
.Stbl tbody tr:hover td{background:#f5faf4}
.Stbl tbody tr.clickable{cursor:pointer}
.Bdg{display:inline-block;padding:3px 9px;border-radius:20px;font-size:9.5px;font-weight:600;font-family:'JetBrains Mono',monospace}
.b-buy{background:#e8f5e4;color:#2d6a2d;border:1px solid #c5d6c3}
.b-con{background:#fef9c3;color:#92400e;border:1px solid #ca8a04}
.b-div{background:#fef3e2;color:#c9a028;border:1px solid #f0d080}
.b-wd{background:#fdecea;color:#c94040;border:1px solid #f0b0b0}
.b-act{background:#e8f5e4;color:#2d6a2d;border:1px solid #c5d6c3}
.b-inact{background:#fdecea;color:#c94040;border:1px solid #f0b0b0}
.b-pend{background:#fef3e2;color:#e07820;border:1px solid #f0c080}
.b-app{background:#e8f5e4;color:#2d6a2d;border:1px solid #c5d6c3}
.b-rej{background:#fdecea;color:#c94040;border:1px solid #f0b0b0}
.MCard{background:linear-gradient(135deg,#2d6a2d,#4a8c3f);border-radius:14px;padding:22px;color:#fff;position:relative;overflow:hidden;margin-bottom:16px}
.MCard::after{content:'🌲';position:absolute;right:16px;bottom:10px;font-size:48px;opacity:0.12}
.Mstat{background:#f5faf4;border:1px solid #c5d6c3;border-radius:8px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;transition:border-color 0.2s}
.Mstat:hover{border-color:#2d6a2d}
.Mstat-l{font-size:12px;color:#7a9a7a}
.Mstat-v{font-family:'JetBrains Mono',monospace;font-size:13px;color:#2d6a2d;font-weight:600}
.Sbar{display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #e8f5e4;background:#f5faf4}
.Sinp{flex:1;background:#fff;border:1px solid #c5d6c3;border-radius:8px;padding:8px 12px;font-size:12.5px;color:#1a2e1a;font-family:'Outfit',sans-serif;outline:none;transition:border-color 0.2s}
.Sinp:focus{border-color:#2d6a2d}
.Sinp::placeholder{color:#b0c8b0}
.Spag{display:flex;align-items:center;justify-content:space-between;padding:11px 18px;border-top:1px solid #e8f5e4;background:#f5faf4}
.Spag-info{font-size:11px;color:#7a9a7a;font-family:'JetBrains Mono',monospace}
.Spag-btns{display:flex;gap:5px}
.Spag-btn{padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;background:#fff;border:1px solid #c5d6c3;color:#4a6a4a;font-family:'Outfit',sans-serif;transition:all 0.15s}
.Spag-btn:hover{border-color:#2d6a2d;color:#2d6a2d}
.Spag-btn.on{background:#2d6a2d;color:#fff;border-color:#2d6a2d}
.Spag-btn:disabled{opacity:0.35;cursor:not-allowed}
.Mbg{position:fixed;inset:0;background:rgba(0,0,0,0.3);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
.Mbox{background:#fff;border-radius:16px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.2)}
.Mhdr{padding:20px 24px 16px;border-bottom:1px solid #e8f5e4;display:flex;align-items:center;justify-content:space-between}
.Mtitle{font-family:'Playfair Display',serif;font-size:16px;color:#1a2e1a;font-weight:600}
.Mclose{background:transparent;border:none;font-size:20px;cursor:pointer;color:#7a9a7a;line-height:1;padding:2px}
.Mbody{padding:20px 24px}
.Mfoot{padding:14px 24px;border-top:1px solid #e8f5e4;display:flex;justify-content:flex-end;gap:8px}
.Fl{font-size:11px;color:#4a6a4a;font-weight:600;margin-bottom:5px;display:block;font-family:'JetBrains Mono',monospace;letter-spacing:0.5px;text-transform:uppercase}
.Fi{width:100%;background:#f5faf4;border:1px solid #c5d6c3;border-radius:8px;padding:9px 12px;font-size:13px;color:#1a2e1a;font-family:'Outfit',sans-serif;outline:none;transition:border-color 0.2s;margin-bottom:14px}
.Fi:focus{border-color:#2d6a2d;background:#fff}
.Fi::placeholder{color:#b0c8b0}
.Fsel{width:100%;background:#f5faf4;border:1px solid #c5d6c3;border-radius:8px;padding:9px 12px;font-size:13px;color:#1a2e1a;font-family:'Outfit',sans-serif;outline:none;margin-bottom:14px}
.Fta{width:100%;background:#f5faf4;border:1px solid #c5d6c3;border-radius:8px;padding:9px 12px;font-size:13px;color:#1a2e1a;font-family:'Outfit',sans-serif;outline:none;resize:vertical;min-height:80px;margin-bottom:14px}
.Al{padding:11px 14px;border-radius:9px;display:flex;align-items:flex-start;gap:9px;margin-bottom:14px;font-size:12.5px;line-height:1.5}
.Al-g{background:#e8f5e4;border:1px solid #c5d6c3;color:#2d6a2d}
.Al-o{background:#fef3e2;border:1px solid #f0d080;color:#c07010}
.Al-r{background:#fdecea;border:1px solid #f0b0b0;color:#c94040}
.Dt{font-size:11px;color:#7a9a7a;font-family:'JetBrains Mono',monospace}
.Ag{font-family:'JetBrains Mono',monospace;font-size:12.5px;color:#2d6a2d;font-weight:600}
.Ao{font-family:'JetBrains Mono',monospace;font-size:12.5px;color:#c9a028;font-weight:600}
.Ar{font-family:'JetBrains Mono',monospace;font-size:12.5px;color:#c94040;font-weight:600}
.Toast{position:fixed;bottom:24px;right:24px;padding:12px 20px;border-radius:10px;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,0.15);z-index:999;font-family:'Outfit',sans-serif;max-width:340px;color:#fff}
@keyframes Sfade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes Sspin{to{transform:rotate(360deg)}}
.f1{animation:Sfade .35s ease both}.f2{animation:Sfade .35s .05s ease both}.f3{animation:Sfade .35s .1s ease both}

/* ========== Responsive: tablet (iPad 11" ~834px) ========== */
@media (max-width: 1023px) {
  .Sb{width:200px}
  .Sb-logo{padding:18px 14px 10px}
  .Sb-lt{font-size:12px}
  .Sb-link{padding:9px 10px}
  .Sb-txt{font-size:12px}
  .Stbar{padding:12px 16px}
  .Stbar-h{font-size:17px}
  .Scont{padding:18px 16px 36px}
  .Sgrid4{grid-template-columns:repeat(2,1fr)}
  .Sgrid3{grid-template-columns:repeat(2,1fr)}
  .Stbl thead th, .Stbl tbody td{padding:10px 12px;font-size:12px}
}

/* ========== Responsive: mobile (iPhone 16 Pro/Pro Max etc, <768px) ========== */
@media (max-width: 767px) {
  .S{flex-direction:column;height:auto;min-height:100vh;overflow:visible}
  .Sb{width:100%;flex-direction:row;height:auto;box-shadow:0 2px 8px rgba(45,106,45,0.2);position:sticky;top:0;z-index:50}
  .Sb::before{display:none}
  .Sb-logo{padding:10px 12px;flex-shrink:0;border-bottom:none;border-right:1px solid rgba(255,255,255,0.15);gap:8px}
  .Sb-lm{width:32px;height:32px;font-size:16px}
  .Sb-lt{font-size:11px}
  .Sb-ls{display:none}
  .Sb-user, .Sb-sect, .Sb-ft{display:none}
  .Sb-out-mobile{display:block}
  .Sb-nav{flex:1;padding:6px 8px;overflow-x:auto;overflow-y:hidden;display:flex;gap:4px;scrollbar-width:none}
  .Sb-nav::-webkit-scrollbar{display:none}
  .Sb-link{flex-shrink:0;padding:6px 10px;margin-bottom:0;border-radius:6px;flex-direction:column;gap:2px;min-width:54px}
  .Sb-link.on::before{display:none}
  .Sb-ico{font-size:16px;width:auto}
  .Sb-txt{font-size:9px;font-weight:500}
  .Sb-num{margin-left:0;position:absolute;top:2px;right:2px;font-size:8px;padding:0 4px}

  .Smain{height:auto;overflow:visible}
  .Stbar{padding:10px 12px;flex-wrap:wrap;gap:8px}
  .Stbar-h{font-size:15px;line-height:1.2}
  .Stbar-sub{font-size:9px}
  .Stbar-r{gap:6px;flex-wrap:wrap}
  .Btn{padding:6px 10px;font-size:11px}
  .Btn-sm{padding:3px 8px;font-size:10px}

  .Scont{padding:12px;overflow-y:visible}
  .Sgrid4, .Sgrid3, .Sgrid2{grid-template-columns:1fr;gap:10px;margin-bottom:12px}
  .Kcard{padding:14px}
  .Kval{font-size:22px}
  .Kbg{font-size:24px;right:10px;top:8px}

  /* Make tables horizontally scrollable */
  .Tc{overflow-x:auto;-webkit-overflow-scrolling:touch}
  .Stbl{min-width:540px}
  .Stbl thead th, .Stbl tbody td{padding:8px 10px;font-size:11px}

  /* Modals fit screen */
  .Mbg{padding:10px}
  .Mbox{max-width:100%;border-radius:12px}
  .Mhdr{padding:14px 16px 12px}
  .Mbody{padding:14px 16px}
  .Mfoot{padding:10px 16px}

  /* Forms more compact */
  .Fi, .Fsel, .Fta{padding:8px 10px;font-size:13px;margin-bottom:10px}

  /* Search bar wraps */
  .Sbar{flex-wrap:wrap;padding:10px 12px}
  .Sinp{min-width:0}

  /* Pagination compact */
  .Spag{flex-direction:column;gap:8px;padding:10px 12px;align-items:stretch}
  .Spag-info{text-align:center}
  .Spag-btns{justify-content:center;flex-wrap:wrap}

  /* Sub-page overrides for inline-styled wrappers */
  .Sscroll{overflow-x:auto !important;-webkit-overflow-scrolling:touch}
  .Sscroll > table{min-width:540px}
  .Sagm-form{grid-template-columns:1fr !important}
  .Stx-pag{flex-wrap:wrap;gap:8px;padding:12px !important;justify-content:center !important}
  .Stx-pag > button{flex:1;min-width:90px}
}
`;

/* ════════ SHAREHOLDER TABLE ════════ */
const MemberTable = React.memo(({ members, onView }: { members:any[]; onView:(id:number)=>void; }) => {
  const PER = 15;
  const [filtered, setFiltered] = useState(members);
  const [pg, setPg] = useState(1);
  const [roleFilter, setRoleFilter] = useState<"all"|"admin"|"staff"|"shareholder">("all");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const apply = (role:"all"|"admin"|"staff"|"shareholder") => {
    const q = inputRef.current?.value?.toLowerCase() ?? "";
    setPg(1);
    let list = members;
    if (role !== "all") list = list.filter(m => (m.role ?? "shareholder") === role);
    if (q) list = list.filter(m => m.name.toLowerCase().includes(q) || (m.shareholder_id??"").toLowerCase().includes(q) || (m.email??"").toLowerCase().includes(q));
    setFiltered(list);
  };
  React.useEffect(() => { apply(roleFilter); }, [members]);
  const doFilter = () => apply(roleFilter);
  const pickRole = (r:"all"|"admin"|"staff"|"shareholder") => { setRoleFilter(r); apply(r); };
  const totalPg = Math.max(1, Math.ceil(filtered.length / PER));
  const safePg  = Math.min(Math.max(pg, 1), totalPg);
  const paged   = filtered.slice((safePg-1)*PER, safePg*PER);
  const fmt = (n:number) => `RM ${Number(n||0).toLocaleString("en-MY",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const RB = ({val,label}:{val:"all"|"admin"|"staff"|"shareholder";label:string}) => (
    <button onClick={()=>pickRole(val)} style={{
      padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",
      fontFamily:"Outfit,sans-serif",border:"1px solid",transition:"all 0.15s",
      background:roleFilter===val?"#2d6a2d":"transparent",
      color:roleFilter===val?"#fff":"#5a7a5a",
      borderColor:roleFilter===val?"#2d6a2d":"#c5d6c3",
    }}>{label}</button>
  );
  return (
    <div className="Tc f1">
      <div style={{padding:"12px 16px 0",display:"flex",gap:6,flexWrap:"wrap"}}>
        <RB val="all"         label="All Members"/>
        <RB val="admin"       label="Admin"/>
        <RB val="staff"       label="Staff"/>
        <RB val="shareholder" label="Shareholder"/>
      </div>
      <div className="Sbar">
        <input ref={inputRef} className="Sinp" placeholder="🔍  Search by name, ID or email…" onChange={doFilter}/>
        <button className="Btn Btn-o Btn-sm" onClick={() => { if (inputRef.current) inputRef.current.value = ""; doFilter(); }}>✕ Clear</button>
      </div>
      <table className="Stbl">
        <thead><tr><th>Shareholder</th><th>Email</th><th>Role</th><th>Status</th><th>Deposit</th><th>Dividend</th><th>Tabung</th><th>Tx</th><th></th></tr></thead>
        <tbody>
          {paged.map(m => (
            <tr key={m.id} className="clickable" onClick={() => onView(m.id)}>
              <td><div style={{fontWeight:500}}>{m.name}</div><div className="Dt">ID {m.shareholder_id} · {m.start_date??m.joined}</div></td>
              <td style={{fontSize:12,color:"#7a9a7a"}}>{m.email}</td>
              <td><span className={`Bdg ${m.role==="admin"?"b-div":m.role==="staff"?"b-act":"b-act"}`} style={m.role==="admin"?{background:"#fef3e2",color:"#c9a028",border:"1px solid #f0d080"}:{}}>{m.role??"shareholder"}</span></td>
              <td><span className={`Bdg ${m.status==="active"?"b-act":m.status==="inactive"?"b-inact":"b-pend"}`}>{m.status==="active"?"Active":m.status==="inactive"?"Inactive":"Pending"}</span></td>
              <td className="Ag">{fmt(m.deposit)}</td>
              <td className="Ao">{fmt(m.dividend)}</td>
              <td className="Ag">{fmt(m.tabung)}</td>
              <td className="Dt">{m.tx_count}</td>
              <td><button className="Btn Btn-g Btn-sm" onClick={e=>{e.stopPropagation();onView(m.id);}}>View →</button></td>
            </tr>
          ))}
          {paged.length===0&&(<tr><td colSpan={9} style={{textAlign:"center",padding:28,color:"#7a9a7a",fontSize:12}}>{filtered.length < members.length ? "No shareholders match your search." : "No approved shareholders yet."}</td></tr>)}
        </tbody>
      </table>
      {totalPg>1&&(
        <div className="Spag">
          <div className="Spag-info">Showing {(safePg-1)*PER+1}–{Math.min(safePg*PER,filtered.length)} of {filtered.length}</div>
          <div className="Spag-btns">
            <button className="Spag-btn" disabled={safePg<=1} onClick={()=>setPg(p=>p-1)}>← Prev</button>
            {Array.from({length:Math.min(totalPg,7)},(_,i)=>i+1).map(n=>(<button key={n} className={`Spag-btn${safePg===n?" on":""}`} onClick={()=>setPg(n)}>{n}</button>))}
            <button className="Spag-btn" disabled={safePg>=totalPg} onClick={()=>setPg(p=>p+1)}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
});

/* ═══════════════════════════════════════════════
   TICKET CARD (module-level so key prop is valid)
═══════════════════════════════════════════════ */
const typeBadge = (t?:string) => {
  if (t === "transaction") return {icon:"💳", label:"TRANSACTION", bg:"#fffbeb", color:"#b45309", border:"#fde68a"};
  if (t === "member")      return {icon:"👤", label:"SHAREHOLDER",      bg:"#eff6ff", color:"#1d4ed8", border:"#bfdbfe"};
  return                          {icon:"📋", label:"GENERAL",     bg:"#f5faf4", color:"#2d6a2d", border:"#c5d6c3"};
};

type TicketCardProps = {
  n: Notif;
  collapsed: Record<number,boolean>;
  acting: Record<number,boolean>;
  replyText: Record<number,string>;
  sending: Record<number,boolean>;
  onToggleCollapse: (id:number) => void;
  onMarkRead: (id:number) => Promise<void> | void;
  onClose: (id:number) => Promise<void> | void;
  onReopen: (id:number) => Promise<void> | void;
  onReplyChange: (id:number, val:string) => void;
  onSendReply: (id:number) => Promise<void> | void;
};

const TicketCard = React.memo(({n, collapsed, acting, replyText, sending, onToggleCollapse, onMarkRead, onClose, onReopen, onReplyChange, onSendReply}: TicketCardProps) => {
  const isOpen = (n.status ?? "open") === "open";
  const isCollapsed = collapsed[n.id] ?? false;
  const badge = typeBadge(n.ticket_type);
  return (
    <div style={{
      background: n.is_read ? "#fff" : "#f0f9ee",
      border:`1px solid ${isOpen ? (n.is_read ? "#c5d6c3" : "#2d6a2d") : "#e2e8f0"}`,
      borderLeft:`4px solid ${isOpen ? "#2d6a2d" : "#94a3b8"}`,
      borderRadius:12, marginBottom:12, overflow:"hidden",
      boxShadow:"0 2px 8px rgba(45,106,45,0.06)",
      opacity: isOpen ? 1 : 0.75,
    }}>
      <div
        style={{padding:"14px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}
        onClick={()=>onToggleCollapse(n.id)}
      >
        <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,fontFamily:"JetBrains Mono,monospace",background:badge.bg,color:badge.color,border:`1px solid ${badge.border}`}}>
          {badge.icon} {badge.label}
        </span>
        {isOpen ? (
          <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20,fontFamily:"JetBrains Mono,monospace",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca"}}>🔴 OPEN</span>
        ) : (
          <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20,fontFamily:"JetBrains Mono,monospace",background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0"}}>✓ CLOSED</span>
        )}
        {!n.is_read && isOpen && (
          <span style={{background:"#2d6a2d",color:"#fff",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:10,fontFamily:"JetBrains Mono,monospace"}}>NEW</span>
        )}
        <span style={{flex:1,fontSize:13,fontWeight:600,color:"#1a2e1a",fontFamily:"'Playfair Display',serif",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
          {n.title || n.message.slice(0,60)}
        </span>
        <span style={{fontSize:10.5,color:"#7a9a7a",fontFamily:"JetBrains Mono,monospace",flexShrink:0}}>{n.created_at}</span>
        <span style={{fontSize:12,color:"#7a9a7a",flexShrink:0}}>{isCollapsed ? "▶" : "▼"}</span>
      </div>
      {!isCollapsed && (<>
        <div style={{borderTop:"1px solid #e8f5e4",padding:"14px 18px"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:10,color:"#7a9a7a",fontFamily:"JetBrains Mono,monospace",marginBottom:6}}>
                FROM: <strong style={{color:"#2d6a2d"}}>{n.from}</strong>
                {n.about && <> · re: <strong style={{color:"#1a2e1a"}}>{n.about}</strong></>}
              </div>
              <div style={{fontSize:13.5,color:"#1a2e1a",lineHeight:1.6}}>{n.message}</div>
            </div>
            <div style={{display:"flex",gap:8,flexShrink:0,alignItems:"flex-start"}}>
              {!n.is_read && isOpen && (
                <button className="Btn Btn-o Btn-sm" onClick={e=>{e.stopPropagation();onMarkRead(n.id);}}>✓ Mark read</button>
              )}
              {isOpen ? (
                <button
                  className="Btn Btn-sm"
                  disabled={acting[n.id]}
                  onClick={e=>{e.stopPropagation();onClose(n.id);}}
                  style={{background:"#16a34a",color:"#fff",border:"none",opacity:acting[n.id]?0.5:1}}
                >✓ Case Closed</button>
              ) : (
                <button
                  className="Btn Btn-o Btn-sm"
                  disabled={acting[n.id]}
                  onClick={e=>{e.stopPropagation();onReopen(n.id);}}
                  style={{opacity:acting[n.id]?0.5:1}}
                >↺ Reopen</button>
              )}
            </div>
          </div>
        </div>
        {(n.replies ?? []).length > 0 && (
          <div style={{borderTop:"1px solid #e8f5e4",background:"#f9fdf9"}}>
            {(n.replies ?? []).map((r:any) => (
              <div key={r.id} style={{padding:"11px 20px",borderBottom:"1px solid #e8f5e4",display:"flex",gap:10,justifyContent:r.sender_role==="staff"?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"72%",background:r.sender_role==="staff"?"#2d6a2d":"#fff",color:r.sender_role==="staff"?"#fff":"#1a2e1a",border:r.sender_role==="staff"?"none":"1px solid #c5d6c3",borderRadius:r.sender_role==="staff"?"12px 12px 2px 12px":"12px 12px 12px 2px",padding:"9px 13px"}}>
                  <div style={{fontSize:9,fontWeight:700,fontFamily:"JetBrains Mono,monospace",opacity:0.7,marginBottom:3,textTransform:"uppercase"}}>{r.sender_role==="staff"?"You":r.sender_name}</div>
                  <div style={{fontSize:13,lineHeight:1.5}}>{r.message}</div>
                  <div style={{fontSize:9.5,opacity:0.6,marginTop:4,fontFamily:"JetBrains Mono,monospace"}}>{r.created_at}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {isOpen && (
          <div style={{borderTop:"1px solid #e8f5e4",padding:"12px 16px",display:"flex",gap:8,alignItems:"flex-end",background:"#fff"}}>
            <textarea
              value={replyText[n.id] || ""}
              onChange={e => onReplyChange(n.id, e.target.value)}
              onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); onSendReply(n.id); } }}
              placeholder="Reply to admin… (Enter to send, Shift+Enter for newline)"
              style={{flex:1,background:"#f5faf4",border:"1px solid #c5d6c3",borderRadius:8,padding:"8px 12px",fontSize:12.5,color:"#1a2e1a",fontFamily:"Outfit,sans-serif",outline:"none",resize:"none",minHeight:38,maxHeight:100}}
              rows={1}
            />
            <button
              className="Btn Btn-g Btn-sm"
              disabled={sending[n.id] || !(replyText[n.id]||"").trim()}
              onClick={()=>onSendReply(n.id)}
              style={{flexShrink:0,opacity:(sending[n.id]||!(replyText[n.id]||"").trim())?0.5:1}}
            >{sending[n.id] ? "…" : "Send ↑"}</button>
          </div>
        )}
      </>)}
    </div>
  );
});

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function StaffDashboard() {
  const PER = 15;
  const [page, setPage]   = useState<string>(getPage());
  const [data, setData]   = useState<DashData|null>(null);
  const [loading, setLoad]= useState(true);
  const [detail, setDetail]   = useState<MemberDetail|null>(null);
  const [modal, setModal] = useState("");
  const [mdata, setMdata] = useState<any>(null);
  const [toast, setToast] = useState<{msg:string;ok:boolean}|null>(null);
  const user = au();

  const nav = (path:string, pg:string) => { window.history.pushState({}, "", path); setPage(pg); setDetail(null); };
  const showToast = (msg:string, ok=true) => { setToast({msg,ok}); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    fetch(base() + "/staff/dashboard-data", { credentials:"include", headers:{Accept:"application/json"} })
      .then(r => r.json()).then(setData).finally(() => setLoad(false));
  }, []);

  const reload = () => {
    fetch(base() + "/staff/dashboard-data", { credentials:"include", headers:{Accept:"application/json"} })
      .then(r => r.json()).then(setData);
  };

  const loadDetail = useCallback(async (id:number) => {
    try {
      const r = await fetch(base() + `/staff/shareholders/${id}`, { credentials:"include", headers:{Accept:"application/json"} });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      if (d && (d.profile || d.error)) {
        setDetail(d); setPage("members");
        window.history.pushState({}, "", "/staff/shareholder-records");
      } else { showToast("Failed to load shareholder data.", false); }
    } catch (e) { showToast("Failed to load shareholder. Please try again.", false); }
  }, []);

  const submit = async (url:string, body:any, method="POST") => {
    const res = await post(url, body, method);
    showToast(res.message || "Submitted for admin approval.", true);
    setModal(""); setMdata(null);
    if (detail) loadDetail(detail.profile.id);
    reload();
  };

  const allMembers  = data?.all_members ?? [];
  const kpi         = data?.kpi;
  const today       = new Date().toLocaleDateString("en-MY",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const unreadCount = (data?.notifications ?? []).filter(n => !n.is_read).length;
  const annCount    = (data?.announcements ?? []).length;

  const TxBadge = ({type}:{type:string}) => {
    const t = type?.toUpperCase() ?? "";
    const cls = t==="DEPOSIT"||t==="INVESTMENT"||t==="BUY"?"b-buy":t==="DIVIDEND"?"b-div":"b-wd";
    return <span className={`Bdg ${cls}`}>{t==="INVESTMENT"||t==="BUY"?"DEPOSIT":t}</span>;
  };
  const amtCls = (t:string) => t?.toUpperCase()==="WITHDRAWAL"||t?.toUpperCase()==="WITHDRAW"?"Ar":t?.toUpperCase()==="DIVIDEND"?"Ao":"Ag";
  const typeLabel = (t:string) => {
    const m:Record<string,string> = { edit_member:"Edit Name/ID", toggle_status:"Toggle Status", add_transaction:"Add Transaction", edit_transaction:"Edit Transaction", delete_transaction:"Delete Transaction", change_tabung:"Change Tabung" };
    return m[t] ?? t.replace(/_/g," ");
  };

  if (loading) return (
    <><style>{css}</style>
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#f5faf4"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:36,height:36,borderRadius:"50%",border:"3px solid #c5d6c3",borderTopColor:"#2d6a2d",animation:"Sspin .8s linear infinite",margin:"0 auto 12px"}}/>
        <p style={{color:"#7a9a7a",fontSize:12}}>Loading…</p>
      </div>
    </div></>
  );

  /* ════════════════════════════════
     SIDEBAR — added Communication section
  ════════════════════════════════ */
  const Sidebar = () => (
    <aside className="Sb">
      <div className="Sb-logo">
        <div className="Sb-lm"><img src={`${base()}/logo-kopssb.jpeg`} alt="KOP-SSB"/></div>
        <div className="Sb-brand">
          <div className="Sb-lt">KOP-SSB</div>
          <div className="Sb-ls">Koperasi Kakitangan<br/>Sabah Softwoods Berhad</div>
        </div>
      </div>
      <div className="Sb-user">
        <div className="Sb-av">{(user.name||"S").slice(0,2).toUpperCase()}</div>
        <div><div className="Sb-un">{user.name||"Staff"}</div><div className="Sb-ur">STAFF</div></div>
        <div className="Sb-badge">STAFF</div>
      </div>
      <nav className="Sb-nav">
        <div className="Sb-sect">Main</div>
        {[
          {label:"Dashboard",      icon:"📊", pg:"dashboard",    path:"/staff"},
          {label:"Shareholder Records", icon:"👥", pg:"members",      path:"/staff/shareholder-records"},
          {label:"Verification",   icon:"✅", pg:"verification",  path:"/staff/verification"},
          {label:"Transactions",   icon:"📋", pg:"transactions",  path:"/staff/transactions"},
        ].map(n => (
          <a key={n.pg} href={n.path} className={`Sb-link${page===n.pg?" on":""}`}
            onClick={e=>{e.preventDefault(); nav(n.path,n.pg);}}>
            <span className="Sb-ico">{n.icon}</span>
            <span className="Sb-txt">{n.label}</span>
            {n.pg==="verification" && (kpi?.accounts_to_verify??0)>0 &&
              <span className="Sb-num red">{kpi!.accounts_to_verify}</span>}
          </a>
        ))}

        {/* Communication section */}
        <div className="Sb-sect">Communication</div>
        <a href="/staff/notifications" className={`Sb-link${page==="notifications"?" on":""}`}
          onClick={e=>{e.preventDefault(); nav("/staff/notifications","notifications");}}>
          <span className="Sb-ico">🎫</span>
          <span className="Sb-txt">Tickets</span>
          {unreadCount > 0 && <span className="Sb-num red">{unreadCount}</span>}
        </a>
        <a href="/staff/announcements" className={`Sb-link${page==="announcements"?" on":""}`}
          onClick={e=>{e.preventDefault(); nav("/staff/announcements","announcements");}}>
          <span className="Sb-ico">📢</span>
          <span className="Sb-txt">Announcements</span>
          {annCount > 0 && <span className="Sb-num">{annCount}</span>}
        </a>
        <a href="/staff/agm" className={`Sb-link${page==="agm"?" on":""}`}
          onClick={e=>{e.preventDefault(); nav("/staff/agm","agm");}}>
          <span className="Sb-ico">📋</span>
          <span className="Sb-txt">AGM Attendance</span>
        </a>
        <a href="/staff/contact-inquiries" className={`Sb-link${page==="contact-inquiries"?" on":""}`}
          onClick={e=>{e.preventDefault(); nav("/staff/contact-inquiries","contact-inquiries");}}>
          <span className="Sb-ico">📧</span>
          <span className="Sb-txt">Contact Inquiries</span>
        </a>

        <div className="Sb-sect">Account</div>
        <a href="/shareholder" className="Sb-link">
          <span className="Sb-ico">💼</span>
          <span className="Sb-txt">My Deposit</span>
        </a>
        {(kpi?.pending_admin??0)>0 && (
          <div className="Sb-link" onClick={()=>nav("/staff/verification","verification")}>
            <span className="Sb-ico">⏳</span>
            <span className="Sb-txt">Pending Approval</span>
            <span className="Sb-num red">{kpi!.pending_admin}</span>
          </div>
        )}
      </nav>
      <div className="Sb-ft">
        <form method="POST" action={(window as any).LogoutUrl || "/logout"} style={{margin:0}}>
          <input type="hidden" name="_token" value={csrf()}/>
          <button type="submit" className="Sb-out">⬅ &nbsp;Log Out</button>
        </form>
      </div>
    </aside>
  );

  const Topbar = ({title,sub}:{title:string;sub?:string}) => (
    <div className="Stbar">
      <div>
        <div className="Stbar-h">{title} <span>· Staff</span></div>
        {sub && <div className="Stbar-sub">{sub}</div>}
      </div>
      <div className="Stbar-r">
        <a href="/staff/verification" className="Btn Btn-o" onClick={e=>{e.preventDefault();nav("/staff/verification","verification");}}>
          ✅ Verify {(kpi?.accounts_to_verify??0)>0?`(${kpi!.accounts_to_verify})`:""}
        </a>
        <button className="Btn Btn-g" onClick={()=>{ nav("/staff/shareholder-records","members"); }}>🔍 Search Shareholder</button>
        <form method="POST" action={(window as any).LogoutUrl || "/logout"} style={{margin:0}} className="Sb-out-mobile">
          <input type="hidden" name="_token" value={csrf()}/>
          <button type="submit" className="Sb-out-mini" title="Log out" aria-label="Log out">Logout</button>
        </form>
      </div>
    </div>
  );

  /* ════════════════════════════════
     PAGE: DASHBOARD — banners now clickable
  ════════════════════════════════ */
  const PageDash = () => (
    <>
      <Topbar title="Staff Dashboard" sub={today}/>
      <div className="Scont">
        {(kpi?.pending_admin??0)>0 && (
          <div className="Al Al-o f1">⏳ <span><strong>{kpi!.pending_admin}</strong> action{kpi!.pending_admin>1?"s":""} pending admin approval.</span></div>
        )}
        {/* Notification banner — clickable, goes to notifications page */}
        {unreadCount > 0 && (
          <div className="Al Al-g f1" style={{cursor:"pointer"}} onClick={()=>nav("/staff/notifications","notifications")}>
            🎫 <span><strong>{unreadCount}</strong> unread ticket{unreadCount>1?"s":""} from admin. <span style={{textDecoration:"underline"}}>View →</span></span>
          </div>
        )}
        {/* Announcement banner — clickable, goes to announcements page */}
        {annCount > 0 && (
          <div className="Al Al-g f1" style={{cursor:"pointer",background:"#e8f0ff",border:"1px solid #b0c4f0",color:"#1a3a8a"}} onClick={()=>nav("/staff/announcements","announcements")}>
            📢 <span><strong>{annCount}</strong> active announcement{annCount>1?"s":""} from admin. <span style={{textDecoration:"underline"}}>View →</span></span>
          </div>
        )}

        <div className="Sgrid3 f1">
          <div className="Kcard kg"><div className="Kbg">👥</div><div className="Klbl">Total Shareholders</div><div className="Kval g">{kpi?.total_members??0}</div><div className="Ksub"><span className="chip cg">Active: {kpi?.active_members??0}</span><span style={{color:"#c94040"}}>Inactive: {kpi?.inactive_members??0}</span><span style={{color:"#e07820",marginLeft:6}}>Pending: {kpi?.pending_members??0}</span></div></div>
          <div className="Kcard ko"><div className="Kbg">📋</div><div className="Klbl">Accounts to Verify</div><div className={`Kval${(kpi?.accounts_to_verify??0)>0?" o":""}`}>{kpi?.accounts_to_verify??0}</div><div className="Ksub"><span className="chip co">No transactions yet</span></div></div>
          <div className="Kcard kt"><div className="Kbg">📊</div><div className="Klbl">This Month</div><div className="Kval">{kpi?.tx_this_month??0}</div><div className="Ksub"><span className="chip ct">Today: {kpi?.tx_today??0}</span></div></div>
        </div>
        <div className="Sgrid3 f2">
          <div style={{background:"#fff",border:"1px solid #c5d6c3",borderRadius:13,padding:18,boxShadow:"0 2px 8px rgba(45,106,45,0.06)"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,color:"#1a2e1a",fontWeight:600,marginBottom:10}}>Shareholder Status</div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:80,height:80,flexShrink:0}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={[{name:"Active",value:kpi?.active_members??0},{name:"Inactive",value:kpi?.inactive_members??0},{name:"Pending",value:kpi?.pending_members??0}]} dataKey="value" innerRadius={22} outerRadius={36} stroke="none"><Cell fill="#2d6a2d"/><Cell fill="#c94040"/><Cell fill="#e07820"/></Pie><Tooltip contentStyle={{background:"#1a2e1a",border:"none",color:"#f0f9ee",borderRadius:8,fontSize:10}}/></PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{flex:1}}>
                {[{l:"Active",v:kpi?.active_members??0,c:"#2d6a2d"},{l:"Inactive",v:kpi?.inactive_members??0,c:"#c94040"},{l:"Pending",v:kpi?.pending_members??0,c:"#e07820"}].map(({l,v,c})=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 10px",background:"#f5faf4",border:"1px solid #e8f5e4",borderRadius:7,marginBottom:6}}>
                    <span style={{fontSize:12,color:"#4a6a4a",display:"flex",alignItems:"center",gap:5}}><span style={{width:7,height:7,borderRadius:"50%",background:c,display:"inline-block"}}/>{l}</span>
                    <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:13,color:c,fontWeight:600}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="Kcard kr"><div className="Kbg">⏳</div><div className="Klbl">Pending Admin Approval</div><div className={`Kval${(kpi?.pending_admin??0)>0?" r":""}`}>{kpi?.pending_admin??0}</div><div className="Ksub"><span className="chip cr">My submissions</span></div></div>
          <div className="Kcard kg"><div className="Kbg">📅</div><div className="Klbl">Today's Transactions</div><div className="Kval g">{kpi?.tx_today??0}</div><div className="Ksub"><span className="chip cg">Recorded today</span></div></div>
        </div>
        <div className="Sgrid2 f3">
          <div className="Tc">
            <div className="Tc-hdr"><div><div className="Tc-title">Shareholder Records</div><div className="Tc-sub">{allMembers.length} approved shareholders</div></div><a href="/staff/shareholder-records" className="Tc-link" onClick={e=>{e.preventDefault();nav("/staff/shareholder-records","members");}}>View all →</a></div>
            <table className="Stbl"><thead><tr><th>Shareholder</th><th>Status</th><th>Deposit</th></tr></thead><tbody>
              {allMembers.slice(0,5).map(m=>(<tr key={m.id} className="clickable" onClick={()=>loadDetail(m.id)}><td><div style={{fontWeight:500}}>{m.name}</div><div className="Dt">ID {m.shareholder_id}</div></td><td><span className={`Bdg ${m.status==="active"?"b-act":m.status==="inactive"?"b-inact":"b-pend"}`}>{m.status==="active"?"Active":m.status==="inactive"?"Inactive":"Pending"}</span></td><td className="Ag">{fmt(m.deposit)}</td></tr>))}
              {allMembers.length===0&&<tr><td colSpan={3} style={{textAlign:"center",padding:20,color:"#7a9a7a",fontSize:12}}>No shareholders yet.</td></tr>}
            </tbody></table>
          </div>
          <div className="Tc">
            <div className="Tc-hdr"><div><div className="Tc-title">Pending Admin</div><div className="Tc-sub">My submissions awaiting approval</div></div></div>
            <table className="Stbl"><thead><tr><th>Shareholder</th><th>Action</th><th>Status</th></tr></thead><tbody>
              {(data?.my_pending??[]).filter(p=>p.status==="pending").slice(0,5).map(p=>(<tr key={p.id}><td><div style={{fontWeight:500}}>{p.member}</div><div className="Dt">ID {p.mid}</div></td><td style={{fontSize:11,color:"#4a6a4a",fontFamily:"JetBrains Mono,monospace"}}>{typeLabel(p.type)}</td><td><span className="Bdg b-pend">Pending</span></td></tr>))}
              {(data?.my_pending??[]).filter(p=>p.status==="pending").length===0&&(<tr><td colSpan={3} style={{textAlign:"center",padding:20,color:"#7a9a7a",fontSize:12}}>No pending items ✅</td></tr>)}
            </tbody></table>
          </div>
        </div>
        <div className="Sgrid2 f3">
          <div className="Tc">
            <div className="Tc-hdr"><div><div className="Tc-title">Recent Transactions</div><div className="Tc-sub">Latest activity</div></div></div>
            <table className="Stbl"><thead><tr><th>Date</th><th>Shareholder</th><th>Type</th><th>Amount</th></tr></thead><tbody>
              {(data?.recent_transactions??[]).slice(0,5).map(t=>(<tr key={t.id}><td className="Dt">{t.date}</td><td><div style={{fontWeight:500,fontSize:12}}>{t.member}</div><div className="Dt">{t.mid}</div></td><td><TxBadge type={t.type}/></td><td className={amtCls(t.type)}>{fmt(t.amount)}</td></tr>))}
            </tbody></table>
          </div>
          <div className="Tc">
            <div className="Tc-hdr"><div><div className="Tc-title">Today's Summary</div><div className="Tc-sub">{new Date().toLocaleDateString("en-MY",{day:"numeric",month:"long",year:"numeric"})}</div></div></div>
            <div style={{padding:"14px 16px"}}>
              {[{l:"Total Shareholders",v:String(kpi?.total_members??0)},{l:"Active Shareholders",v:String(kpi?.active_members??0)},{l:"Inactive Shareholders",v:String(kpi?.inactive_members??0)},{l:"Pending Shareholders",v:String(kpi?.pending_members??0)},{l:"Pending Shareholders",v:String(kpi?.pending_members??0)},{l:"Tx Today",v:String(kpi?.tx_today??0)},{l:"Tx This Month",v:String(kpi?.tx_this_month??0)},{l:"Pending Approvals",v:String(kpi?.pending_admin??0)},{l:"Accounts to Verify",v:String(kpi?.accounts_to_verify??0)}].map(({l,v})=>(<div key={l} className="Mstat"><span className="Mstat-l">{l}</span><span className="Mstat-v">{v}</span></div>))}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  /* ════════════════════════════════
     PAGE: SHAREHOLDER RECORDS
  ════════════════════════════════ */
  const PageMembers = () => {
    if (detail) return <MemberDetailView/>;
    return (
      <><Topbar title="Shareholder Records" sub={`${allMembers.length} approved shareholders`}/>
      <div className="Scont"><MemberTable members={allMembers} onView={loadDetail}/></div></>
    );
  };

  /* ════════════════════════════════
     SHAREHOLDER DETAIL VIEW
  ════════════════════════════════ */
  const MemberDetailView = () => {
    if (!detail) return null;
    const p = detail.profile ?? {};
    const s = detail.summary ?? { current_account:0, total_deposited:0, total_dividend:0, tabung:0 };
    const txList = detail.transactions ?? [];
    const [photoUploading, setPhotoUploading] = useState(false);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file) return;
      setPhotoUploading(true);
      const fd = new FormData(); fd.append("photo", file);
      const csrf = (document.cookie.match(/XSRF-TOKEN=([^;]+)/) || [])[1];
      try {
        const r = await fetch(base() + `/staff/shareholders/${p.id}/photo`, {method:"POST",body:fd,credentials:"include",headers:{"X-XSRF-TOKEN":decodeURIComponent(csrf||"")}});
        const d = await r.json();
        if (d.url) { showToast("Photo updated.", true); loadDetail(p.id); }
        else showToast(d.message||"Upload failed.", false);
      } catch { showToast("Upload failed.", false); }
      finally { setPhotoUploading(false); }
    };

    if (!p.id) return (
      <><Topbar title="Shareholder Detail"/><div className="Scont">
        <button className="Btn Btn-o" style={{marginBottom:16}} onClick={()=>setDetail(null)}>← Back to Shareholders</button>
        <div style={{background:"#fff",border:"1px solid #c5d6c3",borderRadius:12,padding:32,textAlign:"center",color:"#7a9a7a",fontSize:13}}>⚠️ Could not load shareholder data. Please try again.</div>
      </div></>
    );
    return (
      <><Topbar title="Shareholder Detail"/><div className="Scont">
        <button className="Btn Btn-o" style={{marginBottom:16}} onClick={()=>setDetail(null)}>← Back to Shareholders</button>
        <div className="MCard f1">
          <div style={{position:"absolute",top:14,right:14}}><span className={`Bdg ${p.status==="active"?"b-act":p.status==="inactive"?"b-inact":"b-pend"}`}>{p.status==="active"?"Active":p.status==="inactive"?"Inactive":"Pending"}</span></div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:2,opacity:.7,marginBottom:4,textTransform:"uppercase"}}>Shareholder ID</div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:18,letterSpacing:4,marginBottom:10}}>{p.shareholder_id}</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,marginBottom:3}}>{p.name}</div>
          <div style={{fontSize:11.5,opacity:.75,marginBottom:3}}>{p.email}</div>
          {p.phone_number&&<div style={{fontSize:11.5,opacity:.75,marginBottom:3}}>📞 {p.phone_number}</div>}
          <div style={{fontSize:11,opacity:.6,fontFamily:"JetBrains Mono,monospace"}}>Joined: {p.joined}{p.start_date && ` · Shareholder since: ${p.start_date}`}</div>
        </div>
        <div className="Sgrid4 f2">
          {[{l:"Current Account",val:fmt(s.current_account),c:"#2d6a2d"},{l:"Total Deposited",val:fmt(s.total_deposited),c:"#2d6a2d"},{l:"Total Dividend",val:fmt(s.total_dividend),c:"#c9a028"},{l:"Tabung Komitmen",val:fmt(s.tabung),c:"#3aadad"}].map(({l,val,c})=>(
            <div key={l} style={{background:"#fff",border:"1px solid #c5d6c3",borderRadius:10,padding:"14px 16px",boxShadow:"0 2px 6px rgba(45,106,45,0.06)"}}><div style={{fontSize:11,color:"#7a9a7a",marginBottom:5}}>{l}</div><div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:c}}>{val}</div></div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}} className="f2">
          <button className="Btn Btn-g" onClick={()=>{setModal("editMember");setMdata({...p});}}>✏️ Edit Name/ID</button>
          <button className="Btn Btn-o" onClick={()=>{setModal("toggleStatus");setMdata({...p});}}>{p.status==="active"?"🚫 Deactivate":"✅ Activate"}</button>
          <button className="Btn Btn-o" onClick={()=>{setModal("changeTabung");setMdata({...p,tabung:s.tabung});}}>🌿 Change Tabung</button>
          <button className="Btn Btn-gold" onClick={()=>{setModal("addTx");setMdata({...p});}}>+ Add Transaction</button>
          <label style={{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px",background:"#e0f0ff",color:"#1d4ed8",border:"1px solid #93c5fd",borderRadius:8,fontSize:12,fontWeight:600,cursor:photoUploading?"not-allowed":"pointer",opacity:photoUploading?0.6:1}}>
            {photoUploading?"Uploading…":"📷 Upload Photo"}
            <input type="file" accept="image/*" style={{display:"none"}} disabled={photoUploading} onChange={handlePhotoUpload}/>
          </label>
        </div>
        <div className="Tc f3">
          <div className="Tc-hdr"><div><div className="Tc-title">Transaction History</div><div className="Tc-sub">{txList.length} records</div></div></div>
          <table className="Stbl"><thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Description</th><th>Actions</th></tr></thead><tbody>
            {txList.map((t:any)=>(<tr key={t.id}><td className="Dt">{t.date}</td><td><TxBadge type={t.type}/></td><td className={amtCls(t.type)}>{fmt(t.amount)}</td><td style={{fontSize:11.5,color:"#7a9a7a",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis"}}>{t.description||"—"}</td><td><div style={{display:"flex",gap:5}}><button className="Btn Btn-o Btn-sm" onClick={()=>{setModal("editTx");setMdata({...t,userId:p.id});}}>✏️ Edit</button><button className="Btn Btn-red Btn-sm" onClick={()=>{setModal("deleteTx");setMdata(t);}}>🗑 Delete</button></div></td></tr>))}
            {txList.length===0&&(<tr><td colSpan={5} style={{textAlign:"center",padding:24,color:"#7a9a7a",fontSize:12}}>No transactions yet.</td></tr>)}
          </tbody></table>
        </div>
        {(detail.tabung_history??[]).length>0&&(
          <div className="Tc f3" style={{marginTop:14}}>
            <div className="Tc-hdr"><div><div className="Tc-title">🌿 Tabung Komitmen History</div><div className="Tc-sub">Audit trail of changes</div></div></div>
            <table className="Stbl"><thead><tr><th>Amount</th><th>Status</th><th>Effective</th><th>Notes</th></tr></thead><tbody>
              {(detail.tabung_history??[]).map((r:any)=>(<tr key={r.id}><td className={r.is_active?"Ag":"Dt"}>{fmt(r.amount)}</td><td><span className={`Bdg ${r.is_active?"b-act":"b-inact"}`}>{r.is_active?"Current":"Archived"}</span></td><td className="Dt">{r.effective_date??r.created_at}</td><td style={{fontSize:11.5,color:"#7a9a7a"}}>{r.notes||"—"}</td></tr>))}
            </tbody></table>
          </div>
        )}
      </div></>
    );
  };

  /* ════════════════════════════════
     PAGE: VERIFICATION
  ════════════════════════════════ */
  const PageVerification = () => (
    <><Topbar title="Verification" sub="Approve new shareholder registrations"/>
    <div className="Scont">
      <div className="Tc f1">
        <div className="Tc-hdr"><div><div className="Tc-title">New Registrations</div><div className="Tc-sub">{data?.new_registrations?.length??0} shareholders with no transactions yet</div></div></div>
        <table className="Stbl"><thead><tr><th>Shareholder</th><th>Email</th><th>Registered</th><th>Actions</th></tr></thead><tbody>
          {(data?.new_registrations??[]).map(m=>(<tr key={m.id}><td><div style={{fontWeight:500}}>{m.name}</div><div className="Dt">ID {m.mid}</div></td><td style={{fontSize:12,color:"#7a9a7a"}}>{m.email}</td><td className="Dt">{m.joined}</td><td><div style={{display:"flex",gap:6}}><button className="Btn Btn-g Btn-sm" onClick={async()=>{const res=await post(`/staff/shareholders/${m.id}/approve`,{});showToast(res.message||"Confirmed.",true);reload();}}>✅ Confirm</button><button className="Btn Btn-o Btn-sm" onClick={()=>loadDetail(m.id)}>👁 View</button></div></td></tr>))}
          {(data?.new_registrations??[]).length===0&&(<tr><td colSpan={4} style={{textAlign:"center",padding:32,color:"#7a9a7a",fontSize:13}}>✅ No new registrations to verify.</td></tr>)}
        </tbody></table>
      </div>
      {(data?.my_pending??[]).length>0&&(
        <div className="Tc f2" style={{marginTop:16}}>
          <div className="Tc-hdr"><div><div className="Tc-title">My Submitted Actions</div><div className="Tc-sub">Pending / approved / rejected by admin</div></div></div>
          <table className="Stbl"><thead><tr><th>Shareholder</th><th>Action</th><th>Status</th><th>Admin Note</th><th>Date</th></tr></thead><tbody>
            {(data?.my_pending??[]).map(p=>(<tr key={p.id}><td><div style={{fontWeight:500}}>{p.member}</div><div className="Dt">ID {p.mid}</div></td><td style={{fontSize:11,fontFamily:"JetBrains Mono,monospace",color:"#4a6a4a"}}>{typeLabel(p.type)}</td><td><span className={`Bdg ${p.status==="pending"?"b-pend":p.status==="approved"?"b-app":"b-rej"}`}>{p.status}</span></td><td style={{fontSize:11.5,color:"#7a9a7a"}}>{p.admin_note||"—"}</td><td className="Dt">{p.created_at}</td></tr>))}
          </tbody></table>
        </div>
      )}
    </div></>
  );

  /* ════════════════════════════════
     PAGE: TRANSACTIONS
  ════════════════════════════════ */
  const PageTransactions = () => {
    const PER_PAGE = 20;
    const [txType,  setTxType]  = React.useState("all");
    const [txRange, setTxRange] = React.useState("all");
    const [txYear,  setTxYear]  = React.useState(String(new Date().getFullYear()));
    const [txAll,   setTxAll]   = React.useState<any[]>([]);
    const [txLoad,  setTxLoad]  = React.useState(false);
    const [txPage,  setTxPage]  = React.useState(1);

    const fetchTx = React.useCallback(async (type=txType, range=txRange, year=txYear) => {
      setTxLoad(true); setTxPage(1);
      try {
        const r = await fetch(base() + `/staff/transactions/data?type=${type}&range=${range}&year=${year}`, {credentials:"include", headers:{Accept:"application/json"}});
        const d = await r.json();
        setTxAll(d.transactions||[]);
      } finally { setTxLoad(false); }
    }, []);

    React.useEffect(() => { fetchTx(); }, []);
    React.useEffect(() => { fetchTx(txType, txRange, txYear); }, [txType, txRange]);

    const download = () => { window.location.href = `/staff/transactions/download?type=${txType}&range=${txRange}&year=${txYear}`; };
    const totalPages = Math.max(1, Math.ceil(txAll.length / PER_PAGE));
    const txList     = txAll.slice((txPage-1)*PER_PAGE, txPage*PER_PAGE);

    const txBadge = (type:string) => {
      const s = type==="DEPOSIT"||type==="INVESTMENT"||type==="BUY" ? {bg:"#e8f5e4",color:"#1a6b1a",border:"#a8d4a8"} : type==="DIVIDEND" ? {bg:"#fff8e6",color:"#a07010",border:"#e8cc80"} : {bg:"#fdecea",color:"#b03030",border:"#f0a0a0"};
      return <span style={{background:s.bg,color:s.color,border:`1px solid ${s.border}`,padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:700,fontFamily:"JetBrains Mono,monospace",letterSpacing:0.5}}>{type==="INVESTMENT"||type==="BUY"?"DEPOSIT":type}</span>;
    };
    const amtColor = (type:string) => type==="WITHDRAWAL"||type==="WITHDRAW" ? "#c94040" : type==="DIVIDEND" ? "#c9a028" : "#2d6a2d";
    const amtSign  = (type:string) => type==="WITHDRAWAL"||type==="WITHDRAW" ? "−" : "+";
    const BF = ({val,cur,set,label}:{val:string;cur:string;set:(v:string)=>void;label:string}) => (
      <button onClick={()=>set(val)} style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Outfit,sans-serif",border:"1px solid",transition:"all 0.15s",background:cur===val?"#2d6a2d":"#fff",color:cur===val?"#fff":"#4a6a4a",borderColor:cur===val?"#2d6a2d":"#c5d6c3"}}>{label}</button>
    );

    return (
      <><Topbar title="Transactions" sub="All transactions · Filter & download reports"/>
      <div className="Scont">
        <div style={{background:"#fff",border:"1px solid #c5d6c3",borderRadius:13,overflow:"hidden",boxShadow:"0 2px 8px rgba(45,106,45,0.06)",marginBottom:16}}>
          <div style={{padding:"16px 20px",display:"flex",alignItems:"flex-end",gap:20,flexWrap:"wrap"}}>
            <div><div style={{fontSize:10,color:"#7a9a7a",fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:7}}>Transaction Type</div><div style={{display:"flex",gap:6}}><BF val="all" cur={txType} set={setTxType} label="All"/><BF val="deposit" cur={txType} set={setTxType} label="Deposit"/><BF val="withdrawal" cur={txType} set={setTxType} label="Withdraw"/><BF val="dividend" cur={txType} set={setTxType} label="Dividend"/></div></div>
            <div><div style={{fontSize:10,color:"#7a9a7a",fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:7}}>Time Range</div><div style={{display:"flex",gap:6}}><BF val="all" cur={txRange} set={setTxRange} label="All Time"/><BF val="year" cur={txRange} set={setTxRange} label="By Year"/><BF val="month" cur={txRange} set={setTxRange} label="This Month"/><BF val="week" cur={txRange} set={setTxRange} label="This Week"/></div></div>
            {txRange==="year"&&(<div><div style={{fontSize:10,color:"#7a9a7a",fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:7}}>Year</div><input type="number" value={txYear} onChange={e=>setTxYear(e.target.value)} onBlur={()=>fetchTx(txType,txRange,txYear)} onKeyDown={e=>e.key==="Enter"&&fetchTx(txType,txRange,txYear)} style={{background:"#f5faf4",border:"1px solid #c5d6c3",borderRadius:8,padding:"7px 12px",fontSize:13,color:"#1a2e1a",width:100,fontFamily:"JetBrains Mono,monospace",outline:"none"}}/></div>)}
            <div style={{display:"flex",gap:8,alignItems:"flex-end",paddingBottom:2}}>
              <button onClick={download} style={{padding:"8px 18px",borderRadius:8,border:"1px solid #c9a028",background:"#c9a028",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Outfit,sans-serif",display:"flex",alignItems:"center",gap:6,boxShadow:"0 2px 8px rgba(201,160,40,0.25)"}}>⬇ Download CSV</button>
            </div>
          </div>
          <div style={{padding:"10px 20px 14px",display:"flex",gap:8,alignItems:"center",borderTop:"1px solid #e8f5e4"}}>
            <span style={{fontSize:11,color:"#7a9a7a"}}>Results:</span>
            <span style={{background:"#e8f5e4",color:"#2d6a2d",fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20}}>{txAll.length} records</span>
            {totalPages>1&&<span style={{marginLeft:"auto",fontSize:11,color:"#7a9a7a",fontFamily:"JetBrains Mono,monospace"}}>Page {txPage} of {totalPages}</span>}
          </div>
        </div>
        <div className="Sscroll" style={{background:"#fff",border:"1px solid #c5d6c3",borderRadius:13,overflow:"hidden",boxShadow:"0 2px 8px rgba(45,106,45,0.06)"}}>
          <table className="Stbl" style={{tableLayout:"fixed",width:"100%"}}>
            <thead><tr><th style={{width:"13%"}}>Date</th><th style={{width:"20%"}}>Shareholder</th><th style={{width:"13%"}}>Type</th><th style={{width:"34%"}}>Description</th><th style={{width:"20%",textAlign:"right",paddingRight:20}}>Amount</th></tr></thead>
            <tbody>
              {txLoad&&<tr><td colSpan={5} style={{textAlign:"center",padding:32,color:"#7a9a7a",fontSize:13}}>Loading…</td></tr>}
              {!txLoad&&txList.length===0&&<tr><td colSpan={5} style={{textAlign:"center",padding:32,color:"#7a9a7a",fontSize:13}}>No transactions found.</td></tr>}
              {!txLoad&&txList.map((t:any)=>(<tr key={t.id}><td className="Dt">{t.date??'—'}</td><td><div style={{fontWeight:500,fontSize:12.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.member}</div><div className="Dt">ID {t.mid}</div></td><td>{txBadge(t.type)}</td><td style={{fontSize:12,color:"#7a9a7a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.desc??'—'}</td><td style={{textAlign:"right",paddingRight:20,whiteSpace:"nowrap"}}><span style={{fontFamily:"JetBrains Mono,monospace",fontSize:13,fontWeight:700,color:amtColor(t.type)}}>{amtSign(t.type)}{fmt(t.amount)}</span></td></tr>))}
            </tbody>
          </table>
          {totalPages>1&&(
            <div className="Stx-pag" style={{padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderTop:"1px solid #e8f5e4"}}>
              <button onClick={()=>setTxPage(p=>Math.max(1,p-1))} disabled={txPage===1} style={{padding:"7px 16px",borderRadius:8,border:"1px solid #c5d6c3",background:txPage===1?"#f5faf4":"#fff",color:txPage===1?"#b0c8b0":"#4a6a4a",fontSize:12,fontWeight:600,cursor:txPage===1?"default":"pointer",opacity:txPage===1?0.5:1}}>← Prev</button>
              <div style={{display:"flex",gap:6}}>
                {Array.from({length:totalPages},(_,i)=>i+1).filter(p=>p===1||p===totalPages||Math.abs(p-txPage)<=1).reduce((acc:any[],p,i,arr)=>{if(i>0&&p-arr[i-1]>1)acc.push("...");acc.push(p);return acc;},[]).map((p,i)=>p==="..."?<span key={`e${i}`} style={{padding:"6px 4px",fontSize:12,color:"#7a9a7a"}}>…</span>:<button key={p} onClick={()=>setTxPage(p)} style={{width:32,height:32,borderRadius:8,border:"1px solid",fontSize:12,fontWeight:600,cursor:"pointer",background:txPage===p?"#2d6a2d":"#fff",color:txPage===p?"#fff":"#4a6a4a",borderColor:txPage===p?"#2d6a2d":"#c5d6c3"}}>{p}</button>)}
              </div>
              <button onClick={()=>setTxPage(p=>Math.min(totalPages,p+1))} disabled={txPage===totalPages} style={{padding:"7px 16px",borderRadius:8,border:"1px solid #c5d6c3",background:txPage===totalPages?"#f5faf4":"#2d6a2d",color:txPage===totalPages?"#b0c8b0":"#fff",fontSize:12,fontWeight:600,cursor:txPage===totalPages?"default":"pointer",boxShadow:txPage===totalPages?"none":"0 2px 8px rgba(45,106,45,0.2)"}}>Next →</button>
            </div>
          )}
        </div>
      </div></>
    );
  };

  /* ════════════════════════════════
     PAGE: TICKETS & CASES
  ════════════════════════════════ */

  const PageNotifications = () => {
    const notifs = data?.notifications ?? [];
    const [replyText,   setReplyText]   = React.useState<Record<number,string>>({});
    const [sending,     setSending]     = React.useState<Record<number,boolean>>({});
    const [collapsed,   setCollapsed]   = React.useState<Record<number,boolean>>({});
    const [showClosed,  setShowClosed]  = React.useState(false);
    const [acting,      setActing]      = React.useState<Record<number,boolean>>({});

    const openTickets   = notifs.filter(n => (n.status ?? "open") === "open");
    const closedTickets = notifs.filter(n => (n.status ?? "open") === "closed");

    const markRead = async (id:number) => {
      await post(`/staff/notifications/${id}/read`, {});
      reload();
    };
    const sendReply = async (id:number) => {
      const msg = (replyText[id] || "").trim();
      if (!msg) return;
      setSending(s => ({...s, [id]: true}));
      await post(`/staff/notifications/${id}/reply`, { message: msg });
      setReplyText(t => ({...t, [id]: ""}));
      setSending(s => ({...s, [id]: false}));
      reload();
    };
    const closeTicket = async (id:number) => {
      setActing(a => ({...a, [id]: true}));
      await post(`/staff/notifications/${id}/close`, {});
      setActing(a => ({...a, [id]: false}));
      reload();
    };
    const reopenTicket = async (id:number) => {
      setActing(a => ({...a, [id]: true}));
      await post(`/staff/notifications/${id}/reopen`, {});
      setActing(a => ({...a, [id]: false}));
      reload();
    };
    const toggleCollapse = (id:number) => setCollapsed(c => ({...c, [id]: !c[id]}));

    return (
      <><Topbar title="Tickets & Cases" sub={`${openTickets.length} open · ${closedTickets.length} closed`}/>
      <div className="Scont">
        {notifs.length === 0 ? (
          <div style={{background:"#fff",border:"1px solid #c5d6c3",borderRadius:12,padding:48,textAlign:"center",color:"#7a9a7a",fontSize:13}}>
            🎫 No tickets yet. Admin will raise tickets for issues that need your action.
          </div>
        ) : (<>
          {openTickets.length === 0 && (
            <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:12,padding:20,textAlign:"center",color:"#16a34a",fontSize:13,marginBottom:12}}>
              ✓ All tickets are closed. Great work!
            </div>
          )}
          {openTickets.map(n => <TicketCard key={n.id} n={n} collapsed={collapsed} acting={acting} replyText={replyText} sending={sending} onToggleCollapse={toggleCollapse} onMarkRead={markRead} onClose={closeTicket} onReopen={reopenTicket} onReplyChange={(id,val)=>setReplyText(t=>({...t,[id]:val}))} onSendReply={sendReply}/>)}

          {closedTickets.length > 0 && (
            <div style={{marginTop:8}}>
              <button
                className="Btn Btn-o"
                style={{marginBottom:12,fontSize:12}}
                onClick={()=>setShowClosed(s=>!s)}
              >{showClosed ? "▲ Hide" : "▼ Show"} Closed Cases ({closedTickets.length})</button>
              {showClosed && closedTickets.map(n => <TicketCard key={n.id} n={n} collapsed={collapsed} acting={acting} replyText={replyText} sending={sending} onToggleCollapse={toggleCollapse} onMarkRead={markRead} onClose={closeTicket} onReopen={reopenTicket} onReplyChange={(id,val)=>setReplyText(t=>({...t,[id]:val}))} onSendReply={sendReply}/>)}
            </div>
          )}
        </>)}
      </div></>
    );
  };

  /* ════════════════════════════════
     PAGE: ANNOUNCEMENTS — NEW
     Staff reads published announcements from admin
  ════════════════════════════════ */
  const PageAnnouncements = () => {
    const anns = data?.announcements ?? [];
    const [lb, setLb] = React.useState<string|null>(null);
    return (
      <><Topbar title="Announcements" sub="Published by admin"/>
      <div className="Scont">
        {anns.length === 0 ? (
          <div style={{background:"#fff",border:"1px solid #c5d6c3",borderRadius:12,padding:48,textAlign:"center",color:"#7a9a7a",fontSize:13}}>
            📢 No announcements at this time.
          </div>
        ) : (
          anns.map(ann => (
            <div key={ann.id} className="f1" style={{
              background:"#fff", border:"1px solid #c5d6c3",
              borderLeft:"4px solid #2d6a2d", borderRadius:12,
              padding:"18px 20px", marginBottom:12,
              boxShadow:"0 2px 8px rgba(45,106,45,0.06)",
            }}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:600,color:"#1a2e1a",flex:1}}>{ann.title}</span>
                <span style={{background:"#e8f5e4",color:"#2d6a2d",border:"1px solid #c5d6c3",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20,fontFamily:"JetBrains Mono,monospace",flexShrink:0}}>PUBLISHED</span>
                <span style={{fontSize:10.5,color:"#7a9a7a",fontFamily:"JetBrains Mono,monospace",flexShrink:0}}>{ann.published_at}</span>
              </div>
              <div style={{fontSize:13,color:"#4a6a4a",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{ann.content}</div>
              {(()=>{
                const rawUrl=(ann as any).attachment_url; const name=(ann as any).attachment_name||"";
                if(!rawUrl) return null;
                const url = base() + rawUrl;
                const ext=((ann as any).attachment_ext || (name ? name.split(".").pop() : rawUrl.split(".").pop()))?.toLowerCase()?.split('?')[0] || "";
                if(["jpg","jpeg","png","gif","webp"].includes(ext))
                  return <img src={url} alt={name} onClick={()=>setLb(url)} style={{marginTop:10,maxWidth:"100%",maxHeight:400,borderRadius:8,display:"block",border:"1px solid #c5d6c3",cursor:"zoom-in"}}/>;
                if(ext==="pdf")
                  return <embed src={url} type="application/pdf" style={{marginTop:10,width:"100%",height:480,borderRadius:8,border:"1px solid #c5d6c3"}}/>;
                return <a href={url} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:5,marginTop:10,fontSize:12,color:"#2d6a2d",fontWeight:600,textDecoration:"none"}}>📎 {name||"Download"}</a>;
              })()}
            </div>
          ))
        )}
      </div>
      {lb&&<div onClick={()=>setLb(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out"}}>
        <img src={lb} style={{maxWidth:"92vw",maxHeight:"92vh",borderRadius:10,boxShadow:"0 8px 48px rgba(0,0,0,0.6)",objectFit:"contain"}} onClick={e=>e.stopPropagation()}/>
        <button onClick={()=>setLb(null)} style={{position:"absolute",top:18,right:22,background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:22,width:40,height:40,borderRadius:"50%",cursor:"pointer",lineHeight:1}}>✕</button>
      </div>}
      </>
    );
  };

  /* ── AGM Attendance page ── */
  type AgmMeeting  = { id:number; title:string; scheduled_at:string|null; location:string|null; notes:string|null; qr_token:string; is_active:boolean; attendance_count:number; created_at:string|null; };
  type Attendee    = { id:number; name:string; shareholder_id:string|null; scanned_at:string; method:string; };
  type MemberHit2  = { id:number; name:string; shareholder_id:string; role:string; is_attending:boolean; };
  const PageAGM = () => {
    const [meetings, setMeetings] = React.useState<AgmMeeting[]>([]);
    const [selected, setSelected] = React.useState<AgmMeeting|null>(null);
    const [attendees, setAttendees] = React.useState<Attendee[]>([]);
    const [form, setForm] = React.useState({title:"",scheduled_at:"",location:"",notes:""});
    const [saving, setSaving] = React.useState(false);
    const [toast2, setToast2] = React.useState("");
    const [manualQ, setManualQ]       = React.useState("");
    const [manualHits, setManualHits] = React.useState<MemberHit2[]>([]);
    const [manualPick, setManualPick] = React.useState<MemberHit2|null>(null);
    const [manualBusy, setManualBusy] = React.useState(false);

    const loadList = async () => {
      const r = await fetch(base() + "/admin/agm/list", {credentials:"include",headers:{Accept:"application/json"}});
      const d = await r.json(); setMeetings(d.meetings || []);
    };
    const loadAttendance = async (id:number) => {
      const r = await fetch(base() + `/admin/agm/${id}/attendance`, {credentials:"include",headers:{Accept:"application/json"}});
      const d = await r.json();
      setAttendees(d.attendances || []);
      setSelected(prev => prev ? {...prev, attendance_count: d.total} : prev);
    };
    React.useEffect(() => { loadList(); }, []);
    React.useEffect(() => {
      if (!selected) return;
      const t = setInterval(() => loadAttendance(selected.id), 4000);
      return () => clearInterval(t);
    }, [selected?.id]);

    const handleCreate = async (e:React.FormEvent) => {
      e.preventDefault(); setSaving(true);
      const d = await postS("/admin/agm/create", form);
      setSaving(false);
      if (d.meeting) { setMeetings(m=>[d.meeting,...m]); setForm({title:"",scheduled_at:"",location:"",notes:""}); setToast2("Meeting created!"); setTimeout(()=>setToast2(""),3000); }
    };
    const handleToggle = async (m:AgmMeeting) => {
      await postS(`/admin/agm/${m.id}/toggle`, {});
      loadList();
      if (selected?.id === m.id) setSelected(s=>s?{...s,is_active:!s.is_active}:s);
    };
    const handleDelete = async (m:AgmMeeting) => {
      if (!confirm(`Delete meeting "${m.title}"? All attendance records will be lost.`)) return;
      await postS(`/admin/agm/${m.id}`, {}, "DELETE");
      if (selected?.id === m.id) setSelected(null);
      loadList();
    };
    const searchManual = async (q:string) => {
      setManualQ(q); setManualPick(null);
      if (!q.trim()) { setManualHits([]); return; }
      if (!selected) return;
      const r = await fetch(base() + `/admin/agm/${selected.id}/members?q=${encodeURIComponent(q)}`, {credentials:"include",headers:{Accept:"application/json"}});
      const d = await r.json();
      setManualHits(d.members || []);
    };

    const doManual = async () => {
      if (!manualPick || !selected) return;
      setManualBusy(true);
      try {
        const r = await postS(`/admin/agm/${selected.id}/manual-attend`, {user_id: manualPick.id});
        setToast2(r.message || "Attendance recorded.");
        setTimeout(() => setToast2(""), 4000);
        setManualPick(null); setManualQ(""); setManualHits([]);
        loadAttendance(selected.id);
      } finally { setManualBusy(false); }
    };

    const removeAttendance = async (a: Attendee) => {
      if (!selected) return;
      if (!confirm(`Remove attendance for ${a.name}?`)) return;
      await postS(`/admin/agm/${selected.id}/attendance/${a.id}`, {}, "DELETE");
      setToast2(`${a.name} removed from attendance.`);
      setTimeout(() => setToast2(""), 4000);
      loadAttendance(selected.id);
    };

    const attendUrl = selected ? `${base()}/attend/${selected.qr_token}` : "";

    return (
      <><Topbar title="AGM Attendance" sub="Manage meetings · QR check-in"/>
      <div className="Scont">
        {toast2 && <div style={{background:"#2d6a2d",color:"#fff",borderRadius:8,padding:"10px 16px",marginBottom:12,fontSize:13}}>{toast2}</div>}

        {/* Create form */}
        <div style={{background:"#fff",border:"1px solid #c5d6c3",borderRadius:12,padding:"18px 20px",marginBottom:18}}>
          <div style={{fontWeight:600,fontSize:14,color:"#1a2e1a",marginBottom:12}}>📅 New Meeting</div>
          <form onSubmit={handleCreate} className="Sagm-form" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <input required placeholder="Meeting title" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
              style={{padding:"8px 12px",border:"1px solid #c5d6c3",borderRadius:8,fontSize:13,fontFamily:"inherit"}}/>
            <input required type="datetime-local" value={form.scheduled_at} onChange={e=>setForm(f=>({...f,scheduled_at:e.target.value}))}
              style={{padding:"8px 12px",border:"1px solid #c5d6c3",borderRadius:8,fontSize:13,fontFamily:"inherit"}}/>
            <input placeholder="Location (optional)" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))}
              style={{padding:"8px 12px",border:"1px solid #c5d6c3",borderRadius:8,fontSize:13,fontFamily:"inherit"}}/>
            <input placeholder="Notes (optional)" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}
              style={{padding:"8px 12px",border:"1px solid #c5d6c3",borderRadius:8,fontSize:13,fontFamily:"inherit"}}/>
            <button type="submit" disabled={saving}
              style={{gridColumn:"1/-1",padding:"9px",background:"#2d6a2d",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>
              {saving?"Creating…":"➕ Create Meeting"}
            </button>
          </form>
        </div>

        {/* Meetings table */}
        <div className="Sscroll" style={{background:"#fff",border:"1px solid #c5d6c3",borderRadius:12,overflow:"hidden",marginBottom:18}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid #e8f5e4",fontWeight:600,fontSize:14,color:"#1a2e1a"}}>All Meetings</div>
          {meetings.length === 0
            ? <div style={{padding:"32px",textAlign:"center",color:"#7a9a7a",fontSize:13}}>No meetings yet. Create one above.</div>
            : <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr style={{background:"#f5faf4",color:"#7a9a7a",fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>
                  {["TITLE","DATE","LOCATION","STATUS","SCANNED","ACTIONS"].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",fontWeight:600}}>{h}</th>)}
                </tr></thead>
                <tbody>{meetings.map(m=>(
                  <tr key={m.id} style={{borderTop:"1px solid #f0f9ee",cursor:"pointer",background:selected?.id===m.id?"#f0f9ee":"#fff"}}
                    onClick={()=>{setSelected(m);loadAttendance(m.id);}}>
                    <td style={{padding:"10px 14px",fontWeight:600,color:"#1a2e1a"}}>{m.title}</td>
                    <td style={{padding:"10px 14px",color:"#4a6a4a"}}>{m.scheduled_at ?? "—"}</td>
                    <td style={{padding:"10px 14px",color:"#4a6a4a"}}>{m.location ?? "—"}</td>
                    <td style={{padding:"10px 14px"}}>
                      <span style={{background:m.is_active?"#d4f4e0":"#fde8e8",color:m.is_active?"#1a5c1a":"#8b2020",border:`1px solid ${m.is_active?"#6fcf97":"#f5b5b5"}`,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20}}>
                        {m.is_active?"OPEN":"CLOSED"}
                      </span>
                    </td>
                    <td style={{padding:"10px 14px",color:"#2d6a2d",fontWeight:600}}>{m.attendance_count}</td>
                    <td style={{padding:"10px 14px"}} onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>handleToggle(m)} style={{marginRight:6,padding:"4px 10px",fontSize:11,fontWeight:600,background:m.is_active?"#fff3cd":"#d4f4e0",border:`1px solid ${m.is_active?"#f0c040":"#6fcf97"}`,borderRadius:6,cursor:"pointer",color:m.is_active?"#7a5000":"#1a5c1a"}}>
                        {m.is_active?"Close":"Reopen"}
                      </button>
                      <button onClick={()=>handleDelete(m)} style={{padding:"4px 10px",fontSize:11,fontWeight:600,background:"#fde8e8",border:"1px solid #f5b5b5",borderRadius:6,cursor:"pointer",color:"#8b2020"}}>Delete</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
          }
        </div>

        {/* Selected meeting detail */}
        {selected && (
          <div style={{background:"#fff",border:"1px solid #c5d6c3",borderRadius:12,padding:"20px"}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:24,flexWrap:"wrap"}}>
              <div>
                <div style={{fontWeight:700,fontSize:15,color:"#1a2e1a",marginBottom:4}}>{selected.title}</div>
                <div style={{fontSize:12,color:"#7a9a7a",marginBottom:16}}>{selected.scheduled_at} · {selected.location ?? "No location"}</div>
                <div style={{background:"#fff",border:"2px solid #2d6a2d",borderRadius:10,padding:12,display:"inline-block",marginBottom:10}}>
                  <QRCodeSVG value={attendUrl} size={220} fgColor="#1a4a1a" bgColor="#ffffff" level="M"/>
                </div>
                <div style={{fontSize:10,color:"#7a9a7a",wordBreak:"break-all",maxWidth:260,lineHeight:1.4}}>{attendUrl}</div>
                <div style={{display:"flex",gap:8,marginTop:12}}>
                  <a href={`${base()}/admin/agm/${selected.id}/export`} style={{padding:"7px 14px",background:"#c9a028",color:"#fff",borderRadius:8,fontSize:12,fontWeight:600,textDecoration:"none"}}>⬇ Export CSV</a>
                </div>
              </div>
              <div style={{flex:1,minWidth:260}}>
                <div style={{fontWeight:600,fontSize:13,color:"#1a2e1a",marginBottom:10}}>
                  Live Attendance — {selected.attendance_count} shareholder{selected.attendance_count!==1?"s":""}
                </div>
                {attendees.length === 0
                  ? <div style={{color:"#7a9a7a",fontSize:12,padding:"20px 0"}}>No check-ins yet. Wait for shareholders to scan the QR or use Manual Check-In below.</div>
                  : <div style={{maxHeight:280,overflowY:"auto"}}>
                      {attendees.map(a=>(
                        <div key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,background:"#f5faf4",marginBottom:4}}>
                          <div style={{width:32,height:32,borderRadius:"50%",background:"#2d6a2d",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0}}>
                            {(a.name||"?").slice(0,2).toUpperCase()}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:600,color:"#1a2e1a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</div>
                            <div style={{fontSize:10,color:"#7a9a7a",fontFamily:"'JetBrains Mono',monospace"}}>{a.shareholder_id ?? "—"} · {a.scanned_at}</div>
                          </div>
                          {a.method==="manual"
                            ? <span style={{fontSize:10,background:"#fff3cd",color:"#7a5000",border:"1px solid #f0c040",padding:"2px 7px",borderRadius:20,fontWeight:700,flexShrink:0}}>Manual</span>
                            : <span style={{fontSize:10,background:"#d4f4e0",color:"#1a5c1a",border:"1px solid #6fcf97",padding:"2px 7px",borderRadius:20,fontWeight:700,flexShrink:0}}>QR</span>
                          }
                          <button onClick={()=>removeAttendance(a)} style={{padding:"3px 8px",fontSize:11,background:"#fff",border:"1px solid #e0a0a0",color:"#c94040",borderRadius:6,cursor:"pointer",flexShrink:0}}>✕</button>
                        </div>
                      ))}
                    </div>
                }
              </div>
            </div>

            {/* ── Manual Check-In ── */}
            <div style={{marginTop:20,padding:"16px 20px",background:"#fffbf0",border:"1px solid #f0c040",borderRadius:10}}>
              <div style={{fontWeight:700,fontSize:13,color:"#5a3e00",marginBottom:2}}>✋ Manual Check-In</div>
              <div style={{fontSize:11,color:"#8a6a00",marginBottom:12}}>Backup for shareholders who cannot scan the QR — no internet, no phone, or elderly shareholders.</div>
              <div style={{display:"flex",gap:10,alignItems:"flex-start",flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:200,position:"relative"}}>
                  <input
                    placeholder="Search by name or shareholder ID…"
                    value={manualQ}
                    onChange={e=>searchManual(e.target.value)}
                    autoComplete="off"
                    style={{width:"100%",padding:"8px 12px",border:"1px solid #f0c040",borderRadius:8,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}
                  />
                  {manualHits.length>0 && !manualPick && (
                    <div style={{position:"absolute",top:"calc(100% + 2px)",left:0,right:0,background:"#fff",border:"1px solid #c5d6c3",borderRadius:8,zIndex:20,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",maxHeight:220,overflowY:"auto"}}>
                      {manualHits.map(u=>(
                        <div key={u.id}
                          onClick={()=>{setManualPick(u);setManualQ(`${u.name} (${u.shareholder_id})`);setManualHits([]);}}
                          style={{padding:"9px 14px",cursor:"pointer",display:"flex",gap:8,alignItems:"center",borderBottom:"1px solid #f0f9ee"}}
                          onMouseOver={e=>(e.currentTarget.style.background="#f5faf4")}
                          onMouseOut={e=>(e.currentTarget.style.background="")}>
                          <div style={{flex:1,minWidth:0}}>
                            <span style={{fontWeight:600,color:"#1a2e1a",fontSize:13}}>{u.name}</span>
                            <span style={{fontSize:11,color:"#7a9a7a",fontFamily:"monospace",marginLeft:8}}>{u.shareholder_id}</span>
                            <span style={{fontSize:10,color:"#888",marginLeft:6,textTransform:"capitalize"}}>{u.role}</span>
                          </div>
                          {u.is_attending && (
                            <span style={{fontSize:10,padding:"2px 7px",borderRadius:10,background:"#d4f4e0",color:"#1a5c1a",border:"1px solid #6fcf97",fontWeight:700,flexShrink:0,whiteSpace:"nowrap"}}>✓ Attended</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={doManual} disabled={!manualPick||manualBusy||!!manualPick?.is_attending}
                  style={{padding:"9px 18px",background:manualPick&&!manualPick.is_attending?"#2d6a2d":"#aaa",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:manualPick&&!manualPick.is_attending?"pointer":"not-allowed",flexShrink:0,minWidth:160}}>
                  {manualBusy?"Recording…":manualPick?.is_attending?"Already Attended":"✓ Record Attendance"}
                </button>
                {manualPick && (
                  <button onClick={()=>{setManualPick(null);setManualQ("");setManualHits([]);}}
                    style={{padding:"9px 14px",background:"#fff",border:"1px solid #ccc",borderRadius:8,fontSize:13,cursor:"pointer",flexShrink:0}}>✕ Cancel</button>
                )}
              </div>
              {manualPick && (
                <div style={{marginTop:10,padding:"8px 12px",background:"#fff8e1",borderRadius:8,fontSize:12,color:"#5a3e00",display:"flex",gap:8,alignItems:"center"}}>
                  <span>👤 Selected:</span>
                  <strong>{manualPick.name}</strong>
                  <span style={{fontFamily:"monospace",color:"#2d6a2d"}}>({manualPick.shareholder_id})</span>
                  {manualPick.is_attending && <span style={{color:"#1a5c1a",fontWeight:600}}>— already marked attended</span>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </>
    );
  };

  /* ════════════════════════════════
     PAGE: CONTACT INQUIRIES
  ════════════════════════════════ */
  const PageContactInquiries = () => {
    const [inquiries, setInquiries] = React.useState<any[]>([]);
    const [inqLoading, setInqLoading] = React.useState(true);

    React.useEffect(() => {
      fetch(base() + "/staff/contact-inquiries/data", { credentials:"include", headers:{Accept:"application/json"} })
        .then(r => r.json())
        .then(d => setInquiries(d.data || []))
        .finally(() => setInqLoading(false));
    }, []);

    const markAsRead = async (id:number) => {
      await post(`/staff/contact-inquiries/${id}/read`, {});
      setInquiries(inq => inq.map(i => i.id === id ? {...i, is_read: true, read_at: new Date().toISOString()} : i));
    };

    const unreadCount = inquiries.filter(i => !i.is_read).length;

    return (
      <><Topbar title="Contact Inquiries" sub={`${inquiries.length} total · ${unreadCount} unread`}/>
      <div className="Scont">
        {inqLoading ? (
          <div style={{textAlign:"center",padding:32,color:"#7a9a7a"}}>Loading…</div>
        ) : inquiries.length === 0 ? (
          <div style={{background:"#fff",border:"1px solid #c5d6c3",borderRadius:12,padding:48,textAlign:"center",color:"#7a9a7a",fontSize:13}}>
            📧 No contact inquiries yet.
          </div>
        ) : (
          <div className="Tc">
            <div className="Tc-hdr"><div><div className="Tc-title">Contact Form Submissions</div><div className="Tc-sub">{inquiries.length} inquiries from visitors</div></div></div>
            <table className="Stbl">
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Message</th><th>Status</th><th>Submitted</th><th></th></tr></thead>
              <tbody>
                {inquiries.map(inq => (
                  <tr key={inq.id} style={{background:!inq.is_read?"#fffbeb":"#fff"}}>
                    <td><div style={{fontWeight:500}}>{inq.name}</div></td>
                    <td style={{fontSize:12,color:"#7a9a7a"}}>{inq.email}</td>
                    <td style={{fontSize:12,color:"#7a9a7a"}}>{inq.phone || "—"}</td>
                    <td style={{fontSize:12,color:"#4a6a4a",maxWidth:300,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{inq.message}</td>
                    <td><span className={`Bdg ${inq.is_read?"b-act":"b-pend"}`}>{inq.is_read?"Read":"Unread"}</span></td>
                    <td className="Dt">{inq.created_at ?? "—"}</td>
                    <td>{!inq.is_read && <button className="Btn Btn-g Btn-sm" onClick={() => markAsRead(inq.id)}>✓ Mark Read</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div></>
    );
  };

  return (
    <><style>{css}</style>
    <div className="S">
      <Sidebar/>
      <div className="Smain">
        {page==="dashboard"     && <PageDash/>}
        {page==="members"       && <PageMembers/>}
        {page==="verification"  && <PageVerification/>}
        {page==="transactions"  && <PageTransactions/>}
        {page==="notifications" && <PageNotifications/>}
        {page==="announcements" && <PageAnnouncements/>}
        {page==="agm"           && <PageAGM/>}
        {page==="contact-inquiries" && <PageContactInquiries/>}
      </div>
    </div>
    {modal && (
      <StaffModal
        key={`${modal}-${mdata?.id || "new"}`}
        modal={modal} mdata={mdata} profile={detail?.profile || null}
        onClose={() => { setModal(""); setMdata(null); }}
        onSubmit={submit}
      />
    )}
    {toast && (
      <div className="Toast" style={{background:toast.ok?"#2d6a2d":"#c94040"}}>
        {toast.ok?"✅":"❌"} {toast.msg}
      </div>
    )}
    </>
  );
}