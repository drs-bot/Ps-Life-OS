import React, { useState, useEffect, useRef, useMemo, useCallback, useContext, createContext } from "react";
import {
  LayoutDashboard, CalendarDays, Flame, Dumbbell, BookOpen, Guitar, Wallet,
  Package, Trophy, BarChart3, Bot, Sun, Moon, Cloud, CloudRain, Plus, X,
  Check, ChevronLeft, ChevronRight, Sparkles, Send, TrendingUp, TrendingDown,
  Clock, Droplet, Globe2, BookMarked, Timer, Target, Award, Zap, Users,
  ShoppingBag, DollarSign, PlayCircle, PauseCircle, RotateCcw, Trash2,
  Edit3, ChevronDown, Star, CheckCircle2, Circle, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, PieChart, Pie, Cell
} from "recharts";

/* ============================== DESIGN TOKENS ============================== */
const T = {
  bg: "#08080D",
  bgGrad: "radial-gradient(1200px 600px at 15% -10%, rgba(124,106,239,0.16), transparent 60%), radial-gradient(1000px 500px at 100% 0%, rgba(47,217,168,0.08), transparent 55%), #08080D",
  surface: "rgba(255,255,255,0.045)",
  surfaceSolid: "#111117",
  surfaceHover: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.09)",
  borderSoft: "rgba(255,255,255,0.05)",
  violet: "#7C6AEF",
  violetGlow: "#9B8CFF",
  mint: "#2FD9A8",
  gold: "#E8B75A",
  rose: "#F2707A",
  text: "#F3F3F7",
  textMuted: "#8D8DA3",
  textFaint: "#5B5B6E",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
