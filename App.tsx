import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { useTranslation } from "react-i18next";
import {
  Wallet, Users, HandCoins, HeartPulse, CreditCard, History,
  Bell, FileText, Menu, X, Languages, ArrowUpRight, Clock3, ShieldCheck,
  Plus, CheckCircle2, Download, CalendarDays, LockKeyhole, Scale, MessageSquare, BadgeCheck, UserPlus, Timer
} from "lucide-react";

type Section = "overview" | "groups" | "savings" | "loans" | "mutuelle" | "pay" | "history" | "news" | "reports" | "members" | "penalties" | "subscription";
type MutuellePlan = {
  id: string; household_label: string; target_amount: number; due_date: string;
  frequency: "weekly" | "monthly"; planned_contribution: number; created_at: string;
};
type MutuelleContribution = {
  id: string; plan_id: string; amount: number; contributed_on: string;
  note: string; verification_status: "recorded" | "confirmed";
};
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
  { key: "reports", icon: FileText, label: "reports" },
  { key: "members", icon: Users, label: "members" },
  { key: "penalties", icon: Scale, label: "penalties" },
  { key: "subscription", icon: CreditCard, label: "subscription" }
];

const money = (n: number) => new Intl.NumberFormat("fr-RW", {
  style: "currency", currency: "RWF", maximumFractionDigits: 0
}).format(n);


function AuthGate() {
  const { i18n } = useTranslation();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");
  const [legacyEmail, setLegacyEmail] = useState("");
  const [legacyPassword, setLegacyPassword] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const normalizePhone = (raw: string) => {
    const cleaned = raw.trim().replace(/[\s()-]/g, "");
    if (cleaned.startsWith("+")) return cleaned;
    if (cleaned.startsWith("250")) return `+${cleaned}`;
    if (cleaned.startsWith("0")) return `+250${cleaned.slice(1)}`;
    return `+250${cleaned}`;
  };

  async function sendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setError(""); setMessage("");
    const normalized = normalizePhone(phone);
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
      setError("Andika nimero ya telefone yemewe, urugero +2507XXXXXXXX.");
      setBusy(false); return;
    }
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: normalized,
        options: {
          shouldCreateUser: mode === "signup",
          data: mode === "signup" ? { full_name: fullName.trim(), preferred_language: i18n.language } : undefined,
        },
      });
      if (otpError) throw otpError;
      setPhone(normalized);
      setStep("code");
      setMessage("Kode yoherejwe kuri SMS niba iyi nimero yemerewe. Yandike hano.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kode ntiyoherejwe. Ongera ugerageze.");
    } finally { setBusy(false); }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({ phone: normalizePhone(phone), token: code.trim(), type: "sms" });
      if (verifyError) throw verifyError;
      if (data.user) {
        const profile: Record<string, string> = {
          id: data.user.id,
          phone: normalizePhone(phone),
          preferred_language: i18n.language,
        };
        const enteredName = fullName.trim() || String(data.user.user_metadata?.full_name ?? "");
        if (enteredName) profile.full_name = enteredName;
        const { error: profileError } = await supabase.from("profiles").upsert(profile, { onConflict: "id" });
        if (profileError) throw profileError;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kode si yo cyangwa yarangiye. Ongera ugerageze.");
    } finally { setBusy(false); }
  }

  async function legacyEmailSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!supabase) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: legacyEmail.trim(), password: legacyPassword });
      if (signInError) throw signInError;
    } catch (e) { setError(e instanceof Error ? e.message : "Kwinjira byanze."); }
    finally { setBusy(false); }
  }

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div className="brand auth-brand"><div className="brand-mark">IR</div><div><strong>ITSINDA RYACU</strong><span>Kwizigama hamwe, dutere imbere</span></div></div>
        <div className="auth-language"><Languages size={16}/><select value={i18n.language} onChange={e => void i18n.changeLanguage(e.target.value)} aria-label="Ururimi"><option value="rw">Kinyarwanda</option><option value="en">English</option><option value="fr">Français</option><option value="sw">Kiswahili</option></select></div>
        {!isSupabaseConfigured ? <>
          <h1>Huza ITSINDA RYACU na Supabase</h1>
          <p className="auth-description">Kwinjira ukoresheje SMS bisaba Supabase URL, Publishable/anon key, no gushyiraho SMS provider muri Supabase Authentication.</p>
          <ol className="setup-steps"><li>Kora kopi ya <code>.env.example</code> uyite <code>.env.local</code>.</li><li>Shyiramo <code>VITE_SUPABASE_URL</code> na <code>VITE_SUPABASE_ANON_KEY</code>.</li><li>Muri Supabase, fungura Authentication → Providers → Phone, uhitemo SMS provider kandi uyishyireho credentials.</li><li>Koresha SQL iri muri <code>supabase/migration_v05_penalties_trial.sql</code> nyuma yo kuyisuzuma.</li></ol>
          <div className="auth-warning">Ntushyiremo service_role cyangwa sb_secret key muri porogaramu igaragara ku bakoresha.</div>
        </> : <>
          <div className="eyebrow">ITSINDA RYACU · KONTI IRINZWE</div>
          <h1>{step === "phone" ? (mode === "signin" ? "Injira ukoresheje telefone" : "Fungura konti nshya") : "Emeza kode ya SMS"}</h1>
          <p className="auth-description">{step === "phone" ? "Andika nimero ya telefone yawe. Tuzakohereza kode yo kwinjiramo." : `Kode yoherejwe kuri ${phone}. Kode imara igihe gito kandi ikoreshwa rimwe gusa.`}</p>
          {authMethod === "email" ? <form className="auth-form" onSubmit={legacyEmailSignIn}>
            <p className="auth-warning">Ubu buryo ni ubw'abari basanzwe bafite konti ya email. Kwinjira kuri telefone ntibuhita buhuza konti za kera; ntukore konti nshya niba amakuru yawe yari kuri konti ishaje.</p>
            <label>Email<input required type="email" autoComplete="email" value={legacyEmail} onChange={e=>setLegacyEmail(e.target.value)} /></label>
            <label>Ijambo ry'ibanga<input required type="password" autoComplete="current-password" value={legacyPassword} onChange={e=>setLegacyPassword(e.target.value)} /></label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy ? "Tegereza..." : "Injira kuri konti isanzwe"}</button>
            <button type="button" className="auth-switch" onClick={()=>{setAuthMethod("phone");setError("");setMessage("");}}>Subira kuri telefone na SMS</button>
          </form> : step === "phone" ? <form className="auth-form" onSubmit={sendCode}>
            {mode === "signup" && <label>Amazina yose<input required autoComplete="name" value={fullName} onChange={e => setFullName(e.target.value)} /></label>}
            <label>Nimero ya telefone<input required autoComplete="tel" inputMode="tel" placeholder="+2507XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} /></label>
            <div className="auth-warning">Indangamuntu ntiragenzurwa n'iyi verisiyo kuko tutarahuzwa na serivisi yemewe yo kugenzura umwirondoro. Ntituzavuga ko yagenzuwe itaragenzurwa.</div>
            {error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-success" role="status">{message}</p>}
            <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy ? "Tegereza..." : "Ohereza kode ya SMS"}</button>
          </form> : <form className="auth-form" onSubmit={verifyCode}>
            <label>Kode wakiriye kuri SMS<input required inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={e => setCode(e.target.value)} /></label>
            {error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-success" role="status">{message}</p>}
            <button className="primary-button auth-submit" type="submit" disabled={busy || code.trim().length < 4}>{busy ? "Turagenzura..." : "Emeza kode winjire"}</button>
            <button type="button" className="auth-switch" onClick={() => { setStep("phone"); setCode(""); setMessage(""); setError(""); }}>Hindura nimero cyangwa wongere wohereze kode</button>
          </form>}
          {authMethod === "phone" && step === "phone" && <>
            <button className="auth-switch" onClick={() => {setMode(mode === "signin" ? "signup" : "signin"); setError(""); setMessage("");}}>{mode === "signin" ? "Nta konti ufite? Fungura konti" : "Usanzwe ufite konti? Injira"}</button>
            <button className="auth-switch" onClick={() => {setAuthMethod("email");setMode("signin");setError("");setMessage("");}}>Ufite konti ya kera? Injira ukoresheje email</button>
          </>}
        </>}
        <p className="auth-foot">Ntugire uwo uha kode ya SMS. Gukoresha SMS bisaba ko umushinga ushyiraho kandi ukishyura serivisi ya SMS provider.</p>
      </section>
    </main>
  );
}


