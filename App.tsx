import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { useTranslation } from "react-i18next";
import {
  Wallet, Users, HandCoins, HeartPulse, CreditCard, History,
  Bell, FileText, Menu, X, Languages, ArrowUpRight, Clock3, ShieldCheck,
  Plus, CheckCircle2, Download, CalendarDays, LockKeyhole
} from "lucide-react";

type Section = "overview" | "groups" | "savings" | "loans" | "mutuelle" | "pay" | "history" | "news" | "reports";
type GroupRecord = {
  id: string; name: string; start_date: string; monthly_contribution: number;
  goal_amount: number; member_count: number; status: "active" | "closed";
  ended_at: string | null; closing_note: string;
};

const navigation: { key: Section; icon: typeof Wallet; label: string }[] = [
  { key: "overview", icon: Wallet, label: "overview" },
  { key: "groups", icon: Users, label: "groups" },
  { key: "savings", icon: HandCoins, label: "savings" },
  { key: "loans", icon: CreditCard, label: "loans" },
  { key: "mutuelle", icon: HeartPulse, label: "mutuelle" },
  { key: "pay", icon: CreditCard, label: "pay" },
  { key: "history", icon: History, label: "history" },
  { key: "news", icon: Bell, label: "news" },
  { key: "reports", icon: FileText, label: "reports" }
];

const money = (n: number) => new Intl.NumberFormat("fr-RW", {
  style: "currency", currency: "RWF", maximumFractionDigits: 0
}).format(n);


function AuthGate() {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim(), phone: phone.trim() } },
        });
        if (signUpError) throw signUpError;
        if (data.user && data.session) {
          const { error: profileError } = await supabase.from("profiles").upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            preferred_language: i18n.language,
          });
          if (profileError) throw profileError;
        }
        setMessage(data.session
          ? (i18n.language === "rw" ? "Konti yafunguwe neza." : "Account created successfully.")
          : (i18n.language === "rw"
              ? "Reba email yawe wemeze konti, hanyuma winjire."
              : "Check your email to confirm your account, then sign in."));
        if (!data.session) setMode("signin");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(), password,
        });
        if (signInError) throw signInError;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div className="brand auth-brand">
          <div className="brand-mark">IR</div>
          <div><strong>{t("brand")}</strong><span>{t("tagline")}</span></div>
        </div>
        <div className="auth-language">
          <Languages size={16} />
          <select value={i18n.language} onChange={(e) => void i18n.changeLanguage(e.target.value)} aria-label={t("language")}>
            <option value="rw">Kinyarwanda</option><option value="en">English</option>
            <option value="fr">Français</option><option value="sw">Kiswahili</option>
          </select>
        </div>
        {!isSupabaseConfigured ? (
          <>
            <h1>Huza ITSINDA RYACU na Supabase</h1>
            <p className="auth-description">Kugira ngo kwinjira no gufungura konti bikore, banza ushyiremo Supabase URL na Publishable/anon key muri dosiye <code>.env.local</code>.</p>
            <ol className="setup-steps">
              <li>Kora kopi ya <code>.env.example</code> uyite <code>.env.local</code>.</li>
              <li>Shyiramo <code>VITE_SUPABASE_URL</code> na <code>VITE_SUPABASE_ANON_KEY</code> byo muri Supabase Project Settings → API Keys.</li>
              <li>Shyira SQL iri muri <code>supabase/schema.sql</code> muri Supabase SQL Editor, uyisome mbere yo kuyikoresha.</li>
              <li>Ongera utangize porogaramu nyuma yo gushyiramo ayo makuru.</li>
            </ol>
            <div className="auth-warning">Ntushyiremo service_role cyangwa sb_secret key muri porogaramu igaragara ku bakoresha.</div>
          </>
        ) : (
          <>
            <div className="eyebrow">ITSINDA RYACU · KONTI</div>
            <h1>{mode === "signin" ? "Murakaza neza" : "Fungura konti"}</h1>
            <p className="auth-description">{mode === "signin" ? "Injira ukoresheje email n'ijambo ry'ibanga." : "Andika amakuru yawe kugira ngo ufungure konti."}</p>
            <form className="auth-form" onSubmit={submit}>
              {mode === "signup" && <>
                <label>Amazina yose<input required autoComplete="name" value={fullName} onChange={e => setFullName(e.target.value)} /></label>
                <label>Telefoni (si ngombwa)<input autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} /></label>
              </>}
              <label>Email<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
              <label>Ijambo ry'ibanga<input required minLength={6} type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} /></label>
              {error && <p className="auth-error" role="alert">{error}</p>}
              {message && <p className="auth-success" role="status">{message}</p>}
              <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy ? "Birategerejwe..." : mode === "signin" ? "Injira" : "Fungura konti"}</button>
            </form>
            <button className="auth-switch" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setMessage(""); }}>
              {mode === "signin" ? "Nta konti ufite? Fungura konti" : "Usanzwe ufite konti? Injira"}
            </button>
          </>
        )}
        <p className="auth-foot">Konti yawe irinzwe n'amabwiriza y'umutekano ya Supabase. Ntukoreshe amakuru y'ibanga y'undi muntu.</p>
      </section>
    </main>
  );
}

