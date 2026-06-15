import React, { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "../../lib/qrcode-react.js";
/* eslint-disable @typescript-eslint/no-explicit-any */

/* ── Types ── */
type Profile  = { id:number; member_id:string|number; name:string; email?:string; phone_number?:string|null; avatar?:string|null; startmembership:string|null; status:string; verificationUrl?:string; };
type Summary  = { currentAccount:number; totalDeposit:number; totalDividend:number; tabungKomitmen:number; yearlyDividendAmount:number; yearlyDividendRate:number; membershipMonths:number; };
type DivItem  = { year:number; rate:number; amount:number; };
type Ann      = { id:number; title:string; content:string; published_at:string|null; };
type Data     = { profile:Profile; summary:Summary; chartData:any[]; dividends:DivItem[]; transactions:any[]; announcements:Ann[]; tabungHistory:any[]; };

/* ── Helpers ── */
const fmt  = (n:number) => `RM ${Number(n||0).toLocaleString("en-MY",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtShort = (n:number) => `RM${Math.round(Number(n||0)).toLocaleString("en-MY")}`;
const base = () => ((window as any).AppBase ?? "") as string;
const getPage = () => {
  const p = window.location.pathname;
  if (p.includes("/announcements")) return "announcements";
  if (p.includes("/certificate"))   return "certificate";
  return "dashboard";
};
const getAuthRole = () => (window as any).AuthUser?.role ?? "shareholder";
const getBackPath  = (role:string) => role === "admin" ? "/admin" : role === "staff" ? "/staff" : null;
const getBackLabel = (role:string) => role === "admin" ? "← Admin" : role === "staff" ? "← Staff" : null;

/* ── Styles (light theme matching mockup) ── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#f4f7f4}::-webkit-scrollbar-thumb{background:#4a8c3f;border-radius:99px}
body{font-family:'Outfit',sans-serif;background:#ffffff;color:#1a2e1a}

html,body{background:#ffffff !important}
#shareholder-dashboard-root{background:#ffffff;min-height:100vh}
.IDwrap{max-width:1400px;margin:0 auto;padding:16px;display:flex;flex-direction:column;gap:16px;min-height:100vh;background:#ffffff}
@media(min-width:768px){.IDwrap{padding:28px}}

/* Topbar */
.IDtop{display:none}
@media(min-width:768px){
  .IDtop{display:flex;justify-content:space-between;align-items:center;background:#fff;border:1px solid #d4e8d0;border-radius:14px;padding:12px 22px;box-shadow:0 4px 16px rgba(45,106,45,0.08);gap:18px}
  .IDbrand{display:flex;align-items:center;gap:12px;font-weight:700;font-size:15px;color:#1a2e1a;min-width:0}
  .IDbrand .IDlogo{width:42px;height:42px;border-radius:10px;background:#fff;border:1px solid #d4e8d0;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
  .IDbrand .IDlogo img{width:100%;height:100%;object-fit:contain}
  .IDbrand-txt{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .IDnav{display:flex;gap:4px;flex:1;justify-content:center}
  .IDnav a{padding:8px 16px;border-radius:10px;font-size:13px;color:#5a7a5a;text-decoration:none;transition:all .15s;cursor:pointer;border:none;background:transparent;font-family:'Outfit',sans-serif}
  .IDnav a:hover{background:#f0f9ee;color:#2d6a2d}
  .IDnav a.act{background:#d4f4e0;color:#1a5c1a;font-weight:600}
  .IDuser{display:flex;align-items:center;gap:12px;flex-shrink:0}
  .IDuser .IDun{font-size:13px;font-weight:600;color:#1a2e1a;text-align:right}
  .IDuser .IDur{font-size:11px;color:#5a7a5a;text-align:right;font-family:'JetBrains Mono',monospace;letter-spacing:1px}
  .IDav-sm{width:40px;height:40px;border-radius:11px;background:linear-gradient(135deg,#2d6a2d 0%,#6fcf97 100%);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:13px;overflow:hidden;flex-shrink:0}
  .IDav-sm img{width:100%;height:100%;object-fit:cover}
  .IDlogout{padding:8px 14px;border-radius:10px;border:1px solid #e8c5c5;background:#fff;color:#a83a3a;font-size:12px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .15s}
  .IDlogout:hover{background:#fdecec;border-color:#c97070;color:#8a2828}
}
.IDlogout-mini{padding:9px 14px;border-radius:9px;border:1px solid #e8c5c5;background:#fff;color:#a83a3a;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:'Outfit',sans-serif;white-space:nowrap}
.IDlogout-mini:hover{background:#fdecec}

/* Mobile menu (compact) */
.IDmtop{display:flex;justify-content:space-between;align-items:center;background:#fff;border:1px solid #d4e8d0;border-radius:14px;padding:10px 14px;box-shadow:0 4px 16px rgba(45,106,45,0.08)}
.IDmtop .IDmlogo{width:36px;height:36px;border-radius:9px;background:#fff;border:1px solid #d4e8d0;overflow:hidden;display:flex;align-items:center;justify-content:center}
.IDmtop .IDmlogo img{width:100%;height:100%;object-fit:contain}
.IDmtop .IDmname{font-size:13px;font-weight:700;color:#1a2e1a;line-height:1.2}
.IDmtop .IDmid{font-size:10px;color:#5a7a5a;font-family:'JetBrains Mono',monospace;letter-spacing:1px;margin-top:2px}
.IDmnav{display:flex;gap:6px;background:#fff;border:1px solid #d4e8d0;border-radius:14px;padding:6px;box-shadow:0 4px 16px rgba(45,106,45,0.08)}
.IDmnav button{flex:1;padding:9px;border:none;background:transparent;border-radius:10px;font-size:12px;color:#5a7a5a;cursor:pointer;font-family:'Outfit',sans-serif;font-weight:500}
.IDmnav button.act{background:#d4f4e0;color:#1a5c1a;font-weight:600}
@media(min-width:768px){.IDmtop,.IDmnav{display:none}}

/* Welcome banner */
.IDwel{background:#fff;border:1px solid #d4e8d0;border-radius:14px;padding:22px;position:relative;overflow:hidden;box-shadow:0 4px 16px rgba(45,106,45,0.08)}
.IDwel::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(45,106,45,0.05),transparent 60%);pointer-events:none}
.IDwel::after{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,#2d6a2d,#6fcf97)}
.IDwel>*{position:relative}
.IDpill{display:inline-flex;align-items:center;gap:6px;background:#d4f4e0;border:1px solid #6fcf97;padding:4px 12px;border-radius:999px;font-size:11px;color:#1a5c1a;font-weight:600;margin-bottom:12px}
.IDpill .IDstar{color:#2d6a2d}
.IDwel h1{font-size:22px;font-weight:700;margin-bottom:6px;line-height:1.2;color:#1a2e1a;font-family:'Outfit',sans-serif}
.IDwel p{font-size:13px;color:#3a6a3a;margin-bottom:18px;line-height:1.5}
.IDav-lg{width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#2d6a2d 0%,#6fcf97 100%);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:18px;overflow:hidden;flex-shrink:0}
.IDav-lg img{width:100%;height:100%;object-fit:cover}
@media(min-width:768px){
  .IDwel{padding:24px 32px;display:flex;justify-content:space-between;align-items:center;gap:18px}
  .IDwel>div:first-child{flex:1}
  .IDwel p{margin-bottom:0}
  .IDwel h1{font-size:26px}
  .IDav-lg{width:64px;height:64px;border-radius:16px;font-size:20px}
}

/* Card base */
.IDcard{background:#fff;border:1px solid #e3eee0;border-radius:14px;padding:18px;box-shadow:0 4px 16px rgba(45,106,45,0.08);transition:transform .2s,box-shadow .2s}
.IDcard:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(45,106,45,0.14);border-color:#6fcf97}

/* KPI Grid */
.IDkpis{display:grid;grid-template-columns:1fr;gap:14px}
@media(min-width:540px){.IDkpis{grid-template-columns:repeat(2,1fr)}}
@media(min-width:1024px){.IDkpis{grid-template-columns:repeat(5,1fr)}}
.IDkpi-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
.IDkpi-icon{width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#2d6a2d 0%,#6fcf97 100%);display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff}
.IDkpi-icon.muted{background:#f8fcf7;border:1px solid #e3eee0;color:#2d6a2d}
.IDpill-chg{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:600;background:#d4f4e0;color:#1a5c1a;border:1px solid #6fcf97}
.IDkpi-lbl{font-size:10px;color:#5a7a5a;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;font-weight:600}
.IDkpi-val{font-size:22px;font-weight:700;color:#1a2e1a;line-height:1.1;margin-bottom:4px;font-family:'Outfit',sans-serif}
.IDkpi-sub{font-size:11px;color:#5a7a5a}

/* Middle row */
.IDmid{display:grid;grid-template-columns:1fr;gap:14px}
@media(min-width:1024px){.IDmid{grid-template-columns:2fr 1fr}}

/* Portfolio Breakdown */
.IDpb h3{font-size:16px;font-weight:700;margin-bottom:4px;color:#1a2e1a;font-family:'Playfair Display',serif}
.IDpb-total{font-size:13px;color:#5a7a5a;margin-bottom:22px;font-family:'JetBrains Mono',monospace}
.IDpb-body{display:flex;flex-direction:column;align-items:center;gap:22px}
@media(min-width:540px){.IDpb-body{flex-direction:row;align-items:center;gap:30px}}
.IDdonut{width:200px;height:200px;flex-shrink:0;position:relative}
.IDdonut svg{width:100%;transform:rotate(-90deg)}
.IDdonut-ctr{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.IDdonut-big{font-size:26px;font-weight:700;color:#1a2e1a;font-family:'Playfair Display',serif}
.IDdonut-lbl{font-size:10px;color:#5a7a5a;text-transform:uppercase;letter-spacing:1px;margin-top:2px}
.IDleg{flex:1;display:flex;flex-direction:column;gap:10px;width:100%}
.IDleg-row{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#f8fcf7;border:1px solid #e3eee0;border-radius:12px}
.IDleg-left{display:flex;align-items:center;gap:12px}
.IDleg-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.IDleg-name{font-size:13px;font-weight:600;color:#1a2e1a}
.IDleg-pct{font-size:11px;color:#5a7a5a;margin-top:2px;font-family:'JetBrains Mono',monospace}
.IDleg-val{font-size:14px;font-weight:700;color:#1a2e1a;font-family:'JetBrains Mono',monospace}

/* Quick Actions */
.IDqa h3{font-size:16px;font-weight:700;margin-bottom:4px;color:#1a2e1a;font-family:'Playfair Display',serif}
.IDqa-sub{font-size:13px;color:#5a7a5a;margin-bottom:16px}
.IDqa-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.IDqa-item{background:#f8fcf7;border:1px solid #e3eee0;border-radius:12px;padding:18px 12px;display:flex;flex-direction:column;align-items:center;gap:10px;transition:all .15s;cursor:pointer;text-align:center;text-decoration:none;font-family:'Outfit',sans-serif}
.IDqa-item:hover{background:#eaf6e6;border-color:#6fcf97;transform:translateY(-2px)}
.IDqa-icon{width:38px;height:38px;border-radius:10px;background:#fff;border:1px solid #e3eee0;display:flex;align-items:center;justify-content:center;font-size:16px;color:#2d6a2d;flex-shrink:0}
.IDqa-name{font-size:13px;font-weight:600;color:#1a2e1a}
.IDqa-item.busy{opacity:.6;cursor:wait}
.IDqa-msg{margin-top:14px;padding:10px 14px;background:#f8fcf7;border:1px solid #e3eee0;border-left:3px solid #6fcf97;border-radius:8px;font-size:12px;color:#1a5c1a}

/* Announcements */
.IDann h3{display:flex;align-items:center;gap:10px;font-size:16px;font-weight:700;margin-bottom:18px;color:#1a2e1a;font-family:'Playfair Display',serif}
.IDann h3 .IDann-ic{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#2d6a2d,#6fcf97);display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff}
.IDann-item{border-left:3px solid #6fcf97;padding:4px 0 4px 16px;margin-bottom:18px}
.IDann-item:last-child{margin-bottom:0}
.IDann-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;gap:12px;flex-wrap:wrap}
.IDann-title{font-size:14px;font-weight:600;color:#1a2e1a}
.IDann-date{font-size:11px;color:#5a7a5a;letter-spacing:1px;text-transform:uppercase;white-space:nowrap;font-weight:500;font-family:'JetBrains Mono',monospace}
.IDann-body{font-size:13px;color:#3a6a3a;line-height:1.5}
.IDann-empty{text-align:center;padding:40px 20px;color:#5a7a5a;font-size:13px}

/* Loading / error */
.IDspin{width:36px;height:36px;border-radius:50%;border:2px solid #d4e8d0;border-top-color:#2d6a2d;animation:IDspin .8s linear infinite;margin:0 auto 12px}
@keyframes IDspin{to{transform:rotate(360deg)}}
@keyframes IDfade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.IDfade1{animation:IDfade .4s ease both}
.IDfade2{animation:IDfade .4s .05s ease both}
.IDfade3{animation:IDfade .4s .1s ease both}
.IDfade4{animation:IDfade .4s .15s ease both}

/* Footer back link */
.IDback-row{display:flex;justify-content:flex-end;margin-top:8px}
.IDback-row a{font-size:12px;color:#5a7a5a;text-decoration:none;padding:6px 14px;border:1px solid #d4e8d0;border-radius:8px;background:#fff;transition:all .15s}
.IDback-row a:hover{border-color:#2d6a2d;color:#2d6a2d}

/* Hidden file input */
.IDfile{display:none}
`;

const PC = ["#2d6a2d","#6fcf97","#e07820"]; // Net Deposit, Dividend, Tabung Komitmen — matches logo palette

export default function ShareholderDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [data, setData]       = useState<Data|null>(null);
  const [activePage, setAP]   = useState<string>(getPage());
  const [photoUrl, setPhotoUrl] = useState<string|null>(null);
  const [photoOk, setPhotoOk]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string|null>(null);
  const [lightbox, setLightbox] = useState<string|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(base() + "/shareholder/dashboard-data",{ credentials:"include", headers:{ Accept:"application/json" } })
      .then(r=>{ if(!r.ok) throw new Error("Failed to load."); return r.json(); })
      .then((d:Data)=>{ setData(d); setPhotoUrl(d.profile?.avatar??null); setPhotoOk(true); })
      .catch(e=>setError(e.message))
      .finally(()=>setLoading(false));
  },[]);

  const nav = (path:string,page:string)=>{ window.history.pushState({},"",path); setAP(page); };

  const profile  = data?.profile;
  const S        = data?.summary;
  const totalDepositVal = S?.totalDeposit != null
    ? S.totalDeposit
    : Math.max(0, (S?.currentAccount ?? 0) - (S?.totalDividend ?? 0));
  const fy = data?.dividends?.[0]?.year ?? new Date().getFullYear();

  const authRole = getAuthRole();
  const backPath  = getBackPath(authRole);
  const backLabel = getBackLabel(authRole);

  const initials = useMemo(() =>
    (profile?.name??"").split(" ").slice(0,2).map(w=>w[0]||"").join("").toUpperCase() || "??",
    [profile?.name]
  );

  const memberSinceLabel = useMemo(() => {
    if (!profile?.startmembership) return "—";
    return new Date(profile.startmembership).toLocaleDateString("en-MY",{month:"long",year:"numeric"});
  }, [profile?.startmembership]);

  const monthLabel = new Date().toLocaleDateString("en-MY",{month:"long",year:"numeric"});

  const pieData = useMemo(() => [
    {name:"Net Deposit",       value:totalDepositVal,           color:PC[0]},
    {name:"Total Dividend",    value:S?.totalDividend??0,       color:PC[1]},
    {name:"Tabung Komitmen",   value:S?.tabungKomitmen??0,      color:PC[2]},
  ].filter(d=>d.value>0), [totalDepositVal, S?.totalDividend, S?.tabungKomitmen]);
  const pieTotal = pieData.reduce((sum,d)=>sum+d.value,0);
  const biggest  = pieData.reduce((a,b)=>a&&a.value>b.value?a:b, pieData[0]);

  const handlePhotoClick = () => fileRef.current?.click();
  const handlePhotoChange = async (e:React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) {
      setUploadMsg("Please choose a JPEG, PNG or WEBP image.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadMsg("Image is larger than 8 MB.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setUploading(true);
    setUploadMsg(null);
    const fd = new FormData(); fd.append("photo", file);
    const csrfMeta = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
    const csrfCookie = decodeURIComponent((document.cookie.match(/XSRF-TOKEN=([^;]+)/)||[])[1] || "");
    try {
      const r = await fetch(base() + "/shareholder/profile/photo", {
        method:"POST",
        body:fd,
        credentials:"include",
        headers:{
          "X-CSRF-TOKEN": csrfMeta,
          "X-XSRF-TOKEN": csrfCookie,
          Accept:"application/json",
          "X-Requested-With":"XMLHttpRequest",
        },
      });
      const text = await r.text();
      let d:any = null;
      try { d = JSON.parse(text); } catch { /* not json */ }
      if (!r.ok) {
        const msg = d?.message || d?.errors?.photo?.[0] || `Upload failed (HTTP ${r.status}).`;
        setUploadMsg(msg);
        return;
      }
      if (d?.url) {
        const fresh = `${d.url}?t=${Date.now()}`; // cache-bust so the browser fetches the new file
        setPhotoUrl(fresh);
        setPhotoOk(true);
        if (profile) profile.avatar = fresh;
        setUploadMsg("Photo updated.");
        setTimeout(()=>setUploadMsg(null), 2500);
      } else {
        setUploadMsg("Upload finished but no URL was returned.");
      }
    } catch (err:any) {
      setUploadMsg(err?.message || "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const avatarInner = () => (photoUrl && photoOk)
    ? <img src={photoUrl} alt="" onError={()=>setPhotoOk(false)}/>
    : <>{initials}</>;

  const handleLogout = () => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = (window as any).LogoutUrl || base() + "/logout";
    const csrf = document.createElement("input");
    csrf.type = "hidden";
    csrf.name = "_token";
    csrf.value = (window as any).LaravelCsrfToken || "";
    form.appendChild(csrf);
    document.body.appendChild(form);
    form.submit();
  };


  if (loading) return (
    <><style>{css}</style>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#ffffff"}}>
        <div style={{textAlign:"center"}}>
          <div className="IDspin"/>
          <p style={{color:"#7a9a7a",fontSize:12,fontFamily:"'Outfit',sans-serif"}}>Loading…</p>
        </div>
      </div>
    </>
  );
  if (error || !profile || !data) return (
    <><style>{css}</style>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#ffffff"}}>
        <div style={{background:"#fff",border:"1px solid #fca5a5",borderRadius:16,padding:32,color:"#b91c1c",fontSize:13}}>{error||"No profile found."}</div>
      </div>
    </>
  );

  const navItems: Array<{label:string;page:string;path:string}> = [
    {label:"Dashboard",     page:"dashboard",     path:"/shareholder"},
    {label:"Announcements", page:"announcements", path:"/shareholder/announcements"},
    {label:"Certificate",   page:"certificate",   path:"/shareholder/certificate"},
  ];

  /* ── Top nav (desktop) ── */
  const TopNav = () => (
    <div className="IDtop">
      <div className="IDbrand">
        <div className="IDlogo"><img src={base()+"/landing/logo-kopssb.jpeg"} alt="KOP-SSB"/></div>
        <span className="IDbrand-txt">Koperasi Kakitangan Sabah Softwoods Berhad</span>
      </div>
      <div className="IDnav">
        {navItems.map(n=>(
          <a key={n.page} href={n.path} className={activePage===n.page?"act":""}
             onClick={e=>{e.preventDefault(); nav(n.path,n.page);}}>{n.label}</a>
        ))}
      </div>
      <div className="IDuser">
        <div>
          <div className="IDun">{profile.name}</div>
          <div className="IDur">{profile.member_id}</div>
        </div>
        <div className="IDav-sm">{avatarInner()}</div>
        <button type="button" className="IDlogout" onClick={handleLogout} title="Log out">Log out</button>
      </div>
    </div>
  );

  /* ── Mobile compact header + nav ── */
  const MobileTop = () => (
    <>
      <div className="IDmtop">
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div className="IDmlogo"><img src={base()+"/landing/logo-kopssb.jpeg"} alt="KOP-SSB"/></div>
          <div>
            <div className="IDmname">KOP-SSB</div>
            <div className="IDmid">{profile.member_id}</div>
          </div>
        </div>
        <button type="button" className="IDlogout-mini" onClick={handleLogout} title="Log out">Logout</button>
      </div>
      <div className="IDmnav">
        {navItems.map(n=>(
          <button key={n.page} className={activePage===n.page?"act":""}
                  onClick={()=>nav(n.path,n.page)}>{n.label}</button>
        ))}
      </div>
    </>
  );

  /* ── Welcome banner ── */
  const Welcome = () => (
    <div className="IDwel IDfade1">
      <div>
        <div className="IDpill"><span className="IDstar">✦</span> {monthLabel}</div>
        <h1>Welcome back, {(profile.name||"").split(" ")[0]||"Shareholder"}</h1>
        <p>Here's how your portfolio is performing this month.</p>
      </div>
      <div className="IDav-lg">{avatarInner()}</div>
    </div>
  );

  /* ── KPI cards ── */
  const KPIs = () => (
    <div className="IDkpis IDfade2">
      <div className="IDcard">
        <div className="IDkpi-top">
          <div className="IDkpi-icon">🏦</div>
        </div>
        <div className="IDkpi-lbl">Shares Holding</div>
        <div className="IDkpi-val">{fmt(S?.currentAccount??0)}</div>
        <div className="IDkpi-sub">Deposit + Dividend − Withdraw</div>
      </div>

      <div className="IDcard">
        <div className="IDkpi-top">
          <div className="IDkpi-icon muted">📈</div>
        </div>
        <div className="IDkpi-lbl">Net Deposit</div>
        <div className="IDkpi-val">{fmt(totalDepositVal)}</div>
        <div className="IDkpi-sub">Deposit − Withdrawal</div>
      </div>

      <div className="IDcard">
        <div className="IDkpi-top">
          <div className="IDkpi-icon muted">🏅</div>
        </div>
        <div className="IDkpi-lbl">Total Dividend</div>
        <div className="IDkpi-val">{fmt(S?.totalDividend??0)}</div>
        <div className="IDkpi-sub">Lifetime earnings</div>
      </div>

      <div className="IDcard">
        <div className="IDkpi-top">
          <div className="IDkpi-icon muted">🌿</div>
        </div>
        <div className="IDkpi-lbl">Tabung Komitmen</div>
        <div className="IDkpi-val">{fmt(S?.tabungKomitmen??0)}</div>
        <div className="IDkpi-sub">Fixed · staff-assigned</div>
      </div>

      <div className="IDcard">
        <div className="IDkpi-top">
          <div className="IDkpi-icon muted">📅</div>
          {(S?.yearlyDividendRate??0)>0 && <div className="IDpill-chg">↗ {S?.yearlyDividendRate}%</div>}
        </div>
        <div className="IDkpi-lbl">Financial Year Dividend</div>
        <div className="IDkpi-val">{fmt(S?.yearlyDividendAmount??0)}</div>
        <div className="IDkpi-sub">FY {fy} · paid</div>
      </div>
    </div>
  );

  /* ── Portfolio Breakdown donut ── */
  const Breakdown = () => {
    const R = 38, C = 2*Math.PI*R;
    let off = 0;
    return (
      <div className="IDcard IDpb">
        <h3>Portfolio Breakdown</h3>
        <div className="IDpb-total">Total {fmt(pieTotal)}</div>
        <div className="IDpb-body">
          <div className="IDdonut">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={R} fill="none" stroke="#eef5ee" strokeWidth="14"/>
              {pieData.map(d=>{
                const dash = pieTotal>0 ? (d.value/pieTotal)*C : 0;
                const el = <circle key={d.name} cx="50" cy="50" r={R} fill="none" stroke={d.color} strokeWidth="14" strokeDasharray={`${dash} ${C-dash}`} strokeDashoffset={-off} strokeLinecap="round"/>;
                off += dash; return el;
              })}
            </svg>
            <div className="IDdonut-ctr">
              <div className="IDdonut-big">{pieTotal>0?Math.round(((biggest?.value??0)/pieTotal)*100):0}%</div>
              <div className="IDdonut-lbl">{biggest?.name?.split(" ")[0]??"—"}</div>
            </div>
          </div>
          <div className="IDleg">
            {pieData.map(d=>(
              <div key={d.name} className="IDleg-row">
                <div className="IDleg-left">
                  <div className="IDleg-dot" style={{background:d.color}}/>
                  <div>
                    <div className="IDleg-name">{d.name}</div>
                    <div className="IDleg-pct">{pieTotal>0?((d.value/pieTotal)*100).toFixed(1):"0.0"}%</div>
                  </div>
                </div>
                <div className="IDleg-val">{fmtShort(d.value)}</div>
              </div>
            ))}
            {pieData.length === 0 && (
              <div style={{padding:18,textAlign:"center",color:"#5a7a5a",fontSize:12}}>No portfolio data yet.</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ── Quick Actions ── */
  const QuickActions = () => (
    <div className="IDcard IDqa">
      <h3>Quick Actions</h3>
      <div className="IDqa-sub">Jump straight into common tasks</div>
      <div className="IDqa-grid">
        <a className="IDqa-item" href={base()+"/shareholder/statement/download"} target="_blank" rel="noopener noreferrer" download>
          <div className="IDqa-icon">📄</div>
          <div className="IDqa-name">Statement</div>
        </a>
        <a className="IDqa-item" href="/shareholder/certificate"
           onClick={e=>{e.preventDefault();nav("/shareholder/certificate","certificate");}}>
          <div className="IDqa-icon">🎖</div>
          <div className="IDqa-name">Certificate</div>
        </a>
        <button type="button"
                className={`IDqa-item${uploading?" busy":""}`}
                onClick={handlePhotoClick}
                disabled={uploading}
                style={{border:"1px solid #d4e8d0"}}>
          <div className="IDqa-icon">📷</div>
          <div className="IDqa-name">{uploading?"Uploading…":"Profile Photo"}</div>
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="IDfile" onChange={handlePhotoChange}/>
      </div>
      {uploadMsg && <div className="IDqa-msg">{uploadMsg}</div>}
    </div>
  );

  /* ── Announcements list ── */
  const Announcements = ({limit}:{limit?:number}) => {
    const list = (data.announcements ?? []).slice(0, limit ?? data.announcements?.length ?? 0);
    return (
      <div className="IDcard IDann">
        <h3><span className="IDann-ic">📣</span> Announcements</h3>
        {list.length === 0 ? (
          <div className="IDann-empty">No announcements at this time.</div>
        ) : list.map(a=>(
          <div key={a.id} className="IDann-item">
            <div className="IDann-head">
              <div className="IDann-title">{a.title}</div>
              <div className="IDann-date">{a.published_at ?? "—"}</div>
            </div>
            <div className="IDann-body">{a.content}</div>
            {(()=>{
              const rawUrl=(a as any).attachment_url; const name=(a as any).attachment_name||"";
              if(!rawUrl) return null;
              const url = base() + rawUrl;
              const ext=((a as any).attachment_ext || (name ? name.split(".").pop() : rawUrl.split(".").pop()))?.toLowerCase()?.split('?')[0] || "";
              if(["jpg","jpeg","png","gif","webp"].includes(ext))
                return <img src={url} alt={name}
                  onClick={()=>setLightbox(url)}
                  onError={(e)=>{
                    const img = e.currentTarget;
                    img.replaceWith(Object.assign(document.createElement("a"), {
                      href: url+"?download=1", target:"_blank", textContent:"📎 "+(name||"Open attachment"),
                      style:"display:inline-flex;align-items:center;gap:5px;margin-top:8px;font-size:12px;color:#2d6a2d;font-weight:600;text-decoration:none",
                    }));
                  }}
                  style={{marginTop:10,maxWidth:"100%",maxHeight:400,borderRadius:8,display:"block",border:"1px solid #c5d6c3",cursor:"zoom-in"}}/>;
              if(ext==="pdf")
                return <embed src={url} type="application/pdf" style={{marginTop:10,width:"100%",height:480,borderRadius:8,border:"1px solid #c5d6c3"}}/>;
              return <a href={url+"?download=1"} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:5,marginTop:8,fontSize:12,color:"#2d6a2d",fontWeight:600,textDecoration:"none"}}>📎 {name||"Download"}</a>;
            })()}
          </div>
        ))}
      </div>
    );
  };

  /* ── Pages ── */
  const PageDash = () => (
    <>
      <Welcome/>
      <KPIs/>
      <div className="IDmid IDfade3">
        <Breakdown/>
        <QuickActions/>
      </div>
      <div className="IDfade4"><Announcements limit={3}/></div>
    </>
  );

  const PageAnnouncements = () => (
    <div className="IDfade1"><Announcements/></div>
  );

  const PageCertificate = () => {
    const sharesHolding = S?.currentAccount ?? 0;
    const shares        = Math.max(0, Math.round(sharesHolding));
    const shareValue    = 1.00;
    const totalVal      = shares * shareValue;
    const shareholderId      = profile?.member_id ?? String(profile?.id ?? "");
    const memberName    = (profile?.name ?? "").toUpperCase();
    const certNo        = `KSS-${new Date().getFullYear()}-${String(profile?.id ?? 0).padStart(4,"0")}`;
    const fmtRM         = (n:number) => `RM ${n.toLocaleString("en-MY",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
    const qrValue = profile?.verificationUrl
      ?? `KOP-SSB://shareholder?id=${encodeURIComponent(String(shareholderId))}&name=${encodeURIComponent(profile?.name ?? "")}`;
    return (
      <div className="IDfade1" style={{maxWidth:720,margin:"0 auto",padding:"0 4px"}}>
        <div style={{background:"#fdf8f0",border:"2px solid #c9a028",borderRadius:16,padding:"32px 40px",boxShadow:"0 4px 24px rgba(45,106,45,0.12)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:5,background:"linear-gradient(90deg,#2d6a2d,#c9a028,#2d6a2d)"}}/>
          <div style={{position:"absolute",top:14,right:22,textAlign:"right"}}>
            <div style={{fontSize:8,color:"#7a9a7a",fontFamily:"JetBrains Mono,monospace",letterSpacing:1,textTransform:"uppercase"}}>No. Sijil Saham</div>
            <div style={{fontSize:13,fontWeight:700,color:"#c9a028",fontFamily:"JetBrains Mono,monospace"}}>{certNo}</div>
          </div>
          <div style={{textAlign:"center",marginBottom:16}}>
            <img src={base()+"/landing/logo-kopssb.jpeg"} onError={e=>{(e.target as HTMLImageElement).style.display="none";}}
                 style={{width:68,height:60,objectFit:"contain",marginBottom:8,display:"block",margin:"0 auto 8px"}} alt="KOP-SSB"/>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:"#1a4a1a",lineHeight:1.3,letterSpacing:0.5}}>KOPERASI KAKITANGAN SABAH SOFTWOODS BERHAD</div>
            <div style={{fontSize:10,color:"#7a9a7a",marginTop:3}}>Didaftarkan di bawah Akta Koperasi 1993</div>
          </div>
          <div style={{height:2,background:"linear-gradient(90deg,transparent,#2d6a2d,transparent)",margin:"0 32px 16px"}}/>
          <div style={{textAlign:"center",marginBottom:16}}>
            <span style={{background:"#2d6a2d",color:"#fff",fontWeight:700,fontSize:13,padding:"5px 28px",borderRadius:4,letterSpacing:2,display:"inline-block"}}>SIJIL SAHAM</span>
          </div>
          <div style={{textAlign:"center",fontSize:12.5,color:"#555",marginBottom:14}}>Dengan ini adalah diakui bahawa,</div>
          <div style={{background:"#f0f9ee",border:"1px solid #2d6a2d",borderRadius:10,padding:"14px 20px",marginBottom:16,textAlign:"center"}}>
            <div style={{display:"inline-block",background:"#2d6a2d",color:"#fff",fontSize:9,fontWeight:700,padding:"2px 14px",borderRadius:20,marginBottom:8,fontFamily:"JetBrains Mono,monospace",letterSpacing:0.5}}>ID AHLI: {shareholderId}</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:19,fontWeight:700,color:"#1a4a1a",marginBottom:4}}>{memberName}</div>
            <div style={{fontSize:12,color:"#7a9a7a"}}>Ahli sah Koperasi sejak {memberSinceLabel}.</div>
          </div>
          {[{label:"Bilangan Saham",value:`${shares.toLocaleString()} unit`,bold:false},{label:"Nilai Seunit",value:`RM ${shareValue.toFixed(2)}`,bold:false},{label:"Jumlah Nilai Saham",value:fmtRM(totalVal),bold:true}].map(({label,value,bold},i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",padding:"9px 14px",background:i%2===0?"#e8f5e4":"#f5faf4",borderRadius:7,marginBottom:4}}>
              <span style={{fontSize:10.5,color:"#4a6a4a",fontFamily:"JetBrains Mono,monospace",textTransform:"uppercase",letterSpacing:0.5,width:190,flexShrink:0}}>{label}</span>
              <span style={{fontSize:14,fontWeight:bold?700:500,color:bold?"#2d6a2d":"#1a2e1a"}}>{value}</span>
            </div>
          ))}
          <div style={{textAlign:"center",margin:"14px 0 16px",fontWeight:700,fontSize:13,color:"#c9a028",letterSpacing:2}}>**** {fmtRM(totalVal)} ****</div>
          <div style={{borderTop:"1px solid #c5d6c3",paddingTop:16,marginTop:8,display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
            {["Pengerusi Koperasi","Setiausaha Koperasi"].map(role=>(
              <div key={role} style={{textAlign:"center",width:155}}>
                <div style={{borderBottom:"1px solid #1a4a1a",marginBottom:4,height:32}}/>
                <div style={{fontSize:10,fontWeight:700,color:"#1a4a1a"}}>{role}</div>
                <div style={{fontSize:8,color:"#7a9a7a",marginTop:1}}>KOP. KAKITANGAN SABAH SOFTWOODS</div>
              </div>
            ))}
            <div style={{textAlign:"center"}}>
              <div style={{padding:6,background:"#fff",border:"1px solid #d4e8d0",borderRadius:8}}>
                <QRCodeSVG value={qrValue} size={56} bgColor="#ffffff" fgColor="#1a4a1a" includeMargin={false}/>
              </div>
              <div style={{fontSize:8,color:"#7a9a7a",marginTop:3}}>Verify</div>
            </div>
          </div>
        </div>
        <div style={{marginTop:20,textAlign:"center"}}>
          <a href={base() + "/shareholder/certificate/download"} target="_blank" rel="noopener noreferrer" download
             style={{display:"inline-flex",alignItems:"center",gap:8,padding:"12px 32px",background:"#2d6a2d",color:"#fff",borderRadius:10,fontSize:13,fontWeight:600,textDecoration:"none",boxShadow:"0 4px 14px rgba(45,106,45,0.3)"}}>⬇ Download PDF Certificate</a>
        </div>
        <p style={{textAlign:"center",fontSize:11,color:"#7a9a7a",marginTop:10}}>NOTA: Saham tidak boleh dipindahmiliki jikalau Sijil ini tidak dikembalikan ke pejabat Koperasi.</p>
      </div>
    );
  };

  return (
    <>
      <style>{css}</style>
      <div className="IDwrap">
        <TopNav/>
        <MobileTop/>
        {activePage === "dashboard"     && <PageDash/>}
        {activePage === "announcements" && <PageAnnouncements/>}
        {activePage === "certificate"   && <PageCertificate/>}
        {backPath && (
          <div className="IDback-row">
            <a href={backPath}>{backLabel}</a>
          </div>
        )}
      </div>
      {lightbox && (
        <div onClick={()=>setLightbox(null)}
             style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out"}}>
          <img src={lightbox}
               onClick={e=>e.stopPropagation()}
               style={{maxWidth:"92vw",maxHeight:"92vh",borderRadius:10,boxShadow:"0 8px 48px rgba(0,0,0,0.6)",objectFit:"contain"}} alt=""/>
          <button onClick={()=>setLightbox(null)}
                  style={{position:"absolute",top:18,right:22,background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:22,width:40,height:40,borderRadius:"50%",cursor:"pointer",lineHeight:1}}>✕</button>
        </div>
      )}
    </>
  );
}