`;

const WEEKDAYS = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
const WEEKDAYS_SHORT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

/* Pedro's fixed weekly schedule. day: 1=Mon..5=Fri */
const FIXED_SCHEDULE = [
  { id: "escola-1", day: 1, start: "07:30", end: "15:30", title: "Escola", cat: "escola", color: T.textMuted },
  { id: "escola-2", day: 2, start: "07:30", end: "15:30", title: "Escola", cat: "escola", color: T.textMuted },
  { id: "escola-3", day: 3, start: "07:30", end: "15:30", title: "Escola", cat: "escola", color: T.textMuted },
  { id: "escola-4", day: 4, start: "07:30", end: "15:30", title: "Escola", cat: "escola", color: T.textMuted },
  { id: "escola-5", day: 5, start: "07:30", end: "13:00", title: "Escola", cat: "escola", color: T.textMuted },
  { id: "estudos-seg", day: 1, start: "15:30", end: "16:30", title: "Grupo de Estudos", cat: "estudos", color: T.mint },
  { id: "basquete-seg", day: 1, start: "16:30", end: "17:30", title: "Basquete", cat: "esporte", color: T.gold },
  { id: "gamedesign-qui", day: 4, start: "15:30", end: "16:45", title: "Game Design Club", cat: "estudos", color: T.mint },
  { id: "guitarra-qua", day: 3, start: "17:00", end: "18:00", title: "Aula de Guitarra", cat: "guitarra", color: T.violetGlow },
  { id: "volei-sex", day: 5, start: "14:00", end: "15:00", title: "Vôlei", cat: "esporte", color: T.gold },
];
const SLEEP = { bed: "21:45", wake: "06:00" };

/* ============================== HELPERS ============================== */
const pad = (n) => String(n).padStart(2, "0");
const todayISO = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const timeToMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const minToTime = (m) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const fmtEUR = (n) => `€${n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtBRL = (n) => `R$${n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

function greeting(hour) {
  if (hour < 5) return "Ainda acordado, Pedro?";
  if (hour < 12) return "Bom dia, Pedro";
  if (hour < 18) return "Boa tarde, Pedro";
  return "Boa noite, Pedro";
}

/* ============================== DEFAULT DATA ============================== */
function defaultData() {
  return {
    tasks: [
      { id: uid(), title: "Revisar pedidos PSPrints", date: todayISO(), done: false, cat: "psprints" },
      { id: uid(), title: "30 min de inglês", date: todayISO(), done: false, cat: "estudos" },
    ],
    habits: [
      { id: "agua", name: "Água (2L)", icon: "Droplet", history: {} },
      { id: "ingles", name: "Inglês", icon: "Globe2", history: {} },
      { id: "guitarra", name: "Guitarra", icon: "Guitar", history: {} },
      { id: "academia", name: "Academia", icon: "Dumbbell", history: {} },
      { id: "leitura", name: "Leitura", icon: "BookMarked", history: {} },
      { id: "sono", name: "Dormir no horário", icon: "Moon", history: {} },
    ],
    gym: { logs: [] },
    study: {
      subjects: ["Escola", "Inglês", "Game Design", "Leitura", "Projetos"],
      sessions: [],
      weeklyGoalMinutes: 300,
    },
    guitar: { sessions: [], weeklyGoalMinutes: 180 },
    finance: {
      goalEUR: 3500,
      eurToBRL: 6.0,
      entries: [],
    },
    psprints: {
      clients: [],
      orders: [],
    },
    gamification: { xp: 0, achievementsUnlocked: [] },
    aiChat: [],
    onboarded: true,
  };
}

const HABIT_ICONS = { Droplet, Globe2, Guitar, Dumbbell, BookMarked, Moon };

/* ============================== RESPONSIVE ============================== */
const ViewportContext = createContext(false);
function useIsMobile() { return useContext(ViewportContext); }
function useViewportWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return w;
}

/* ============================== STORAGE ============================== */
const STORAGE_KEY = "ps-life-os-v1";

/* ============================== PRIMITIVES ============================== */
function GlassCard({ children, style, className = "", onClick, hover = false }) {
  const [h, setH] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setH(true)}
      onMouseLeave={() => hover && setH(false)}
      className={className}
      style={{
        background: h ? T.surfaceHover : T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 18,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        transition: "all .25s cubic-bezier(.4,0,.2,1)",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Pill({ children, color = T.violet, style }) {
  return (
    <span style={{
      fontFamily: "Inter", fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
      padding: "4px 10px", borderRadius: 999, color,
      background: color + "1a", border: `1px solid ${color}33`, ...style
    }}>{children}</span>
  );
}

function IconBtn({ icon: Icon, onClick, size = 16, style }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 30, height: 30, borderRadius: 9, border: "none", cursor: "pointer",
        background: h ? T.surfaceHover : "transparent", color: h ? T.text : T.textMuted,
        transition: "all .15s", ...style
      }}>
      <Icon size={size} strokeWidth={2} />
    </button>
  );
}

function TextInput(props) {
  return (
    <input {...props}
      style={{
        fontFamily: "Inter", fontSize: 14, color: T.text, background: "rgba(255,255,255,0.05)",
        border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px",
        outline: "none", width: "100%", ...props.style
      }}
    />
  );
}

function Button({ children, onClick, variant = "primary", style, icon: Icon, disabled }) {
  const styles = {
    primary: { background: T.violet, color: "#fff", border: "1px solid " + T.violet },
    ghost: { background: "transparent", color: T.text, border: `1px solid ${T.border}` },
    subtle: { background: "rgba(255,255,255,0.06)", color: T.text, border: "1px solid transparent" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "Inter",
      fontSize: 13.5, fontWeight: 600, padding: "9px 14px", borderRadius: 10,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
      transition: "all .15s", ...styles[variant], ...style
    }}>
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}

/* Radial gauge - signature dashboard element */
function LifeGauge({ score, size = 220 }) {
  const r = size / 2 - 14;
  const c = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 100);
    return () => clearTimeout(t);
  }, [score]);
  const offset = c - (animated / 100) * c;
  const color = score >= 80 ? T.mint : score >= 55 ? T.gold : T.rose;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1), stroke 0.6s" }} />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center"
      }}>
        <div style={{ fontFamily: "JetBrains Mono", fontSize: 44, fontWeight: 700, color: T.text, lineHeight: 1 }}>
          {Math.round(animated)}
        </div>
        <div style={{ fontFamily: "Inter", fontSize: 12, color: T.textMuted, marginTop: 6, letterSpacing: 0.5 }}>
          LIFE SCORE
        </div>
      </div>
    </div>
  );
}

function MiniRing({ pct, color, size = 46, label }) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={4} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
            strokeDasharray={c} strokeDashoffset={c - (clamp(pct, 0, 100) / 100) * c} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset .8s" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "JetBrains Mono", fontSize: 11, fontWeight: 700, color: T.text }}>
          {Math.round(pct)}
        </div>
      </div>
      <div style={{ fontFamily: "Inter", fontSize: 10.5, color: T.textMuted }}>{label}</div>
    </div>
  );
}

/* ============================== APP ============================== */
export default function PSLifeOS() {
  const [data, setData] = useState(defaultData());
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("dashboard");
  const [now, setNow] = useState(new Date());
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("data");
        if (res && res.value) setData({ ...defaultData(), ...JSON.parse(res.value) });
      } catch (e) { /* first run, use defaults */ }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try { await window.storage.set("data", JSON.stringify(data)); } catch (e) { console.error(e); }
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [data, loaded]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const addXP = useCallback((amount) => {
    setData((d) => ({ ...d, gamification: { ...d.gamification, xp: d.gamification.xp + amount } }));
  }, []);

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "calendar", label: "Calendário", icon: CalendarDays },
    { id: "habits", label: "Hábitos", icon: Flame },
    { id: "gym", label: "Academia", icon: Dumbbell },
    { id: "study", label: "Estudos", icon: BookOpen },
    { id: "guitar", label: "Guitarra", icon: Guitar },
    { id: "finance", label: "Finanças", icon: Wallet },
    { id: "psprints", label: "PSPrints", icon: Package },
    { id: "gamification", label: "Conquistas", icon: Trophy },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "ai", label: "IA Executiva", icon: Bot },
  ];

  const width = useViewportWidth();
  const isMobile = width < 860;

  if (!loaded) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg }}>
        <style>{FONTS}</style>
        <div style={{ fontFamily: "Outfit", color: T.textMuted, fontSize: 14 }}>Carregando PS Life OS…</div>
      </div>
    );
  }

  return (
    <ViewportContext.Provider value={isMobile}>
      <div style={{
        minHeight: "100vh", background: T.bgGrad, color: T.text, fontFamily: "Inter",
        display: "flex", flexDirection: isMobile ? "column" : "row"
      }}>
        <style>{`
          ${FONTS}
          * { box-sizing: border-box; }
          html, body { -webkit-text-size-adjust: 100%; }
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 8px; }
          ::-webkit-scrollbar-track { background: transparent; }
          input:focus, textarea:focus, select:focus { border-color: ${T.violet} !important; }
          input::placeholder, textarea::placeholder { color: ${T.textFaint}; }
          button { font-family: 'Inter'; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(6px);} to { opacity:1; transform: translateY(0);} }
          .fade-in { animation: fadeIn .35s cubic-bezier(.4,0,.2,1); }
          @media (max-width: 520px) {
            .ps-grid-auto { grid-template-columns: 1fr !important; }
          }
        `}</style>

        {!isMobile && <Sidebar nav={nav} view={view} setView={setView} />}

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <TopBar now={now} data={data} isMobile={isMobile} />
          <div key={view} className="fade-in" style={{
            flex: 1, overflowY: "auto",
            padding: isMobile ? "14px 14px 90px" : "20px 28px 40px",
          }}>
            {view === "dashboard" && <Dashboard data={data} setData={setData} now={now} />}
            {view === "calendar" && <CalendarView data={data} setData={setData} />}
            {view === "habits" && <HabitsView data={data} setData={setData} addXP={addXP} />}
            {view === "gym" && <GymView data={data} setData={setData} addXP={addXP} />}
            {view === "study" && <StudyView data={data} setData={setData} addXP={addXP} />}
            {view === "guitar" && <GuitarView data={data} setData={setData} addXP={addXP} />}
            {view === "finance" && <FinanceView data={data} setData={setData} />}
            {view === "psprints" && <PSPrintsView data={data} setData={setData} />}
            {view === "gamification" && <GamificationView data={data} />}
            {view === "analytics" && <AnalyticsView data={data} />}
            {view === "ai" && <AIView data={data} setData={setData} />}
          </div>
        </div>

        {isMobile && <BottomNav nav={nav} view={view} setView={setView} />}
      </div>
    </ViewportContext.Provider>
  );
}

function BottomNav({ nav, view, setView }) {
  return (
    <div style={{
      position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 40,
      display: "flex", overflowX: "auto", gap: 2, padding: "8px 8px calc(8px + env(safe-area-inset-bottom))",
      background: "rgba(10,10,15,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderTop: `1px solid ${T.borderSoft}`,
    }}>
      {nav.map((n) => {
        const active = view === n.id;
        return (
          <button key={n.id} onClick={() => setView(n.id)} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0,
            minWidth: 60, padding: "6px 4px", borderRadius: 10, border: "none", cursor: "pointer",
            background: active ? T.surfaceHover : "transparent",
          }}>
            <n.icon size={17} strokeWidth={2} color={active ? T.violetGlow : T.textMuted} />
            <span style={{ fontSize: 9.5, fontWeight: active ? 600 : 500, color: active ? T.text : T.textFaint, whiteSpace: "nowrap" }}>{n.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ============================== SIDEBAR ============================== */
function Sidebar({ nav, view, setView }) {
  return (
    <div style={{
      width: 232, flexShrink: 0, borderRight: `1px solid ${T.borderSoft}`,
      display: "flex", flexDirection: "column", padding: "22px 14px", position: "sticky", top: 0, height: "100vh"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px", marginBottom: 30 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg, ${T.violet}, ${T.violetGlow})`,
          display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 20px ${T.violet}55`
        }}>
          <Zap size={17} color="#fff" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 15, lineHeight: 1.1 }}>PS Life OS</div>
          <div style={{ fontFamily: "Inter", fontSize: 10.5, color: T.textFaint }}>Sistema pessoal</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {nav.map((n) => {
          const active = view === n.id;
          return (
            <button key={n.id} onClick={() => setView(n.id)} style={{
              display: "flex", alignItems: "center", gap: 11, padding: "9px 12px", borderRadius: 10,
              border: "none", cursor: "pointer", textAlign: "left",
              background: active ? T.surfaceHover : "transparent",
              color: active ? T.text : T.textMuted,
              transition: "all .15s", position: "relative"
            }}>
              {active && <div style={{ position: "absolute", left: -14, top: "20%", bottom: "20%", width: 3, borderRadius: 3, background: T.violet }} />}
              <n.icon size={16.5} strokeWidth={2} color={active ? T.violetGlow : T.textMuted} />
              <span style={{ fontSize: 13.5, fontWeight: active ? 600 : 500 }}>{n.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: "auto", padding: "12px 8px" }}>
        <div style={{ fontSize: 10.5, color: T.textFaint, fontFamily: "Inter" }}>PS Life OS · Ultimate Edition</div>
      </div>
    </div>
  );
}

/* ============================== TOPBAR ============================== */
function TopBar({ now, data, isMobile }) {
  const [weather] = useState({ temp: 21, condition: "clear" });
  const nextEvent = useMemo(() => getNextEvent(now, data), [now, data]);
  const hour = now.getHours();

  if (isMobile) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", gap: 10,
        padding: "14px 14px 12px", borderBottom: `1px solid ${T.borderSoft}`,
        position: "sticky", top: 0, zIndex: 30, background: "rgba(8,8,13,0.85)", backdropFilter: "blur(16px)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 8, background: `linear-gradient(135deg, ${T.violet}, ${T.violetGlow})`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              <Zap size={14} color="#fff" strokeWidth={2.5} />
            </div>
            <div style={{ fontFamily: "Outfit", fontSize: 16.5, fontWeight: 700, lineHeight: 1.1 }}>{greeting(hour)}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <Clock size={13} color={T.violetGlow} />
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 12.5, fontWeight: 600 }}>{pad(now.getHours())}:{pad(now.getMinutes())}</span>
            <Sun size={13} color={T.gold} style={{ marginLeft: 4 }} />
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 12.5, fontWeight: 600 }}>{weather.temp}°</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.textMuted, overflow: "hidden" }}>
          <Target size={13} color={T.mint} style={{ flexShrink: 0 }} />
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Próximo: <b style={{ color: T.text }}>{nextEvent ? nextEvent.title : "livre"}</b>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "18px 28px", borderBottom: `1px solid ${T.borderSoft}`, flexWrap: "wrap", gap: 12
    }}>
      <div>
        <div style={{ fontFamily: "Outfit", fontSize: 22, fontWeight: 700 }}>{greeting(hour)}</div>
        <div style={{ fontFamily: "Inter", fontSize: 12.5, color: T.textMuted, marginTop: 2 }}>
          {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <GlassCard style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <Sun size={15} color={T.gold} />
          <span style={{ fontFamily: "JetBrains Mono", fontSize: 13, fontWeight: 600 }}>{weather.temp}°C</span>
        </GlassCard>
        <GlassCard style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <Clock size={15} color={T.violetGlow} />
          <span style={{ fontFamily: "JetBrains Mono", fontSize: 13, fontWeight: 600 }}>
            {pad(now.getHours())}:{pad(now.getMinutes())}
          </span>
        </GlassCard>
        <GlassCard style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, borderColor: T.violet + "44" }}>
          <Target size={15} color={T.mint} />
          <span style={{ fontFamily: "Inter", fontSize: 12.5, color: T.textMuted }}>
            Próximo: <b style={{ color: T.text }}>{nextEvent ? nextEvent.title : "livre"}</b>
          </span>
        </GlassCard>
      </div>
    </div>
  );
}

function getScheduleForDay(day) {
  return FIXED_SCHEDULE.filter((e) => e.day === day).sort((a, b) => timeToMin(a.start) - timeToMin(b.start));
}

function getNextEvent(now, data) {
  const day = now.getDay();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const todays = getScheduleForDay(day);
  const extraToday = (data.tasks || []).filter((t) => t.date === todayISO(now) && !t.done);
  const upcoming = todays.find((e) => timeToMin(e.start) > nowMin);
  if (upcoming) return upcoming;
  if (extraToday.length) return { title: extraToday[0].title };
  return null;
}

/* Free time slots today, given fixed schedule + sleep window */
function freeSlotsToday(now) {
  const day = now.getDay();
  const events = getScheduleForDay(day);
  const wake = timeToMin(SLEEP.wake);
  const bed = timeToMin(SLEEP.bed);
  const nowMin = Math.max(now.getHours() * 60 + now.getMinutes(), wake);
  let cursor = nowMin;
  const slots = [];
  for (const e of events) {
    const s = timeToMin(e.start), en = timeToMin(e.end);
    if (en <= cursor) continue;
    if (s > cursor) slots.push([cursor, Math.min(s, bed)]);
    cursor = Math.max(cursor, en);
  }
  if (cursor < bed) slots.push([cursor, bed]);
  return slots.filter(([s, e]) => e - s >= 15);
}

/* ============================== DASHBOARD ============================== */
function computeLifeScore(data, now) {
  const iso = todayISO(now);
  // Sleep: assume on-track unless habit marked false explicitly
  const sleepHabit = data.habits.find((h) => h.id === "sono");
  const sleepScore = sleepHabit && sleepHabit.history[iso] === false ? 40 : sleepHabit?.history[iso] ? 100 : 70;

  const studyToday = (data.study.sessions || []).filter((s) => s.date === iso).reduce((a, s) => a + s.minutes, 0);
  const studyScore = clamp((studyToday / 45) * 100, 0, 100);

  const gymToday = (data.gym.logs || []).some((l) => l.date === iso);
  const guitarToday = (data.guitar.sessions || []).some((s) => s.date === iso);
  const exerciseScore = clamp((gymToday ? 60 : 0) + (guitarToday ? 20 : 0) + (getScheduleForDay(now.getDay()).some(e => e.cat === "esporte") ? 20 : 0), 0, 100);

  const habitsMarked = data.habits.filter((h) => h.history[iso] === true).length;
  const habitsScore = (habitsMarked / data.habits.length) * 100;

  const finTotal = (data.finance.entries || []).reduce((a, e) => a + (e.type === "income" ? e.amount : 0), 0);
  const financeScore = clamp((finTotal / data.finance.goalEUR) * 100, 0, 100);

  const tasksToday = (data.tasks || []).filter((t) => t.date === iso);
  const orgScore = tasksToday.length ? (tasksToday.filter((t) => t.done).length / tasksToday.length) * 100 : 60;

  const categories = { Sono: sleepScore, Estudos: studyScore, Exercício: exerciseScore, Hábitos: habitsScore, Finanças: financeScore, Organização: orgScore };
  const overall = Object.values(categories).reduce((a, b) => a + b, 0) / 6;
  return { overall, categories };
}

function Dashboard({ data, setData, now }) {
  const isMobile = useIsMobile();
  const { overall, categories } = useMemo(() => computeLifeScore(data, now), [data, now]);
  const iso = todayISO(now);
  const tasksToday = (data.tasks || []).filter((t) => t.date === iso);
  const habitsToday = data.habits.filter((h) => h.history[iso] === true).length;
  const freeSlots = freeSlotsToday(now);
  const freeMinutes = freeSlots.reduce((a, [s, e]) => a + (e - s), 0);
  const finTotal = (data.finance.entries || []).reduce((a, e) => a + (e.type === "income" ? e.amount : 0), 0);
  const finPct = clamp((finTotal / data.finance.goalEUR) * 100, 0, 100);
  const [newTask, setNewTask] = useState("");

  const addTask = () => {
    if (!newTask.trim()) return;
    setData((d) => ({ ...d, tasks: [...d.tasks, { id: uid(), title: newTask.trim(), date: iso, done: false, cat: "geral" }] }));
    setNewTask("");
  };
  const toggleTask = (id) => setData((d) => ({ ...d, tasks: d.tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t) }));
  const removeTask = (id) => setData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));

  const todaysAgenda = useMemo(() => {
    const fixed = getScheduleForDay(now.getDay()).map((e) => ({ ...e, kind: "fixed" }));
    return fixed.sort((a, b) => timeToMin(a.start) - timeToMin(b.start));
  }, [now]);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "300px 1fr 300px",
      gap: isMobile ? 14 : 18
    }}>
      {/* LEFT: Life score + rings */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, order: isMobile ? 1 : 0 }}>
        <GlassCard style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <LifeGauge score={overall} size={190} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 18, width: "100%" }}>
            <MiniRing pct={categories.Sono} color={T.violetGlow} label="Sono" />
            <MiniRing pct={categories.Estudos} color={T.mint} label="Estudos" />
            <MiniRing pct={categories.Exercício} color={T.gold} label="Exercício" />
            <MiniRing pct={categories.Hábitos} color={T.rose} label="Hábitos" />
            <MiniRing pct={categories.Finanças} color={T.violet} label="Finanças" />
            <MiniRing pct={categories.Organização} color={T.textMuted} label="Organização" />
          </div>
        </GlassCard>

        <GlassCard style={{ padding: 18 }}>
          <SectionTitle icon={Target} title="Meta financeira" />
          <div style={{ fontFamily: "JetBrains Mono", fontSize: 26, fontWeight: 700, marginTop: 8 }}>
            {fmtEUR(finTotal)} <span style={{ fontSize: 14, color: T.textMuted, fontWeight: 500 }}>/ {fmtEUR(data.finance.goalEUR)}</span>
          </div>
          <ProgressBar pct={finPct} color={T.gold} style={{ marginTop: 10 }} />
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 8 }}>
            Faltam <b style={{ color: T.text }}>{fmtEUR(Math.max(0, data.finance.goalEUR - finTotal))}</b> para a meta.
          </div>
        </GlassCard>
      </div>

      {/* CENTER: Agenda + Tasks */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0, order: isMobile ? 0 : 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12 }}>
          <StatCard icon={Clock} label="Tempo livre hoje" value={`${Math.floor(freeMinutes / 60)}h${pad(freeMinutes % 60)}`} color={T.mint} />
          <StatCard icon={CheckCircle2} label="Tarefas concluídas" value={`${tasksToday.filter(t=>t.done).length}/${tasksToday.length}`} color={T.violetGlow} />
          <StatCard icon={Flame} label="Hábitos hoje" value={`${habitsToday}/${data.habits.length}`} color={T.gold} />
        </div>

        <GlassCard style={{ padding: 18 }}>
          <SectionTitle icon={CalendarDays} title="Agenda de hoje" />
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {todaysAgenda.length === 0 && <EmptyRow text="Nenhum compromisso fixo hoje." />}
            {todaysAgenda.map((e) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,0.03)" }}>
                <div style={{ width: 3, height: 28, borderRadius: 3, background: e.color }} />
                <div style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: T.textMuted, width: 92 }}>{e.start}–{e.end}</div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{e.title}</div>
              </div>
            ))}
            {freeSlots.map(([s, e], i) => (
              <div key={"free" + i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", borderRadius: 10, border: `1px dashed ${T.border}` }}>
                <div style={{ width: 3, height: 28, borderRadius: 3, background: "transparent" }} />
                <div style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: T.mint, width: 92 }}>{minToTime(s)}–{minToTime(e)}</div>
                <div style={{ fontSize: 13, color: T.textMuted }}>Tempo livre · {e - s} min</div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard style={{ padding: 18 }}>
          <SectionTitle icon={CheckCircle2} title="Tarefas do dia" />
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <TextInput placeholder="Adicionar tarefa…" value={newTask} onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()} />
            <Button icon={Plus} onClick={addTask}>Add</Button>
          </div>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            {tasksToday.length === 0 && <EmptyRow text="Nenhuma tarefa para hoje. Adicione uma acima." />}
            {tasksToday.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", borderRadius: 9 }}>
                <IconBtn icon={t.done ? CheckCircle2 : Circle} onClick={() => toggleTask(t.id)} style={{ color: t.done ? T.mint : T.textMuted }} />
                <div style={{ flex: 1, fontSize: 13.5, textDecoration: t.done ? "line-through" : "none", color: t.done ? T.textFaint : T.text }}>{t.title}</div>
                <IconBtn icon={Trash2} onClick={() => removeTask(t.id)} />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* RIGHT: widgets */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, order: isMobile ? 2 : 2 }}>
        <GlassCard style={{ padding: 18 }}>
          <SectionTitle icon={Sparkles} title="Widget · Semana" />
          <WeekProgressMini data={data} now={now} />
        </GlassCard>
        <GlassCard style={{ padding: 18 }}>
          <SectionTitle icon={Guitar} title="Guitarra" />
          <MinutesThisWeek sessions={data.guitar.sessions} goal={data.guitar.weeklyGoalMinutes} color={T.violetGlow} />
        </GlassCard>
        <GlassCard style={{ padding: 18 }}>
          <SectionTitle icon={BookOpen} title="Estudos" />
          <MinutesThisWeek sessions={data.study.sessions} goal={data.study.weeklyGoalMinutes} color={T.mint} />
        </GlassCard>
        <GlassCard style={{ padding: 18 }}>
          <SectionTitle icon={Package} title="PSPrints" />
          <div style={{ marginTop: 10, fontFamily: "JetBrains Mono", fontSize: 22, fontWeight: 700 }}>
            {fmtBRL(monthlyRevenue(data.psprints.orders))}
          </div>
          <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 2 }}>receita este mês</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 8 }}>
            {data.psprints.orders.filter(o => o.status !== "concluído").length} pedidos ativos
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function monthlyRevenue(orders) {
  const now = new Date();
  return (orders || []).filter((o) => {
    const d = new Date(o.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((a, o) => a + Number(o.value || 0), 0);
}

function WeekProgressMini({ data, now }) {
  const start = new Date(now); start.setDate(now.getDate() - now.getDay());
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i);
    return d;
  });
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
      {days.map((d, i) => {
        const iso = todayISO(d);
        const { overall } = computeLifeScore(data, d);
        const isToday = iso === todayISO(now);
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
              background: isToday ? T.violet : "rgba(255,255,255,0.05)",
              fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 700,
              color: isToday ? "#fff" : (overall > 60 ? T.mint : T.textMuted)
            }}>
              {Math.round(overall)}
            </div>
            <div style={{ fontSize: 10, color: T.textFaint }}>{WEEKDAYS_SHORT[i]}</div>
          </div>
        );
      })}
    </div>
  );
}

function MinutesThisWeek({ sessions, goal, color }) {
  const now = new Date();
  const start = new Date(now); start.setDate(now.getDate() - now.getDay());
  const total = (sessions || []).filter((s) => new Date(s.date) >= start).reduce((a, s) => a + s.minutes, 0);
  const pct = clamp((total / goal) * 100, 0, 100);
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontFamily: "JetBrains Mono", fontSize: 20, fontWeight: 700 }}>{total}<span style={{ fontSize: 12, color: T.textMuted }}> / {goal} min</span></div>
      <ProgressBar pct={pct} color={color} style={{ marginTop: 8 }} />
    </div>
  );
}

function ProgressBar({ pct, color, style }) {
  return (
    <div style={{ height: 6, borderRadius: 6, background: "rgba(255,255,255,0.07)", overflow: "hidden", ...style }}>
      <div style={{ height: "100%", width: `${clamp(pct, 0, 100)}%`, background: color, borderRadius: 6, transition: "width .6s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <GlassCard style={{ padding: 14 }}>
      <Icon size={16} color={color} />
      <div style={{ fontFamily: "JetBrains Mono", fontSize: 20, fontWeight: 700, marginTop: 8 }}>{value}</div>
      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{label}</div>
    </GlassCard>
  );
}

function SectionTitle({ icon: Icon, title, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon size={15} color={T.violetGlow} />
        <span style={{ fontFamily: "Outfit", fontSize: 14.5, fontWeight: 600 }}>{title}</span>
      </div>
      {right}
    </div>
  );
}

function EmptyRow({ text }) {
  return <div style={{ fontSize: 12.5, color: T.textFaint, padding: "10px 4px" }}>{text}</div>;
}

/* ============================== CALENDAR ============================== */
function CalendarView({ data, setData }) {
  const isMobile = useIsMobile();
  const [weekOffset, setWeekOffset] = useState(0);
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() + weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const [showAdd, setShowAdd] = useState(null); // date iso
  const [form, setForm] = useState({ title: "", start: "18:00", end: "19:00" });

  const eventsForDay = (d) => {
    const fixed = getScheduleForDay(d.getDay());
    const iso = todayISO(d);
    const custom = (data.tasks || []).filter((t) => t.date === iso && t.customTime).map((t) => ({ id: t.id, title: t.title, start: t.start, end: t.end, color: T.violet, cat: "custom" }));
    return [...fixed, ...custom].sort((a, b) => timeToMin(a.start) - timeToMin(b.start));
  };

  const addEvent = (iso) => {
    if (!form.title.trim()) return;
    setData((d) => ({ ...d, tasks: [...d.tasks, { id: uid(), title: form.title, date: iso, done: false, cat: "geral", customTime: true, start: form.start, end: form.end }] }));
    setForm({ title: "", start: "18:00", end: "19:00" });
    setShowAdd(null);
  };

  const HOUR_START = 6, HOUR_END = 23;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontFamily: "Outfit", fontSize: 20, fontWeight: 700 }}>
          {start.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – {days[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <IconBtn icon={ChevronLeft} onClick={() => setWeekOffset((w) => w - 1)} />
          <Button variant="ghost" onClick={() => setWeekOffset(0)}>Hoje</Button>
          <IconBtn icon={ChevronRight} onClick={() => setWeekOffset((w) => w + 1)} />
        </div>
      </div>

      <GlassCard style={{ padding: 0, overflow: isMobile ? "auto" : "hidden" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "50px repeat(7, 120px)" : "60px repeat(7, 1fr)",
          minWidth: isMobile ? 890 : "auto",
        }}>
          <div />
          {days.map((d, i) => {
            const isToday = todayISO(d) === todayISO(today);
            return (
              <div key={i} style={{ padding: "12px 8px", textAlign: "center", borderLeft: `1px solid ${T.borderSoft}`, borderBottom: `1px solid ${T.borderSoft}` }}>
                <div style={{ fontSize: 11, color: T.textMuted }}>{WEEKDAYS_SHORT[i]}</div>
                <div style={{
                  fontFamily: "JetBrains Mono", fontSize: 15, fontWeight: 700, marginTop: 2,
                  color: isToday ? "#fff" : T.text,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 26, height: 26, borderRadius: 8, background: isToday ? T.violet : "transparent"
                }}>{d.getDate()}</div>
              </div>
            );
          })}
          {/* hour rows */}
          {Array.from({ length: HOUR_END - HOUR_START }, (_, h) => h + HOUR_START).map((h) => (
            <React.Fragment key={h}>
              <div style={{ fontSize: 10.5, color: T.textFaint, textAlign: "right", paddingRight: 8, height: 46, position: "relative", top: -6 }}>
                {pad(h)}:00
              </div>
              {days.map((d, i) => {
                const iso = todayISO(d);
                const evts = eventsForDay(d).filter((e) => Math.floor(timeToMin(e.start) / 60) === h);
                return (
                  <div key={i} onClick={() => setShowAdd(iso)} style={{ height: 46, borderLeft: `1px solid ${T.borderSoft}`, borderTop: `1px solid ${T.borderSoft}`, position: "relative", cursor: "pointer" }}>
                    {evts.map((e) => {
                      const durMin = timeToMin(e.end) - timeToMin(e.start);
                      const topOffset = ((timeToMin(e.start) % 60) / 60) * 46;
                      const h2 = Math.max((durMin / 60) * 46, 18);
                      return (
                        <div key={e.id} title={`${e.title} ${e.start}-${e.end}`} style={{
                          position: "absolute", left: 2, right: 2, top: topOffset, height: h2,
                          background: (e.color || T.violet) + "26", borderLeft: `2.5px solid ${e.color || T.violet}`,
                          borderRadius: 5, padding: "2px 5px", fontSize: 10, overflow: "hidden", color: T.text, fontWeight: 500,
                        }}>{e.title}</div>
                      );
                    })}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </GlassCard>

      {showAdd && (
        <Modal onClose={() => setShowAdd(null)} title={`Novo evento · ${showAdd}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <TextInput placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <div style={{ display: "flex", gap: 8 }}>
              <TextInput type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
              <TextInput type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
            </div>
            <Button onClick={() => addEvent(showAdd)}>Adicionar evento</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose, title }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(380px, 92vw)", background: T.surfaceSolid, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: "Outfit", fontWeight: 600, fontSize: 15 }}>{title}</div>
          <IconBtn icon={X} onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