export default function App() {
  const { t, i18n } = useTranslation();
  const [section, setSection] = useState<Section>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(!isSupabaseConfigured);
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState("");
  const [groupsMessage, setGroupsMessage] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupStartDate, setGroupStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [groupContribution, setGroupContribution] = useState("1000");
  const [groupGoal, setGroupGoal] = useState("100000");
  const [groupMembers, setGroupMembers] = useState("10");
  const [closingGroupId, setClosingGroupId] = useState<string | null>(null);
  const [closingNote, setClosingNote] = useState("");
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setSessionLoaded(true);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setSessionLoaded(true);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !session || section !== "groups" && section !== "reports") return;
    let active = true;
    setGroupsLoading(true);
    setGroupsError("");
    supabase.from("savings_groups").select("id,name,start_date,monthly_contribution,goal_amount,member_count,status,ended_at,closing_note").order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setGroupsError(error.message);
        else setGroups((data ?? []).map((row: any) => ({
          id: row.id, name: row.name, start_date: row.start_date ?? row.created_at?.slice(0, 10) ?? "",
          monthly_contribution: Number(row.monthly_contribution ?? 0), goal_amount: Number(row.goal_amount ?? 0),
          member_count: Number(row.member_count ?? 0), status: row.status === "closed" ? "closed" : "active",
          ended_at: row.ended_at ?? null, closing_note: row.closing_note ?? "",
        })));
        setGroupsLoading(false);
      });
    return () => { active = false; };
  }, [section, session]);

  const createGroup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGroupsError(""); setGroupsMessage("");
    const record = {
      name: groupName.trim(), start_date: groupStartDate,
      monthly_contribution: Number(groupContribution), goal_amount: Number(groupGoal),
      member_count: Number(groupMembers), status: "active" as const, ended_at: null, closing_note: "",
    };
    if (!record.name || record.monthly_contribution < 0 || record.goal_amount < 0 || record.member_count < 1) {
      setGroupsError("Reba amakuru wanditse. Umubare w'abanyamuryango ugomba nibura kuba 1."); return;
    }
    if (supabase && session) {
      const { data, error } = await supabase.from("savings_groups").insert({ ...record, created_by: session.user.id, description: "" }).select("id,name,start_date,monthly_contribution,goal_amount,member_count,status,ended_at,closing_note").single();
      if (error) { setGroupsError(error.message); return; }
      setGroups(current => [{ ...record, id: data.id }, ...current]);
      setGroupsMessage("Itsinda ryanditswe muri Supabase.");
    } else {
      setGroups(current => [{ ...record, id: crypto.randomUUID() }, ...current]);
      setGroupsMessage("Itsinda ryashyizweho mu igerageza gusa; ntiribikwa kuri server.");
    }
    setGroupName("");
  };

  const closeGroup = async (group: GroupRecord) => {
    setGroupsError(""); setGroupsMessage("");
    const endedAt = new Date().toISOString().slice(0, 10);
    if (supabase && session) {
      const { error } = await supabase.from("savings_groups").update({ status: "closed", ended_at: endedAt, closing_note: closingNote.trim() }).eq("id", group.id);
      if (error) { setGroupsError(error.message); return; }
    }
    setGroups(current => current.map(item => item.id === group.id ? { ...item, status: "closed", ended_at: endedAt, closing_note: closingNote.trim() } : item));
    setClosingGroupId(null); setClosingNote("");
    setGroupsMessage(supabase && session ? "Itsinda ryarafunzwe kandi impinduka zabitswe." : "Itsinda ryarafunzwe muri iyi igerageza gusa.");
  };

  const changeSection = (key: Section) => {
    setSection(key);
    setMenuOpen(false);
    setGroupsMessage(""); setGroupsError("");
  };

  if (isSupabaseConfigured && !sessionLoaded) {
    return <main className="auth-screen"><section className="auth-card"><h1>ITSINDA RYACU</h1><p>Turimo gufungura konti yawe...</p></section></main>;
  }
  if (isSupabaseConfigured && !session) return <AuthGate />;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">IR</div>
          <div><strong>{t("brand")}</strong><span>{t("tagline")}</span></div>
          <button className="icon-button close-menu" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X /></button>
        </div>
        <div className="nav-label">{t("menu")}</div>
        <nav>
          {navigation.map(({ key, icon: Icon, label }) => (
            <button key={key} className={`nav-item ${section === key ? "active" : ""}`} onClick={() => changeSection(key)}>
              <Icon size={19} /><span>{t(label)}</span>
              {key === "news" && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <ShieldCheck size={17} />
          <span>Umutekano n'icyizere<br /><small>Prototype · v0.1</small></span>
        </div>
      </aside>

      {menuOpen && <button className="scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu /></button>
          <div className="crumb">{t("brand")} <span>/</span> {t(section)}</div>
          <div className="top-actions">
            <label className="language-picker"><Languages size={17} />
              <select value={i18n.language} onChange={(e) => void i18n.changeLanguage(e.target.value)} aria-label={t("language")}>
                <option value="rw">Kinyarwanda</option><option value="en">English</option>
                <option value="fr">Français</option><option value="sw">Kiswahili</option>
              </select>
            </label>
            <button className="avatar" title="Kuva muri konti" onClick={() => void supabase?.auth.signOut()}>{session?.user.email?.slice(0, 1).toUpperCase() || "U"}</button>
          </div>
        </header>

        <div className="page-content">
          {section === "overview" ? (
            <>
              <section className="welcome-row">
                <div><div className="eyebrow">ITSINDA RYACU · V0.1</div><h1>{t("welcome")} 👋</h1><p>{t("subtitle")}</p></div>
                <div className="date-pill"><Clock3 size={16} /> {new Date().toLocaleDateString(i18n.language, { year: "numeric", month: "short", day: "numeric" })}</div>
              </section>

              <div className="notice"><span className="notice-mark">i</span><span>{t("demoNotice")}</span></div>

              <section className="summary-grid">
                <article className="summary-card savings-card">
                  <div className="card-top"><span>{t("totalSavings")}</span><span className="metric-icon"><Wallet size={19}/></span></div>
                  <strong>{money(0)}</strong><div className="card-bottom"><span className="muted">{t("demo")}</span><span className="metric-arrow"><ArrowUpRight size={16}/></span></div>
                </article>
                <article className="summary-card">
                  <div className="card-top"><span>{t("loanBalance")}</span><span className="metric-icon peach"><HandCoins size={19}/></span></div>
                  <strong>{money(0)}</strong><div className="card-bottom"><span className="muted">{t("demo")}</span><span className="metric-arrow"><ArrowUpRight size={16}/></span></div>
                </article>
                <article className="summary-card">
                  <div className="card-top"><span>{t("mutuelleGoal")}</span><span className="metric-icon blue"><HeartPulse size={19}/></span></div>
                  <strong>{money(0)}</strong><div className="progress-track"><span style={{ width: "0%" }} /></div><div className="progress-caption">0%</div>
                </article>
              </section>

              <section className="content-grid">
                <article className="panel activity-panel">
                  <div className="panel-heading"><div><h2>{t("recentActivity")}</h2><p>History · {t("demo")}</p></div><button className="text-button" onClick={() => changeSection("history")}>{t("history")} <ArrowUpRight size={15}/></button></div>
                  <div className="empty-state"><div className="empty-icon"><History size={25}/></div><strong>{t("comingSoon")}</strong><p>{t("noPayment")}</p></div>
                </article>
                <article className="panel quick-panel">
                  <div className="panel-heading"><div><h2>Ibikorwa by'ingenzi</h2><p>Quick actions</p></div></div>
                  <div className="quick-actions">
                    <button onClick={() => changeSection("savings")}><span className="quick-icon green"><HandCoins/></span><span><b>{t("savings")}</b><small>Kwizigama make make</small></span><ArrowUpRight size={16}/></button>
                    <button onClick={() => changeSection("mutuelle")}><span className="quick-icon red"><HeartPulse/></span><span><b>{t("mutuelle")}</b><small>Intego yo kwiteganyiriza</small></span><ArrowUpRight size={16}/></button>
                    <button onClick={() => changeSection("news")}><span className="quick-icon gold"><Bell/></span><span><b>{t("news")}</b><small>Amatangazo y'itsinda</small></span><ArrowUpRight size={16}/></button>
                  </div>
                </article>
              </section>
              <div className="footer-note"><ShieldCheck size={16}/> Amakuru y'amafaranga nyayo azagaragara ari uko ububiko bw'amakuru n'ubwishyu byemewe bihujwe.</div>
            </>
          ) : section === "groups" ? (
            <section className="feature-page">
              <div className="feature-heading"><div><div className="eyebrow">ITSINDA RYACU · UBUYOBOZI</div><h1>Gutangiza no gusoza itsinda</h1><p>Andika itsinda rishya, ukurikirane ayakora, cyangwa urisoze ufite raporo y'uko rihagaze.</p></div><span className="status-pill">{supabase && session ? "Supabase" : "Igerageza"}</span></div>
              {(!supabase || !session) && <div className="feature-notice"><LockKeyhole size={17}/> Iyi ni demo: amakuru ari muri iyi page ntazaguma ahari nyuma yo kongera gufungura app. Huza Supabase kugira ngo abikwe kuri server.</div>}
              {groupsError && <div className="feature-error" role="alert">{groupsError}</div>}
              {groupsMessage && <div className="feature-success" role="status">{groupsMessage}</div>}
              <div className="feature-grid">
                <form className="panel feature-form" onSubmit={createGroup}>
                  <div className="panel-heading"><div><h2><Plus size={17}/> Tangiza itsinda</h2><p>Amakuru y'ibanze y'itsinda</p></div></div>
                  <label>Izina ry'itsinda<input required value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Urugero: Twiteze imbere" /></label>
                  <label>Itariki ryatangiriyeho<input required type="date" value={groupStartDate} onChange={e => setGroupStartDate(e.target.value)} /></label>
                  <label>Umusanzu wa buri kwezi (RWF)<input required type="number" min="0" value={groupContribution} onChange={e => setGroupContribution(e.target.value)} /></label>
                  <label>Intego y'amafaranga (RWF)<input required type="number" min="0" value={groupGoal} onChange={e => setGroupGoal(e.target.value)} /></label>
                  <label>Umubare w'abanyamuryango<input required type="number" min="1" step="1" value={groupMembers} onChange={e => setGroupMembers(e.target.value)} /></label>
                  <button className="primary-button" type="submit"><Plus size={16}/> Bika itsinda</button>
                </form>
                <div className="panel group-list-panel">
                  <div className="panel-heading"><div><h2>Amatsinda yanditswe</h2><p>{groups.filter(g => g.status === "active").length} arakora · {groups.filter(g => g.status === "closed").length} yarasojwe</p></div></div>
                  {groupsLoading && <p className="feature-muted">Turimo gushaka amakuru y'amatsinda...</p>}
                  {!groupsLoading && groups.length === 0 && <div className="empty-state"><div className="empty-icon"><Users size={25}/></div><strong>Nta tsinda rirandikwa</strong><p>Uzuza ifishi ibumoso utangize itsinda rya mbere.</p></div>}
                  <div className="group-records">{groups.map(group => <article className="group-record" key={group.id}>
                    <div className="group-record-top"><div><strong>{group.name}</strong><small>Ryatangijwe: {group.start_date || "—"}</small></div><span className={`group-status ${group.status}`}>{group.status === "active" ? "Rirakora" : "Ryarasojwe"}</span></div>
                    <div className="group-facts"><span><b>{group.member_count}</b> abanyamuryango</span><span><b>{money(group.monthly_contribution)}</b> / ukwezi</span><span>Intego: <b>{money(group.goal_amount)}</b></span></div>
                    {group.status === "closed" ? <small className="feature-muted">Ryarangiye: {group.ended_at || "—"}{group.closing_note ? ` · ${group.closing_note}` : ""}</small> : closingGroupId === group.id ? <div className="close-group-form"><label>Impamvu/icyemezo cyo gusoza<textarea value={closingNote} onChange={e => setClosingNote(e.target.value)} placeholder="Andika uko abanyamuryango babyumvikanyeho" rows={2}/></label><div className="inline-actions"><button type="button" className="primary-button" onClick={() => void closeGroup(group)}>Emeza gusoza</button><button type="button" className="secondary-button" onClick={() => {setClosingGroupId(null);setClosingNote("")}}>Reka</button></div></div> : <button className="secondary-button close-group-button" onClick={() => setClosingGroupId(group.id)}><CheckCircle2 size={15}/> Soza itsinda</button>}
                  </article>)}</div>
                </div>
              </div>
            </section>
          ) : section === "reports" ? (
            <section className="feature-page">
              <div className="feature-heading"><div><div className="eyebrow">ITSINDA RYACU · RAPORO</div><h1>Raporo ya buri kwezi</h1><p>Hitamo ukwezi urebe uko amatsinda ahagaze, hanyuma ukuremo incamake.</p></div><span className="status-pill">{supabase && session ? "Amakuru yabitswe" : "Igerageza"}</span></div>
              {(!supabase || !session) && <div className="feature-notice"><LockKeyhole size={17}/> Iyi raporo ishingiye ku makuru y'amatsinda ari muri iyi demo gusa. Raporo y'amafaranga nyayo izakenera kwandika no kugenzura imisanzu, inguzanyo n'ibyasohotse.</div>}
              {groupsError && <div className="feature-error" role="alert">{groupsError}</div>}
              <div className="panel report-panel">
                <div className="report-controls"><label><CalendarDays size={17}/> Ukwezi kwa raporo<input type="month" value={reportMonth} onChange={e => setReportMonth(e.target.value)} /></label><button className="secondary-button" onClick={() => { const monthGroups = groups.filter(g => g.start_date?.slice(0,7) === reportMonth); const closedGroups = groups.filter(g => g.ended_at?.slice(0,7) === reportMonth); const rows = [['Raporo y’ukwezi',reportMonth],['Amatsinda yose',String(groups.length)],['Amatsinda akora',String(groups.filter(g=>g.status==='active').length)],['Amatsinda yasojwe muri uku kwezi',String(closedGroups.length)],['Amatsinda yatangijwe muri uku kwezi',String(monthGroups.length)],['Abanyamuryango bose (imibare y’amatsinda)',String(groups.reduce((n,g)=>n+g.member_count,0))],['Umusanzu uteganyijwe buri kwezi (RWF)',String(groups.filter(g=>g.status==='active').reduce((n,g)=>n+g.monthly_contribution*g.member_count,0))]]; const csv = rows.map(r=>r.map(v=>'"'+v.replaceAll('"','""')+'"').join(',')).join('\n'); const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'})); const a=document.createElement('a'); a.href=url; a.download=`raporo-yitsinda-${reportMonth}.csv`; a.click(); URL.revokeObjectURL(url); }}><Download size={16}/> Kuramo raporo (CSV)</button></div>
                <div className="report-metrics"><article><span>Amatsinda yose</span><strong>{groups.length}</strong></article><article><span>Amatsinda akora</span><strong>{groups.filter(g=>g.status === "active").length}</strong></article><article><span>Yasojwe muri uku kwezi</span><strong>{groups.filter(g=>g.ended_at?.slice(0,7) === reportMonth).length}</strong></article><article><span>Yatangijwe muri uku kwezi</span><strong>{groups.filter(g=>g.start_date?.slice(0,7) === reportMonth).length}</strong></article><article><span>Abanyamuryango (igiteranyo)</span><strong>{groups.reduce((n,g)=>n+g.member_count,0)}</strong></article><article><span>Umusanzu uteganyijwe / ukwezi</span><strong>{money(groups.filter(g=>g.status === "active").reduce((n,g)=>n+g.monthly_contribution*g.member_count,0))}</strong></article></div>
                <div className="report-table-wrap"><table className="report-table"><thead><tr><th>Itsinda</th><th>Itariki ryaritangiriyeho</th><th>Abanyamuryango</th><th>Imiterere</th><th>Itariki ryarangiye</th></tr></thead><tbody>{groups.map(g=><tr key={g.id}><td>{g.name}</td><td>{g.start_date || "—"}</td><td>{g.member_count}</td><td>{g.status === "active" ? "Rirakora" : "Ryarasojwe"}</td><td>{g.ended_at || "—"}</td></tr>)}{groups.length===0 && <tr><td colSpan={5}>Nta makuru ahari. Banza wandike amatsinda.</td></tr>}</tbody></table></div>
                <p className="report-footnote">Icyitonderwa: iyi verisiyo ibara amatsinda, abanyamuryango n'umusanzu uteganyijwe gusa. Raporo yuzuye y'amafaranga izongerwamo nyuma yo gushyiraho uburyo bwemewe bwo kubika no kugenzura buri bwishyu.</p>
              </div>
            </section>
          ) : (
            <section className="section-placeholder panel">
              <div className="empty-icon"><FileText size={26}/></div>
              <div className="eyebrow">{t("brand")}</div>
              <h1>{t(section)}</h1>
              <p>{t("comingSoon")}</p>
              <span className="status-pill">{t("demo")}</span>
              <button className="primary-button" onClick={() => changeSection("overview")}>{t("overview")}</button>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}