type PenaltyRule = { id: string; group_id: string; title: string; reason: string; calculation_method: "fixed" | "daily" | "weekly" | "custom"; amount: number; grace_days: number; max_amount: number | null; is_active: boolean; approved_by: string | null };
type PenaltyRecord = { id: string; group_id: string; rule_id: string | null; member_label: string; reason: string; amount: number; due_date: string | null; days_late: number; status: "pending" | "approved" | "paid" | "cancelled"; created_at: string; payment_note: string };

function PenaltiesPage({ session }: { session: Session | null }) {
  const [groups, setGroups] = useState<{id:string;name:string}[]>([]);
  const [groupId, setGroupId] = useState("");
  const [rules, setRules] = useState<PenaltyRule[]>([]);
  const [penalties, setPenalties] = useState<PenaltyRecord[]>([]);
  const [title, setTitle] = useState("");
  const [ruleReason, setRuleReason] = useState("");
  const [method, setMethod] = useState<PenaltyRule["calculation_method"]>("fixed");
  const [amount, setAmount] = useState("500");
  const [graceDays, setGraceDays] = useState("0");
  const [memberLabel, setMemberLabel] = useState("");
  const [penaltyReason, setPenaltyReason] = useState("");
  const [selectedRuleId, setSelectedRuleId] = useState("");
  const [daysLate, setDaysLate] = useState("0");
  const [penaltyAmount, setPenaltyAmount] = useState("500");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0,10));
  const [approverId, setApproverId] = useState("");
  const [approverRole, setApproverRole] = useState<"leader"|"committee">("committee");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadData(selectedGroup?: string) {
    if (!supabase || !session) return;
    const { data: groupData, error: groupError } = await supabase.from("savings_groups").select("id,name").order("created_at", {ascending:false});
    if (groupError) { setError(groupError.message); return; }
    const owned = (groupData ?? []) as {id:string;name:string}[];
    setGroups(owned);
    const activeGroup = selectedGroup || groupId || owned[0]?.id || "";
    if (!groupId && activeGroup) setGroupId(activeGroup);
    if (!activeGroup) { setRules([]); setPenalties([]); return; }
    const [ruleResult, penaltyResult] = await Promise.all([
      supabase.from("group_penalty_rules").select("id,group_id,title,reason,calculation_method,amount,grace_days,max_amount,is_active,approved_by").eq("group_id", activeGroup).order("created_at", {ascending:false}),
      supabase.from("group_penalties").select("id,group_id,rule_id,member_label,reason,amount,due_date,days_late,status,created_at,payment_note").eq("group_id", activeGroup).order("created_at", {ascending:false})
    ]);
    if (ruleResult.error || penaltyResult.error) setError((ruleResult.error?.message || penaltyResult.error?.message || "") + " — Banza ukoreshe migration_v05_penalties_trial.sql muri Supabase.");
    else { setRules((ruleResult.data ?? []) as PenaltyRule[]); setPenalties((penaltyResult.data ?? []) as PenaltyRecord[]); }
  }
  useEffect(() => {
    const rule = rules.find(r => r.id === selectedRuleId && r.is_active);
    if (!rule || rule.calculation_method === "custom") return;
    const late = Math.max(0, Number(daysLate) - rule.grace_days);
    let calculated = rule.calculation_method === "fixed" ? rule.amount : rule.calculation_method === "daily" ? rule.amount * late : rule.amount * Math.ceil(late / 7);
    if (rule.max_amount !== null) calculated = Math.min(calculated, rule.max_amount);
    setPenaltyAmount(String(Math.max(0, calculated)));
  }, [rules, selectedRuleId, daysLate]);

  useEffect(() => { void loadData(); /* initial load */ }, [session]);
  useEffect(() => { if (groupId) void loadData(groupId); }, [groupId]);

  async function saveRule(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!supabase || !session || !groupId) return;
    setBusy(true); setError(""); setMessage("");
    const { error: saveError } = await supabase.from("group_penalty_rules").insert({ group_id: groupId, title: title.trim(), reason: ruleReason.trim(), calculation_method: method, amount: Number(amount), grace_days: Number(graceDays), is_active: false, created_by: session.user.id });
    if (saveError) setError(saveError.message); else { setTitle(""); setRuleReason(""); setMessage("Itegeko ryabitswe ritegereje kwemezwa n'ubifitiye ububasha."); await loadData(groupId); }
    setBusy(false);
  }
  async function approveRule(rule: PenaltyRule) {
    if (!supabase || !session) return; setError("");
    const { error: e } = await supabase.from("group_penalty_rules").update({ is_active: true, approved_by: session.user.id, approved_at: new Date().toISOString() }).eq("id", rule.id);
    if (e) setError(e.message); else { setMessage("Itegeko ryemejwe."); await loadData(groupId); }
  }
  async function savePenalty(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!supabase || !session || !groupId) return;
    setBusy(true); setError(""); setMessage("");
    const chosenRule = rules.find(r => r.id === selectedRuleId && r.is_active);
    if (!chosenRule) { setError("Hitamo itegeko ryemejwe mbere yo kwandika igihano."); setBusy(false); return; }
    const { error: saveError } = await supabase.from("group_penalties").insert({ group_id: groupId, rule_id: chosenRule.id, member_label: memberLabel.trim(), reason: penaltyReason.trim(), amount: Number(penaltyAmount), due_date: dueDate || null, days_late: Number(daysLate), created_by: session.user.id, status: "pending" });
    if (saveError) setError(saveError.message); else { setMemberLabel(""); setPenaltyReason(""); setMessage("Igihano cyanditswe kandi gitegereje kwemezwa."); await loadData(groupId); }
    setBusy(false);
  }
  async function updatePenalty(p: PenaltyRecord, status: "approved" | "paid" | "cancelled") {
    if (!supabase || !session) return; setError("");
    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === "approved") { updates.approved_by = session.user.id; updates.approved_at = new Date().toISOString(); }
    if (status === "paid") { updates.paid_by = session.user.id; updates.paid_at = new Date().toISOString(); }
    const { error: e } = await supabase.from("group_penalties").update(updates).eq("id", p.id);
    if (e) setError(e.message); else { setMessage(status === "approved" ? "Igihano cyemejwe." : status === "paid" ? "Ubwishyu bwanditswe. Ibi byemeza ko bwanditswe gusa, si ugukora Mobile Money." : "Igihano cyahagaritswe."); await loadData(groupId); }
  }
  async function addApprover(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!supabase || !session || !groupId) return;
    setError(""); setMessage("");
    const { error: e2 } = await supabase.from("group_penalty_approvers").insert({ group_id: groupId, user_id: approverId.trim(), approver_role: approverRole, added_by: session.user.id });
    if (e2) setError(e2.message); else { setApproverId(""); setMessage("Uburenganzira bw'umwemeza bwongeweho."); }
  }
  const methodLabel = (m: string) => ({fixed:"Amafaranga ahamye",daily:"Kuri buri munsi",weekly:"Kuri buri cyumweru",custom:"Uburyo bwihariye"}[m] || m);
  const statusLabel = (st: string) => ({pending:"Bitegereje kwemezwa",approved:"Byemejwe",paid:"Byishyuwe",cancelled:"Byahagaritswe"}[st] || st);

  return <section className="feature-page">
    <div className="feature-heading"><div><div className="eyebrow">ITSINDA RYACU · AMATEGEKO Y'ITSINDA</div><h1>Ibihano n'amande</h1><p>Buri tsinda rigena amategeko n'amafaranga. Ibyemezo n'ubwishyu bigira amateka.</p></div><span className="status-pill">{supabase && session ? "Bibikwa muri Supabase" : "Igerageza"}</span></div>
    {!supabase || !session ? <div className="feature-notice"><LockKeyhole size={17}/> Huza Supabase kandi winjire kugira ngo ubike amategeko n'ibihano.</div> : null}
    {error && <div className="feature-error" role="alert">{error}</div>}{message && <div className="feature-success" role="status">{message}</div>}
    <div className="panel penalty-selector"><label>Hitamo itsinda<select value={groupId} onChange={e => setGroupId(e.target.value)}><option value="">-- Hitamo itsinda --</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label><p className="report-footnote">Umuyobozi cyangwa komite igomba kubanza kugira uburenganzira. Umuyobozi w'itsinda ashobora kongeramo uwemeza akoresheje User ID ye ya Supabase.</p></div>
    <div className="feature-grid">
      <form className="panel feature-form" onSubmit={saveRule}><div className="panel-heading"><div><h2><Scale size={17}/> Shyiraho itegeko</h2><p>Itegeko ritangira gukora rimaze kwemezwa.</p></div></div>
        <label>Izina ry'itegeko<input required minLength={2} maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Urugero: Gutinda gutanga umusanzu" /></label>
        <label>Ibisobanuro<textarea maxLength={500} value={ruleReason} onChange={e=>setRuleReason(e.target.value)} placeholder="Itegeko ryemejwe n'abanyamuryango" rows={2}/></label>
        <label>Uburyo bwo kubara<select value={method} onChange={e=>setMethod(e.target.value as PenaltyRule["calculation_method"])}><option value="fixed">Amafaranga ahamye</option><option value="daily">Kuri buri munsi watinze</option><option value="weekly">Kuri buri cyumweru watinze</option><option value="custom">Uburyo bwihariye</option></select></label>
        <label>Umubare (RWF)<input required type="number" min="1" step="1" value={amount} onChange={e=>setAmount(e.target.value)}/></label>
        <label>Iminsi y'imbabazi mbere y'igihano<input required type="number" min="0" max="365" step="1" value={graceDays} onChange={e=>setGraceDays(e.target.value)}/></label>
        <button className="primary-button" type="submit" disabled={busy || !groupId}><Plus size={16}/> Bika itegeko</button>
      </form>
      <div className="panel group-list-panel"><div className="panel-heading"><div><h2><BadgeCheck size={17}/> Amategeko y'ibihano</h2><p>Kwemeza itegeko ni byo bituma ritangira gukoreshwa.</p></div></div>
        {!rules.length ? <div className="empty-state"><div className="empty-icon"><Scale size={25}/></div><strong>Nta tegeko rirandikwa</strong><p>Hitamo itsinda hanyuma ushyireho itegeko.</p></div> : <div className="group-records">{rules.map(r=><article className="group-record" key={r.id}><div className="group-record-top"><div><strong>{r.title}</strong><small>{methodLabel(r.calculation_method)} · {r.grace_days} iminsi y'imbabazi</small></div><span className={`group-status ${r.is_active ? "active" : "closed"}`}>{r.is_active ? "Ryemejwe" : "Ritegereje"}</span></div><div className="group-facts"><span>Igihano: <b>{money(r.amount)}</b></span></div>{r.reason && <small className="feature-muted">{r.reason}</small>}{!r.is_active && <button className="secondary-button" type="button" onClick={()=>void approveRule(r)}>Emeza itegeko</button>}</article>)}</div>}
      </div>
    </div>
    <div className="feature-grid">
      <form className="panel feature-form" onSubmit={savePenalty}><div className="panel-heading"><div><h2><Plus size={17}/> Andika igihano</h2><p>Igihano gitegereza kwemezwa mbere yo gufatwa nk'icyemewe.</p></div></div>
        <label>Itegeko ryemejwe<select required value={selectedRuleId} onChange={e=>setSelectedRuleId(e.target.value)}><option value="">-- Hitamo itegeko --</option>{rules.filter(r=>r.is_active).map(r=><option key={r.id} value={r.id}>{r.title} · {methodLabel(r.calculation_method)}</option>)}</select></label>
        <label>Izina ry'umunyamuryango<input required maxLength={120} value={memberLabel} onChange={e=>setMemberLabel(e.target.value)} /></label>
        <label>Impamvu y'igihano<textarea required minLength={2} maxLength={500} value={penaltyReason} onChange={e=>setPenaltyReason(e.target.value)} rows={2}/></label>
        <label>Iminsi yatinze<input required type="number" min="0" step="1" value={daysLate} onChange={e=>setDaysLate(e.target.value)}/></label>
        <label>Umubare w'igihano (RWF)<input required type="number" min="0" step="1" readOnly={!!selectedRuleId && rules.find(r=>r.id===selectedRuleId)?.calculation_method !== "custom"} value={penaltyAmount} onChange={e=>setPenaltyAmount(e.target.value)}/></label>
        <label>Itariki y'igikorwa cyangwa igihe ntarengwa<input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/></label>
        <button className="primary-button" type="submit" disabled={busy || !groupId || !rules.some(r=>r.is_active)}><Plus size={16}/> Andika igihano</button>
      </form>
      <div className="panel group-list-panel"><div className="panel-heading"><div><h2><History size={17}/> Ibihano byanditswe</h2><p>Ibikorwa byose bigira uko bihagaze.</p></div></div>
        {!penalties.length ? <div className="empty-state"><div className="empty-icon"><History size={25}/></div><strong>Nta gihano kirandikwa</strong><p>Ibihano by'itsinda bizagaragara hano.</p></div> : <div className="group-records">{penalties.map(p=><article className="group-record" key={p.id}><div className="group-record-top"><div><strong>{p.member_label}</strong><small>{p.created_at.slice(0,10)} · {p.reason}</small></div><span className={`group-status ${p.status === "approved" || p.status === "paid" ? "active" : "closed"}`}>{statusLabel(p.status)}</span></div><div className="group-facts"><span>Igihano: <b>{money(p.amount)}</b></span>{p.due_date && <span>Itariki: <b>{p.due_date}</b></span>}</div><div className="inline-actions">{p.status === "pending" && <button className="secondary-button" type="button" onClick={()=>void updatePenalty(p,"approved")}>Emeza</button>}{p.status === "approved" && <button className="secondary-button" type="button" onClick={()=>void updatePenalty(p,"paid")}>Andika ko yishyuwe</button>}{p.status !== "paid" && p.status !== "cancelled" && <button className="secondary-button" type="button" onClick={()=>void updatePenalty(p,"cancelled")}>Hagarika</button>}</div></article>)}</div>}
        <p className="report-footnote">“Andika ko yishyuwe” ibika inyandiko gusa; ntabwo ikora ubwishyu bwa Mobile Money cyangwa ngo yemeze amafaranga yakiriwe na banki.</p>
      </div>
    </div>
    <form className="panel feature-form approver-form" onSubmit={addApprover}><div className="panel-heading"><div><h2><UserPlus size={17}/> Ongeramo umuyobozi/komite wemerewe</h2><p>Andika Supabase User ID y'uwo uha uburenganzira.</p></div></div><label>User ID ya Supabase<input required value={approverId} onChange={e=>setApproverId(e.target.value)} placeholder="UUID y'umukoresha" /></label><label>Uruhare<select value={approverRole} onChange={e=>setApproverRole(e.target.value as "leader"|"committee")}><option value="leader">Umuyobozi</option><option value="committee">Komite</option></select></label><button className="secondary-button" type="submit" disabled={!groupId}>Ongeramo uwemeza</button></form>
  </section>;
}


function MembersPage({ session }: { session: Session | null }) {
  type Group = { id: string; name: string; start_date: string; planned_end_date: string | null; monthly_contribution: number; status: string };
  type Member = { id: string; group_id: string; full_name: string; phone: string; monthly_due: number; joined_at: string; is_active: boolean };
  type Contribution = { id: string; member_id: string; amount: number; paid_on: string; status: string; note: string };
  type Announcement = { id: string; title: string; message: string; created_at: string; send_status: string; total_recipients: number; sent_count: number; failed_count: number };
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [monthlyDue, setMonthlyDue] = useState("1000"); const [joinedAt, setJoinedAt] = useState(new Date().toISOString().slice(0,10));
  const [memberId, setMemberId] = useState(""); const [amount, setAmount] = useState(""); const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0,10)); const [note, setNote] = useState("");
  const [plannedEndDate, setPlannedEndDate] = useState(""); const [reminderDays, setReminderDays] = useState("7");
  const [announcementTitle, setAnnouncementTitle] = useState(""); const [announcementMessage, setAnnouncementMessage] = useState("");
  const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  useEffect(() => { if (!supabase || !session) return; void supabase.from("savings_groups").select("id,name,start_date,planned_end_date,monthly_contribution,status").order("created_at",{ascending:false}).then(({data,error:e})=>{if(e){setError(e.message);return;} const list=(data??[]).map((r:any)=>({...r,monthly_contribution:Number(r.monthly_contribution??0)})) as Group[];setGroups(list);if(list[0]){setGroupId(list[0].id);setPlannedEndDate(list[0].planned_end_date??"");}}); },[session]);
  async function refresh() { if(!supabase || !session || !groupId)return; setLoading(true);setError(""); const [m,c,a,g]=await Promise.all([
    supabase.from("group_members").select("id,group_id,full_name,phone,monthly_due,joined_at,is_active").eq("group_id",groupId).order("full_name"),
    supabase.from("group_member_contributions").select("id,member_id,amount,paid_on,status,note").eq("group_id",groupId).order("paid_on",{ascending:false}),
    supabase.from("group_announcements").select("id,title,message,created_at,send_status,total_recipients,sent_count,failed_count").eq("group_id",groupId).order("created_at",{ascending:false}).limit(20),
    supabase.from("savings_groups").select("planned_end_date,reminder_days_before").eq("id",groupId).maybeSingle()
  ]); const err=m.error||c.error||a.error||g.error; if(err)setError(err.message+" — Reba ko migration_v06_members_announcements.sql yashyizwe muri Supabase.");else{setMembers((m.data??[]) as Member[]);setContributions((c.data??[]).map((x:any)=>({...x,amount:Number(x.amount)})) as Contribution[]);setAnnouncements((a.data??[]) as Announcement[]);setPlannedEndDate(g.data?.planned_end_date??"");setReminderDays(String(g.data?.reminder_days_before??7));}setLoading(false); }
  useEffect(()=>{void refresh();},[groupId,session]);
  const selectedGroup=groups.find(g=>g.id===groupId);
  function dueMonths(joined:string){const start=new Date(joined+"T00:00:00");const now=new Date();if(start>now)return 0;return Math.max(0,(now.getFullYear()-start.getFullYear())*12+now.getMonth()-start.getMonth()+1);}
  async function addMember(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!supabase||!session||!groupId)return;setError("");setMessage("");const rawPhone=phone.trim().replace(/[\s()-]/g,"");const cleanPhone=rawPhone.startsWith("+")?rawPhone:rawPhone.startsWith("250")?`+${rawPhone}`:rawPhone.startsWith("0")?`+250${rawPhone.slice(1)}`:`+250${rawPhone}`;if(!/^\+[1-9]\d{7,14}$/.test(cleanPhone)){setError("Andika nimero yemewe, urugero +2507XXXXXXXX.");return;}const {error:e2}=await supabase.from("group_members").insert({group_id:groupId,full_name:name.trim(),phone:cleanPhone,monthly_due:Number(monthlyDue),joined_at:joinedAt,created_by:session.user.id});if(e2){setError(e2.message);return;}setName("");setPhone("");const {count}=await supabase.from("group_members").select("id",{count:"exact",head:true}).eq("group_id",groupId);if(typeof count==="number")await supabase.from("savings_groups").update({member_count:count}).eq("id",groupId);setMessage("Umunyamuryango yongewemo.");await refresh();}
  async function addContribution(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!supabase||!session||!groupId||!memberId)return;setError("");setMessage("");const {error:e2}=await supabase.from("group_member_contributions").insert({group_id:groupId,member_id:memberId,amount:Number(amount),paid_on:paidOn,note:note.trim(),status:"recorded",recorded_by:session.user.id});if(e2){setError(e2.message);return;}setAmount("");setNote("");setMessage("Ubwishyu bwanditswe. Bugomba kwemezwa mbere yo kubarwa nk'ubwishyu bwemejwe.");await refresh();}
  async function confirmContribution(c:Contribution){if(!supabase||!session)return;const {error:e}=await supabase.from("group_member_contributions").update({status:"confirmed",confirmed_by:session.user.id,confirmed_at:new Date().toISOString()}).eq("id",c.id);if(e)setError(e.message);else{setMessage("Ubwishyu bwemejwe.");await refresh();}}
  async function saveEndDate(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!supabase||!groupId)return;setError("");const {error:e2}=await supabase.from("savings_groups").update({planned_end_date:plannedEndDate||null,reminder_days_before:Number(reminderDays)}).eq("id",groupId);if(e2){setError(e2.message);return;}setGroups(gs=>gs.map(g=>g.id===groupId?{...g,planned_end_date:plannedEndDate||null}:g));setMessage("Itariki yo gusoza n'iminsi yo kwibutsa byabitswe. Kwibutsa kuri SMS bisaba scheduler/Edge Function.");}
  async function sendAnnouncement(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!supabase||!session||!groupId)return;setError("");setMessage("");const activeMembers=members.filter(m=>m.is_active&&m.phone.trim());if(!activeMembers.length){setError("Banza wongere abanyamuryango bafite nimero za telefone.");return;}const {data,error:e2}=await supabase.from("group_announcements").insert({group_id:groupId,title:announcementTitle.trim(),message:announcementMessage.trim(),created_by:session.user.id,send_status:"sending",total_recipients:activeMembers.length}).select("id").single();if(e2){setError(e2.message);return;}const {data:sendData,error:sendError}=await supabase.functions.invoke("send-group-announcement",{body:{announcement_id:data.id}});if(sendError){await supabase.from("group_announcements").update({send_status:"failed"}).eq("id",data.id);setError("Itangazo ryabitswe ariko SMS ntizoherejwe. Shyiraho Edge Function na SMS provider nk'uko biri muri README. Ibisobanuro: "+sendError.message);}else{setMessage(`Ibisubizo bya SMS: ${JSON.stringify(sendData)}`);}setAnnouncementTitle("");setAnnouncementMessage("");await refresh();}
  return <section className="feature-page"><div className="feature-heading"><div><div className="eyebrow">ITSINDA RYACU · v0.6</div><h1>Abanyamuryango, imisanzu n'amatangazo</h1><p>Reba uko buri muntu ahagaze, andika ubwishyu, teganya igihe cyo gusoza itsinda kandi utegure amatangazo.</p></div></div>
    {error&&<div className="feature-error"><ShieldCheck size={17}/>{error}</div>}{message&&<div className="feature-success"><CheckCircle2 size={17}/>{message}</div>}
    <div className="panel penalty-selector"><label>Hitamo itsinda<select value={groupId} onChange={e=>{setGroupId(e.target.value);setMemberId("");}}><option value="">-- Hitamo itsinda --</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label>{!groups.length&&<p>Banza ukore itsinda mu gice cy'Amatsinda.</p>}</div>
    {groupId&&<><div className="feature-grid">
      <form className="panel feature-form" onSubmit={addMember}><div className="panel-heading"><h2><UserPlus size={17}/> Ongeramo umunyamuryango</h2><p>Andika izina, telefone n'umusanzu uteganyijwe buri kwezi.</p></div><label>Izina ryuzuye<input required minLength={2} maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label><label>Nimero ya telefone<input required value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+2507XXXXXXXX"/></label><label>Umusanzu wa buri kwezi (RWF)<input required type="number" min="0" value={monthlyDue} onChange={e=>setMonthlyDue(e.target.value)}/></label><label>Itariki yinjiye mu itsinda<input required type="date" value={joinedAt} onChange={e=>setJoinedAt(e.target.value)}/></label><button className="primary-button" type="submit"><Plus size={16}/> Bika umunyamuryango</button></form>
      <form className="panel feature-form" onSubmit={addContribution}><div className="panel-heading"><h2><Wallet size={17}/> Andika umusanzu yatanze</h2><p>Ubwishyu bushya bubanza kuba butaremezwa.</p></div><label>Umunyamuryango<select required value={memberId} onChange={e=>setMemberId(e.target.value)}><option value="">-- Hitamo --</option>{members.map(m=><option key={m.id} value={m.id}>{m.full_name}</option>)}</select></label><label>Amafaranga (RWF)<input required type="number" min="1" step="1" value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>Itariki y'ubwishyu<input required type="date" value={paidOn} onChange={e=>setPaidOn(e.target.value)}/></label><label>Ibisobanuro (si ngombwa)<input value={note} onChange={e=>setNote(e.target.value)}/></label><button className="primary-button" type="submit" disabled={!members.length}><Plus size={16}/> Bika ubwishyu</button></form>
    </div>
    <div className="panel group-list-panel"><div className="panel-heading"><div><h2>Raporo ya buri munyamuryango</h2><p>Imisanzu yemejwe ni yo ibarwa nk'amafaranga amaze gutangwa. Ibarura riteganya umusanzu wa buri kwezi kuva mu kwezi yinjiyeho.</p></div></div>{loading?<p>Turimo kuzana amakuru...</p>:members.length===0?<div className="empty-state"><strong>Nta munyamuryango urandikwa</strong><p>Ongeramo abanyamuryango kugira ngo raporo ibare.</p></div>:<div className="group-records">{members.map(m=>{const paid=contributions.filter(c=>c.member_id===m.id&&c.status==="confirmed").reduce((n,c)=>n+c.amount,0);const expected=dueMonths(m.joined_at)*m.monthly_due;const remaining=Math.max(0,expected-paid);const pending=contributions.filter(c=>c.member_id===m.id&&c.status==="recorded").reduce((n,c)=>n+c.amount,0);const days=selectedGroup?.planned_end_date?Math.ceil((new Date(selectedGroup.planned_end_date+"T00:00:00").getTime()-new Date(new Date().toDateString()).getTime())/86400000):null;return <article className="group-record" key={m.id}><div className="group-record-top"><div><strong>{m.full_name}</strong><small>{m.phone} · Yinjiye: {m.joined_at}</small></div><span className={`group-status ${remaining===0?"active":"closed"}`}>{remaining===0?"Yujuje umusanzu":"Haracyabura"}</span></div><div className="group-facts"><span>Yagombaga gutanga: <b>{money(expected)}</b></span><span>Yemejwe ko yatanze: <b>{money(paid)}</b></span><span>Asigaje: <b>{money(remaining)}</b></span><span>Ubwishyu butaremezwa: <b>{money(pending)}</b></span><span>Umusanzu w'ukwezi: <b>{money(m.monthly_due)}</b></span>{days!==null&&<span>Igihe cyo gusoza: <b>{days<0?`Igihe cyarenzeho iminsi ${Math.abs(days)}`:`Hasigaye iminsi ${days}`}</b></span>}</div></article>})}</div>}</div>
    <div className="panel group-list-panel"><div className="panel-heading"><div><h2>Amateka y'imisanzu</h2><p>Kwemeza ubwishyu byemeza ko bwagenzuwe n'ubuyobozi bw'itsinda; si gihamya y'ubwishyu bwemejwe na banki.</p></div></div>{contributions.length===0?<p className="report-footnote">Nta musanzu urandikwa.</p>:<div className="group-records">{contributions.map(c=>{const member=members.find(m=>m.id===c.member_id);return <article className="group-record" key={c.id}><div className="group-record-top"><div><strong>{member?.full_name??"Umunyamuryango"} · {money(c.amount)}</strong><small>{c.paid_on}{c.note?` · ${c.note}`:""}</small></div><span className={`group-status ${c.status==="confirmed"?"active":"closed"}`}>{c.status==="confirmed"?"Byemejwe":c.status==="rejected"?"Byanzwe":"Bitegereje kwemezwa"}</span></div>{c.status==="recorded"&&<div className="inline-actions"><button className="secondary-button" type="button" onClick={()=>void confirmContribution(c)}>Emeza ubwishyu</button></div>}</article>})}</div>}</div>
    <div className="feature-grid"><form className="panel feature-form" onSubmit={saveEndDate}><div className="panel-heading"><h2><CalendarDays size={17}/> Igihe cyo gusoza itsinda</h2><p>Shyiraho itariki iteganyijwe n'iminsi yo kuburira mbere.</p></div><label>Itariki iteganyijwe yo gusoza<input type="date" value={plannedEndDate} onChange={e=>setPlannedEndDate(e.target.value)}/></label><label>Kwibutsa hasigaye iminsi<input type="number" min="0" max="90" value={reminderDays} onChange={e=>setReminderDays(e.target.value)}/></label><button className="primary-button" type="submit">Bika gahunda yo gusoza</button><p className="report-footnote">Iminsi isigaye ibarwa muri app. Kwibutsa byikora kuri SMS bisaba scheduler iteguwe kuri server.</p></form>
    <form className="panel feature-form" onSubmit={sendAnnouncement}><div className="panel-heading"><h2><MessageSquare size={17}/> Ohereza itangazo kuri SMS</h2><p>Ubutumwa bumwe bugenewe abanyamuryango bose bafite telefone muri iri tsinda.</p></div><label>Umutwe w'itangazo<input required minLength={2} maxLength={140} value={announcementTitle} onChange={e=>setAnnouncementTitle(e.target.value)}/></label><label>Ubutumwa<textarea required minLength={2} maxLength={1200} rows={4} value={announcementMessage} onChange={e=>setAnnouncementMessage(e.target.value)}/></label><p className="report-footnote">Abanyamuryango bazakira SMS gusa iyo Edge Function na SMS provider byashyizweho. Kohereza ubutumwa bishobora kugira ikiguzi.</p><button className="primary-button" type="submit" disabled={!members.some(m=>m.is_active&&m.phone.trim())}><Bell size={16}/> Ohereza itangazo</button></form></div>
    <div className="panel group-list-panel"><div className="panel-heading"><div><h2>Amatangazo aheruka</h2><p>Imiterere yo kohereza SMS n'umubare w'abagenewe ubutumwa.</p></div></div>{announcements.length===0?<p className="report-footnote">Nta tangazo rirabikwa.</p>:<div className="group-records">{announcements.map(a=><article className="group-record" key={a.id}><div className="group-record-top"><div><strong>{a.title}</strong><small>{a.created_at.slice(0,16).replace("T"," ")}</small></div><span className={`group-status ${a.send_status==="sent"?"active":"closed"}`}>{a.send_status}</span></div><p>{a.message}</p><div className="group-facts"><span>Abagenewe: <b>{a.total_recipients}</b></span><span>Byoherejwe: <b>{a.sent_count}</b></span><span>Byanze: <b>{a.failed_count}</b></span></div></article>)}</div>}</div></>}
  </section>;
}