/* ============================== HABITS ============================== */
function HabitsView({ data, setData, addXP }) {
  const toggle = (habitId, iso) => {
    setData((d) => ({
      ...d,
      habits: d.habits.map((h) => {
        if (h.id !== habitId) return h;
        const cur = h.history[iso];
        const next = cur === true ? false : true;
        return { ...h, history: { ...h.history, [iso]: next } };
      }),
    }));
    addXP(5);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {data.habits.map((h) => (
        <HabitRow key={h.id} habit={h} onToggle={(iso) => toggle(h.id, iso)} />
      ))}
    </div>
  );
}

function calcStreaks(history) {
  const dates = Object.keys(history).filter((k) => history[k]).sort();
  if (!dates.length) return { current: 0, best: 0 };
  let best = 1, cur = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const currD = new Date(dates[i]);
    const diff = (currD - prev) / 86400000;
    if (diff === 1) { cur++; best = Math.max(best, cur); } else { cur = 1; }
  }
  // is current streak still active (last date is today or yesterday)?
  const last = new Date(dates[dates.length - 1]);
  const diffFromToday = (new Date(todayISO()) - new Date(todayISO(last))) / 86400000;
  const currentActive = diffFromToday <= 1 ? cur : 0;
  return { current: currentActive, best };
}

