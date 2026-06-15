import React, { useEffect, useState, useCallback } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { QRCodeSVG } from "../../lib/qrcode-react.js";

type Theme = "green" | "dark";

const T = {
  green: {
    bg:"#f5faf4", sidebar:"#2d6a2d", sidebarBorder:"rgba(255,255,255,0.15)", sidebarText:"rgba(255,255,255,0.75)",
    sidebarActive:"rgba(255,255,255,0.18)", sidebarActiveBorder:"rgba(255,255,255,0.3)", sidebarActiveBar:"#ffffff",
    topbar:"#ffffff", topbarBorder:"#c5d6c3", topbarShadow:"rgba(45,106,45,0.08)",
    cardBg:"#ffffff", cardBorder:"#c5d6c3", cardShadow:"rgba(45,106,45,0.06)", cardHover:"rgba(45,106,45,0.1)",
    tableHead:"#f5faf4", tableRowHover:"#f5faf4", tableText:"#1a2e1a", tableSub:"#7a9a7a", tableBorder:"#f0f9ee",
    formBg:"#f5faf4", formBorder:"#c5d6c3", searchBg:"#f5faf4", searchInput:"#ffffff",
    accent:"#2d6a2d", accentHover:"#4a8c3f", accentText:"#ffffff", accentAlt:"#c9a028",
    text:"#1a2e1a", textMid:"#4a6a4a", textLight:"#7a9a7a",
    statBg:"#f5faf4", statBorder:"#c5d6c3", statVal:"#2d6a2d",
    divider:"#e8f5e4", sectionTitle:"#1a2e1a",
    memberCard:"linear-gradient(135deg,#2d6a2d,#4a8c3f)",
    avatarBg:"#c9a028", avatarText:"#fff",
  },
  dark: {
    bg:"#0a0a0a", sidebar:"#111111", sidebarBorder:"rgba(255,255,255,0.07)", sidebarText:"#888888",
    sidebarActive:"rgba(201,160,40,0.15)", sidebarActiveBorder:"rgba(201,160,40,0.3)", sidebarActiveBar:"#c9a028",
    topbar:"#111111", topbarBorder:"rgba(255,255,255,0.07)", topbarShadow:"rgba(0,0,0,0.2)",
    cardBg:"#181818", cardBorder:"rgba(255,255,255,0.07)", cardShadow:"rgba(0,0,0,0.2)", cardHover:"rgba(201,160,40,0.08)",
    tableHead:"#111111", tableRowHover:"rgba(255,255,255,0.02)", tableText:"#f0e8d0", tableSub:"#666666", tableBorder:"rgba(255,255,255,0.04)",
    formBg:"#222222", formBorder:"rgba(255,255,255,0.07)", searchBg:"#181818", searchInput:"#222222",
    accent:"#c9a028", accentHover:"#f0cc60", accentText:"#0a0a0a", accentAlt:"#2d6a2d",
    text:"#f0e8d0", textMid:"#cccccc", textLight:"#888888",
    statBg:"#222222", statBorder:"rgba(255,255,255,0.04)", statVal:"#c9a028",
    divider:"rgba(255,255,255,0.07)", sectionTitle:"#ffffff",
    memberCard:"linear-gradient(135deg,#1a1400,#2a1e00 40%,#1a1400)",
    avatarBg:"#c9a028", avatarText:"#0a0a0a",
  },
};

type Kpi = { total_members:number; active_members:number; inactive_members:number; pending_members:number; total_approved:number; total_current_account:number; total_dividend_this_year:number; tx_today:number; tx_this_month:number; pending_approvals:number; active_announcements:number; latest_rate:number; latest_rate_year:number; fy:number; };
type Tx  = { id:number; date:string; member:string; mid:string; type:string; amount:number; };
type Pend= { id:number; type:string; staff:string; member:string; mid:string; payload:any; remarks:string; created_at:string; };
type Ann = { id:number; title:string; content:string; is_active:boolean; published_at:string|null; attachment_name:string|null; attachment_url:string|null; };
type DivHistory = { year:number; rate:number; total_amount:number; member_count:number; calculated_at:string; };
type TabungEntry = { id:number; member:string; mid:string; amount:number; is_active:boolean; notes:string|null; effective_date:string|null; created_at:string; };
type Data= { kpi:Kpi; monthly_volume:any[]; recent_tx:Tx[]; pending_list:Pend[]; announcements:Ann[]; staff_list:any[]; dividend_history:DivHistory[]; tabung_history:TabungEntry[]; notif_threads:any[]; };

/* NEW: type for read-only member detail fetched from /staff/shareholders/{id} */
type AdminMemberDetail = { profile:any; summary:any; transactions:any[]; tabung_history:any[]; };