function SubscriptionPage({ session }: { session: Session | null }) {
  const [groups, setGroups] = useState<{id:string;name:string}[]>([]);
  const [groupId, setGroupId] = useState("");
  const [subscription, setSubscription] = useState<{plan:string;trial_started_at:string;trial_ends_at:string;status:string;monthly_price_rwf:number}|null>(null);
  const [message, setMessage] = useState(""); const [error, setError] = useState("");
  useEffect(() => { if (!supabase || !session) return; void supabase.from("savings_groups").select("id,name").order("created_at",{ascending:false}).then(({data,error:e})=>{if(e){setError(e.message);return;}const list=(data??[]) as {id:string;name:string}[];setGroups(list);if(list[0])setGroupId(list[0].id);}); },[session]);
  useEffect(() => { if(!supabase || !session || !groupId)return; void supabase.from("group_subscriptions").select("plan,trial_started_at,trial_ends_at,status,monthly_price_rwf").eq("group_id",groupId).maybeSingle().then(({data,error:e})=>{if(e)setError(e.message);else setSubscription(data as typeof subscription);}); },[groupId,session]);
  async function startTrial() { if(!supabase || !session || !groupId)return; setError("");setMessage(""); const {error:e}=await supabase.from("group_subscriptions").insert({group_id:groupId,plan:"free",status:"trial",monthly_price_rwf:0}); if(e)setError(e.message);else{setMessage("Igihe cy'igerageza cy'amezi 3 cyatangiye."); const {data}=await supabase.from("group_subscriptions").select("plan,trial_started_at,trial_ends_at,status,monthly_price_rwf").eq("group_id",groupId).maybeSingle();setSubscription(data as typeof subscription);} }
  const daysLeft = subscription ? Math.max(0,Math.ceil((new Date(subscription.trial_ends_at).getTime()-Date.now())/86400000)) : 0;
  return <section className="feature-page"><div className="feature-heading"><div><div className="eyebrow">ITSINDA RYACU · UBURYO BW'UBUCURUZI</div><h1>Gahunda y'ubuntu na Pro</h1><p>Itsinda rigira amezi 3 yo kugerageza; nyuma rishobora guhitamo serivisi za Pro.</p></div><span className="status-pill">Igerageza</span></div>
    {error && <div className="feature-error" role="alert">{error}</div>}{message && <div className="feature-success" role="status">{message}</div>}
    <div className="panel penalty-selector"><label>Hitamo itsinda<select value={groupId} onChange={e=>setGroupId(e.target.value)}><option value="">-- Hitamo itsinda --</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
      {subscription ? <div className="trial-summary"><h2>Amakuru y'igerageza</h2><p>Gahunda: <b>{subscription.plan}</b> · Imiterere: <b>{subscription.status}</b></p><p>Ryatangiriye: {new Date(subscription.trial_started_at).toLocaleDateString()} · Rizarangira: {new Date(subscription.trial_ends_at).toLocaleDateString()}</p><strong>{daysLeft} iminsi isigaye</strong></div> : <><p>Ntiharashyirwaho igihe cy'igerageza kuri iri tsinda.</p><button className="primary-button" type="button" disabled={!groupId} onClick={()=>void startTrial()}><Timer size={16}/> Tangiza amezi 3 y'ubuntu</button></>}
    </div>
    <div className="feature-grid pricing-grid"><article className="panel"><div className="eyebrow">FREE</div><h2>Ubuntu</h2><h1>0 RWF</h1><p>Gushinga itsinda no gukoresha serivisi z'ibanze.</p><ul><li>Konti n'itsinda</li><li>Amakuru y'ibanze</li><li>Raporo y'ibanze</li></ul></article><article className="panel"><div className="eyebrow">PRO · ITSINDA RITO</div><h2>Pro</h2><h1>3,000 RWF <small>/ ukwezi</small></h1><p>Ibiciro by'igerageza; bizemezwa nyuma yo kugerageza ku matsinda.</p><ul><li>Raporo zirambuye</li><li>Gukurikirana ibihano n'ubwishyu bwanditswe</li><li>Serivisi z'inyongera uko zubakwa</li></ul></article><article className="panel"><div className="eyebrow">PRO · ITSINDA RISANZWE</div><h2>Pro</h2><h1>5,000 RWF <small>/ ukwezi</small></h1><p>Igiciro cy'igerageza ku matsinda afite ibikorwa byinshi.</p><ul><li>Raporo z'inyongera</li><li>Gukura no gufasha abakoresha benshi</li><li>Serivisi z'inyongera uko zubakwa</li></ul></article></div>
    <div className="feature-notice"><LockKeyhole size={17}/> Kwishyura kuri internet/Mobile Money ntibirahuzwa. Ntituzafunga konti cyangwa ngo twemeze ko Pro yishyuwe kugeza habonetse uburyo bwo kwishyura n'igenzura rya server.</div>
  </section>;
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
  const [mutuellePlans, setMutuellePlans] = useState<MutuellePlan[]>([]);
  const [mutuelleContributions, setMutuelleContributions] = useState<MutuelleContribution[]>([]);
  const [mutuelleLoading, setMutuelleLoading] = useState(false);
  const [mutuelleError, setMutuelleError] = useState("");
  const [mutuelleMessage, setMutuelleMessage] = useState("");
  const [householdLabel, setHouseholdLabel] = useState("");
  const [mutuelleTarget, setMutuelleTarget] = useState("20000");
  const [mutuelleDueDate, setMutuelleDueDate] = useState(new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().slice(0, 10));
  const [mutuelleFrequency, setMutuelleFrequency] = useState<"weekly" | "monthly">("monthly");
  const [mutuellePlanned, setMutuellePlanned] = useState("2000");
  const [selectedMutuellePlan, setSelectedMutuellePlan] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionDate, setContributionDate] = useState(new Date().toISOString().slice(0, 10));
  const [contributionNote, setContributionNote] = useState("");

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

  useEffect(() => {
    if (section !== "mutuelle" || !supabase || !session) return;
    let active = true;
    setMutuelleLoading(true);
    setMutuelleError("");
    Promise.all([
      supabase.from("mutuelle_savings_plans")
        .select("id,household_label,target_amount,due_date,frequency,planned_contribution,created_at")
        .order("created_at", { ascending: false }),
      supabase.from("mutuelle_savings_contributions")
        .select("id,plan_id,amount,contributed_on,note,verification_status")
        .order("contributed_on", { ascending: false }),
    ]).then(([plansResult, contributionsResult]) => {
      if (!active) return;
      if (plansResult.error || contributionsResult.error) {
        setMutuelleError((plansResult.error?.message || contributionsResult.error?.message || "") +
          " — Reba ko wakoresheje SQL migration ya Mutuelle muri Supabase.");
      } else {
        const plans = (plansResult.data ?? []).map((r: any) => ({
          id: r.id, household_label: r.household_label, target_amount: Number(r.target_amount),
          due_date: r.due_date, frequency: r.frequency, planned_contribution: Number(r.planned_contribution),
          created_at: r.created_at,
        })) as MutuellePlan[];
        setMutuellePlans(plans);
        setMutuelleContributions((contributionsResult.data ?? []).map((r: any) => ({
          id: r.id, plan_id: r.plan_id, amount: Number(r.amount), contributed_on: r.contributed_on,
          note: r.note ?? "", verification_status: r.verification_status,
        })) as MutuelleContribution[]);
        if (!selectedMutuellePlan && plans.length) setSelectedMutuellePlan(plans[0].id);
      }
      setMutuelleLoading(false);
    });
    return () => { active = false; };
  }, [section, session]);

  const createMutuellePlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMutuelleError(""); setMutuelleMessage("");
    const target = Number(mutuelleTarget), planned = Number(mutuellePlanned);
    if (!householdLabel.trim() || target <= 0 || planned <= 0 || !mutuelleDueDate) {
      setMutuelleError("Uzuza amakuru yose kandi amafaranga agomba kuba arenze zeru."); return;
    }
    const record = { household_label: householdLabel.trim(), target_amount: target, due_date: mutuelleDueDate,
      frequency: mutuelleFrequency, planned_contribution: planned };
    if (supabase && session) {
      const { data, error } = await supabase.from("mutuelle_savings_plans")
        .insert({ ...record, owner_id: session.user.id })
        .select("id,household_label,target_amount,due_date,frequency,planned_contribution,created_at").single();
      if (error) { setMutuelleError(error.message); return; }
      const newPlan = { ...record, id: data.id, created_at: data.created_at } as MutuellePlan;
      setMutuellePlans(current => [newPlan, ...current]); setSelectedMutuellePlan(newPlan.id);
      setMutuelleMessage("Intego yo kwizigamira Mutuelle yabitswe kuri Supabase.");
    } else {
      const newPlan = { ...record, id: crypto.randomUUID(), created_at: new Date().toISOString() } as MutuellePlan;
      setMutuellePlans(current => [newPlan, ...current]); setSelectedMutuellePlan(newPlan.id);
      setMutuelleMessage("Intego yanditswe muri demo gusa; ntizabikwa nyuma yo gufunga porogaramu.");
    }
    setHouseholdLabel("");
  };

  const addMutuelleContribution = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMutuelleError(""); setMutuelleMessage("");
    const amount = Number(contributionAmount);
    if (!selectedMutuellePlan || amount <= 0 || !contributionDate) {
      setMutuelleError("Hitamo intego, wandike amafaranga arenze zeru n'itariki."); return;
    }
    const record = { plan_id: selectedMutuellePlan, amount, contributed_on: contributionDate,
      note: contributionNote.trim(), verification_status: "recorded" as const };
    if (supabase && session) {
      const { data, error } = await supabase.from("mutuelle_savings_contributions")
        .insert({ ...record, owner_id: session.user.id })
        .select("id,plan_id,amount,contributed_on,note,verification_status").single();
      if (error) { setMutuelleError(error.message); return; }
      setMutuelleContributions(current => [{ ...record, id: data.id }, ...current]);
      setMutuelleMessage("Amafaranga yanditswe. Agomba kugenzurwa n'uwabishinzwe mbere yo gufatwa nk'ayemejwe.");
    } else {
      setMutuelleContributions(current => [{ ...record, id: crypto.randomUUID() }, ...current]);
      setMutuelleMessage("Amafaranga yanditswe muri demo gusa; ntabwo ari ubwishyu bwemejwe.");
    }
    setContributionAmount(""); setContributionNote("");
  };

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
      const { error: trialError } = await supabase.from("group_subscriptions").insert({ group_id: data.id, plan: "free", status: "trial", monthly_price_rwf: 0 });
      setGroupsMessage(trialError ? "Itsinda ryanditswe. Igihe cy'ubuntu nticyatangiye kubera ko migration_v05 itarashyirwa muri Supabase." : "Itsinda ryanditswe kandi amezi 3 y'igerageza yatangiye.");
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
          <span>Umutekano n'icyizere<br /><small>Prototype · v0.5</small></span>
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
                <div><div className="eyebrow">ITSINDA RYACU · V0.5</div><h1>{t("welcome")} 👋</h1><p>{t("subtitle")}</p></div>
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
          ) : section === "mutuelle" ? (
            <section className="feature-page">
              <div className="feature-heading"><div><div className="eyebrow">ITSINDA RYACU · KWITEGANYIRIZA</div><h1>Kwizigamira Mutuelle de Santé</h1>
                <p>Jya wizigamira make make kugira ngo igihe cyo kwishyura ubwisungane mu kwivuza kigeze, amafaranga asabwa abe yarateganyijwe. Aya ni amafaranga yo kwizigamira, ntabwo aba yishyuriye Mutuelle kugeza habonetse icyemezo cy'ubwishyu.</p></div>
                <span className="status-pill">{supabase && session ? "Konti yawe" : "Igerageza"}</span></div>
              {(!supabase || !session) && <div className="feature-notice"><LockKeyhole size={17}/> Iyi ni demo: amakuru yanditswe ntazaguma ahari nyuma yo gufunga porogaramu. Huza Supabase kandi ukoreshe migration iri muri <code>supabase/migration_mutuelle_savings_v04.sql</code> kugira ngo abikwe kuri server.</div>}
              {mutuelleError && <div className="feature-error" role="alert">{mutuelleError}</div>}
              {mutuelleMessage && <div className="feature-success" role="status">{mutuelleMessage}</div>}
              <div className="feature-grid">
                <form className="panel feature-form" onSubmit={createMutuellePlan}>
                  <div className="panel-heading"><div><h2><HeartPulse size={17}/> Teganya Mutuelle y'urugo</h2><p>Shyiraho intego y'amafaranga n'igihe uzayakenerera.</p></div></div>
                  <label>Izina ry'urugo cyangwa uwizigamira<input required value={householdLabel} onChange={e => setHouseholdLabel(e.target.value)} placeholder="Urugero: Urugo rwa Uwimana" /></label>
                  <label>Igiteranyo cy'amafaranga asabwa (RWF)<input required type="number" min="1" step="1" value={mutuelleTarget} onChange={e => setMutuelleTarget(e.target.value)} /></label>
                  <label>Itariki yo kuba amafaranga yuzuye<input required type="date" value={mutuelleDueDate} onChange={e => setMutuelleDueDate(e.target.value)} /></label>
                  <label>Uko uteganya kwizigama<select value={mutuelleFrequency} onChange={e => setMutuelleFrequency(e.target.value as "weekly" | "monthly")}><option value="weekly">Buri cyumweru</option><option value="monthly">Buri kwezi</option></select></label>
                  <label>Umubare uteganya kwizigama buri gihe (RWF)<input required type="number" min="1" step="1" value={mutuellePlanned} onChange={e => setMutuellePlanned(e.target.value)} /></label>
                  <button className="primary-button" type="submit"><Plus size={16}/> Bika intego</button>
                </form>
                <div className="panel group-list-panel">
                  <div className="panel-heading"><div><h2>Intego za Mutuelle</h2><p>Hitamo intego urebe ayo umaze kwizigama n'asigaye.</p></div></div>
                  {mutuelleLoading && <p className="feature-muted">Turimo gushaka amakuru...</p>}
                  {!mutuelleLoading && mutuellePlans.length === 0 && <div className="empty-state"><div className="empty-icon"><HeartPulse size={25}/></div><strong>Nta ntego irandikwa</strong><p>Tangira wandike amafaranga urugo ruzakenera kuri Mutuelle.</p></div>}
                  <div className="group-records">{mutuellePlans.map(plan => {
                    const saved = mutuelleContributions.filter(c => c.plan_id === plan.id).reduce((sum, c) => sum + c.amount, 0);
                    const remaining = Math.max(0, plan.target_amount - saved);
                    const progress = Math.min(100, Math.round(saved / plan.target_amount * 100));
                    const daysLeft = Math.ceil((new Date(plan.due_date + "T00:00:00").getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);
                    return <article className="group-record" key={plan.id}>
                      <div className="group-record-top"><div><strong>{plan.household_label}</strong><small>Itariki ntarengwa: {plan.due_date}</small></div><span className={`group-status ${remaining === 0 ? "active" : "closed"}`}>{remaining === 0 ? "Intego yuzuye" : "Irakomeje"}</span></div>
                      <div className="group-facts"><span>Intego: <b>{money(plan.target_amount)}</b></span><span>Yazigamwe: <b>{money(saved)}</b></span><span>Hasigaye: <b>{money(remaining)}</b></span><span>Gahunda: <b>{money(plan.planned_contribution)} / {plan.frequency === "weekly" ? "icyumweru" : "ukwezi"}</b></span><span>Iminsi isigaye: <b>{daysLeft < 0 ? "Igihe cyarenze" : daysLeft}</b></span></div>
                      <div className="progress-track"><span style={{ width: `${progress}%` }}/></div><div className="progress-caption">{progress}% by'intego</div>
                      <div className="inline-actions"><button type="button" className="secondary-button" onClick={() => setSelectedMutuellePlan(plan.id)}>{selectedMutuellePlan === plan.id ? "Ni yo wahisemo" : "Hitamo iyi ntego"}</button></div>
                    </article>;
                  })}</div>
                </div>
              </div>
              <div className="feature-grid">
                <form className="panel feature-form" onSubmit={addMutuelleContribution}>
                  <div className="panel-heading"><div><h2><Plus size={17}/> Andika amafaranga wizigamye</h2><p>Andika amafaranga watanze cyangwa wabitse.</p></div></div>
                  <label>Intego ya Mutuelle<select required value={selectedMutuellePlan} onChange={e => setSelectedMutuellePlan(e.target.value)}><option value="">-- Hitamo intego --</option>{mutuellePlans.map(p => <option key={p.id} value={p.id}>{p.household_label} · {money(p.target_amount)}</option>)}</select></label>
                  <label>Umubare w'amafaranga (RWF)<input required type="number" min="1" step="1" value={contributionAmount} onChange={e => setContributionAmount(e.target.value)} /></label>
                  <label>Itariki<input required type="date" value={contributionDate} onChange={e => setContributionDate(e.target.value)} /></label>
                  <label>Ibisobanuro (si ngombwa)<input value={contributionNote} onChange={e => setContributionNote(e.target.value)} placeholder="Urugero: kwizigama kwa mbere" /></label>
                  <button className="primary-button" type="submit" disabled={!mutuellePlans.length}><Plus size={16}/> Andika kwizigama</button>
                </form>
                <div className="panel group-list-panel">
                  <div className="panel-heading"><div><h2>Amateka yo kwizigama</h2><p>Amakuru agaragaza amafaranga yanditswe kuri buri ntego.</p></div></div>
                  {mutuelleContributions.length === 0 ? <div className="empty-state"><div className="empty-icon"><History size={25}/></div><strong>Nta mafaranga yanditswe</strong><p>Amateka azagaragara hano umaze kwandika amafaranga.</p></div> :
                    <div className="group-records">{mutuelleContributions.map(c => {
                      const plan = mutuellePlans.find(p => p.id === c.plan_id);
                      return <article className="group-record" key={c.id}><div className="group-record-top"><div><strong>{money(c.amount)}</strong><small>{plan?.household_label || "Intego ya Mutuelle"} · {c.contributed_on}</small></div><span className={`group-status ${c.verification_status === "confirmed" ? "active" : "closed"}`}>{c.verification_status === "confirmed" ? "Byemejwe" : "Bitegereje igenzura"}</span></div>{c.note && <small className="feature-muted">{c.note}</small>}</article>;
                    })}</div>}
                  <p className="report-footnote">Icyitonderwa: ayo mafaranga abanza kwandikwa nk'ayateganyijwe/atanzwe mu kwizigama. Ntabwo porogaramu yemeza ko amafaranga nyayo yakiriwe cyangwa ko Mutuelle yishyuwe itarabanje kugenzurwa n'uburyo bwemewe.</p>
                </div>
              </div>
            </section>
          ) : section === "members" ? (
            <MembersPage session={session} />
          ) : section === "penalties" ? (
            <PenaltiesPage session={session} />
          ) : section === "subscription" ? (
            <SubscriptionPage session={session} />
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