function HabitRow({ habit, onToggle }) {
  const Icon = HABIT_ICONS[habit.icon] || Flame;
  const { current, best } = calcStreaks(habit.history);
  const days = 182; // ~6 months heatmap
  const today = new Date();
  const cells = Array.from({ length: days }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (days - 1 - i));
    return d;
  });
  const consistency = useMemo(() => {
    const last30 = cells.slice(-30);
    const done = last30.filter((d) => habit.history[todayISO(d)]).length;
    return Math.round((done / 30) * 100);
  }, [habit.history]);

  return (
    <GlassCard style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: T.violet + "22", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={17} color={T.violetGlow} />
          </div>
          <div>
            <div style={{ fontFamily: "Outfit", fontWeight: 600, fontSize: 14.5 }}>{habit.name}</div>
            <div style={{ fontSize: 11.5, color: T.textMuted }}>Consistência (30d): {consistency}%</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 18 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 18, fontWeight: 700, color: T.gold }}>{current}🔥</div>
            <div style={{ fontSize: 10, color: T.textMuted }}>sequência</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 18, fontWeight: 700 }}>{best}</div>
            <div style={{ fontSize: 10, color: T.textMuted }}>recorde</div>
          </div>
          <Button variant={habit.history[todayISO()] ? "primary" : "ghost"} onClick={() => onToggle(todayISO())} icon={Check}>
            Hoje
          </Button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(26, 1fr)`, gap: 3, marginTop: 16 }}>
        {chunk(cells, 7).map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {week.map((d, di) => {
              const iso = todayISO(d);
              const done = d.getTime() <= today.getTime() ? habit.history[iso] : undefined;
              return (
                <div key={di} title={iso} onClick={() => d <= today && onToggle(iso)} style={{
                  width: "100%", aspectRatio: "1", borderRadius: 3, cursor: d <= today ? "pointer" : "default",
                  background: done === true ? T.mint : done === false ? "rgba(242,112,122,0.35)" : "rgba(255,255,255,0.05)",
                }} />
              );
            })}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/* ============================== GYM ============================== */
function GymView({ data, setData, addXP }) {
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ weight: "", chest: "", waist: "", arm: "", notes: "" });
  const logs = [...(data.gym.logs || [])].sort((a, b) => new Date(a.date) - new Date(b.date));

  const addLog = () => {
    if (!form.weight) return;
    setData((d) => ({ ...d, gym: { ...d.gym, logs: [...d.gym.logs, { id: uid(), date: todayISO(), ...form, weight: Number(form.weight) }] } }));
    setForm({ weight: "", chest: "", waist: "", arm: "", notes: "" });
    addXP(15);
  };

  const chartData = logs.map((l) => ({ date: l.date.slice(5), peso: l.weight }));

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "340px 1fr", gap: isMobile ? 14 : 18 }}>
      <GlassCard style={{ padding: 18 }}>
        <SectionTitle icon={Dumbbell} title="Registrar treino de hoje" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
          <LabeledInput label="Peso (kg)" value={form.weight} onChange={(v) => setForm({ ...form, weight: v })} type="number" />
          <div style={{ display: "flex", gap: 8 }}>
            <LabeledInput label="Peito (cm)" value={form.chest} onChange={(v) => setForm({ ...form, chest: v })} type="number" />
            <LabeledInput label="Cintura (cm)" value={form.waist} onChange={(v) => setForm({ ...form, waist: v })} type="number" />
          </div>
          <LabeledInput label="Braço (cm)" value={form.arm} onChange={(v) => setForm({ ...form, arm: v })} type="number" />
          <LabeledInput label="Notas do treino" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
          <Button onClick={addLog} icon={Plus}>Salvar registro</Button>
        </div>
      </GlassCard>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <GlassCard style={{ padding: 18 }}>
          <SectionTitle icon={TrendingUp} title="Evolução do peso" />
          <div style={{ height: 220, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gW" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={T.violet} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={T.violet} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" stroke={T.textFaint} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={T.textFaint} fontSize={11} tickLine={false} axisLine={false} domain={["dataMin - 2", "dataMax + 2"]} />
                <Tooltip contentStyle={{ background: T.surfaceSolid, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12 }} />
                <Area type="monotone" dataKey="peso" stroke={T.violetGlow} fill="url(#gW)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
            {chartData.length === 0 && <EmptyChartHint />}
          </div>
        </GlassCard>

        <GlassCard style={{ padding: 18 }}>
          <SectionTitle icon={Clock} title="Histórico de registros" />
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflowY: "auto" }}>
            {[...logs].reverse().map((l) => (
              <div key={l.id} style={{ display: "flex", gap: 14, fontSize: 12.5, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 9 }}>
                <span style={{ color: T.textMuted, width: 80 }}>{l.date}</span>
                <span><b>{l.weight}kg</b></span>
                {l.chest && <span>Peito {l.chest}cm</span>}
                {l.waist && <span>Cintura {l.waist}cm</span>}
                {l.arm && <span>Braço {l.arm}cm</span>}
              </div>
            ))}
            {logs.length === 0 && <EmptyRow text="Nenhum registro ainda." />}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function EmptyChartHint() {
  return <div style={{ textAlign: "center", fontSize: 12, color: T.textFaint, marginTop: -140 }}>Adicione registros para ver o gráfico</div>;
}

function LabeledInput({ label, value, onChange, type = "text" }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>{label}</div>
      <TextInput type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/* ============================== STUDY (Pomodoro + Subjects) ============================== */
function usePomodoro(onComplete) {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [duration, setDuration] = useState(25);
  const ref = useRef(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) { clearInterval(ref.current); setRunning(false); onComplete(duration); return duration * 60; }
          return s - 1;
        });
      }, 1000);
    } else clearInterval(ref.current);
    return () => clearInterval(ref.current);
  }, [running]);

  const reset = (min) => { clearInterval(ref.current); setRunning(false); setDuration(min); setSeconds(min * 60); };
  return { seconds, running, setRunning, duration, reset };
}

function StudyView({ data, setData, addXP }) {
  const isMobile = useIsMobile();
  const [subject, setSubject] = useState(data.study.subjects[0]);
  const pomo = usePomodoro((min) => {
    setData((d) => ({ ...d, study: { ...d.study, sessions: [...d.study.sessions, { id: uid(), date: todayISO(), subject, minutes: min }] } }));
    addXP(min);
  });
  const now = new Date();
  const start = new Date(now); start.setDate(now.getDate() - now.getDay());
  const weekSessions = data.study.sessions.filter((s) => new Date(s.date) >= start);
  const weekTotal = weekSessions.reduce((a, s) => a + s.minutes, 0);

  const bySubject = data.study.subjects.map((s) => ({
    name: s, minutes: data.study.sessions.filter((x) => x.subject === s).reduce((a, x) => a + x.minutes, 0)
  }));

  const mm = pad(Math.floor(pomo.seconds / 60)), ss = pad(pomo.seconds % 60);

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "320px 1fr", gap: isMobile ? 14 : 18 }}>
      <GlassCard style={{ padding: 22, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <SectionTitle icon={Timer} title="Pomodoro" />
        <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{
          marginTop: 14, width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`,
          borderRadius: 10, color: T.text, padding: "9px 10px", fontSize: 13
        }}>
          {data.study.subjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ fontFamily: "JetBrains Mono", fontSize: 56, fontWeight: 700, margin: "26px 0 10px" }}>{mm}:{ss}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[15, 25, 45].map((m) => (
            <Button key={m} variant={pomo.duration === m ? "primary" : "ghost"} onClick={() => pomo.reset(m)}>{m}m</Button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <Button icon={pomo.running ? PauseCircle : PlayCircle} onClick={() => pomo.setRunning((r) => !r)}>
            {pomo.running ? "Pausar" : "Iniciar"}
          </Button>
          <Button variant="ghost" icon={RotateCcw} onClick={() => pomo.reset(pomo.duration)}>Zerar</Button>
        </div>
      </GlassCard>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <StatCard icon={Clock} label="Minutos esta semana" value={weekTotal} color={T.mint} />
          <StatCard icon={Target} label="Meta semanal" value={`${data.study.weeklyGoalMinutes} min`} color={T.violet} />
        </div>
        <GlassCard style={{ padding: 18 }}>
          <SectionTitle icon={BarChart3} title="Minutos por matéria" />
          <div style={{ height: 220, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySubject}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" stroke={T.textFaint} fontSize={10.5} tickLine={false} axisLine={false} />
                <YAxis stroke={T.textFaint} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: T.surfaceSolid, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="minutes" fill={T.mint} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
        <GlassCard style={{ padding: 18 }}>
          <SectionTitle icon={Clock} title="Sessões recentes" />
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
            {[...data.study.sessions].reverse().slice(0, 20).map((s) => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "7px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                <span>{s.subject}</span><span style={{ color: T.textMuted }}>{s.minutes} min · {s.date}</span>
              </div>
            ))}
            {data.study.sessions.length === 0 && <EmptyRow text="Nenhuma sessão registrada ainda." />}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

/* ============================== GUITAR ============================== */
function GuitarView({ data, setData, addXP }) {
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ minutes: 20, technique: "", song: "" });
  const totalHours = (data.guitar.sessions.reduce((a, s) => a + s.minutes, 0) / 60).toFixed(1);
  const now = new Date();
  const start = new Date(now); start.setDate(now.getDate() - now.getDay());
  const weekMin = data.guitar.sessions.filter((s) => new Date(s.date) >= start).reduce((a, s) => a + s.minutes, 0);

  const add = () => {
    setData((d) => ({ ...d, guitar: { ...d.guitar, sessions: [...d.guitar.sessions, { id: uid(), date: todayISO(), ...form, minutes: Number(form.minutes) }] } }));
    addXP(Number(form.minutes));
    setForm({ minutes: 20, technique: "", song: "" });
  };

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    const iso = todayISO(d);
    return { date: iso.slice(5), min: data.guitar.sessions.filter((s) => s.date === iso).reduce((a, s) => a + s.minutes, 0) };
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "320px 1fr", gap: isMobile ? 14 : 18 }}>
      <GlassCard style={{ padding: 18 }}>
        <SectionTitle icon={Guitar} title="Registrar prática" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
          <LabeledInput label="Minutos praticados" type="number" value={form.minutes} onChange={(v) => setForm({ ...form, minutes: v })} />
          <LabeledInput label="Técnica trabalhada" value={form.technique} onChange={(v) => setForm({ ...form, technique: v })} />
          <LabeledInput label="Música" value={form.song} onChange={(v) => setForm({ ...form, song: v })} />
          <Button onClick={add} icon={Plus}>Salvar sessão</Button>
        </div>
      </GlassCard>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12 }}>
          <StatCard icon={Clock} label="Horas totais" value={`${totalHours}h`} color={T.violetGlow} />
          <StatCard icon={Target} label="Esta semana" value={`${weekMin} min`} color={T.mint} />
          <StatCard icon={Award} label="Meta semanal" value={`${data.guitar.weeklyGoalMinutes} min`} color={T.gold} />
        </div>
        <GlassCard style={{ padding: 18 }}>
          <SectionTitle icon={BarChart3} title="Últimos 14 dias" />
          <div style={{ height: 200, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last14}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" stroke={T.textFaint} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={T.textFaint} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: T.surfaceSolid, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="min" fill={T.violetGlow} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
        <GlassCard style={{ padding: 18 }}>
          <SectionTitle icon={Music2Fallback} title="Músicas & técnicas recentes" />
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
            {[...data.guitar.sessions].reverse().slice(0, 15).map((s) => (
              <div key={s.id} style={{ fontSize: 12.5, padding: "7px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
                <span>{s.song || s.technique || "Prática livre"}</span>
                <span style={{ color: T.textMuted }}>{s.minutes} min</span>
              </div>
            ))}
            {data.guitar.sessions.length === 0 && <EmptyRow text="Nenhuma sessão ainda." />}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
function Music2Fallback(props) { return <Guitar {...props} />; }

/* ============================== FINANCE ============================== */
function FinanceView({ data, setData }) {
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ type: "income", amount: "", desc: "", currency: "EUR" });
  const entries = [...data.finance.entries].sort((a, b) => new Date(b.date) - new Date(a.date));
  const total = data.finance.entries.reduce((a, e) => a + (e.type === "income" ? e.amount : -e.amount), 0);
  const income = data.finance.entries.filter(e => e.type === "income").reduce((a, e) => a + e.amount, 0);
  const expense = data.finance.entries.filter(e => e.type === "expense").reduce((a, e) => a + e.amount, 0);
  const pct = clamp((income / data.finance.goalEUR) * 100, 0, 100);

  const add = () => {
    if (!form.amount) return;
    setData((d) => ({ ...d, finance: { ...d.finance, entries: [...d.finance.entries, { id: uid(), date: todayISO(), type: form.type, amount: Number(form.amount), desc: form.desc, currency: form.currency }] } }));
    setForm({ ...form, amount: "", desc: "" });
  };

  // monthly projection based on Aug 2026 - Jun 2027 (11 months)
  const monthsLeft = 11;
  const remaining = Math.max(0, data.finance.goalEUR - income);
  const perMonth = remaining / monthsLeft;

  const byMonth = useMemo(() => {
    const map = {};
    data.finance.entries.filter(e => e.type === "income").forEach(e => {
      const k = e.date.slice(0, 7);
      map[k] = (map[k] || 0) + e.amount;
    });
    return Object.entries(map).sort().map(([k, v]) => ({ month: k.slice(5), receita: v }));
  }, [data.finance.entries]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: isMobile ? 14 : 18 }}>
      <GlassCard style={{ padding: 22, gridColumn: isMobile ? "span 1" : "span 3" }}>
        <SectionTitle icon={Target} title={`Meta: ${fmtEUR(data.finance.goalEUR)}`} />
        <div style={{ fontFamily: "JetBrains Mono", fontSize: 34, fontWeight: 700, marginTop: 10 }}>
          {fmtEUR(income)} <span style={{ fontSize: 15, color: T.textMuted, fontWeight: 500 }}>arrecadados</span>
        </div>
        <ProgressBar pct={pct} color={T.gold} style={{ marginTop: 12, height: 10 }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12.5, color: T.textMuted }}>
          <span>Faltam <b style={{ color: T.text }}>{fmtEUR(remaining)}</b></span>
          <span>≈ <b style={{ color: T.text }}>{fmtEUR(Math.round(perMonth))}</b>/mês até jun/2027</span>
        </div>
      </GlassCard>

      <GlassCard style={{ padding: 18 }}>
        <SectionTitle icon={Plus} title="Novo lançamento" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant={form.type === "income" ? "primary" : "ghost"} onClick={() => setForm({ ...form, type: "income" })} icon={ArrowUpRight} style={{ flex: 1 }}>Receita</Button>
            <Button variant={form.type === "expense" ? "primary" : "ghost"} onClick={() => setForm({ ...form, type: "expense" })} icon={ArrowDownRight} style={{ flex: 1 }}>Despesa</Button>
          </div>
          <LabeledInput label="Valor (EUR)" type="number" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} />
          <LabeledInput label="Descrição" value={form.desc} onChange={(v) => setForm({ ...form, desc: v })} />
          <Button onClick={add}>Adicionar</Button>
        </div>
      </GlassCard>

      <GlassCard style={{ padding: 18 }}>
        <SectionTitle icon={BarChart3} title="Receita por mês" />
        <div style={{ height: 190, marginTop: 10 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="month" stroke={T.textFaint} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={T.textFaint} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: T.surfaceSolid, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="receita" fill={T.gold} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <GlassCard style={{ padding: 18 }}>
        <SectionTitle icon={Wallet} title="Resumo" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
          <RowStat label="Receitas totais" value={fmtEUR(income)} color={T.mint} />
          <RowStat label="Despesas totais" value={fmtEUR(expense)} color={T.rose} />
          <RowStat label="Saldo" value={fmtEUR(total)} color={T.text} />
        </div>
      </GlassCard>

      <GlassCard style={{ padding: 18, gridColumn: isMobile ? "span 1" : "span 3" }}>
        <SectionTitle icon={Clock} title="Lançamentos" />
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflowY: "auto" }}>
          {entries.map((e) => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {e.type === "income" ? <ArrowUpRight size={14} color={T.mint} /> : <ArrowDownRight size={14} color={T.rose} />}
                {e.desc || (e.type === "income" ? "Receita" : "Despesa")}
              </span>
              <span style={{ color: T.textMuted }}>{e.date} · <b style={{ color: e.type === "income" ? T.mint : T.rose }}>{e.type === "income" ? "+" : "-"}{fmtEUR(e.amount)}</b></span>
            </div>
          ))}
          {entries.length === 0 && <EmptyRow text="Nenhum lançamento ainda." />}
        </div>
      </GlassCard>
    </div>
  );
}