const fmt  = (n:number) => `RM ${Number(n||0).toLocaleString("en-MY",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtK = (n:number) => n>=1000000?`RM ${(n/1000000).toFixed(2)}M`:n>=1000?`RM ${(n/1000).toFixed(1)}k`:`RM ${n.toFixed(0)}`;
const csrf = () => (window as any).LaravelCsrfToken || "";
const au   = () => (window as any).AuthUser || {};
const base = () => ((window as any).AppBase ?? "") as string;
const getPage = () => {
  const p = window.location.pathname;
  if (p.includes("/approvals"))     return "approvals";
  if (p.includes("/dividend"))      return "dividend";
  if (p.includes("/tabung"))         return "tabung";
  if (p.includes("/shareholders"))  return "members";
  if (p.includes("/transactions"))  return "transactions";
  if (p.includes("/announcements"))  return "announcements";
  if (p.includes("/notifications"))  return "notifications";
  if (p.includes("/agm"))            return "agm";
  if (p.includes("/reports"))        return "reports";
  if (p.includes("/audit-log"))      return "audit-log";
  return "dashboard";
};

function QRCanvasAdmin({value,size,dark}:{value:string;size:number;dark:string}){
  return <QRCodeSVG value={value} size={size} fgColor={dark} bgColor="#ffffff" level="M" style={{display:"block",borderRadius:6}}/>;
}
const post = async (url:string, body:any, method="POST") => {
  const r = await fetch(base() + url, { method, credentials:"include", headers:{ "Content-Type":"application/json", "X-CSRF-TOKEN":csrf(), "Accept":"application/json" }, body: method==="DELETE"?undefined:JSON.stringify(body) });
  return r.json();
};
const upload = async (url:string, file:File) => {
  const fd = new FormData(); fd.append("file", file);
  try {
    const r = await fetch(base() + url, { method:"POST", credentials:"include", headers:{ "Accept":"application/json", "X-CSRF-TOKEN":csrf() }, body:fd });
    const d = await r.json();
    if (!r.ok) return { message: d.message || "Upload failed.", errors:[] };
    return d;
  } catch { return { message:"Network error. Please try again.", errors:[] }; }
};

/* ════════════════════════════════════════════════════════════
   CHANGE 1 of 3: AdminMemberTable
   - Added onViewMember prop
   - Added green "👁 View" button BEFORE the "Change Role" button
════════════════════════════════════════════════════════════ */
const AdminMemberTable = React.memo(({ onChangeRole, onViewMember, colors: c }: {
  onChangeRole: (u:any) => void;
  onViewMember: (id:number) => void;  // NEW
  colors: typeof T["green"];
}) => {
  const [users,      setUsers]      = useState<any[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [roleFilter, setRoleFilter] = useState<"all"|"admin"|"staff"|"shareholder">("all");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const search = async (query:string, role:string = roleFilter) => {
    setLoading(true);
    try {
      const r = await fetch(base() + `/admin/users/list?q=${encodeURIComponent(query)}&role=${role}`,
        { credentials:"include", headers:{Accept:"application/json"} });
      const d = await r.json();
      setUsers(d.data||[]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { search(""); }, []);

  const pickRole = (r:"all"|"admin"|"staff"|"shareholder") => {
    setRoleFilter(r);
    search(inputRef.current?.value ?? "", r);
  };

  const RoleBtn = ({val,label}:{val:"all"|"admin"|"staff"|"shareholder";label:string}) => (
    <button onClick={()=>pickRole(val)} style={{
      padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",
      fontFamily:"Outfit,sans-serif",border:"1px solid",transition:"all 0.15s",
      background:roleFilter===val?c.accent:"transparent",
      color:roleFilter===val?c.accentText:c.textMid,
      borderColor:roleFilter===val?c.accent:c.cardBorder,
    }}>{label}</button>
  );

  return (
    <div className="kAtcard kAf1">
      <div style={{padding:"12px 16px 0",display:"flex",gap:6,flexWrap:"wrap"}}>
        <RoleBtn val="all"         label="All Members"/>
        <RoleBtn val="admin"       label="Admin"/>
        <RoleBtn val="staff"       label="Staff"/>
        <RoleBtn val="shareholder" label="Shareholder"/>
      </div>
      <div className="kAssearch">
        <input
          ref={inputRef}
          className="kAssearchinput"
          placeholder="🔍  Search by name, ID or email…"
          onChange={e => search(e.target.value)}
        />
        <button className="kAbtn kAbtn-o" style={{padding:"6px 12px",fontSize:12}}
          onClick={() => search(inputRef.current?.value ?? "")}>Search</button>
      </div>
      <table className="kAtbl">
        <thead><tr><th>Shareholder</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td><div style={{fontWeight:500}}>{u.name}</div><div className="kAdate">ID {u.shareholder_id} · {u.joined}</div></td>
              <td style={{fontSize:12,color:c.textLight}}>{u.email}</td>
              <td><span className={`kAbadge ${u.role==="admin"?"bb-admin":u.role==="staff"?"bb-staff":"bb-investor"}`}>{u.role}</span></td>
              <td><span className={`kAbadge ${u.status==="active"?"bb-app":u.status==="inactive"?"bb-rej":"bb-pend"}`}>{u.status==="active"?"Active":u.status==="inactive"?"Inactive":"Pending"}</span></td>
              <td>
                {/* NEW: View button (green) before Change Role */}
                <div style={{display:"flex",gap:6}}>
                  <button className="kAbtn kAbtn-g" style={{padding:"4px 11px",fontSize:11}}
                    onClick={() => onViewMember(u.id)}>
                    👁 View
                  </button>
                  <button className="kAbtn kAbtn-o" style={{padding:"4px 10px",fontSize:11}}
                    onClick={() => onChangeRole(u)}>
                    Change Role
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {users.length===0&&(
            <tr><td colSpan={5} style={{textAlign:"center",padding:24,color:c.textLight,fontSize:12}}>
              {loading?"Loading…":"No users found."}
            </td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
});

/* ════════════════════════════════════════════════════════════
   CHANGE 2 of 3: NEW AdminMemberDetailView component
   Read-only. Shows profile + 4 summary cards + transactions +
   tabung history. NO action buttons anywhere.
════════════════════════════════════════════════════════════ */
const AdminMemberDetailView = React.memo(({ detail, colors: c, onBack, onRaiseTicket }: {
  detail: AdminMemberDetail;
  colors: typeof T["green"];
  onBack: () => void;
  onRaiseTicket: () => void;
}) => {
  const p = detail.profile ?? {};
  const s = detail.summary ?? { current_account:0, total_deposited:0, total_dividend:0, tabung:0 };
  const txList = detail.transactions ?? [];

  const TxBadge = ({type}:{type:string}) => {
    const t = type?.toUpperCase() ?? "";
    const cls = t==="DEPOSIT"||t==="INVESTMENT"||t==="BUY"?"bb-inv":t==="DIVIDEND"?"bb-div":"bb-wd";
    return <span className={`kAbadge ${cls}`}>{t==="INVESTMENT"||t==="BUY"?"DEPOSIT":t}</span>;
  };
  const amtCls = (t:string) =>
    t?.toUpperCase()==="WITHDRAWAL"||t?.toUpperCase()==="WITHDRAW" ? "kAamt-wd"
    : t?.toUpperCase()==="DIVIDEND" ? "kAamt-div" : "kAamt-inv";

  if (!p.id) return (
    <div style={{padding:24}}>
      <button className="kAbtn kAbtn-o" style={{marginBottom:16}} onClick={onBack}>← Back to Shareholders</button>
      <div style={{background:c.cardBg,border:`1px solid ${c.cardBorder}`,borderRadius:12,padding:32,textAlign:"center",color:c.textLight,fontSize:13}}>
        ⚠️ Could not load shareholder data. Please try again.
      </div>
    </div>
  );

  return (
    <div className="kAcont">
      {/* Back + read-only badge + raise ticket — all inline */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <button className="kAbtn kAbtn-o" onClick={onBack}>← Back to Shareholders</button>
        <span style={{background:"#fef3e2",border:"1px solid #f0d080",color:"#c07010",
          fontSize:10,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",
          padding:"3px 10px",borderRadius:20,letterSpacing:0.5}}>
          👁 READ-ONLY VIEW
        </span>
        <button onClick={onRaiseTicket}
          style={{fontSize:12,padding:"5px 12px",borderRadius:8,border:"1px solid #c94040",background:"#c94040",color:"#fff",cursor:"pointer",fontFamily:"Outfit,sans-serif",fontWeight:700}}>
          ⚠ Raise Ticket
        </button>
      </div>

      {/* Profile card — same gradient as staff */}
      <div style={{background:c.memberCard,borderRadius:14,padding:22,color:"#fff",position:"relative",overflow:"hidden",marginBottom:16}}>
        <div style={{content:'""',position:"absolute",right:16,bottom:10,fontSize:48,opacity:0.12,pointerEvents:"none"}}>🌲</div>
        <div style={{position:"absolute",top:14,right:14}}>
          <span className={`kAbadge ${p.status==="active"?"bb-app":p.status==="inactive"?"bb-rej":"bb-pend"}`}>{p.status==="active"?"Active":p.status==="inactive"?"Inactive":"Pending"}</span>
        </div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:2,opacity:.7,marginBottom:4,textTransform:"uppercase"}}>Shareholder ID</div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:18,letterSpacing:4,marginBottom:10}}>{p.shareholder_id}</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,marginBottom:3}}>{p.name ?? p.full_name}</div>
        <div style={{fontSize:11.5,opacity:.75,marginBottom:3}}>{p.email}</div>
        {p.phone_number&&<div style={{fontSize:11.5,opacity:.75,marginBottom:3}}>📞 {p.phone_number}</div>}
        <div style={{fontSize:11,opacity:.6,fontFamily:"JetBrains Mono,monospace"}}>
          Joined: {p.joined}
          {p.start_date && ` · Shareholder since: ${p.start_date}`}
        </div>
        {p.role && (
          <div style={{marginTop:8}}>
            <span className={`kAbadge ${p.role==="admin"?"bb-admin":p.role==="staff"?"bb-staff":"bb-investor"}`}>{p.role}</span>
          </div>
        )}
      </div>

      {/* 4 summary cards */}
      <div className="kAg-4col" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
        {[
          {l:"Current Account", val:fmt(s.current_account), clr:c.accent},
          {l:"Total Deposited", val:fmt(s.total_deposited), clr:c.accent},
          {l:"Total Dividend",  val:fmt(s.total_dividend),  clr:"#c9a028"},
          {l:"Tabung Komitmen", val:fmt(s.tabung),          clr:"#3aadad"},
        ].map(({l,val,clr}) => (
          <div key={l} style={{background:c.cardBg,border:`1px solid ${c.cardBorder}`,borderRadius:10,padding:"14px 16px",boxShadow:`0 2px 6px ${c.cardShadow}`}}>
            <div style={{fontSize:11,color:c.textLight,marginBottom:5}}>{l}</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:clr}}>{val}</div>
          </div>
        ))}
      </div>

      {/* Read-only notice — NO Edit/Deactivate/Change Tabung/Add Transaction buttons */}
      <div style={{background:"#fef3e2",border:"1px solid #f0d080",borderRadius:8,padding:"10px 16px",
        marginBottom:16,fontSize:12.5,color:"#c07010",display:"flex",alignItems:"center",gap:8}}>
        <span>ℹ️</span>
        <span>This is a <strong>read-only</strong> view. To modify shareholder data, staff must submit a change request which admin approves.</span>
      </div>

      {/* Transactions — no Edit / Delete columns */}
      <div className="kAtcard kAf3">
        <div className="kAtchdr">
          <div><div className="kAtctitle">Transaction History</div><div className="kAtcsub">{txList.length} records</div></div>
        </div>
        <table className="kAtbl">
          <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Description</th></tr></thead>
          <tbody>
            {txList.map((t:any) => (
              <tr key={t.id}>
                <td className="kAdate">{t.date}</td>
                <td><TxBadge type={t.type}/></td>
                <td className={amtCls(t.type)}>{fmt(t.amount)}</td>
                <td style={{fontSize:11.5,color:c.textLight}}>{t.description||"—"}</td>
              </tr>
            ))}
            {txList.length===0 && (
              <tr><td colSpan={4} style={{textAlign:"center",padding:24,color:c.textLight,fontSize:12}}>No transactions yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tabung history — read-only */}
      {(detail.tabung_history??[]).length > 0 && (
        <div className="kAtcard kAf3" style={{marginTop:14}}>
          <div className="kAtchdr">
            <div><div className="kAtctitle">🌿 Tabung Komitmen History</div><div className="kAtcsub">Audit trail</div></div>
          </div>
          <table className="kAtbl">
            <thead><tr><th>Amount</th><th>Status</th><th>Effective</th><th>Notes</th></tr></thead>
            <tbody>
              {(detail.tabung_history??[]).map((r:any) => (
                <tr key={r.id}>
                  <td className={r.is_active?"kAamt-inv":"kAdate"}>{fmt(r.amount)}</td>
                  <td><span className={`kAbadge ${r.is_active?"bb-app":"bb-rej"}`}>{r.is_active?"Current":"Archived"}</span></td>
                  <td className="kAdate">{r.effective_date??r.created_at}</td>
                  <td style={{fontSize:11.5,color:c.textLight}}>{r.notes||"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════
   ADMIN MODAL — unchanged from your original
═══════════════════════════════════════════════════════════ */
type AdminModalProps = {
  modal: string;
  mdata: any;
  staffList: any[];
  colors: typeof T["green"];
  onClose: () => void;
  onAction: (url:string, body:any, method?:string) => void;
};

const AdminModal = React.memo(({ modal, mdata, staffList, colors: c, onClose, onAction }: AdminModalProps) => {
  if (!modal) return null;

  const [adminRemarks, setAdminRemarks] = useState("");
  const [role,         setRole]         = useState(mdata?.currentRole || "shareholder");
  const [toStaff,      setToStaff]      = useState("all");
  const [ticketTitle,  setTicketTitle]  = useState(mdata?.defaultTitle || "");
  const [message,      setMessage]      = useState("");
  const [annTitle,     setAnnTitle]     = useState("");
  const [annContent,   setAnnContent]   = useState("");
  const [annActive,    setAnnActive]    = useState(true);
  const [annFile,      setAnnFile]      = useState<File|null>(null);
  const annFileRef = React.useRef<HTMLInputElement>(null);

  const isTicket = modal==="notify" && (mdata?.ticketType==="transaction" || mdata?.ticketType==="member");
  const title = modal==="approve"?"Approve Action":modal==="reject"?"Reject Action":
    modal==="changeRole"?"Change User Role":modal==="notify"?( isTicket?"Raise Ticket":"Notify Staff"):
    modal==="announcement"?"New Announcement":modal==="dividend"?"Set Dividend":"Action";

  const handleConfirm = async () => {
    if (modal==="approve")
      await onAction(`/admin/approvals/${mdata?.id}/approve`, { admin_remarks: adminRemarks });
    else if (modal==="reject")
      await onAction(`/admin/approvals/${mdata?.id}/reject`, { admin_remarks: adminRemarks });
    else if (modal==="changeRole")
      await onAction(`/admin/users/${mdata?.userId}/role`, { role });
    else if (modal==="notify")
      await onAction("/admin/notify-staff", { to_staff: toStaff, message, about_user_id: null, title: ticketTitle||null, ticket_type: mdata?.ticketType||'general', reference_id: mdata?.referenceId||null });
    else if (modal==="announcement") {
      if (!annTitle.trim() || !annContent.trim()) {
        onAction("__fail__", { message: "Title and content are required." });
        return;
      }
      if (annFile && annFile.size > 10 * 1024 * 1024) {
        onAction("__fail__", { message: "Attachment is larger than 10 MB." });
        return;
      }
      const fd = new FormData();
      fd.append("title", annTitle);
      fd.append("content", annContent);
      fd.append("is_active", annActive ? "1" : "0");
      if (annFile) fd.append("attachment", annFile);
      let r: Response;
      try {
        r = await fetch(base() + "/admin/announcements", { method:"POST", credentials:"include", headers:{ "Accept":"application/json", "X-CSRF-TOKEN":csrf() }, body:fd });
      } catch {
        onAction("__fail__", { message: "Network error — please try again." });
        return;
      }
      let res:any = null;
      try { res = JSON.parse(await r.text()); } catch { /* non-JSON error body */ }
      if (!r.ok) {
        const msg = res?.message
          || res?.errors?.attachment?.[0]
          || res?.errors?.title?.[0]
          || res?.errors?.content?.[0]
          || (r.status===413 ? "Attachment too large for the server." : `Post failed (HTTP ${r.status}).`);
        onAction("__fail__", { message: msg });
        return;
      }
      onAction("__done__", { message: res?.message || "Announcement posted." });
      return;
    }
  };

  const inputStyle = { width:"100%", background:c.formBg, border:`1px solid ${c.formBorder}`, borderRadius:8, padding:"9px 12px", fontSize:13, color:c.text, fontFamily:"'Outfit',sans-serif", outline:"none", marginBottom:14 };
  const labelStyle = { fontSize:11, color:c.textMid, fontWeight:600 as const, marginBottom:5, display:"block" as const, fontFamily:"'JetBrains Mono',monospace", letterSpacing:"0.5px", textTransform:"uppercase" as const };

  return (
    <div className="kAmodalbg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="kAmodal">
        <div className="kAmodalhdr">
          <div className="kAmodaltitle">{title}</div>
          <button className="kAmodalclose" onClick={onClose}>✕</button>
        </div>
        <div className="kAmodalbody">

          {(modal==="approve"||modal==="reject") && (<>
            <div className={`kAalert ${modal==="approve"?"kAalert-g":"kAalert-r"}`}>
              <span>{modal==="approve"?"✅":"✗"}</span>
              <span>{modal==="approve"?"This will apply the change immediately.":"This will reject the request permanently."}</span>
            </div>
            <div>
              <label style={labelStyle}>Admin Remarks {modal==="reject"?"(required)":"(optional)"}</label>
              <textarea style={{...inputStyle, resize:"vertical", minHeight:80}}
                placeholder={modal==="reject"?"Reason for rejection…":"Optional notes…"}
                value={adminRemarks} onChange={e => setAdminRemarks(e.target.value)}/>
            </div>
          </>)}

          {modal==="changeRole" && (<>
            <div style={{background:c.statBg,border:`1px solid ${c.statBorder}`,borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12.5,color:c.textMid}}>
              Changing role for: <strong style={{color:c.text}}>{mdata?.name}</strong><br/>
              <span style={{fontSize:11}}>Current: <span className={`kAbadge ${mdata?.currentRole==="admin"?"bb-admin":mdata?.currentRole==="staff"?"bb-staff":"bb-investor"}`}>{mdata?.currentRole}</span></span>
            </div>
            <div>
              <label style={labelStyle}>New Role</label>
              <select style={inputStyle} value={role} onChange={e => setRole(e.target.value)}>
                <option value="shareholder">Shareholder</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </>)}

          {modal==="notify" && (<>
            {isTicket && <div style={{background:"#fff3cd",border:"1px solid #ffc107",borderRadius:8,padding:"8px 12px",marginBottom:14,fontSize:12,color:"#856404"}}>
              ⚠ Raising a {mdata?.ticketType} ticket {mdata?.referenceId?`(Ref #${mdata.referenceId})`:""} — staff will see this in their Tickets page.
            </div>}
            <div>
              <label style={labelStyle}>Ticket Subject</label>
              <input style={inputStyle} placeholder="Brief description of the issue…"
                value={ticketTitle} onChange={e => setTicketTitle(e.target.value)}/>
            </div>
            <div>
              <label style={labelStyle}>Assign To</label>
              <select style={inputStyle} value={toStaff} onChange={e => setToStaff(e.target.value)}>
                <option value="all">📣 All Staff</option>
                <option value="" disabled>── Individual staff ──</option>
                {staffList.map((s:any) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
              </select>
            </div>
            {toStaff && toStaff !== "all" && (
              <div style={{background:c.statBg,border:`1px solid ${c.statBorder}`,borderRadius:8,padding:"8px 12px",marginBottom:14,fontSize:12,color:c.textMid}}>
                📩 Assigned to <strong style={{color:c.text}}>{staffList.find((s:any)=>String(s.id)===toStaff)?.name ?? "selected staff"}</strong>.
              </div>
            )}
            {toStaff === "all" && (
              <div style={{background:c.statBg,border:`1px solid ${c.statBorder}`,borderRadius:8,padding:"8px 12px",marginBottom:14,fontSize:12,color:c.textMid}}>
                📣 Assigned to <strong style={{color:c.text}}>all {staffList.length} staff member{staffList.length!==1?"s":""}</strong>.
              </div>
            )}
            <div>
              <label style={labelStyle}>Details</label>
              <textarea style={{...inputStyle, resize:"vertical", minHeight:100}}
                placeholder="Describe the issue or concern…"
                value={message} onChange={e => setMessage(e.target.value)}/>
            </div>
          </>)}

          {modal==="announcement" && (<>
            <div>
              <label style={labelStyle}>Title</label>
              <input style={inputStyle} placeholder="Announcement title…"
                value={annTitle} onChange={e => setAnnTitle(e.target.value)}/>
            </div>
            <div>
              <label style={labelStyle}>Content</label>
              <textarea style={{...inputStyle, resize:"vertical", minHeight:120}}
                placeholder="Write your announcement…"
                value={annContent} onChange={e => setAnnContent(e.target.value)}/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={labelStyle}>Attachment (optional)</label>
              <input ref={annFileRef} type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                style={{...inputStyle, padding:"7px 10px", cursor:"pointer"}}
                onChange={e => setAnnFile(e.target.files?.[0] ?? null)}/>
              {annFile && <div style={{fontSize:11,color:c.textMid,marginTop:-10,marginBottom:8}}>📎 {annFile.name}</div>}
            </div>
            <div style={{marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
              <input type="checkbox" id="ann-active" checked={annActive}
                onChange={e => setAnnActive(e.target.checked)}
                style={{width:16,height:16,accentColor:c.accent}}/>
              <label htmlFor="ann-active" style={{fontSize:13,color:c.textMid}}>Publish immediately (visible to all users)</label>
            </div>
          </>)}

        </div>
        <div className="kAmodalfoot">
          <button className="kAbtn kAbtn-o" onClick={onClose}>Cancel</button>
          <button className={`kAbtn ${modal==="reject"?"kAbtn-red":"kAbtn-g"}`} onClick={handleConfirm}>
            {modal==="approve"?"✅ Approve":modal==="reject"?"✗ Reject":modal==="announcement"?"Post":modal==="notify"?"⚠ Raise Ticket":"Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
});


type AdminColors = typeof T[keyof typeof T];

const adminTypeBadge = (t:string, c:AdminColors) => {
  if (t==="transaction") return <span style={{background:"#fff3cd",color:"#856404",border:"1px solid #ffc107",fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:10,fontFamily:"JetBrains Mono,monospace"}}>💳 TRANSACTION</span>;
  if (t==="member")      return <span style={{background:"#d1ecf1",color:"#0c5460",border:"1px solid #bee5eb",fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:10,fontFamily:"JetBrains Mono,monospace"}}>👤 SHAREHOLDER</span>;
  return <span style={{background:c.statBg,color:c.textMid,border:`1px solid ${c.cardBorder}`,fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:10,fontFamily:"JetBrains Mono,monospace"}}>📋 GENERAL</span>;
};

type AdminTicketCardProps = {
  n: any;
  isClosed: boolean;
  collapsed: Record<number,boolean>;
  c: AdminColors;
  replyText: Record<number,string>;
  sending: Record<number,boolean>;
  onToggleCollapse: (id:number) => void;
  onReplyChange: (id:number, val:string) => void;
  onSendReply: (id:number) => Promise<void> | void;
  onClose: (id:number) => Promise<void> | void;
  onReopen: (id:number) => Promise<void> | void;
};

const AdminTicketCard = React.memo(({n, isClosed, collapsed, c, replyText, sending, onToggleCollapse, onReplyChange, onSendReply, onClose, onReopen}: AdminTicketCardProps) => {
  const isCollapsed = collapsed[n.id] ?? isClosed;
  return (
    <div style={{
      background: c.cardBg, border:`1px solid ${c.cardBorder}`,
      borderLeft:`4px solid ${isClosed?"#aaa":n.ticket_type==="transaction"?"#c9a028":n.ticket_type==="member"?"#2196f3":c.accent}`,
      borderRadius:12, marginBottom:10,
      boxShadow:`0 2px 8px ${c.cardShadow}`, overflow:"hidden",
      opacity: isClosed ? 0.75 : 1,
    }}>
      <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",borderBottom:isCollapsed?"none":`1px solid ${c.divider}`,cursor:"pointer"}}
        onClick={()=>onToggleCollapse(n.id)}>
        {adminTypeBadge(n.ticket_type??'general', c)}
        {isClosed
          ? <span style={{background:"#e8f5e4",color:"#2d6a2d",border:"1px solid #c5d6c3",fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:10,fontFamily:"JetBrains Mono,monospace"}}>✓ CLOSED</span>
          : <span style={{background:"#fdecea",color:"#c94040",border:"1px solid #f0b0b0",fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:10,fontFamily:"JetBrains Mono,monospace"}}>🔴 OPEN</span>
        }
        {!n.is_read && <span style={{background:"#c94040",color:"#fff",fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:10,fontFamily:"JetBrains Mono,monospace"}}>NEW</span>}
        <span style={{fontSize:12,fontWeight:600,color:c.text,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
          {n.title || n.message.slice(0,60)}
        </span>
        <span style={{fontSize:10,color:c.textLight,fontFamily:"JetBrains Mono,monospace",flexShrink:0}}>→ {n.to_staff} · {n.created_at}</span>
        <span style={{fontSize:13,color:c.textLight,flexShrink:0}}>{isCollapsed?"▶":"▼"}</span>
      </div>
      {!isCollapsed && (<>
        <div style={{padding:"12px 16px",borderBottom:`1px solid ${c.divider}`}}>
          {n.title && <div style={{fontSize:13.5,fontWeight:600,color:c.text,marginBottom:6}}>{n.title}</div>}
          <div style={{fontSize:13,color:c.textMid,lineHeight:1.65,whiteSpace:"pre-wrap"}}>{n.message}</div>
          {n.reference_id && <div style={{marginTop:6,fontSize:11,color:c.textLight,fontFamily:"JetBrains Mono,monospace"}}>Ref ID: #{n.reference_id}</div>}
        </div>
        {(n.replies??[]).length > 0 && (
          <div style={{background:c.statBg}}>
            {(n.replies??[]).map((r:any) => (
              <div key={r.id} style={{padding:"8px 16px",borderBottom:`1px solid ${c.divider}`,display:"flex",justifyContent:r.sender_role==="admin"?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"72%",background:r.sender_role==="admin"?c.accent:c.cardBg,color:r.sender_role==="admin"?c.accentText:c.text,border:r.sender_role==="admin"?"none":`1px solid ${c.cardBorder}`,borderRadius:r.sender_role==="admin"?"12px 12px 2px 12px":"12px 12px 12px 2px",padding:"8px 12px"}}>
                  <div style={{fontSize:9,fontWeight:700,fontFamily:"JetBrains Mono,monospace",opacity:0.7,marginBottom:2,textTransform:"uppercase"}}>{r.sender_role==="admin"?"You (Admin)":r.sender_name}</div>
                  <div style={{fontSize:12.5,lineHeight:1.5}}>{r.message}</div>
                  <div style={{fontSize:9,opacity:0.6,marginTop:3,fontFamily:"JetBrains Mono,monospace"}}>{r.created_at}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{padding:"10px 14px",display:"flex",gap:8,alignItems:"flex-end",background:c.cardBg,borderTop:`1px solid ${c.divider}`}}>
          <textarea value={replyText[n.id]||""} onChange={e=>onReplyChange(n.id,e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();onSendReply(n.id);}}}
            placeholder="Reply to staff… (Enter to send)"
            style={{flex:1,background:c.formBg,border:`1px solid ${c.formBorder}`,borderRadius:8,padding:"7px 11px",fontSize:12.5,color:c.text,fontFamily:"Outfit,sans-serif",outline:"none",resize:"none",minHeight:36,maxHeight:90}}
            rows={1}/>
          <button className="kAbtn kAbtn-g" disabled={sending[n.id]||!(replyText[n.id]||"").trim()}
            onClick={()=>onSendReply(n.id)}
            style={{flexShrink:0,padding:"7px 14px",fontSize:12,opacity:(sending[n.id]||!(replyText[n.id]||"").trim())?0.5:1}}>
            {sending[n.id]?"…":"Send ↑"}
          </button>
          {!isClosed
            ? <button onClick={()=>onClose(n.id)}
                style={{flexShrink:0,padding:"7px 14px",fontSize:11,fontWeight:700,borderRadius:8,border:"1px solid #c5d6c3",background:"#e8f5e4",color:"#2d6a2d",cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>
                ✓ Case Closed
              </button>
            : <button onClick={()=>onReopen(n.id)}
                style={{flexShrink:0,padding:"7px 14px",fontSize:11,fontWeight:700,borderRadius:8,border:`1px solid ${c.cardBorder}`,background:c.statBg,color:c.textMid,cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>
                ↺ Reopen
              </button>
          }
        </div>
      </>)}
    </div>
  );
});

export default function AdminDashboard() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("kss_admin_theme") as Theme) || "green");
  const [ap, setAP]       = useState<string>(getPage());
  const [data, setData]   = useState<Data|null>(null);
  const [loading, setLoad]= useState(true);
  const [modal, setModal] = useState<string>("");
  const [mdata, setMdata] = useState<any>(null);
  const [toast, setToast] = useState<{msg:string;ok:boolean}|null>(null);

  /* NEW: state for admin read-only member detail view */
  const [adminMemberDetail,    setAdminMemberDetail]    = useState<AdminMemberDetail|null>(null);
  const [memberDetailLoading,  setMemberDetailLoading]  = useState(false);
  const [lightbox,             setLightbox]             = useState<string|null>(null);

  const c = T[theme];
  const switchTheme = (t:Theme) => { setTheme(t); localStorage.setItem("kss_admin_theme", t); };
  const nav = (path:string, page:string) => { window.history.pushState({}, "", path); setAP(page); };
  const showToast = (msg:string, ok=true) => { setToast({msg,ok}); setTimeout(() => setToast(null), 3500); };

  const reload = () => fetch(base() + "/admin/dashboard-data",{credentials:"include",headers:{Accept:"application/json"}}).then(r=>r.json()).then(d=>{setData(d);});

  useEffect(() => { reload().finally(() => setLoad(false)); }, []);

  const doAction = async (url:string, body:any, method="POST") => {
    if (url === "__fail__") {
      // Surface the error but keep the modal open so the admin can fix and retry.
      showToast(body?.message || "Failed", false);
      return;
    }
    if (url === "__done__") {
      showToast(body?.message || "Done", true);
      setModal(""); setMdata(null);
      reload();
      return;
    }
    const res = await post(url, body, method);
    showToast(res.message||"Done", !res.error);
    setModal(""); setMdata(null);
    reload();
  };

  /* NEW: load read-only member detail for admin — reuses staff endpoint */
  const loadAdminMemberDetail = useCallback(async (id:number) => {
    setMemberDetailLoading(true);
    setAdminMemberDetail(null);
    try {
      const r = await fetch(base() + `/staff/shareholders/${id}`, { credentials:"include", headers:{Accept:"application/json"} });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      setAdminMemberDetail(d);
    } catch(e) {
      showToast("Failed to load shareholder data.", false);
    } finally {
      setMemberDetailLoading(false);
    }
  }, []);

  /* ── DYNAMIC CSS — identical to your original ── */
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${theme==="green"?"#f0f9ee":"#111"}}
    ::-webkit-scrollbar-thumb{background:${theme==="green"?"#c5d6c3":"#333"};border-radius:99px}
    .kA{display:flex;height:100vh;overflow:hidden;font-family:'Outfit',sans-serif;background:${c.bg};color:${c.text};transition:background .3s}
    .kAsb{width:235px;background:${c.sidebar};display:flex;flex-direction:column;flex-shrink:0;position:relative;overflow:hidden;box-shadow:2px 0 12px rgba(0,0,0,0.15);transition:background .3s}
    .kAsb::before{content:'';position:absolute;top:0;left:0;right:0;height:180px;background:radial-gradient(ellipse at 50% 0%,rgba(255,255,255,0.07) 0%,transparent 70%);pointer-events:none}
    .kAlogo{padding:22px 20px;border-bottom:1px solid ${c.sidebarBorder};display:flex;align-items:center;gap:12px}
    .kAlogomark{width:40px;height:40px;background:${theme==="green"?"#fff":"linear-gradient(135deg,#c9a028,#8a6c18)"};border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 12px rgba(0,0,0,0.15);flex-shrink:0;padding:4px;overflow:hidden}
    .kAlogomark img{width:100%;height:100%;object-fit:contain;border-radius:6px;display:block}
    .kAlt{font-family:'Playfair Display',serif;font-size:14px;color:${theme==="green"?"#fff":"#f0e8d0"};font-weight:700;line-height:1.15;letter-spacing:.5px}
    .kAls{font-family:'JetBrains Mono',monospace;font-size:8px;color:${theme==="green"?"rgba(255,255,255,0.65)":"#c9a028"};letter-spacing:.8px;text-transform:uppercase;margin-top:3px;line-height:1.35}
    .kAuser{margin:14px 14px 6px;background:${theme==="green"?"rgba(255,255,255,0.12)":"rgba(201,160,40,0.07)"};border:1px solid ${theme==="green"?"rgba(255,255,255,0.2)":"rgba(201,160,40,0.3)"};border-radius:12px;padding:12px 13px;display:flex;align-items:center;gap:10px}
    .kAav{width:34px;height:34px;border-radius:50%;background:${c.avatarBg};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:${c.avatarText};flex-shrink:0}
    .kAun{font-size:12.5px;font-weight:600;color:#fff}
    .kAur{font-family:'JetBrains Mono',monospace;font-size:9px;color:${theme==="green"?"rgba(255,255,255,0.6)":"#c9a028"};margin-top:1px}
    .kAubadge{margin-left:auto;background:${c.avatarBg};color:${c.avatarText};font-size:8.5px;font-family:'JetBrains Mono',monospace;padding:2px 7px;border-radius:10px}
    .kAnav{flex:1;padding:8px 12px;overflow-y:auto}
    .kAns{font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:2.5px;text-transform:uppercase;color:${theme==="green"?"rgba(255,255,255,0.45)":"#555"};padding:14px 8px 6px}
    .kAni{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;cursor:pointer;margin-bottom:2px;transition:all 0.18s;position:relative;border:1px solid transparent;text-decoration:none;color:${c.sidebarText}}
    .kAni:hover{background:${theme==="green"?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.05)"};color:${theme==="green"?"#fff":"#f0e8d0"}}
    .kAni.act{background:${c.sidebarActive};border-color:${c.sidebarActiveBorder};color:${theme==="green"?"#fff":"#f0e8d0"}}
    .kAni.act::before{content:'';position:absolute;left:0;top:25%;bottom:25%;width:3px;background:${c.sidebarActiveBar};border-radius:0 3px 3px 0}
    .kAicon{font-size:15px;width:18px;text-align:center;flex-shrink:0}
    .kAntxt{font-size:13px;font-weight:500}
    .kAni.act .kAntxt{font-weight:600}
    .kAnbadge{margin-left:auto;background:${theme==="green"?"rgba(255,255,255,0.9)":"rgba(201,160,40,0.15)"};color:${theme==="green"?"#2d6a2d":"#c9a028"};font-size:9px;font-weight:700;padding:1px 6px;border-radius:10px}
    .kAnbadge.red{background:#c94040;color:#fff}
    .kAft{padding:12px;border-top:1px solid ${c.sidebarBorder}}
    .kAlo{width:100%;background:transparent;border:1px solid ${c.sidebarBorder};border-radius:8px;padding:9px;color:${c.sidebarText};font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;font-family:'Outfit',sans-serif;transition:all 0.2s}
    .kAlo:hover{background:rgba(255,255,255,0.08)}
    .kAlo-mobile{display:none}
    .kAlo-mini{height:36px;padding:0 14px;border-radius:9px;border:1px solid #e8c5c5;background:#fff;color:#a83a3a;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;font-family:'Outfit',sans-serif;letter-spacing:.02em}
    .kAlo-mini:hover{background:#fdecec;border-color:#c97070}
    .kAm{flex:1;display:flex;flex-direction:column;overflow:hidden}
    .kAtb{background:${c.topbar};border-bottom:1px solid ${c.topbarBorder};padding:14px 26px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;box-shadow:0 1px 4px ${c.topbarShadow};transition:background .3s}
    .kAtbh{font-family:'Playfair Display',serif;font-size:19px;color:${c.sectionTitle};font-weight:600}
    .kAtbh span{color:${c.accent};font-style:italic}
    .kAtbsub{font-family:'JetBrains Mono',monospace;font-size:10px;color:${c.textLight};margin-top:2px}
    .kAtbacts{display:flex;align-items:center;gap:9px}
    .kAbtn{display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;font-family:'Outfit',sans-serif;transition:all 0.2s;text-decoration:none;border:none;white-space:nowrap}
    .kAbtn-o{background:transparent;border:1px solid ${c.cardBorder};color:${c.textMid}}
    .kAbtn-o:hover{border-color:${c.accent};color:${c.accent}}
    .kAbtn-g{background:${c.accent};color:${c.accentText};box-shadow:0 4px 12px rgba(0,0,0,0.12)}
    .kAbtn-g:hover{background:${c.accentHover}}
    .kAbtn-gold{background:#c9a028;color:${theme==="green"?"#fff":"#0a0a0a"}}
    .kAbtn-red{background:#c94040;color:#fff}
    .kAcont{flex:1;overflow-y:auto;padding:22px 26px 48px}
    .kAg4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}
    .kAg2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
    .kAg3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:16px}
    .kAcard{background:${c.cardBg};border:1px solid ${c.cardBorder};border-radius:13px;padding:18px;position:relative;overflow:hidden;transition:transform 0.2s,box-shadow 0.2s;cursor:default;box-shadow:0 2px 8px ${c.cardShadow}}
    .kAcard:hover{transform:translateY(-2px);box-shadow:0 6px 20px ${c.cardHover}}
    .kAcard::before{content:'';position:absolute;top:0;left:0;right:0;height:3px}
    .kAcard.cg::before{background:linear-gradient(90deg,${c.accent},${theme==="green"?"#4a8c3f":"#f0cc60"})}
    .kAcard.co::before{background:linear-gradient(90deg,#c9a028,#f0cc60)}
    .kAcard.cr::before{background:linear-gradient(90deg,#c94040,#e06060)}
    .kAcard.ct::before{background:linear-gradient(90deg,#3aadad,#6ee0e0)}
    .kAcbg{position:absolute;right:14px;top:12px;font-size:30px;opacity:0.07}
    .kAclbl{font-size:11px;color:${c.textLight};font-weight:500;margin-bottom:6px}
    .kAcval{font-family:'Playfair Display',serif;font-size:24px;color:${c.sectionTitle};letter-spacing:-0.5px;margin-bottom:6px}
    .kAcval.ac{color:${c.accent}}.kAcval.gold{color:#c9a028}.kAcval.red{color:#c94040}
    .kAcsub{font-size:10.5px;color:${c.textLight};display:flex;align-items:center;gap:5px}
    .chip-g{background:${theme==="green"?"#e8f5e4":"rgba(45,106,45,0.15)"};color:${theme==="green"?"#2d6a2d":"#5cd47a"};font-size:10px;font-weight:600;padding:2px 7px;border-radius:20px}
    .chip-o{background:${theme==="green"?"#fef3e2":"rgba(201,160,40,0.12)"};color:${theme==="green"?"#e07820":"#f0cc60"};font-size:10px;font-weight:600;padding:2px 7px;border-radius:20px}
    .chip-r{background:${theme==="green"?"#fdecea":"rgba(200,60,60,0.15)"};color:#c94040;font-size:10px;font-weight:600;padding:2px 7px;border-radius:20px}
    .chip-t{background:${theme==="green"?"#e0f5f5":"rgba(58,173,173,0.12)"};color:${theme==="green"?"#2a9a9a":"#6ee0e0"};font-size:10px;font-weight:600;padding:2px 7px;border-radius:20px}
    .kAtcard{background:${c.cardBg};border:1px solid ${c.cardBorder};border-radius:13px;overflow:hidden;box-shadow:0 2px 8px ${c.cardShadow}}
    .kAtchdr{padding:14px 18px 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid ${c.divider}}
    .kAtctitle{font-family:'Playfair Display',serif;font-size:14px;color:${c.sectionTitle};font-weight:600}
    .kAtcsub{font-size:10.5px;color:${c.textLight};margin-top:1px}
    .kAtcact{font-size:11.5px;color:${c.accent};cursor:pointer;font-weight:500;text-decoration:none}
    .kAtbl{width:100%;border-collapse:collapse}
    .kAtbl thead th{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:${c.textLight};padding:9px 16px;text-align:left;border-bottom:1px solid ${c.divider};background:${c.tableHead}}
    .kAtbl tbody td{padding:11px 16px;font-size:12.5px;color:${c.tableText};border-bottom:1px solid ${c.tableBorder};vertical-align:middle}
    .kAtbl tbody tr:last-child td{border-bottom:none}
    .kAtbl tbody tr:hover td{background:${c.tableRowHover}}
    .kAdate{font-size:11px;color:${c.textLight};font-family:'JetBrains Mono',monospace}
    .kAamt-inv{font-family:'JetBrains Mono',monospace;font-size:12.5px;color:${c.accent};font-weight:600}
    .kAamt-wd{font-family:'JetBrains Mono',monospace;font-size:12.5px;color:#c94040;font-weight:600}
    .kAamt-div{font-family:'JetBrains Mono',monospace;font-size:12.5px;color:#c9a028;font-weight:600}
    .kAbadge{display:inline-block;padding:3px 9px;border-radius:20px;font-size:9.5px;font-weight:600;font-family:'JetBrains Mono',monospace}
    .bb-inv{background:${theme==="green"?"#e8f5e4":"rgba(45,106,45,0.15)"};color:${theme==="green"?"#2d6a2d":"#5cd47a"};border:1px solid ${theme==="green"?"#c5d6c3":"rgba(45,106,45,0.3)"}}
    .bb-div{background:${theme==="green"?"#fef3e2":"rgba(201,160,40,0.12)"};color:#c9a028;border:1px solid ${theme==="green"?"#f0d080":"rgba(201,160,40,0.25)"}}
    .bb-wd{background:${theme==="green"?"#fdecea":"rgba(200,60,60,0.12)"};color:#c94040;border:1px solid ${theme==="green"?"#f0b0b0":"rgba(200,60,60,0.25)"}}
    .bb-pend{background:${theme==="green"?"#fef3e2":"rgba(201,160,40,0.12)"};color:#e07820;border:1px solid ${theme==="green"?"#f0d080":"rgba(201,160,40,0.25)"}}
    .bb-app{background:${theme==="green"?"#e8f5e4":"rgba(45,106,45,0.15)"};color:${theme==="green"?"#2d6a2d":"#5cd47a"};border:1px solid ${theme==="green"?"#c5d6c3":"rgba(45,106,45,0.3)"}}
    .bb-rej{background:${theme==="green"?"#fdecea":"rgba(200,60,60,0.12)"};color:#c94040;border:1px solid ${theme==="green"?"#f0b0b0":"rgba(200,60,60,0.25)"}}
    .bb-admin{background:${theme==="green"?"#fef3e2":"rgba(201,160,40,0.12)"};color:#c9a028;border:1px solid ${theme==="green"?"#f0d080":"rgba(201,160,40,0.25)"}}
    .bb-staff{background:${theme==="green"?"#e8f5e4":"rgba(45,106,45,0.15)"};color:${theme==="green"?"#2d6a2d":"#5cd47a"};border:1px solid ${theme==="green"?"#c5d6c3":"rgba(45,106,45,0.3)"}}
    .bb-investor{background:${theme==="green"?"#e0f5f5":"rgba(58,173,173,0.12)"};color:${theme==="green"?"#2a9a9a":"#6ee0e0"};border:1px solid ${theme==="green"?"#a0e0e0":"rgba(58,173,173,0.25)"}}
    .kAmodalbg{position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px}
    .kAmodal{background:${c.cardBg};border:1px solid ${c.cardBorder};border-radius:16px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,0.25)}
    .kAmodalhdr{padding:20px 24px 16px;border-bottom:1px solid ${c.divider};display:flex;align-items:center;justify-content:space-between}
    .kAmodaltitle{font-family:'Playfair Display',serif;font-size:16px;color:${c.sectionTitle};font-weight:600}
    .kAmodalclose{background:transparent;border:none;font-size:18px;cursor:pointer;color:${c.textLight}}
    .kAmodalbody{padding:20px 24px}
    .kAmodalfoot{padding:14px 24px;border-top:1px solid ${c.divider};display:flex;justify-content:flex-end;gap:8px}
    .kAflbl{font-size:11px;color:${c.textMid};font-weight:600;margin-bottom:5px;display:block;font-family:'JetBrains Mono',monospace;letter-spacing:0.5px;text-transform:uppercase}
    .kAfinput{width:100%;background:${c.formBg};border:1px solid ${c.formBorder};border-radius:8px;padding:9px 12px;font-size:13px;color:${c.text};font-family:'Outfit',sans-serif;outline:none}
    .kAfinput:focus{border-color:${c.accent};background:${theme==="green"?"#fff":"#2a2a2a"}}
    .kAfinput::placeholder{color:${c.textLight}}
    .kAfsel{width:100%;background:${c.formBg};border:1px solid ${c.formBorder};border-radius:8px;padding:9px 12px;font-size:13px;color:${c.text};font-family:'Outfit',sans-serif;outline:none}
    .kAfta{width:100%;background:${c.formBg};border:1px solid ${c.formBorder};border-radius:8px;padding:9px 12px;font-size:13px;color:${c.text};font-family:'Outfit',sans-serif;outline:none;resize:vertical;min-height:80px}
    .kAalert{padding:12px 16px;border-radius:10px;display:flex;align-items:flex-start;gap:10px;margin-bottom:14px;font-size:12.5px}
    .kAalert-g{background:${theme==="green"?"#e8f5e4":"rgba(45,106,45,0.12)"};border:1px solid ${theme==="green"?"#c5d6c3":"rgba(45,106,45,0.3)"};color:${theme==="green"?"#2d6a2d":"#5cd47a"}}
    .kAalert-o{background:${theme==="green"?"#fef3e2":"rgba(201,160,40,0.1)"};border:1px solid ${theme==="green"?"#f0d080":"rgba(201,160,40,0.3)"};color:${theme==="green"?"#c07010":"#f0cc60"}}
    .kAalert-r{background:${theme==="green"?"#fdecea":"rgba(200,60,60,0.1)"};border:1px solid ${theme==="green"?"#f0b0b0":"rgba(200,60,60,0.3)"};color:#c94040}
    .kAstatrow{display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:${c.statBg};border-radius:8px;margin-bottom:8px;border:1px solid ${c.statBorder}}
    .kAstatrow:hover{border-color:${c.accent}}
    .kAssearch{display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid ${c.divider};background:${c.searchBg}}
    .kAssearchinput{flex:1;background:${c.searchInput};border:1px solid ${c.cardBorder};border-radius:8px;padding:8px 12px;font-size:12.5px;color:${c.text};font-family:'Outfit',sans-serif;outline:none}
    .kAssearchinput:focus{border-color:${c.accent}}
    .kApend{background:${c.cardBg};border:1px solid ${c.cardBorder};border-radius:10px;padding:14px 16px;margin-bottom:10px;box-shadow:0 1px 4px ${c.cardShadow}}
    .kApend-border{border-left:3px solid #c94040}
    @keyframes kAfade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes kAspin{to{transform:rotate(360deg)}}
    .kAf1{animation:kAfade .35s ease both}.kAf2{animation:kAfade .35s .05s ease both}.kAf3{animation:kAfade .35s .1s ease both}

    /* ========== Responsive: tablet (iPad 11" portrait ~834px) ========== */
    @media (max-width: 1023px) {
      .kAsb{width:200px}
      .kAlogo{padding:18px 14px 10px}
      .kAlt{font-size:12px}
      .kAni{padding:9px 10px}
      .kAntxt{font-size:12px}
      .kAtb{padding:12px 16px}
      .kAtbh{font-size:17px}
      .kAcont{padding:18px 16px 36px}
      .kAg4{grid-template-columns:repeat(2,1fr)}
      .kAg3{grid-template-columns:repeat(2,1fr)}
      .kAtbl thead th, .kAtbl tbody td{padding:9px 12px;font-size:12px}
    }

    /* ========== Responsive: mobile (iPhone 16 Pro/Pro Max etc, <768px) ========== */
    @media (max-width: 767px) {
      .kA{flex-direction:column;height:auto;min-height:100vh;overflow:visible}
      .kAsb{width:100%;flex-direction:row;height:auto;box-shadow:0 2px 8px rgba(0,0,0,0.15);position:sticky;top:0;z-index:50}
      .kAsb::before{display:none}
      .kAlogo{padding:10px 12px;border-bottom:none;border-right:1px solid ${c.sidebarBorder};flex-shrink:0}
      .kAlogomark{width:32px;height:32px;font-size:16px}
      .kAlt{font-size:11px}
      .kAls{display:none}
      .kAuser, .kAft{display:none}
      .kAlo-mobile{display:block}
      .kAnav{flex:1;padding:6px 8px;overflow-x:auto;overflow-y:hidden;display:flex;gap:4px;scrollbar-width:none}
      .kAnav::-webkit-scrollbar{display:none}
      .kAni{flex-shrink:0;padding:6px 10px;margin-bottom:0;border-radius:6px;flex-direction:column;gap:2px;min-width:54px;text-align:center}
      .kAni.act::before{display:none}
      .kAicon{font-size:16px;width:auto}
      .kAntxt{font-size:9px;font-weight:500}

      .kAm{height:auto;overflow:visible}
      .kAtb{padding:10px 12px;flex-wrap:wrap;gap:8px}
      .kAtbh{font-size:15px;line-height:1.2}
      .kAtbsub{font-size:9px}
      .kAtbacts{gap:6px;flex-wrap:wrap}

      .kAcont{padding:12px;overflow-y:visible}
      .kAg4, .kAg3, .kAg2{grid-template-columns:1fr;gap:10px;margin-bottom:12px}
      .kAcard{padding:14px}
      .kAcbg{font-size:24px;right:10px;top:8px}

      /* Make tables horizontally scrollable */
      .kAtcard{overflow-x:auto;-webkit-overflow-scrolling:touch}
      .kAtbl{min-width:540px}
      .kAtbl thead th, .kAtbl tbody td{padding:8px 10px;font-size:11px}

      /* Modals fit screen */
      .kAmodalbg{padding:10px}
      .kAmodal{max-width:100%;border-radius:12px}
      .kAmodalhdr{padding:14px 16px 12px}
      .kAmodalbody{padding:14px 16px}
      .kAmodalfoot{padding:10px 16px}

      /* Forms compact */
      .kAfinput, .kAfsel, .kAfta{padding:8px 10px;font-size:13px}

      /* Inline-styled sub-page grids collapse */
      .kAg-4col, .kAg-2col, .kAg-tabung, .kAg-agm{grid-template-columns:1fr !important}
      .kAg-tabung > div, .kAg-agm > div{min-width:0}
    }

    /* Tablet: reduce 4-col grid and AGM split */
    @media (max-width: 1023px) and (min-width: 768px) {
      .kAg-4col{grid-template-columns:repeat(2,1fr) !important}
      .kAg-tabung{grid-template-columns:1fr 1fr !important}
      .kAg-agm{grid-template-columns:260px 1fr !important}
    }
  `;

  if (loading) return (
    <><style>{css}</style>
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:c.bg}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:36,height:36,borderRadius:"50%",border:`3px solid ${c.cardBorder}`,borderTopColor:c.accent,animation:"kAspin .8s linear infinite",margin:"0 auto 12px"}}/>
        <p style={{color:c.textLight,fontSize:12,fontFamily:"'Outfit',sans-serif"}}>Loading…</p>
      </div>
    </div></>
  );

  const kpi  = data?.kpi;
  const activeCount   = kpi?.active_members  ?? 0;
  const inactiveCount = kpi?.inactive_members ?? 0;
  const pendingCount  = kpi?.pending_members  ?? 0;
  const today = new Date().toLocaleDateString("en-MY",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

  const TxBadge = ({type}:{type:string}) => {
    const cls = type==="DEPOSIT"||type==="INVESTMENT"||type==="BUY"?"bb-inv":type==="DIVIDEND"?"bb-div":"bb-wd";
    return <span className={`kAbadge ${cls}`}>{type==="INVESTMENT"||type==="BUY"?"DEPOSIT":type}</span>;
  };
  const amtCls = (t:string) => t==="WITHDRAWAL"||t==="WITHDRAW"?"kAamt-wd":t==="DIVIDEND"?"kAamt-div":"kAamt-inv";

  /* Sidebar and Topbar — identical to your original */
  const Sidebar = () => (
    <aside className="kAsb">
      <div className="kAlogo">
        <div className="kAlogomark"><img src={`${base()}/logo-kopssb.jpeg`} alt="KOP-SSB"/></div>
        <div>
          <div className="kAlt">KOP-SSB</div>
          <div className="kAls">Koperasi Kakitangan<br/>Sabah Softwoods Berhad</div>
        </div>
      </div>
      <div className="kAuser">
        <div className="kAav">{(au().name||"A").slice(0,2).toUpperCase()}</div>
        <div><div className="kAun">{au().name||"Admin"}</div><div className="kAur">ADMINISTRATOR</div></div>
        <div className="kAubadge">ADMIN</div>
      </div>
      <nav className="kAnav">
        <div className="kAns">Overview</div>
        <a href="/admin" className={`kAni${ap==="dashboard"?" act":""}`} onClick={e=>{e.preventDefault();setAdminMemberDetail(null);nav("/admin","dashboard");}}>
          <span className="kAicon">🎛️</span><span className="kAntxt">Dashboard</span>
        </a>
        <div className="kAns">Management</div>
        <a href="/admin/approvals" className={`kAni${ap==="approvals"?" act":""}`} onClick={e=>{e.preventDefault();setAdminMemberDetail(null);nav("/admin/approvals","approvals");}}>
          <span className="kAicon">⏳</span><span className="kAntxt">Approvals</span>
          {(kpi?.pending_approvals??0)>0&&<span className="kAnbadge red">{kpi!.pending_approvals}</span>}
        </a>
        <a href="/admin/shareholders" className={`kAni${ap==="members"?" act":""}`} onClick={e=>{e.preventDefault();setAdminMemberDetail(null);nav("/admin/shareholders","members");}}>
          <span className="kAicon">👥</span><span className="kAntxt">Shareholder Management</span>
        </a>
        <a href="/admin/dividend" className={`kAni${ap==="dividend"?" act":""}`} onClick={e=>{e.preventDefault();setAdminMemberDetail(null);nav("/admin/dividend","dividend");}}>
          <span className="kAicon">📈</span><span className="kAntxt">Dividend Manager</span>
        </a>
        <a href="/admin/tabung" className={`kAni${ap==="tabung"?" act":""}`} onClick={e=>{e.preventDefault();setAdminMemberDetail(null);nav("/admin/tabung","tabung");}}>
          <span className="kAicon">🌿</span><span className="kAntxt">Tabung Komitmen</span>
        </a>
        <a href="/admin/transactions" className={`kAni${ap==="transactions"?" act":""}`} onClick={e=>{e.preventDefault();setAdminMemberDetail(null);nav("/admin/transactions","transactions");}}>
          <span className="kAicon">📋</span><span className="kAntxt">Transactions</span>
        </a>
        <div className="kAns">Communication</div>
        <a href="/admin/announcements" className={`kAni${ap==="announcements"?" act":""}`} onClick={e=>{e.preventDefault();setAdminMemberDetail(null);nav("/admin/announcements","announcements");}}>
          <span className="kAicon">📢</span><span className="kAntxt">Announcements</span>
          {(kpi?.active_announcements??0)>0&&<span className="kAnbadge">{kpi!.active_announcements}</span>}
        </a>
        <a href="/admin/notifications" className={`kAni${ap==="notifications"?" act":""}`} onClick={e=>{e.preventDefault();setAdminMemberDetail(null);nav("/admin/notifications","notifications");}}>
          <span className="kAicon">🔔</span><span className="kAntxt">Staff Messages</span>
        </a>
        <a href="/admin/agm" className={`kAni${ap==="agm"?" act":""}`} onClick={e=>{e.preventDefault();setAdminMemberDetail(null);nav("/admin/agm","agm");}}>
          <span className="kAicon">📋</span><span className="kAntxt">AGM Attendance</span>
        </a>
        <div className="kAns">Reports</div>
        <a href="/admin/reports" className={`kAni${ap==="reports"?" act":""}`} onClick={e=>{e.preventDefault();setAdminMemberDetail(null);nav("/admin/reports","reports");}}>
          <span className="kAicon">📊</span><span className="kAntxt">Financial Summary</span>
        </a>
        <a href="/admin/audit-log" className={`kAni${ap==="audit-log"?" act":""}`} onClick={e=>{e.preventDefault();setAdminMemberDetail(null);nav("/admin/audit-log","audit-log");}}>
          <span className="kAicon">🔍</span><span className="kAntxt">Audit Log</span>
        </a>
        <div className="kAns">Account</div>
        <a href="/shareholder" className="kAni">
          <span className="kAicon">💼</span><span className="kAntxt">My Deposit</span>
        </a>
        <a href="#" className={`kAni${ap==="settings"?" act":""}`} onClick={e=>{e.preventDefault();nav("/admin","settings");}}>
          <span className="kAicon">⚙️</span><span className="kAntxt">Settings</span>
        </a>
      </nav>
      <div className="kAft">
        <form method="POST" action={(window as any).LogoutUrl || "/logout"} style={{margin:0}}>
          <input type="hidden" name="_token" value={csrf()}/>
          <button type="submit" className="kAlo">⬅ &nbsp;Log Out</button>
        </form>
      </div>
    </aside>
  );

  const Topbar = ({title}:{title:string}) => (
    <div className="kAtb">
      <div>
        <div className="kAtbh">{title} <span>· Admin</span></div>
        <div className="kAtbsub">{today} &nbsp;·&nbsp; FY {kpi?.fy}</div>
      </div>
      <div className="kAtbacts">
        {ap==="dashboard"&&<>
          <button className="kAbtn kAbtn-o" onClick={()=>{setModal("notify");setMdata(null);}}>🔔 Notify Staff</button>
          <button className="kAbtn kAbtn-gold" onClick={()=>{setModal("dividend");setMdata(null);}}>📈 Set Dividend</button>
        </>}
        {ap==="announcements"&&<button className="kAbtn kAbtn-g" onClick={()=>{setModal("announcement");setMdata(null);}}>+ New Announcement</button>}
        <form method="POST" action={(window as any).LogoutUrl || "/logout"} style={{margin:0}} className="kAlo-mobile">
          <input type="hidden" name="_token" value={csrf()}/>
          <button type="submit" className="kAlo-mini" title="Log out" aria-label="Log out">Logout</button>
        </form>
      </div>
    </div>
  );

  /* PageDash — identical to your original */
  const PageDash = () => (
    <>
      <Topbar title="Admin Dashboard"/>
      <div className="kAcont">
        {(kpi?.pending_approvals??0)>0&&(
          <div className="kAalert kAalert-r kAf1">
            <span>⚠️</span>
            <span><strong>{kpi!.pending_approvals} staff action{kpi!.pending_approvals>1?"s":""}</strong> awaiting approval. <a href="#" style={{color:"#c94040",fontWeight:700}} onClick={e=>{e.preventDefault();nav("/admin/approvals","approvals");}}>Review →</a></span>
          </div>
        )}
        <div className="kAg4 kAf1">
          <div className="kAcard cg"><div className="kAcbg">👥</div><div className="kAclbl">Total Shareholders</div><div className="kAcval ac">{kpi?.total_members??0}</div><div className="kAcsub"><span className="chip-g">Active: {activeCount}</span><span style={{color:"#c94040",marginLeft:6}}>Inactive: {inactiveCount}</span><span style={{color:"#e07820",marginLeft:6}}>Pending: {pendingCount}</span></div></div>
          <div className="kAcard co"><div className="kAcbg">💰</div><div className="kAclbl">Total Current Account</div><div className="kAcval gold">{fmtK(kpi?.total_current_account??0)}</div><div className="kAcsub"><span className="chip-o">All shareholders</span></div></div>
          <div className="kAcard cg"><div className="kAcbg">🏅</div><div className="kAclbl">Dividend Paid (FY {kpi?.fy})</div><div className="kAcval">{fmtK(kpi?.total_dividend_this_year??0)}</div><div className="kAcsub"><span className="chip-g">This year</span></div></div>
          <div className="kAcard ct"><div className="kAcbg">📋</div><div className="kAclbl">Tx Today</div><div className="kAcval">{kpi?.tx_today??0}</div><div className="kAcsub"><span className="chip-t">Month: {kpi?.tx_this_month??0}</span></div></div>
        </div>
        <div className="kAg4 kAf2">
          <div className="kAcard cr"><div className="kAcbg">⏳</div><div className="kAclbl">Pending Approvals</div><div className={`kAcval${(kpi?.pending_approvals??0)>0?" red":""}`}>{kpi?.pending_approvals??0}</div><div className="kAcsub"><span className="chip-r">Staff submissions</span></div></div>
          <div className="kAcard cg"><div className="kAcbg">📢</div><div className="kAclbl">Active Announcements</div><div className="kAcval">{kpi?.active_announcements??0}</div><div className="kAcsub"><span className="chip-g">Published</span></div></div>
          <div className="kAcard co"><div className="kAcbg">📈</div><div className="kAclbl">Latest Dividend Rate</div><div className="kAcval gold">{kpi?.latest_rate??0}%</div><div className="kAcsub"><span className="chip-o">FY {kpi?.latest_rate_year}</span></div></div>
          <div className="kAcard ct"><div className="kAcbg">📅</div><div className="kAclbl">Tx This Month</div><div className="kAcval">{kpi?.tx_this_month??0}</div><div className="kAcsub"><span className="chip-t">Month total</span></div></div>
        </div>
        <div className="kAg2 kAf2">
          <div className="kAtcard">
            <div className="kAtchdr"><div><div className="kAtctitle">Shareholder Overview</div><div className="kAtcsub">Active / Inactive / Pending</div></div></div>
            <div style={{padding:"16px 18px",display:"flex",alignItems:"center",gap:20}}>
              <div style={{width:130,height:130,flexShrink:0}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{name:"Active",value:activeCount},{name:"Inactive",value:inactiveCount},{name:"Pending",value:pendingCount}]} dataKey="value" innerRadius={35} outerRadius={55} stroke="none">
                      <Cell fill={c.accent}/><Cell fill="#c94040"/><Cell fill="#e07820"/>
                    </Pie>
                    <Tooltip contentStyle={{background:theme==="green"?"#1a2e1a":"#111",border:"none",color:"#f0f9ee",borderRadius:8,fontSize:11}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{flex:1}}>
                {[{l:"Active",v:activeCount,clr:c.accent},{l:"Inactive",v:inactiveCount,clr:"#c94040"},{l:"Pending",v:pendingCount,clr:"#e07820"}].map(({l,v,clr})=>(
                  <div key={l} className="kAstatrow">
                    <div style={{display:"flex",alignItems:"center",gap:7}}><span style={{width:8,height:8,borderRadius:"50%",background:clr,display:"inline-block"}}/><span style={{fontSize:13,color:c.textMid}}>{l}</span></div>
                    <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:14,color:clr,fontWeight:600}}>{v}</span>
                  </div>
                ))}
                <div style={{padding:"10px 12px",borderRadius:8,background:c.statBg,border:`1px solid ${c.statBorder}`,marginTop:4}}>
                  <div style={{fontSize:11,color:c.textLight,marginBottom:2}}>Total</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:c.accent}}>{kpi?.total_members??0}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="kAtcard">
            <div className="kAtchdr"><div><div className="kAtctitle">Monthly Transactions</div><div className="kAtcsub">Volume (RM) last 6 months</div></div></div>
            <div style={{padding:"14px 18px",height:200}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.monthly_volume??[]} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.divider}/>
                  <XAxis dataKey="month" stroke={c.cardBorder} tick={{fill:c.textLight,fontSize:9,fontFamily:"JetBrains Mono"}}/>
                  <YAxis stroke={c.cardBorder} tick={{fill:c.textLight,fontSize:9}} tickFormatter={v=>`${Math.round(Number(v)/1000)}k`}/>
                  <Tooltip contentStyle={{background:theme==="green"?"#1a2e1a":"#111",border:"none",color:"#f0f9ee",borderRadius:8,fontSize:11}} formatter={v=>[fmt(Number(v)),"Volume"]}/>
                  <Bar dataKey="total" fill={c.accent} radius={[4,4,0,0]} opacity={0.85}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="kAg2 kAf3">
          <div className="kAtcard">
            <div className="kAtchdr"><div><div className="kAtctitle">Recent Transactions</div></div><a href="#" className="kAtcact" onClick={e=>{e.preventDefault();nav("/admin/transactions","transactions");}}>View all →</a></div>
            <table className="kAtbl"><thead><tr><th>Date</th><th>Shareholder</th><th>Type</th><th>Amount</th></tr></thead><tbody>
              {(data?.recent_tx??[]).slice(0,6).map(t=>(<tr key={t.id}><td className="kAdate">{t.date}</td><td><div style={{fontWeight:500,fontSize:12}}>{t.member}</div><div className="kAdate">{t.mid}</div></td><td><TxBadge type={t.type}/></td><td className={amtCls(t.type)}>{fmt(t.amount)}</td></tr>))}
            </tbody></table>
          </div>
          <div className="kAtcard">
            <div className="kAtchdr"><div><div className="kAtctitle">Announcements</div></div><a href="#" className="kAtcact" onClick={e=>{e.preventDefault();setModal("announcement");setMdata(null);}}>+ New</a></div>
            <div style={{padding:"12px 16px"}}>
              {(data?.announcements??[]).map(ann=>(<div key={ann.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",background:c.statBg,border:`1px solid ${ann.is_active?c.accent:c.statBorder}`,borderLeft:`3px solid ${ann.is_active?c.accent:"#666"}`,borderRadius:8,marginBottom:8}}><div style={{flex:1}}><div style={{fontWeight:500,fontSize:12.5,color:c.text,marginBottom:2}}>{ann.title}{ann.attachment_url&&<span style={{marginLeft:6,fontSize:10,color:c.textLight}}>📎</span>}</div><div style={{fontSize:10.5,color:c.textLight,fontFamily:"JetBrains Mono,monospace"}}>{ann.is_active?"Published":"Draft"} · {ann.published_at??"—"}</div></div><button className="kAbtn kAbtn-o" style={{padding:"3px 8px",fontSize:11,flexShrink:0}} onClick={()=>doAction(`/admin/announcements/${ann.id}/toggle`,{})}>{ann.is_active?"Archive":"Publish"}</button></div>))}
              {(data?.announcements??[]).length===0&&<p style={{textAlign:"center",padding:20,color:c.textLight,fontSize:12}}>No announcements yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const PageApprovals = () => {
    /* Convert raw payload object → readable rows */
    const payloadRows = (type:string, pl:any): {label:string; value:string; highlight?:boolean}[] => {
      if (!pl) return [];
      const fmt2 = (v:any) => v ?? "—";
      const rows: {label:string; value:string; highlight?:boolean}[] = [];

      if (type === "add_transaction" || type === "edit_transaction") {
        const typeMap:Record<string,string> = { deposit:"DEPOSIT", dividend:"DIVIDEND", withdrawal:"WITHDRAWAL / Withdraw" };
        rows.push({ label:"Type",   value: typeMap[pl.type] ?? pl.type ?? "—", highlight:true });
        rows.push({ label:"Amount", value: pl.amount ? `RM ${Number(pl.amount).toLocaleString("en-MY",{minimumFractionDigits:2})}` : "—", highlight:true });
        rows.push({ label:"Date",   value: fmt2(pl.transaction_date) });
        if (pl.description) rows.push({ label:"Description", value: pl.description });
      } else if (type === "delete_transaction") {
        rows.push({ label:"Action", value:"Permanently delete this transaction", highlight:true });
        if (pl.transaction_id) rows.push({ label:"Transaction ID", value: String(pl.transaction_id) });
      } else if (type === "edit_member") {
        if (pl.full_name)  rows.push({ label:"New Name",      value: pl.full_name,  highlight:true });
        if (pl.member_id)  rows.push({ label:"New Shareholder ID", value: pl.member_id,  highlight:true });
      } else if (type === "toggle_status") {
        const action = pl.is_approved ? "Activate account" : "Deactivate account";
        rows.push({ label:"Action", value: action, highlight:true });
      } else if (type === "change_tabung") {
        rows.push({ label:"New Amount", value: pl.amount ? `RM ${Number(pl.amount).toLocaleString("en-MY",{minimumFractionDigits:2})}` : "—", highlight:true });
        if (pl.notes) rows.push({ label:"Notes", value: pl.notes });
      } else {
        // Fallback: show key-value pairs nicely
        Object.entries(pl).forEach(([k,v]) => {
          if (v !== null && v !== undefined && v !== "")
            rows.push({ label: k.replace(/_/g," "), value: String(v) });
        });
      }
      return rows;
    };

    const typeConfig: Record<string,{label:string; icon:string; accent:string; bg:string; border:string}> = {
      add_transaction:    { label:"Add Transaction",    icon:"➕", accent:"#2d6a2d", bg:"#e8f5e4", border:"#c5d6c3" },
      edit_transaction:   { label:"Edit Transaction",   icon:"✏️", accent:"#1a6a9a", bg:"#e3f0fa", border:"#b0cce0" },
      delete_transaction: { label:"Delete Transaction", icon:"🗑",  accent:"#c94040", bg:"#fdecea", border:"#f0b0b0" },
      edit_member:        { label:"Edit Shareholder Info",   icon:"👤", accent:"#7a4ab0", bg:"#f3ecfc", border:"#d0b0e8" },
      toggle_status:      { label:"Toggle Status",      icon:"🔄", accent:"#c9a028", bg:"#fef3e2", border:"#f0d080" },
      change_tabung:      { label:"Change Tabung",      icon:"🌿", accent:"#2a9a9a", bg:"#e0f5f5", border:"#a0dede" },
    };

    const pending = data?.pending_list ?? [];

    return (
      <>
        <Topbar title="Pending Approvals"/>
        <div className="kAcont">

          {pending.length === 0 ? (
            <div className="kAalert kAalert-g kAf1">
              <span>✅</span><span>No pending approvals. All clear!</span>
            </div>
          ) : (
            <>
              {/* Summary count */}
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <span style={{background:"#fdecea",color:"#c94040",border:"1px solid #f0b0b0",borderRadius:20,fontSize:11,fontWeight:700,padding:"3px 12px",fontFamily:"JetBrains Mono,monospace"}}>
                  {pending.length} pending
                </span>
                <span style={{fontSize:12,color:c.textLight}}>Review each request carefully before approving.</span>
              </div>

              {pending.map(p => {
                const cfg = typeConfig[p.type] ?? { label:p.type.replace(/_/g," "), icon:"📋", accent:c.accent, bg:c.statBg, border:c.statBorder };
                const rows = payloadRows(p.type, p.payload);
                const isDelete = p.type.includes("delete");

                return (
                  <div key={p.id} className="kAf1" style={{
                    background: c.cardBg,
                    border: `1px solid ${c.cardBorder}`,
                    borderLeft: `4px solid ${cfg.accent}`,
                    borderRadius: 12, marginBottom: 14,
                    boxShadow: `0 2px 10px ${c.cardShadow}`,
                    overflow:"hidden",
                  }}>

                    {/* ── Header strip ── */}
                    <div style={{background:cfg.bg,borderBottom:`1px solid ${cfg.border}`,padding:"10px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:16}}>{cfg.icon}</span>
                        <span style={{fontWeight:700,fontSize:13,color:cfg.accent}}>{cfg.label}</span>
                        {isDelete && <span style={{background:"#c94040",color:"#fff",fontSize:9,fontWeight:700,padding:"1px 8px",borderRadius:10,fontFamily:"JetBrains Mono,monospace"}}>DESTRUCTIVE</span>}
                      </div>
                      <span style={{fontSize:11,color:cfg.accent,fontFamily:"JetBrains Mono,monospace",opacity:0.8}}>{p.created_at}</span>
                    </div>

                    <div style={{padding:"14px 18px"}}>
                      {/* ── Who → Who ── */}
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                        <span style={{background:c.statBg,border:`1px solid ${c.statBorder}`,borderRadius:8,padding:"5px 10px",fontSize:12,color:c.textMid}}>
                          👤 Staff: <strong style={{color:c.text}}>{p.staff}</strong>
                        </span>
                        <span style={{color:c.textLight,fontSize:14}}>→</span>
                        <span style={{background:c.statBg,border:`1px solid ${c.statBorder}`,borderRadius:8,padding:"5px 10px",fontSize:12,color:c.textMid}}>
                          🧑 Shareholder: <strong style={{color:c.text}}>{p.member}</strong>
                          <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:10,color:c.textLight,marginLeft:6}}>ID {p.mid}</span>
                        </span>
                      </div>

                      {/* ── Payload rows ── */}
                      {rows.length > 0 && (
                        <div style={{background:c.statBg,border:`1px solid ${c.statBorder}`,borderRadius:8,overflow:"hidden",marginBottom:p.remarks?12:0}}>
                          {rows.map(({label,value,highlight},i) => (
                            <div key={i} style={{display:"flex",alignItems:"center",padding:"8px 12px",borderBottom:i<rows.length-1?`1px solid ${c.divider}`:"none",gap:12}}>
                              <span style={{fontSize:10,color:c.textLight,fontFamily:"JetBrains Mono,monospace",textTransform:"uppercase",letterSpacing:0.5,width:110,flexShrink:0}}>{label}</span>
                              <span style={{fontSize:13,color:highlight?cfg.accent:c.text,fontWeight:highlight?700:400}}>{value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* ── Staff remarks ── */}
                      {p.remarks && (
                        <div style={{display:"flex",gap:8,alignItems:"flex-start",background:c.statBg,border:`1px solid ${c.statBorder}`,borderRadius:8,padding:"8px 12px",marginTop:rows.length>0?8:0}}>
                          <span style={{fontSize:11,color:c.textLight,fontFamily:"JetBrains Mono,monospace",textTransform:"uppercase",letterSpacing:0.5,flexShrink:0,paddingTop:1}}>Note</span>
                          <span style={{fontSize:12.5,color:c.textMid,flex:1,lineHeight:1.5,fontStyle:"italic"}}>"{p.remarks}"</span>
                        </div>
                      )}
                    </div>

                    {/* ── Action buttons ── */}
                    <div style={{padding:"12px 18px",borderTop:`1px solid ${c.divider}`,display:"flex",justifyContent:"flex-end",gap:8,background:c.cardBg}}>
                      <button className="kAbtn kAbtn-red" onClick={()=>{setModal("reject");setMdata({id:p.id});}}>✗ Reject</button>
                      <button className="kAbtn kAbtn-g"   onClick={()=>{setModal("approve");setMdata({id:p.id});}}>✅ Approve</button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </>
    );
  };

  /* ════════════════════════════════════════════════════════════
     CHANGE 3 of 3: PageMembers — now has 3 states
     1. Loading spinner (while fetching member detail)
     2. AdminMemberDetailView (read-only, when a member is selected)
     3. AdminMemberTable (default list with View + Change Role)
  ════════════════════════════════════════════════════════════ */
  const PageMembers = () => {
    if (memberDetailLoading) return (
      <>
        <Topbar title="Shareholder Management"/>
        <div className="kAcont" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:300}}>
          <div style={{textAlign:"center"}}>
            <div style={{width:32,height:32,borderRadius:"50%",border:`3px solid ${c.cardBorder}`,borderTopColor:c.accent,animation:"kAspin .8s linear infinite",margin:"0 auto 10px"}}/>
            <p style={{color:c.textLight,fontSize:12}}>Loading shareholder data…</p>
          </div>
        </div>
      </>
    );

    if (adminMemberDetail) return (
      <>
        <Topbar title="Shareholder Management"/>
        <div className="kAm" style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <AdminMemberDetailView
            detail={adminMemberDetail}
            colors={c}
            onBack={() => setAdminMemberDetail(null)}
            onRaiseTicket={()=>{const p=adminMemberDetail.profile;setModal("notify");setMdata({ticketType:"member",referenceId:p.id,defaultTitle:`Shareholder concern: ${p.name||p.full_name} (ID ${p.shareholder_id??p.id})`});}}
          />
        </div>
      </>
    );

    return (
      <>
        <Topbar title="Shareholder Management"/>
        <div className="kAcont">
          <AdminMemberTable
            colors={c}
            onViewMember={id => loadAdminMemberDetail(id)}
            onChangeRole={u => { setModal("changeRole"); setMdata({userId:u.id,name:u.name,currentRole:u.role}); }}
          />
        </div>
      </>
    );
  };

  /* ════════════════════════════════════════════════════════════
     CHANGE 4 of 4: PageTransactions — upgraded to full version
     Same filters/pagination/CSV as staff PageTransactions.
     Reuses /staff/transactions/data and /staff/transactions/download
  ════════════════════════════════════════════════════════════ */
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
        const r = await fetch(base() + `/staff/transactions/data?type=${type}&range=${range}&year=${year}`,
          {credentials:"include",headers:{Accept:"application/json"}});
        const d = await r.json();
        setTxAll(d.transactions||[]);
      } finally { setTxLoad(false); }
    }, []);

    React.useEffect(() => { fetchTx(); }, []);
    React.useEffect(() => { fetchTx(txType, txRange, txYear); }, [txType, txRange]);

    const download = () => {
      window.location.href = `/staff/transactions/download?type=${txType}&range=${txRange}&year=${txYear}`;
    };

    const totalPages = Math.max(1, Math.ceil(txAll.length / PER_PAGE));
    const txList     = txAll.slice((txPage-1)*PER_PAGE, txPage*PER_PAGE);

    const txBadge = (type:string) => {
      const isI = type==="DEPOSIT"||type==="INVESTMENT"||type==="BUY", isD = type==="DIVIDEND";
      return <span style={{
        background:isI?"#e8f5e4":isD?"#fef3e2":"#fdecea",
        color:isI?c.accent:isD?"#c9a028":"#c94040",
        border:`1px solid ${isI?"#c5d6c3":isD?"#f0d080":"#f0b0b0"}`,
        padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:700,
        fontFamily:"JetBrains Mono,monospace"
      }}>{isI?"DEPOSIT":type}</span>;
    };

    const FB = ({val,cur,set,label}:{val:string;cur:string;set:(v:string)=>void;label:string}) => (
      <button onClick={()=>set(val)} style={{
        padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",
        fontFamily:"Outfit,sans-serif",border:"1px solid",transition:"all 0.15s",
        background:cur===val?c.accent:"transparent",
        color:cur===val?c.accentText:c.textMid,
        borderColor:cur===val?c.accent:c.cardBorder,
      }}>{label}</button>
    );

    return (
      <>
        <Topbar title="Transactions"/>
        <div className="kAcont">

          {/* Filter bar */}
          <div className="kAtcard kAf1" style={{marginBottom:16}}>
            <div style={{padding:"16px 20px",display:"flex",alignItems:"flex-end",gap:20,flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:10,color:c.textLight,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:7}}>Transaction Type</div>
                <div style={{display:"flex",gap:6}}>
                  <FB val="all" cur={txType} set={setTxType} label="All"/>
                  <FB val="deposit" cur={txType} set={setTxType} label="Deposit"/>
                  <FB val="withdrawal" cur={txType} set={setTxType} label="Withdraw"/>
                  <FB val="dividend" cur={txType} set={setTxType} label="Dividend"/>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,color:c.textLight,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:7}}>Time Range</div>
                <div style={{display:"flex",gap:6}}>
                  <FB val="all" cur={txRange} set={setTxRange} label="All Time"/>
                  <FB val="year" cur={txRange} set={setTxRange} label="By Year"/>
                  <FB val="month" cur={txRange} set={setTxRange} label="This Month"/>
                  <FB val="week" cur={txRange} set={setTxRange} label="This Week"/>
                </div>
              </div>
              {txRange==="year"&&(
                <div>
                  <div style={{fontSize:10,color:c.textLight,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",marginBottom:7}}>Year</div>
                  <input type="number" value={txYear} onChange={e=>setTxYear(e.target.value)}
                    onBlur={()=>fetchTx(txType,txRange,txYear)}
                    onKeyDown={e=>e.key==="Enter"&&fetchTx(txType,txRange,txYear)}
                    style={{background:c.formBg,border:`1px solid ${c.formBorder}`,borderRadius:8,padding:"7px 12px",fontSize:13,color:c.text,width:100,fontFamily:"JetBrains Mono,monospace",outline:"none"}}/>
                </div>
              )}
              <div style={{display:"flex",gap:8,alignItems:"flex-end",paddingBottom:2}}>
                <button onClick={download} style={{padding:"8px 18px",borderRadius:8,border:"1px solid #c9a028",background:"#c9a028",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Outfit,sans-serif",display:"flex",alignItems:"center",gap:6}}>
                  ⬇ Download CSV
                </button>
              </div>
            </div>
            <div style={{padding:"10px 20px 14px",display:"flex",gap:8,alignItems:"center",borderTop:`1px solid ${c.divider}`}}>
              <span style={{fontSize:11,color:c.textLight}}>Results:</span>
              <span style={{background:theme==="green"?"#e8f5e4":"rgba(45,106,45,0.15)",color:c.accent,fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20}}>{txAll.length} records</span>
              {totalPages>1&&<span style={{marginLeft:"auto",fontSize:11,color:c.textLight,fontFamily:"JetBrains Mono,monospace"}}>Page {txPage} of {totalPages}</span>}
            </div>
          </div>

          {/* Table */}
          <div className="kAtcard kAf2">
            <table className="kAtbl" style={{tableLayout:"fixed",width:"100%"}}>
              <thead>
                <tr>
                  <th style={{width:"12%"}}>Date</th>
                  <th style={{width:"19%"}}>Shareholder</th>
                  <th style={{width:"12%"}}>Type</th>
                  <th style={{width:"31%"}}>Description</th>
                  <th style={{width:"18%",textAlign:"right",paddingRight:12}}>Amount</th>
                  <th style={{width:"8%",textAlign:"center"}}></th>
                </tr>
              </thead>
              <tbody>
                {txLoad&&<tr><td colSpan={6} style={{textAlign:"center",padding:32,color:c.textLight,fontSize:13}}>Loading…</td></tr>}
                {!txLoad&&txList.length===0&&<tr><td colSpan={6} style={{textAlign:"center",padding:32,color:c.textLight,fontSize:13}}>No transactions found.</td></tr>}
                {!txLoad&&txList.map((t:any)=>(
                  <tr key={t.id}>
                    <td className="kAdate">{t.date??'—'}</td>
                    <td><div style={{fontWeight:500,fontSize:12.5}}>{t.member}</div><div className="kAdate">ID {t.mid}</div></td>
                    <td>{txBadge(t.type)}</td>
                    <td style={{fontSize:12,color:c.textLight,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.desc??'—'}</td>
                    <td style={{textAlign:"right",paddingRight:12,whiteSpace:"nowrap"}}>
                      <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:13,fontWeight:700,
                        color:t.type==="WITHDRAWAL"||t.type==="WITHDRAW"?"#c94040":t.type==="DIVIDEND"?"#c9a028":c.accent}}>
                        {t.type==="WITHDRAWAL"||t.type==="WITHDRAW"?"−":"+"}RM {Number(t.amount||0).toLocaleString("en-MY",{minimumFractionDigits:2,maximumFractionDigits:2})}
                      </span>
                    </td>
                    <td style={{paddingRight:12,textAlign:"center"}}>
                      <button title="Report this transaction" onClick={()=>{setModal("notify");setMdata({ticketType:"transaction",referenceId:t.id,defaultTitle:`Suspicious transaction #${t.id} — ${t.member} ${t.type} RM${Number(t.amount||0).toFixed(2)}`});}}
                        style={{background:"#fff3cd",border:"1px solid #ffc107",color:"#856404",borderRadius:6,padding:"3px 7px",fontSize:12,cursor:"pointer",fontWeight:700}}>⚠</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages>1&&(
              <div style={{padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderTop:`1px solid ${c.divider}`}}>
                <button onClick={()=>setTxPage(p=>Math.max(1,p-1))} disabled={txPage===1}
                  style={{padding:"7px 16px",borderRadius:8,border:`1px solid ${c.cardBorder}`,background:txPage===1?c.statBg:c.accent,color:txPage===1?c.textLight:c.accentText,fontSize:12,fontWeight:600,cursor:txPage===1?"default":"pointer",opacity:txPage===1?0.5:1,fontFamily:"Outfit,sans-serif"}}>← Prev</button>
                <div style={{display:"flex",gap:6}}>
                  {Array.from({length:totalPages},(_,i)=>i+1)
                    .filter(p=>p===1||p===totalPages||Math.abs(p-txPage)<=1)
                    .reduce((acc:any[],p,i,arr)=>{if(i>0&&p-arr[i-1]>1)acc.push("...");acc.push(p);return acc;},[])
                    .map((p,i)=>p==="..."
                      ?<span key={`e${i}`} style={{padding:"6px 4px",fontSize:12,color:c.textLight}}>…</span>
                      :<button key={p} onClick={()=>setTxPage(p)} style={{width:32,height:32,borderRadius:8,border:"1px solid",fontSize:12,fontWeight:600,cursor:"pointer",background:txPage===p?c.accent:"transparent",color:txPage===p?c.accentText:c.textMid,borderColor:txPage===p?c.accent:c.cardBorder}}>{p}</button>
                    )}
                </div>
                <button onClick={()=>setTxPage(p=>Math.min(totalPages,p+1))} disabled={txPage===totalPages}
                  style={{padding:"7px 16px",borderRadius:8,border:`1px solid ${c.cardBorder}`,background:txPage===totalPages?c.statBg:c.accent,color:txPage===totalPages?c.textLight:c.accentText,fontSize:12,fontWeight:600,cursor:txPage===totalPages?"default":"pointer",opacity:txPage===totalPages?0.5:1,fontFamily:"Outfit,sans-serif"}}>Next →</button>
              </div>
            )}
          </div>

        </div>
      </>
    );
  };

  const AnnAttachment = ({url,name,ext}:{url:string|null;name:string|null;ext?:string|null}) => {
    if (!url) return null;
    const finalUrl = base() + url;
    const finalExt = (ext || (name||"").split(".").pop() || url.split(".").pop())?.toLowerCase()?.split('?')[0] || "";
    const isImg = ["jpg","jpeg","png","gif","webp"].includes(finalExt);
    const isPdf = finalExt==="pdf";
    if (isImg) return <img src={finalUrl} alt={name||"attachment"} onClick={()=>setLightbox(finalUrl)} style={{marginTop:10,maxWidth:"100%",maxHeight:400,borderRadius:8,display:"block",border:`1px solid ${c.cardBorder}`,cursor:"zoom-in"}}/>;
    if (isPdf) return <embed src={finalUrl} type="application/pdf" style={{marginTop:10,width:"100%",height:480,borderRadius:8,border:`1px solid ${c.cardBorder}`}}/>;
    return <a href={finalUrl} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:5,marginTop:8,fontSize:12,color:c.accent,textDecoration:"none",fontWeight:600}}>📎 {name||"Download Attachment"}</a>;
  };

  /* PageAnnouncements, PageDividend, PageTabung, PageSettings — all identical to your original */
  const PageAnnouncements = () => (
    <>
      <Topbar title="Announcements"/>
      <div className="kAcont">
        {(data?.announcements??[]).length===0&&<div style={{textAlign:"center",padding:40,color:c.textLight,fontSize:13}}>No announcements. Create one above.</div>}
        {(data?.announcements??[]).map(ann=>(
          <div key={ann.id} className="kApend kAf1" style={{borderLeft:`3px solid ${ann.is_active?c.accent:"#666"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <span className={`kAbadge ${ann.is_active?"bb-app":"bb-rej"}`}>{ann.is_active?"Published":"Draft"}</span>
                  <span className="kAdate">{ann.published_at??"—"}</span>
                </div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:c.sectionTitle,marginBottom:6}}>{ann.title}</div>
                <div style={{fontSize:12.5,color:c.textMid,lineHeight:1.7}}>{ann.content}</div>
                <AnnAttachment url={ann.attachment_url} name={ann.attachment_name} ext={(ann as any).attachment_ext}/>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button className="kAbtn kAbtn-o" style={{fontSize:11,padding:"4px 10px"}} onClick={()=>doAction(`/admin/announcements/${ann.id}/toggle`,{})}>{ann.is_active?"Archive":"Publish"}</button>
                <button className="kAbtn kAbtn-red" style={{fontSize:11,padding:"4px 10px"}} onClick={()=>doAction(`/admin/announcements/${ann.id}`,{},"DELETE")}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const PageDividend = React.memo(({ kpi, dividendHistory, c, onCalculate, onDelete }:{
    kpi:any; dividendHistory:any[]; c:any;
    onCalculate:(year:number,pct:number)=>Promise<void>;
    onDelete:(year:number)=>Promise<void>;
  }) => {
    const [localYear, setLocalYear] = React.useState(String(kpi?.fy || new Date().getFullYear()));
    const [localPct,  setLocalPct]  = React.useState(String(kpi?.latest_rate || 10));
    const [divFile,      setDivFile]      = React.useState<File|null>(null);
    const [divUploading, setDivUploading] = React.useState(false);
    const [divResult,    setDivResult]    = React.useState<any|null>(null);
    const [divUndoing,   setDivUndoing]   = React.useState(false);
    const divFileRef = React.useRef<HTMLInputElement>(null);
    const handleUploadDiv = async () => {
      if (!divFile) return;
      setDivUploading(true); setDivResult(null);
      const res = await upload("/admin/upload/dividend", divFile);
      setDivResult(res); setDivUploading(false);
      if (res.inserted_ids?.length) { setDivFile(null); if(divFileRef.current) divFileRef.current.value=""; reload(); }
    };
    const handleUndoDiv = async () => {
      if (!divResult?.inserted_ids?.length || !confirm("Undo this upload? All inserted dividend records will be deleted.")) return;
      setDivUndoing(true);
      const res = await post("/admin/upload/dividend/undo", { inserted_ids: divResult.inserted_ids });
      showToast(res.message || "Undone", true); setDivResult(null); setDivUndoing(false); reload();
    };
    return (
      <>
        <Topbar title="Dividend Manager"/>
        <div className="kAcont">
          <div className="kAtcard kAf1" style={{marginBottom:20}}>
            <div className="kAtchdr"><div><div className="kAtctitle">Set Dividend Rate</div><div className="kAtcsub">Calculate for all shareholders</div></div></div>
            <div className="kAg-2col" style={{padding:"20px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,alignItems:"end"}}>
              <div>
                <div className="kAalert kAalert-g" style={{marginBottom:18}}>
                  <span>ℹ️</span>
                  <span>Last calculated: FY {kpi?.latest_rate_year??'—'} at <strong>{kpi?.latest_rate??0}%</strong> rate<br/>
                  <span style={{fontSize:11,opacity:0.8}}>Formula: Account balance (≤30 Jun) + Tabung Komitmen × rate%</span></span>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{flex:1}}>
                    <label className="kAflbl">Financial Year</label>
                    <input className="kAfinput" type="number"
                      value={localYear}
                      onChange={e => setLocalYear(e.target.value)}/>
                  </div>
                  <div style={{flex:1}}>
                    <label className="kAflbl">Dividend Rate (%)</label>
                    <input className="kAfinput" type="number" step="0.01"
                      value={localPct}
                      onChange={e => setLocalPct(e.target.value)}/>
                  </div>
                </div>
              </div>
              <div>
                <button className="kAbtn kAbtn-gold" style={{width:"100%",justifyContent:"center",padding:"13px"}}
                  onClick={() => onCalculate(Number(localYear), Number(localPct))}>
                  ⚡ Calculate All Dividends
                </button>
              </div>
            </div>
          </div>
          <div className="kAtcard kAf1" style={{marginBottom:20}}>
            <div className="kAtchdr"><div><div className="kAtctitle">Upload Dividend CSV</div><div className="kAtcsub">Columns: user_id, year, rate, amount</div></div></div>
            <div style={{padding:20}}>
              <div className="kAalert kAalert-g" style={{marginBottom:16}}>
                <span>📋</span>
                <span>Upload your Excel directly (.xlsx) or as .csv. Row 1 = header: <strong>user_id, year, rate, amount</strong><br/>
                <span style={{fontSize:11,opacity:0.8}}>Duplicate entries (same user + year) are skipped automatically.</span></span>
              </div>
              <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
                <input ref={divFileRef} type="file" accept=".xlsx,.xls,.csv"
                  onChange={e=>setDivFile(e.target.files?.[0]||null)}
                  style={{flex:1,minWidth:200,padding:"8px 10px",border:`1px solid ${c.divider}`,borderRadius:7,background:c.cardBg,color:c.text,fontSize:12,fontFamily:"Outfit,sans-serif"}}/>
                <button className="kAbtn kAbtn-gold" style={{padding:"9px 20px",whiteSpace:"nowrap"}}
                  onClick={handleUploadDiv} disabled={!divFile||divUploading}>
                  📤 {divUploading?"Uploading…":"Upload"}
                </button>
              </div>
              {divResult && (
                <div style={{marginTop:14,padding:"10px 14px",borderRadius:7,background:divResult.errors?.length?"#fdecea":"#e8f5e4",border:`1px solid ${divResult.errors?.length?"#f0b0b0":"#c5d6c3"}`}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
                    <div style={{fontSize:12,fontWeight:600,color:divResult.errors?.length?"#c94040":"#2d6a2d"}}>{divResult.message}</div>
                    {divResult.inserted_ids?.length>0 && (
                      <button onClick={handleUndoDiv} disabled={divUndoing}
                        style={{padding:"5px 14px",borderRadius:6,border:"1px solid #f0b0b0",background:"#fdecea",color:"#c94040",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
                        ↩ {divUndoing?"Undoing…":"Undo Upload"}
                      </button>
                    )}
                  </div>
                  {divResult.errors?.map((e:string,i:number)=>(
                    <div key={i} style={{fontSize:11,color:"#c94040",fontFamily:"JetBrains Mono,monospace",marginTop:4}}>⚠ {e}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="kAtcard kAf2">
            <div className="kAtchdr"><div><div className="kAtctitle">Dividend History</div><div className="kAtcsub">{dividendHistory.length} announcements</div></div></div>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:c.tableHead}}>{["FY","Rate","Date","Actions"].map(h=>(<th key={h} style={{padding:"9px 16px",fontSize:10,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",color:c.textLight,textAlign:"left",borderBottom:`1px solid ${c.divider}`}}>{h}</th>))}</tr></thead>
              <tbody>
                {dividendHistory.map(d=>(<tr key={d.year} style={{borderBottom:`1px solid ${c.tableBorder}`}}>
                  <td style={{padding:"12px 16px",fontFamily:"JetBrains Mono,monospace",fontSize:13,fontWeight:700,color:c.text}}>FY {d.year}</td>
                  <td style={{padding:"12px 16px"}}><span style={{background:"#fef3e2",color:"#c9a028",border:"1px solid #f0d080",padding:"3px 12px",borderRadius:20,fontSize:12,fontWeight:700,fontFamily:"JetBrains Mono,monospace"}}>{d.rate}%</span></td>
                  <td style={{padding:"12px 16px",fontSize:12,color:c.textLight,fontFamily:"JetBrains Mono,monospace"}}>{d.calculated_at}</td>
                  <td style={{padding:"12px 16px"}}><button onClick={()=>onDelete(d.year)} style={{padding:"5px 12px",borderRadius:6,border:"1px solid #f0b0b0",background:"#fdecea",color:"#c94040",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>🗑 Delete</button></td>
                </tr>))}
                {dividendHistory.length===0&&(<tr><td colSpan={4} style={{textAlign:"center",padding:32,color:c.textLight,fontSize:12}}>No dividend records yet.</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  });

  const PageTabung = () => {
    const [addAmt,setAddAmt]=React.useState("");const [notes,setNotes]=React.useState("");const [ldr,setLdr]=React.useState(false);
    const handleSet=async()=>{if(!addAmt||Number(addAmt)<=0){showToast("Please enter a valid amount",false);return;}if(!confirm(`Add RM ${Number(addAmt).toFixed(2)} to ALL shareholders' Tabung Komitmen?`))return;setLdr(true);const res=await post("/admin/tabung/set",{amount:Number(addAmt),notes});showToast(res.message||"Tabung updated",true);setAddAmt("");setNotes("");setLdr(false);reload();};
    const [tabFile,setTabFile]=React.useState<File|null>(null);const [tabUploading,setTabUploading]=React.useState(false);const [tabResult,setTabResult]=React.useState<any|null>(null);const [tabUndoing,setTabUndoing]=React.useState(false);const tabFileRef=React.useRef<HTMLInputElement>(null);
    const handleUploadTab=async()=>{if(!tabFile)return;setTabUploading(true);setTabResult(null);const res=await upload("/admin/upload/tabung",tabFile);setTabResult(res);setTabUploading(false);if(res.undo_data?.length){setTabFile(null);if(tabFileRef.current)tabFileRef.current.value="";reload();}};
    const handleUndoTab=async()=>{if(!tabResult?.undo_data?.length||!confirm("Undo this upload? Previous Tabung values will be restored."))return;setTabUndoing(true);const res=await post("/admin/upload/tabung/undo",{undo_data:tabResult.undo_data});showToast(res.message||"Undone",true);setTabResult(null);setTabUndoing(false);reload();};
    const ac=kpi?.total_approved??activeCount;const tot=kpi?.total_tabung??0;
    return (
      <>
        <Topbar title="Tabung Komitmen"/>
        <div className="kAcont">
          <div className="kAtcard kAf1" style={{marginBottom:20}}>
            <div className="kAtchdr"><div><div className="kAtctitle">Add Tabung Komitmen</div><div className="kAtcsub">Applies to all approved shareholders</div></div></div>
            <div style={{padding:20}}>
              <div style={{background:"#e8f5e4",border:"1px solid #c5d6c3",borderRadius:8,padding:"12px 14px",marginBottom:18,display:"flex",gap:24}}><div><div style={{fontSize:10,color:"#7a9a7a",fontFamily:"JetBrains Mono,monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Active Shareholders</div><div style={{fontSize:20,fontWeight:700,color:"#2d6a2d",fontFamily:"JetBrains Mono,monospace"}}>{ac}</div></div><div><div style={{fontSize:10,color:"#7a9a7a",fontFamily:"JetBrains Mono,monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Total Tabung</div><div style={{fontSize:20,fontWeight:700,color:"#2d6a2d",fontFamily:"JetBrains Mono,monospace"}}>RM {tot.toFixed(2)}</div></div></div>
              <div className="kAg-tabung" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:12,alignItems:"end"}}>
                <div><label className="kAflbl">Amount per Shareholder (RM)</label><input className="kAfinput" type="number" step="0.01" min="0" placeholder="e.g. 100.00" value={addAmt} onChange={e=>setAddAmt(e.target.value)}/>{addAmt&&Number(addAmt)>0&&(<div style={{marginTop:5,fontSize:11,color:"#2d6a2d",fontFamily:"JetBrains Mono,monospace"}}>New pool: RM {(tot+Number(addAmt)*ac).toFixed(2)}</div>)}</div>
                <div><label className="kAflbl">Notes (Board Decision)</label><input className="kAfinput" placeholder="e.g. Board meeting Apr 2026" value={notes} onChange={e=>setNotes(e.target.value)}/></div>
                <div style={{paddingBottom:2}}><button className="kAbtn kAbtn-g" style={{width:"100%",justifyContent:"center",padding:11}} onClick={handleSet} disabled={ldr}>🌿 {ldr?"Updating…":`Add to All ${ac} Shareholders`}</button></div>
              </div>
            </div>
          </div>
          <div className="kAtcard kAf1" style={{marginBottom:20}}>
            <div className="kAtchdr"><div><div className="kAtctitle">Upload Tabung CSV</div><div className="kAtcsub">Columns: user_id, amount</div></div></div>
            <div style={{padding:20}}>
              <div className="kAalert kAalert-g" style={{marginBottom:16}}>
                <span>📋</span>
                <span>Upload your Excel directly (.xlsx) or as .csv. Row 1 = header: <strong>user_id, amount</strong><br/>
                <span style={{fontSize:11,opacity:0.8}}>Adds the amount in the file to each shareholder's current Tabung (e.g. previous RM 200 + uploaded RM 100 = RM 300).</span></span>
              </div>
              <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
                <input ref={tabFileRef} type="file" accept=".xlsx,.xls,.csv"
                  onChange={e=>setTabFile(e.target.files?.[0]||null)}
                  style={{flex:1,minWidth:200,padding:"8px 10px",border:`1px solid ${c.divider}`,borderRadius:7,background:c.cardBg,color:c.text,fontSize:12,fontFamily:"Outfit,sans-serif"}}/>
                <button className="kAbtn kAbtn-g" style={{padding:"9px 20px",whiteSpace:"nowrap"}}
                  onClick={handleUploadTab} disabled={!tabFile||tabUploading}>
                  📤 {tabUploading?"Uploading…":"Upload"}
                </button>
              </div>
              {tabResult && (
                <div style={{marginTop:14,padding:"10px 14px",borderRadius:7,background:tabResult.errors?.length?"#fdecea":"#e8f5e4",border:`1px solid ${tabResult.errors?.length?"#f0b0b0":"#c5d6c3"}`}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
                    <div style={{fontSize:12,fontWeight:600,color:tabResult.errors?.length?"#c94040":"#2d6a2d"}}>{tabResult.message}</div>
                    {tabResult.undo_data?.length>0 && (
                      <button onClick={handleUndoTab} disabled={tabUndoing}
                        style={{padding:"5px 14px",borderRadius:6,border:"1px solid #f0b0b0",background:"#fdecea",color:"#c94040",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
                        ↩ {tabUndoing?"Undoing…":"Undo Upload"}
                      </button>
                    )}
                  </div>
                  {tabResult.errors?.map((e:string,i:number)=>(
                    <div key={i} style={{fontSize:11,color:"#c94040",fontFamily:"JetBrains Mono,monospace",marginTop:4}}>⚠ {e}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="kAtcard kAf2">
            <div className="kAtchdr"><div><div className="kAtctitle">Tabung History</div><div className="kAtcsub">{(data?.tabung_history??[]).length} announcements</div></div></div>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:c.tableHead}}>{["Amount per Shareholder","Notes","Date","Actions"].map(h=>(<th key={h} style={{padding:"9px 16px",fontSize:10,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",color:c.textLight,textAlign:"left",borderBottom:`1px solid ${c.divider}`}}>{h}</th>))}</tr></thead>
              <tbody>
                {(data?.tabung_history??[]).map((t,i)=>(<tr key={i} style={{borderBottom:`1px solid ${c.tableBorder}`}}><td style={{padding:"11px 16px",fontFamily:"JetBrains Mono,monospace",fontSize:13,fontWeight:700,color:c.accent}}>RM {t.amount.toFixed(2)}</td><td style={{padding:"11px 16px",fontSize:12,color:c.textLight,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.notes??'—'}</td><td style={{padding:"11px 16px",fontSize:12,color:c.textLight,fontFamily:"JetBrains Mono,monospace",whiteSpace:"nowrap"}}>{t.date}</td><td style={{padding:"11px 16px"}}><button onClick={async()=>{if(!confirm("Delete this tabung announcement for all members?"))return;await post("/admin/tabung/delete",{notes:t.notes,effective_date:t.raw_date});reload();}} style={{padding:"5px 12px",borderRadius:6,border:"1px solid #f0b0b0",background:"#fdecea",color:"#c94040",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>🗑 Delete</button></td></tr>))}
                {(data?.tabung_history??[]).length===0&&(<tr><td colSpan={4} style={{textAlign:"center",padding:24,color:c.textLight,fontSize:12}}>No tabung records yet.</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  /* ══ PAGE: NOTIFICATIONS (Staff Messages) ════════════════════════
     Admin can see all notification threads with staff replies,
     and reply back to staff directly from here.
  ════════════════════════════════════════════════════════════════ */
  const PageNotifications = () => {
    const threads = data?.notif_threads ?? [];
    const [replyText,  setReplyText]  = React.useState<Record<number,string>>({});
    const [sending,    setSending]    = React.useState<Record<number,boolean>>({});
    const [collapsed,  setCollapsed]  = React.useState<Record<number,boolean>>({});
    const [showClosed, setShowClosed] = React.useState(false);

    const open   = threads.filter((n:any) => (n.status ?? 'open') === 'open');
    const closed = threads.filter((n:any) => (n.status ?? 'open') === 'closed');

    const sendReply = async (id:number) => {
      const msg = (replyText[id] || "").trim();
      if (!msg) return;
      setSending(s => ({...s, [id]: true}));
      await doAction(`/admin/notifications/${id}/reply`, { message: msg });
      setReplyText(t => ({...t, [id]: ""}));
      setSending(s => ({...s, [id]: false}));
    };

    return (
      <>
        <Topbar title="Tickets & Cases"/>
        <div className="kAcont">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
            <div style={{fontSize:12,color:c.textLight}}><b style={{color:c.text}}>{open.length}</b> open · <b style={{color:c.textLight}}>{closed.length}</b> closed</div>
            <button onClick={()=>setShowClosed(v=>!v)} style={{fontSize:11,padding:"5px 12px",borderRadius:8,border:`1px solid ${c.cardBorder}`,background:c.statBg,color:c.textMid,cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>
              {showClosed?"Hide Closed Cases":"Show Closed Cases"}
            </button>
          </div>
          {open.length===0 && <div style={{background:c.cardBg,border:`1px solid ${c.cardBorder}`,borderRadius:12,padding:40,textAlign:"center",color:c.textLight,fontSize:13,marginBottom:12}}>🎉 No open cases. All clear.</div>}
          {open.map((n:any)=><AdminTicketCard key={n.id} n={n} isClosed={false} collapsed={collapsed} c={c} replyText={replyText} sending={sending} onToggleCollapse={id=>setCollapsed(s=>({...s,[id]:!collapsed[id]}))} onReplyChange={(id,val)=>setReplyText(t=>({...t,[id]:val}))} onSendReply={sendReply} onClose={id=>doAction(`/admin/notifications/${id}/close`,{})} onReopen={id=>doAction(`/admin/notifications/${id}/reopen`,{})}/>)}
          {showClosed && closed.length > 0 && (<>
            <div style={{fontSize:11,fontWeight:700,color:c.textLight,fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase",padding:"8px 2px",marginTop:8}}>Closed Cases</div>
            {closed.map((n:any)=><AdminTicketCard key={n.id} n={n} isClosed={true} collapsed={collapsed} c={c} replyText={replyText} sending={sending} onToggleCollapse={id=>setCollapsed(s=>({...s,[id]:!collapsed[id]}))} onReplyChange={(id,val)=>setReplyText(t=>({...t,[id]:val}))} onSendReply={sendReply} onClose={id=>doAction(`/admin/notifications/${id}/close`,{})} onReopen={id=>doAction(`/admin/notifications/${id}/reopen`,{})}/>)}
          </>)}
          {threads.length===0 && <div style={{background:c.cardBg,border:`1px solid ${c.cardBorder}`,borderRadius:12,padding:48,textAlign:"center",color:c.textLight,fontSize:13}}>No tickets yet. Use the ⚠ button on transactions or shareholders to raise a case.</div>}
        </div>
      </>
    );
  };

  const PageSettings = () => (
    <>
      <Topbar title="Settings"/>
      <div className="kAcont">
        <div style={{maxWidth:480}}>
          <div className="kAtcard kAf1">
            <div className="kAtchdr"><div><div className="kAtctitle">Dashboard Theme</div><div className="kAtcsub">Choose your preferred colour scheme</div></div></div>
            <div style={{padding:"20px",display:"flex",flexDirection:"column",gap:12}}>
              {[
                {id:"green" as Theme,label:"KSS Green & White",sub:"Official Koperasi Sabah Softwoods colours",sw:["#2d6a2d","#ffffff","#c9a028"],bdr:"#c5d6c3"},
                {id:"dark"  as Theme,label:"Black & Gold",      sub:"Dark theme with gold accents",            sw:["#0a0a0a","#111111","#c9a028"],bdr:"#333"},
              ].map(({id,label,sub,sw,bdr})=>(
                <div key={id} style={{padding:"16px 18px",background:theme===id?c.statBg:c.cardBg,border:`2px solid ${theme===id?c.accent:c.cardBorder}`,borderRadius:12,cursor:"pointer",transition:"all 0.2s"}} onClick={()=>switchTheme(id)}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{display:"flex",gap:6}}>{sw.map((s,i)=>(<div key={i} style={{width:20,height:20,borderRadius:5,background:s,border:`1px solid ${bdr}`}}/>))}</div>
                      <div><div style={{fontWeight:600,fontSize:13,color:c.text}}>{label}</div><div style={{fontSize:11,color:c.textLight}}>{sub}</div></div>
                    </div>
                    {theme===id&&<span style={{fontSize:18,color:c.accent}}>✓</span>}
                  </div>
                </div>
              ))}
              <div style={{fontSize:11.5,color:c.textLight,textAlign:"center",marginTop:4}}>Saved automatically in browser.</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  /* ── AGM Attendance page ─────────────────────────────────────── */
  type AgmMeeting = { id:number; title:string; scheduled_at:string|null; location:string|null; notes:string|null; qr_token:string; is_active:boolean; attendance_count:number; created_at:string|null; };
  type AgmAttendee = { id:number; user_id:number; shareholder_id:string; name:string; email:string; scanned_at:string|null; method:string; };
  type MemberHit   = { id:number; name:string; shareholder_id:string; role:string; is_attending:boolean; };

  const PageAGM = () => {
    const [meetings, setMeetings] = useState<AgmMeeting[]>([]);
    const [selected, setSelected] = useState<AgmMeeting|null>(null);
    const [attendees, setAttendees] = useState<AgmAttendee[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({title:"", scheduled_at:"", location:"", notes:""});
    const [loading, setLoading] = useState(false);
    const [manualQ, setManualQ]           = useState("");
    const [manualHits, setManualHits]     = useState<MemberHit[]>([]);
    const [manualPick, setManualPick]     = useState<MemberHit|null>(null);
    const [manualBusy, setManualBusy]     = useState(false);

    const loadMeetings = useCallback(async () => {
      const r = await fetch(base() + "/admin/agm/list", {credentials:"include", headers:{Accept:"application/json"}});
      const d = await r.json();
      setMeetings(d.meetings || []);
    }, []);

    const loadAttendance = useCallback(async (id:number) => {
      const r = await fetch(base() + `/admin/agm/${id}/attendance`, {credentials:"include", headers:{Accept:"application/json"}});
      const d = await r.json();
      setAttendees(d.attendances || []);
      setSelected(prev => prev ? {...prev, attendance_count: d.total} : prev);
    }, []);

    useEffect(() => { loadMeetings(); }, [loadMeetings]);

    /* Live polling when a meeting is selected */
    useEffect(() => {
      if (!selected) return;
      loadAttendance(selected.id);
      const t = setInterval(() => loadAttendance(selected.id), 4000);
      return () => clearInterval(t);
    }, [selected?.id, loadAttendance]);

    const submitCreate = async () => {
      if (!form.title.trim() || !form.scheduled_at) { showToast("Title and date required",false); return; }
      setLoading(true);
      try {
        const r = await post("/admin/agm/create", form);
        if (r.message) showToast(r.message, true);
        setShowCreate(false);
        setForm({title:"", scheduled_at:"", location:"", notes:""});
        loadMeetings();
      } finally { setLoading(false); }
    };

    const toggleMeeting = async (m:AgmMeeting) => {
      const r = await post(`/admin/agm/${m.id}/toggle`, {});
      showToast(r.message, true);
      loadMeetings();
      if (selected?.id === m.id) setSelected({...selected, is_active: !selected.is_active});
    };

    const deleteMeeting = async (m:AgmMeeting) => {
      if (!confirm(`Delete meeting "${m.title}"? All attendance records will be lost.`)) return;
      await post(`/admin/agm/${m.id}`, {}, "DELETE");
      showToast("Meeting deleted", true);
      if (selected?.id === m.id) { setSelected(null); setAttendees([]); }
      loadMeetings();
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
        const r = await post(`/admin/agm/${selected.id}/manual-attend`, {user_id: manualPick.id});
        showToast(r.message, !r.already_marked);
        setManualPick(null); setManualQ(""); setManualHits([]);
        loadAttendance(selected.id);
      } finally { setManualBusy(false); }
    };

    const removeAttendance = async (a: AgmAttendee) => {
      if (!selected) return;
      if (!confirm(`Remove attendance for ${a.name}?`)) return;
      await post(`/admin/agm/${selected.id}/attendance/${a.id}`, {}, "DELETE");
      showToast(`${a.name} removed from attendance.`, false);
      loadAttendance(selected.id);
    };

    const attendUrl = selected ? `${base()}/attend/${selected.qr_token}` : "";

    return (
      <>
        <Topbar title="AGM Attendance"/>
        <div className="kAcont">
          {!selected ? (
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div>
                  <div style={{fontSize:14,color:c.text,fontWeight:600}}>AGM Meetings</div>
                  <div style={{fontSize:12,color:c.textLight,marginTop:2}}>Create a meeting, project the QR code, shareholders scan to mark attendance.</div>
                </div>
                <button className="kAbtn kAbtn-g" onClick={()=>setShowCreate(true)}>+ New Meeting</button>
              </div>

              {showCreate && (
                <div className="kAtcard kAf1" style={{marginBottom:18,padding:20}}>
                  <div style={{fontSize:13,fontWeight:700,color:c.text,marginBottom:14}}>New AGM Meeting</div>
                  <div className="kAg-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                    <div style={{gridColumn:"1 / span 2"}}>
                      <label className="kAflbl">Title *</label>
                      <input className="kAfip" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="AGM Tahunan KOP-SSB 2026"/>
                    </div>
                    <div>
                      <label className="kAflbl">Date & Time *</label>
                      <input type="datetime-local" className="kAfip" value={form.scheduled_at} onChange={e=>setForm({...form,scheduled_at:e.target.value})}/>
                    </div>
                    <div>
                      <label className="kAflbl">Location</label>
                      <input className="kAfip" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Dewan Koperasi"/>
                    </div>
                    <div style={{gridColumn:"1 / span 2"}}>
                      <label className="kAflbl">Notes</label>
                      <textarea className="kAfip" rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,marginTop:14,justifyContent:"flex-end"}}>
                    <button className="kAbtn kAbtn-o" onClick={()=>setShowCreate(false)}>Cancel</button>
                    <button className="kAbtn kAbtn-g" onClick={submitCreate} disabled={loading}>{loading?"Creating…":"Create Meeting"}</button>
                  </div>
                </div>
              )}

              <div className="kAtcard kAf1">
                <table className="kAtbl">
                  <thead><tr><th>Title</th><th>Scheduled</th><th>Location</th><th>Attendance</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {meetings.length===0 ? (
                      <tr><td colSpan={6} style={{textAlign:"center",padding:20,color:c.textLight}}>No meetings yet. Create one to get started.</td></tr>
                    ) : meetings.map(m => (
                      <tr key={m.id}>
                        <td style={{fontWeight:600,color:c.text}}>{m.title}</td>
                        <td style={{fontSize:12}}>{m.scheduled_at}</td>
                        <td style={{fontSize:12,color:c.textMid}}>{m.location || "—"}</td>
                        <td><span className="chip-g">{m.attendance_count} scanned</span></td>
                        <td>{m.is_active ? <span className="chip-g">Active</span> : <span style={{padding:"3px 8px",borderRadius:12,background:"#eee",fontSize:11,color:"#666"}}>Closed</span>}</td>
                        <td>
                          <button className="kAbtn kAbtn-o" style={{padding:"4px 10px",fontSize:11,marginRight:6}} onClick={()=>setSelected(m)}>📋 View</button>
                          <button className="kAbtn kAbtn-o" style={{padding:"4px 10px",fontSize:11,marginRight:6}} onClick={()=>toggleMeeting(m)}>{m.is_active?"Close":"Reopen"}</button>
                          <button style={{padding:"4px 10px",fontSize:11,background:"#fff",border:"1px solid #c94040",color:"#c94040",borderRadius:6,cursor:"pointer"}} onClick={()=>deleteMeeting(m)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <button className="kAbtn kAbtn-o" style={{marginBottom:14}} onClick={()=>{setSelected(null);setAttendees([]);}}>← Back to Meetings</button>

              <div className="kAg-agm" style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:16,alignItems:"start"}}>
                {/* QR + meeting info */}
                <div className="kAtcard kAf1" style={{padding:20,textAlign:"center"}}>
                  <div style={{fontSize:13,fontWeight:700,color:c.text,marginBottom:4}}>{selected.title}</div>
                  <div style={{fontSize:11,color:c.textLight,marginBottom:14}}>📅 {selected.scheduled_at}{selected.location?` · 📍 ${selected.location}`:""}</div>
                  <div style={{background:"#fff",padding:10,borderRadius:10,border:`2px solid ${c.accent}`,display:"inline-block",marginBottom:10}}>
                    <QRCanvasAdmin value={attendUrl} size={240} dark="#1a4a1a"/>
                  </div>
                  <div style={{fontSize:10,color:c.textLight,fontFamily:"monospace",wordBreak:"break-all",marginBottom:8,padding:"6px 8px",background:c.statBg,borderRadius:6}}>{attendUrl}</div>
                  <div style={{fontSize:11,color:c.textMid,lineHeight:1.5}}>Project this QR. Shareholders scan from their phone — if logged in they're marked instantly; if not, they log in first.</div>
                  <a href={`${base()}/admin/agm/${selected.id}/export`} className="kAbtn kAbtn-gold" style={{display:"inline-block",marginTop:10,textDecoration:"none"}}>⬇ Export CSV</a>
                </div>

                {/* Live attendance list */}
                <div className="kAtcard kAf1">
                  <div className="kAtchdr">
                    <div>
                      <div className="kAtctitle">Live Attendance · {attendees.length}</div>
                      <div className="kAtcsub">Auto-refreshes every 4 seconds</div>
                    </div>
                    {selected.is_active ? <span className="chip-g">● Recording</span> : <span style={{padding:"3px 10px",borderRadius:12,background:"#eee",fontSize:11,color:"#666"}}>Closed</span>}
                  </div>
                  <table className="kAtbl">
                    <thead><tr><th>#</th><th>Shareholder ID</th><th>Name</th><th>Time</th><th>Method</th><th></th></tr></thead>
                    <tbody>
                      {attendees.length===0 ? (
                        <tr><td colSpan={6} style={{textAlign:"center",padding:24,color:c.textLight}}>No check-ins yet. Waiting for members to scan the QR…</td></tr>
                      ) : attendees.map((a,i) => (
                        <tr key={a.id}>
                          <td style={{fontSize:11,color:c.textLight}}>{i+1}</td>
                          <td style={{fontFamily:"monospace",fontSize:12,color:c.accent,fontWeight:600}}>{a.shareholder_id}</td>
                          <td style={{fontWeight:600,color:c.text}}>{a.name}</td>
                          <td style={{fontSize:12,color:c.textMid}}>{a.scanned_at}</td>
                          <td>
                            {a.method==="manual"
                              ? <span style={{fontSize:10,padding:"2px 7px",borderRadius:10,background:"#fff3cd",color:"#7a5000",border:"1px solid #f0c040",fontWeight:700}}>Manual</span>
                              : <span style={{fontSize:10,padding:"2px 7px",borderRadius:10,background:"#d4f4e0",color:"#1a5c1a",border:"1px solid #6fcf97",fontWeight:700}}>QR</span>
                            }
                          </td>
                          <td>
                            <button onClick={()=>removeAttendance(a)} style={{padding:"3px 8px",fontSize:11,background:"#fff",border:"1px solid #e0a0a0",color:"#c94040",borderRadius:6,cursor:"pointer"}}>✕ Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Manual Check-In Panel ── */}
              <div className="kAtcard kAf1" style={{marginTop:16,padding:20}}>
                <div style={{fontSize:13,fontWeight:700,color:c.text,marginBottom:2}}>✋ Manual Check-In</div>
                <div style={{fontSize:11,color:c.textLight,marginBottom:14}}>Backup for shareholders who cannot scan the QR — no internet, no phone, or elderly shareholders.</div>
                <div style={{display:"flex",gap:10,alignItems:"flex-start",flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:220,position:"relative"}}>
                    <input
                      className="kAfip"
                      placeholder="Search by name or shareholder ID…"
                      value={manualQ}
                      onChange={e=>searchManual(e.target.value)}
                      autoComplete="off"
                    />
                    {manualHits.length>0 && !manualPick && (
                      <div style={{position:"absolute",top:"calc(100% + 2px)",left:0,right:0,background:"#fff",border:"1px solid #c5d6c3",borderRadius:8,zIndex:20,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",maxHeight:240,overflowY:"auto"}}>
                        {manualHits.map(u=>(
                          <div key={u.id}
                            onClick={()=>{setManualPick(u);setManualQ(`${u.name} (${u.shareholder_id})`);setManualHits([]);}}
                            style={{padding:"9px 14px",cursor:"pointer",display:"flex",gap:8,alignItems:"center",borderBottom:"1px solid #f0f9ee"}}
                            onMouseOver={e=>(e.currentTarget.style.background="#f5faf4")}
                            onMouseOut={e=>(e.currentTarget.style.background="")}>
                            <div style={{flex:1,minWidth:0}}>
                              <span style={{fontWeight:600,color:c.text,fontSize:13}}>{u.name}</span>
                              <span style={{fontSize:11,color:c.textLight,fontFamily:"monospace",marginLeft:8}}>{u.shareholder_id}</span>
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
                  <button className="kAbtn kAbtn-g" onClick={doManual} disabled={!manualPick||manualBusy||manualPick?.is_attending} style={{minWidth:160,flexShrink:0}}>
                    {manualBusy?"Recording…":manualPick?.is_attending?"Already Attended":"✓ Record Attendance"}
                  </button>
                  {manualPick && (
                    <button className="kAbtn kAbtn-o" onClick={()=>{setManualPick(null);setManualQ("");setManualHits([]);}} style={{flexShrink:0}}>✕ Cancel</button>
                  )}
                </div>
                {manualPick && (
                  <div style={{marginTop:10,padding:"8px 14px",background:c.statBg,borderRadius:8,fontSize:12,color:c.text,display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:16}}>👤</span>
                    <span>Selected: <strong>{manualPick.name}</strong></span>
                    <span style={{fontFamily:"monospace",color:c.accent,fontSize:11}}>({manualPick.shareholder_id})</span>
                    {manualPick.is_attending && <span style={{fontSize:11,color:"#1a5c1a",fontWeight:600}}>— already marked attended</span>}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </>
    );
  };

  /* ── Financial Summary Report page ─────────────────────────── */
  const PageReports = () => {
    const curYear = new Date().getFullYear();
    const [year, setYear] = useState(curYear);
    const years = Array.from({length:5},(_,i)=>curYear-i);
    return (
      <>
        <Topbar title="Financial Summary"/>
        <div className="kAcont">
          <div className="kAcard" style={{marginBottom:16,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:c.text,marginBottom:4}}>Financial Year</div>
              <select value={year} onChange={e=>setYear(Number(e.target.value))} style={{background:c.statBg,border:`1px solid ${c.border}`,borderRadius:6,padding:"6px 12px",color:c.text,fontSize:13,fontFamily:"'Outfit',sans-serif"}}>
                {years.map(y=><option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <a href={`/admin/reports/financial-summary?year=${year}`} target="_blank" rel="noopener noreferrer"
              style={{display:"inline-flex",alignItems:"center",gap:8,padding:"9px 20px",background:c.accent,color:c.accentText,border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600,textDecoration:"none",marginTop:20}}>
              📊 Open / Print Report
            </a>
            <div style={{fontSize:12,color:c.sub,marginTop:20}}>Opens a printable report in a new tab. Use browser Print → Save as PDF.</div>
          </div>
          <div className="kAcard">
            <div style={{fontWeight:700,fontSize:14,marginBottom:8,color:c.text}}>About this Report</div>
            <ul style={{margin:0,paddingLeft:18,fontSize:13,color:c.sub,lineHeight:1.8}}>
              <li>KPI summary: total members, net share capital, dividends paid, Tabung Komitmen</li>
              <li>Per-member breakdown: deposit, withdrawal, net deposit, tabung, dividend</li>
              <li>A4 landscape format, print-ready with totals footer</li>
              <li>Data is live — generated at the moment you open the report</li>
            </ul>
          </div>
        </div>
      </>
    );
  };

  /* ── Audit Log page ─────────────────────────────────────────── */
  type AuditEntry = { id:number; action:string; subject_type:string|null; subject_id:number|null; properties:Record<string,any>|null; ip_address:string|null; causer:string; created_at:string; };

  const PageAuditLog = () => {
    const [logs, setLogs]       = useState<AuditEntry[]>([]);
    const [page, setPage]       = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal]     = useState(0);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<number|null>(null);

    const load = useCallback(async (pg:number) => {
      setLoading(true);
      try {
        const r = await fetch(base() + `/admin/reports/audit-log?page=${pg}`, {credentials:"include",headers:{Accept:"application/json"}});
        const d = await r.json();
        setLogs(d.logs || []);
        setTotal(d.total || 0);
        setLastPage(d.last_page || 1);
        setPage(pg);
      } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(1); }, [load]);

    const actionColor = (a:string) => {
      if (a.includes("approve")) return "#1a5c1a";
      if (a.includes("reject") || a.includes("delete")) return "#c94040";
      if (a.includes("dividend")) return "#c9a028";
      return c.accent;
    };

    return (
      <>
        <Topbar title="Audit Log"/>
        <div className="kAcont">
          <div className="kAcard" style={{marginBottom:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:14,color:c.text}}>{total} events recorded</div>
              <div style={{fontSize:12,color:c.sub}}>Page {page} of {lastPage}</div>
            </div>
            {loading ? (
              <div style={{textAlign:"center",padding:40,color:c.sub}}>Loading…</div>
            ) : logs.length === 0 ? (
              <div style={{textAlign:"center",padding:40,color:c.sub}}>No audit log entries yet.</div>
            ) : (
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr style={{background:c.statBg,borderBottom:`2px solid ${c.border}`}}>
                      <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:c.sub}}>Time</th>
                      <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:c.sub}}>Action</th>
                      <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:c.sub}}>By</th>
                      <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:c.sub}}>Subject</th>
                      <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:c.sub}}>IP</th>
                      <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:c.sub}}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(l=>(
                      <>
                        <tr key={l.id} style={{borderBottom:`1px solid ${c.border}`,cursor:l.properties?"pointer":"default"}} onClick={()=>l.properties&&setExpanded(expanded===l.id?null:l.id)}>
                          <td style={{padding:"8px 10px",color:c.sub,whiteSpace:"nowrap"}}>{l.created_at}</td>
                          <td style={{padding:"8px 10px"}}>
                            <span style={{background:actionColor(l.action)+"22",color:actionColor(l.action),borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:600}}>{l.action}</span>
                          </td>
                          <td style={{padding:"8px 10px",color:c.text}}>{l.causer}</td>
                          <td style={{padding:"8px 10px",color:c.sub,fontFamily:"monospace",fontSize:11}}>
                            {l.subject_type && <>{l.subject_type} #{l.subject_id}</>}
                          </td>
                          <td style={{padding:"8px 10px",color:c.sub,fontFamily:"monospace",fontSize:11}}>{l.ip_address}</td>
                          <td style={{padding:"8px 10px",color:c.accent,fontSize:11}}>{l.properties?"▼ show":""}</td>
                        </tr>
                        {expanded===l.id&&l.properties&&(
                          <tr key={`${l.id}-props`} style={{background:c.statBg}}>
                            <td colSpan={6} style={{padding:"8px 16px"}}>
                              <pre style={{margin:0,fontSize:11,color:c.text,whiteSpace:"pre-wrap",wordBreak:"break-all"}}>{JSON.stringify(l.properties,null,2)}</pre>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {lastPage > 1 && (
              <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:16}}>
                <button className="kAbtn" onClick={()=>load(page-1)} disabled={page<=1||loading} style={{padding:"6px 14px",fontSize:12}}>← Prev</button>
                <button className="kAbtn" onClick={()=>load(page+1)} disabled={page>=lastPage||loading} style={{padding:"6px 14px",fontSize:12}}>Next →</button>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <><style>{css}</style>
    <div className="kA">
      <Sidebar/>
      <div className="kAm">
        {ap==="dashboard"     && <PageDash/>}
        {ap==="approvals"     && <PageApprovals/>}
        {ap==="members"       && <PageMembers/>}
        {ap==="dividend"      && <PageDividend
          kpi={kpi}
          dividendHistory={data?.dividend_history??[]}
          c={c}
          onCalculate={async(year,pct)=>{
            const res = await post("/admin/dividend/set",{year,percentage:pct});
            showToast(res.message||"Dividend calculated",true);
            reload();
          }}
          onDelete={async(year)=>{
            if(!confirm(`Delete FY ${year} dividend?`)) return;
            await doAction(`/admin/dividend/${year}`,{},"DELETE");
            reload();
          }}
        />}
        {ap==="tabung"        && <PageTabung/>}
        {ap==="transactions"  && <PageTransactions/>}
        {ap==="announcements" && <PageAnnouncements/>}
        {ap==="notifications" && <PageNotifications/>}
        {ap==="agm"           && <PageAGM/>}
        {ap==="reports"       && <PageReports/>}
        {ap==="audit-log"     && <PageAuditLog/>}
        {ap==="settings"      && <PageSettings/>}
      </div>
    </div>
    {modal && (
      <AdminModal
        key={`${modal}-${mdata?.id||"new"}`}
        modal={modal}
        mdata={mdata}
        staffList={data?.staff_list??[]}
        colors={c}
        onClose={()=>{setModal("");setMdata(null);}}
        onAction={doAction}
      />
    )}
    {toast&&(
      <div style={{position:"fixed",bottom:24,right:24,background:toast.ok?c.accent:"#c94040",color:toast.ok?c.accentText:"#fff",padding:"12px 20px",borderRadius:10,fontSize:13,boxShadow:"0 8px 24px rgba(0,0,0,0.2)",zIndex:999,fontFamily:"'Outfit',sans-serif",maxWidth:360}}>
        {toast.ok?"✅":"❌"} {toast.msg}
      </div>
    )}
    {lightbox&&(
      <div onClick={()=>setLightbox(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out"}}>
        <img src={lightbox} style={{maxWidth:"92vw",maxHeight:"92vh",borderRadius:10,boxShadow:"0 8px 48px rgba(0,0,0,0.6)",objectFit:"contain"}} onClick={e=>e.stopPropagation()}/>
        <button onClick={()=>setLightbox(null)} style={{position:"absolute",top:18,right:22,background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:22,width:40,height:40,borderRadius:"50%",cursor:"pointer",lineHeight:1}}>✕</button>
      </div>
    )}
    </>
  );
}