function RowStat({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12.5, color: T.textMuted }}>{label}</span>
      <span style={{ fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

/* ============================== PSPRINTS ============================== */
function PSPrintsView({ data, setData }) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("orders");
  const [orderForm, setOrderForm] = useState({ client: "", product: "", value: "", status: "produção" });
  const [clientForm, setClientForm] = useState({ name: "", contact: "" });

  const addOrder = () => {
    if (!orderForm.client || !orderForm.value) return;
    setData((d) => ({ ...d, psprints: { ...d.psprints, orders: [...d.psprints.orders, { id: uid(), date: todayISO(), ...orderForm, value: Number(orderForm.value) }] } }));
    setOrderForm({ client: "", product: "", value: "", status: "produção" });
  };
  const addClient = () => {
    if (!clientForm.name) return;
    setData((d) => ({ ...d, psprints: { ...d.psprints, clients: [...d.psprints.clients, { id: uid(), ...clientForm }] } }));
    setClientForm({ name: "", contact: "" });
  };
  const setStatus = (id, status) => setData((d) => ({ ...d, psprints: { ...d.psprints, orders: d.psprints.orders.map(o => o.id === id ? { ...o, status } : o) } }));

  const revenue = monthlyRevenue(data.psprints.orders);
  const totalRevenue = data.psprints.orders.reduce((a, o) => a + Number(o.value), 0);
  const active = data.psprints.orders.filter(o => o.status !== "concluído").length;
  const done = data.psprints.orders.filter(o => o.status === "concluído").length;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
        <StatCard icon={DollarSign} label="Receita do mês" value={fmtBRL(revenue)} color={T.gold} />
        <StatCard icon={TrendingUp} label="Receita total" value={fmtBRL(totalRevenue)} color={T.mint} />
        <StatCard icon={Package} label="Pedidos ativos" value={active} color={T.violetGlow} />
        <StatCard icon={CheckCircle2} label="Concluídos" value={done} color={T.text} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <Button variant={tab === "orders" ? "primary" : "ghost"} onClick={() => setTab("orders")} icon={ShoppingBag}>Pedidos</Button>
        <Button variant={tab === "clients" ? "primary" : "ghost"} onClick={() => setTab("clients")} icon={Users}>Clientes</Button>
      </div>

      {tab === "orders" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "300px 1fr", gap: isMobile ? 14 : 18 }}>
          <GlassCard style={{ padding: 18 }}>
            <SectionTitle icon={Plus} title="Novo pedido" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
              <LabeledInput label="Cliente" value={orderForm.client} onChange={(v) => setOrderForm({ ...orderForm, client: v })} />
              <LabeledInput label="Produto" value={orderForm.product} onChange={(v) => setOrderForm({ ...orderForm, product: v })} />
              <LabeledInput label="Valor (R$)" type="number" value={orderForm.value} onChange={(v) => setOrderForm({ ...orderForm, value: v })} />
              <Button onClick={addOrder} icon={Plus}>Criar pedido</Button>
            </div>
          </GlassCard>
          <GlassCard style={{ padding: 18 }}>
            <SectionTitle icon={ShoppingBag} title="Pedidos" />
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8, maxHeight: 460, overflowY: "auto" }}>
              {[...data.psprints.orders].reverse().map((o) => (
                <div key={o.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{o.client}</div>
                    <div style={{ fontSize: 11.5, color: T.textMuted }}>{o.product || "—"} · {o.date}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "JetBrains Mono", fontSize: 13, fontWeight: 700 }}>{fmtBRL(o.value)}</span>
                    <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} style={{
                      background: "rgba(255,255,255,0.06)", color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11.5, padding: "4px 6px"
                    }}>
                      <option value="pedido">pedido</option>
                      <option value="produção">produção</option>
                      <option value="entrega">entrega</option>
                      <option value="concluído">concluído</option>
                    </select>
                  </div>
                </div>
              ))}
              {data.psprints.orders.length === 0 && <EmptyRow text="Nenhum pedido cadastrado ainda." />}
            </div>
          </GlassCard>
        </div>
      )}

      {tab === "clients" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "300px 1fr", gap: isMobile ? 14 : 18 }}>
          <GlassCard style={{ padding: 18 }}>
            <SectionTitle icon={Plus} title="Novo cliente" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
              <LabeledInput label="Nome" value={clientForm.name} onChange={(v) => setClientForm({ ...clientForm, name: v })} />
              <LabeledInput label="Contato" value={clientForm.contact} onChange={(v) => setClientForm({ ...clientForm, contact: v })} />
              <Button onClick={addClient} icon={Plus}>Adicionar</Button>
            </div>
          </GlassCard>
          <GlassCard style={{ padding: 18 }}>
            <SectionTitle icon={Users} title="Clientes" />
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {data.psprints.clients.map((c) => (
                <div key={c.id} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 11.5, color: T.textMuted }}>{c.contact}</div>
                </div>
              ))}
              {data.psprints.clients.length === 0 && <EmptyRow text="Nenhum cliente cadastrado ainda." />}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

/* ============================== GAMIFICATION ============================== */
const ACHIEVEMENTS = [
  { id: "study7", name: "7 dias seguidos estudando", check: (d) => hasStreakDays(d.study.sessions, 7), icon: BookOpen },
  { id: "habits30", name: "30 dias de hábitos completos", check: (d) => Object.values(d.habits[0]?.history || {}).filter(Boolean).length >= 30, icon: Flame },
  { id: "firstgoal", name: "Primeira meta financeira atingida", check: (d) => d.finance.entries.filter(e => e.type === "income").reduce((a, e) => a + e.amount, 0) >= d.finance.goalEUR, icon: Trophy },
  { id: "guitar100", name: "100 horas de guitarra", check: (d) => d.guitar.sessions.reduce((a, s) => a + s.minutes, 0) >= 6000, icon: Guitar },
  { id: "firstorder", name: "Primeiro pedido PSPrints", check: (d) => d.psprints.orders.length >= 1, icon: Package },
];

function hasStreakDays(sessions, n) {
  const dates = new Set(sessions.map(s => s.date));
  let count = 0;
  for (let i = 0; i < n + 5; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (dates.has(todayISO(d))) count++; else if (count >= n) break;
  }
  return count >= n;
}

function GamificationView({ data }) {
  const isMobile = useIsMobile();
  const xp = data.gamification.xp;
  const level = Math.floor(xp / 200) + 1;
  const xpIntoLevel = xp % 200;
  const unlocked = ACHIEVEMENTS.filter((a) => a.check(data));

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "320px 1fr", gap: isMobile ? 14 : 18 }}>
      <GlassCard style={{ padding: 24, textAlign: "center" }}>
        <div style={{
          width: 90, height: 90, margin: "0 auto", borderRadius: "50%",
          background: `conic-gradient(${T.violet} ${xpIntoLevel / 200 * 360}deg, rgba(255,255,255,0.08) 0deg)`,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ width: 74, height: 74, borderRadius: "50%", background: T.surfaceSolid, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 20, fontWeight: 700 }}>{level}</div>
            <div style={{ fontSize: 9, color: T.textMuted }}>NÍVEL</div>
          </div>
        </div>
        <div style={{ marginTop: 16, fontFamily: "JetBrains Mono", fontSize: 15, fontWeight: 700 }}>{xp} XP</div>
        <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 2 }}>{200 - xpIntoLevel} XP para o próximo nível</div>
      </GlassCard>

      <GlassCard style={{ padding: 18 }}>
        <SectionTitle icon={Trophy} title={`Conquistas (${unlocked.length}/${ACHIEVEMENTS.length})`} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          {ACHIEVEMENTS.map((a) => {
            const on = a.check(data);
            return (
              <div key={a.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12,
                background: on ? T.gold + "14" : "rgba(255,255,255,0.03)", border: `1px solid ${on ? T.gold + "44" : T.borderSoft}`
              }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: on ? T.gold + "22" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <a.icon size={16} color={on ? T.gold : T.textFaint} />
                </div>
                <div style={{ fontSize: 13.5, color: on ? T.text : T.textMuted, fontWeight: on ? 600 : 500 }}>{a.name}</div>
                {on && <Check size={16} color={T.gold} style={{ marginLeft: "auto" }} />}
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

/* ============================== ANALYTICS ============================== */
function AnalyticsView({ data }) {
  const isMobile = useIsMobile();
  const now = new Date();
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const { overall } = computeLifeScore(data, d);
    return { date: todayISO(d).slice(5), score: Math.round(overall) };
  });

  const pieData = [
    { name: "Estudos", value: data.study.sessions.reduce((a, s) => a + s.minutes, 0), color: T.mint },
    { name: "Guitarra", value: data.guitar.sessions.reduce((a, s) => a + s.minutes, 0), color: T.violetGlow },
  ];

  const finTrend = useMemo(() => {
    const entries = [...data.finance.entries].filter(e => e.type === "income").sort((a, b) => new Date(a.date) - new Date(b.date));
    let running = 0;
    return entries.map(e => { running += e.amount; return { date: e.date.slice(5), total: running }; });
  }, [data.finance.entries]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <GlassCard style={{ padding: 18 }}>
        <SectionTitle icon={TrendingUp} title="Life Score · últimos 30 dias" />
        <div style={{ height: 220, marginTop: 10 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={last30}>
              <defs>
                <linearGradient id="gScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.violet} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={T.violet} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="date" stroke={T.textFaint} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke={T.textFaint} fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: T.surfaceSolid, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12 }} />
              <Area type="monotone" dataKey="score" stroke={T.violetGlow} fill="url(#gScore)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 14 : 18 }}>
        <GlassCard style={{ padding: 18 }}>
          <SectionTitle icon={Wallet} title="Progresso da meta financeira" />
          <div style={{ height: 200, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={finTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" stroke={T.textFaint} fontSize={10.5} tickLine={false} axisLine={false} />
                <YAxis stroke={T.textFaint} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: T.surfaceSolid, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12 }} />
                <Line type="monotone" dataKey="total" stroke={T.gold} strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            {finTrend.length === 0 && <EmptyChartHint />}
          </div>
        </GlassCard>
        <GlassCard style={{ padding: 18 }}>
          <SectionTitle icon={BarChart3} title="Tempo investido (min)" />
          <div style={{ height: 200, marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={4}>
                  {pieData.map((p, i) => <Cell key={i} fill={p.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: T.surfaceSolid, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

/* ============================== AI EXECUTIVA ============================== */
function buildSystemPrompt(data, now) {
  const day = WEEKDAYS[now.getDay()];
  const scheduleTxt = FIXED_SCHEDULE.map(e => `- ${WEEKDAYS[e.day]} ${e.start}-${e.end}: ${e.title}`).join("\n");
  const free = freeSlotsToday(now).map(([s, e]) => `${minToTime(s)}-${minToTime(e)}`).join(", ") || "nenhum";
  const income = data.finance.entries.filter(e => e.type === "income").reduce((a, e) => a + e.amount, 0);

  return `Você é a IA Executiva do PS Life OS, assistente pessoal de produtividade do Pedro. Responda sempre em português do Brasil, de forma direta, prática e organizada (use listas com horários quando montar um plano).

Data/hora atual: ${day}, ${pad(now.getHours())}:${pad(now.getMinutes())}.

Rotina fixa semanal do Pedro:
${scheduleTxt}
Sono: dormir ${SLEEP.bed}, acordar ${SLEEP.wake}.

Horários livres HOJE: ${free}.

Metas principais do Pedro: juntar €3.500 (progresso atual: €${income} via PSPrints), fazer a PSPrints crescer, melhorar o inglês, evoluir na guitarra, melhorar condicionamento físico, criar disciplina extrema, organizar a vida em um só lugar.

Quando o Pedro pedir para organizar o dia, montar um plano de estudos, encaixar uma tarefa ou reagendar algo, use os horários livres reais dele e monte um plano de horários específico, considerando a rotina fixa. Seja específico com horários (ex: "18:00–18:45: Inglês"). Seja conciso.`;
}

function AIView({ data, setData }) {
  const isMobile = useIsMobile();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chat = data.aiChat || [];
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat, loading]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setError(null);
    const newHistory = [...chat, { role: "user", content: msg }];
    setData((d) => ({ ...d, aiChat: newHistory }));
    setLoading(true);
    try {
      const now = new Date();
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: buildSystemPrompt(data, now),
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const json = await res.json();
      const textOut = (json.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim() || "Não consegui gerar uma resposta agora.";
      setData((d) => ({ ...d, aiChat: [...newHistory, { role: "assistant", content: textOut }] }));
    } catch (e) {
      setError("Não foi possível falar com a IA agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const suggestions = ["Organize meu dia", "Tenho prova sexta, monte um plano", "Quero estudar inglês hoje", "Tenho 2 horas livres, o que eu faço?"];

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: isMobile ? "calc(100vh - 220px)" : "calc(100vh - 140px)",
      maxWidth: isMobile ? "100%" : 780
    }}>
      <GlassCard style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.borderSoft}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg, ${T.violet}, ${T.violetGlow})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bot size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: "Outfit", fontWeight: 600, fontSize: 14 }}>IA Executiva</div>
            <div style={{ fontSize: 11, color: T.textMuted }}>Organiza sua agenda com base na sua rotina real</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          {chat.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 20 }}>
              <div style={{ fontSize: 12.5, color: T.textMuted, textAlign: "center" }}>Experimente perguntar:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)} style={{
                    fontSize: 12.5, padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${T.border}`, color: T.text, cursor: "pointer"
                  }}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {chat.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "78%", padding: "10px 14px", borderRadius: 14, fontSize: 13.5, lineHeight: 1.5, whiteSpace: "pre-wrap",
                background: m.role === "user" ? T.violet : "rgba(255,255,255,0.05)",
                color: m.role === "user" ? "#fff" : T.text,
                border: m.role === "user" ? "none" : `1px solid ${T.borderSoft}`
              }}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.05)", fontSize: 13, color: T.textMuted }}>
                Pensando…
              </div>
            </div>
          )}
          {error && <div style={{ fontSize: 12, color: T.rose, textAlign: "center" }}>{error}</div>}
          <div ref={endRef} />
        </div>

        <div style={{ padding: 14, borderTop: `1px solid ${T.borderSoft}`, display: "flex", gap: 8 }}>
          <TextInput placeholder="Pergunte algo à sua IA executiva…" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()} />
          <Button icon={Send} onClick={() => send()} disabled={loading}>Enviar</Button>
        </div>
      </GlassCard>
    </div>
  );
}
