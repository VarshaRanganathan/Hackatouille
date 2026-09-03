import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BellRing,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  CloudOff,
  CreditCard,
  Database,
  ExternalLink,
  Gauge,
  HelpCircle,
  Home,
  Info,
  Landmark,
  LockKeyhole,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Network,
  PanelRight,
  Pause,
  PiggyBank,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  TrendingUp,
  UserRound,
  Wallet,
  X,
  Zap,
} from "lucide-react";

const tabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "resilience", label: "Resilience", icon: Gauge },
  { id: "save", label: "Save", icon: PiggyBank },
  { id: "credit", label: "Credit", icon: CreditCard },
  { id: "guidance", label: "Guidance", icon: MessageCircle },
];

const fallbackUsers = Array.from({ length: 30 }, (_, index) => ({
  id: `demo-user-${String(index + 1).padStart(2, "0")}`,
  full_name: [
    "Maya Patel",
    "Arjun Menon",
    "Tara Sharma",
    "Ravi Kumar",
    "Nisha Iyer",
    "Kabir Shah",
  ][index % 6],
  user_type: index === 0 ? "admin" : "member",
}));

const fallbackDashboard = (user) => ({
  profile: user,
  resilienceScore: { score: 78, buffer_days: 18 },
  creditOffers: [
    { id: "demo-offer-1", amount: 6000, interest_rate: 0.12, status: "matched" },
  ],
  netBalance: 48250,
});

const formatCurrency = (value, maximumFractionDigits = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits,
  }).format(Number(value) || 0);

const getScore = (dashboard) =>
  dashboard?.resilienceScore?.score ??
  dashboard?.resilienceScore?.resilience_score ??
  dashboard?.resilienceScore?.value ??
  78;

const getBufferDays = (dashboard) =>
  dashboard?.resilienceScore?.buffer_days ??
  dashboard?.resilienceScore?.bufferDays ??
  18;

const getUserName = (user) => user?.full_name || user?.fullName || "there";

const getToken = () =>
  typeof window !== "undefined"
    ? window.localStorage.getItem("resilientbank_access_token") || ""
    : "";

function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(path, { ...options, headers });
}

function Pill({ children, tone = "green", className = "" }) {
  const tones = {
    green: "bg-[#e4f2e3] text-[#246b4c]",
    orange: "bg-[#fff0e7] text-[#a94e2d]",
    blue: "bg-[#e9f0ff] text-[#3158a4]",
    slate: "bg-[#eef1ed] text-[#5e6b64]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.03em] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

function IconButton({ label, onClick, children, active = false }) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`focus-ring flex h-10 w-10 items-center justify-center rounded-xl border transition ${
        active
          ? "border-[#bddac0] bg-[#e5f1e3] text-[#1c684d]"
          : "border-[#e3e8df] bg-white/80 text-[#496158] hover:border-[#b7ceb9] hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}

function SectionHeading({ eyebrow, title, action, onAction }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#778a80]">
            {eyebrow}
          </div>
        )}
        <h2 className="font-display text-xl font-semibold tracking-[-0.035em] text-[#17382e]">
          {title}
        </h2>
      </div>
      {action && (
        <button
          onClick={onAction}
          className="focus-ring inline-flex items-center gap-1 text-xs font-bold text-[#27734f] hover:text-[#174a36]"
        >
          {action}
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

function ProgressRing({ value, size = 134 }) {
  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(#297957 ${value * 3.6}deg, #dfece0 0deg)`,
      }}
    >
      <div
        className="flex items-center justify-center rounded-full bg-[#fbfcf8]"
        style={{ width: size - 14, height: size - 14 }}
      >
        <div className="text-center">
          <div className="font-display text-4xl font-bold tracking-[-0.08em] text-[#184936]">
            {value}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#789083]">
            score
          </div>
        </div>
      </div>
    </div>
  );
}

function ForecastChart({ compact = false }) {
  const points = compact
    ? "0,65 24,60 48,64 72,43 96,47 120,32 144,39 168,22 192,28 216,14"
    : "0,100 45,92 90,101 135,72 180,78 225,54 270,61 315,37 360,46 405,28 450,34 500,15";
  return (
    <div className={compact ? "h-28 w-full" : "h-52 w-full"}>
      <svg
        viewBox={compact ? "0 0 216 78" : "0 0 500 115"}
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible"
        aria-label="30 day cash-flow forecast"
        role="img"
      >
        <defs>
          <linearGradient id="forecast-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#70b68b" stopOpacity=".34" />
            <stop offset="100%" stopColor="#70b68b" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`M ${points} L ${compact ? "216,78 0,78" : "500,115 0,115"} Z`}
          fill="url(#forecast-fill)"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#277957"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={compact ? "2.4" : "2.1"}
        />
        {!compact && (
          <>
            <line x1="0" y1="27" x2="500" y2="27" stroke="#e5ebe3" />
            <line x1="0" y1="61" x2="500" y2="61" stroke="#e5ebe3" />
            <line x1="0" y1="95" x2="500" y2="95" stroke="#e5ebe3" />
          </>
        )}
      </svg>
      {!compact && (
        <div className="mt-1 flex justify-between text-[10px] font-medium text-[#8a9c91]">
          <span>Today</span>
          <span>+7 days</span>
          <span>+14 days</span>
          <span>+21 days</span>
          <span>+30 days</span>
        </div>
      )}
    </div>
  );
}

function LoadingBar() {
  return <div className="h-1 w-full animate-pulse rounded-full bg-[#d9e9d9]" />;
}

function EmptyState({ icon: Icon = CloudOff, title, detail }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#ccd9ce] bg-[#fafcf8] px-6 py-10 text-center">
      <div className="mb-3 rounded-2xl bg-[#e8f1e5] p-3 text-[#3c7557]">
        <Icon size={21} />
      </div>
      <div className="font-display text-sm font-semibold text-[#2a4a3c]">{title}</div>
      <div className="mt-1 max-w-xs text-xs leading-5 text-[#71827a]">{detail}</div>
    </div>
  );
}

function StepperBanner({ consent, setConsent }) {
  const steps = ["Sign up / Login", "Connect accounts", "Data consent", "Financial setup"];
  return (
    <section className="grid-paper animate-float-in rounded-3xl border border-[#cfe1d0] bg-[#eef7eb] p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="max-w-sm">
          <Pill tone="green">
            <Sparkles size={12} /> Your setup path
          </Pill>
          <h2 className="mt-2 font-display text-lg font-semibold tracking-[-0.04em] text-[#1d513b]">
            Build your resilience, one clear step at a time.
          </h2>
        </div>
        <div className="flex flex-1 flex-col gap-3 lg:pl-8">
          <div className="flex items-center">
            {steps.map((step, index) => (
              <div key={step} className="flex min-w-0 flex-1 items-center last:flex-none">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      index < 2
                        ? "bg-[#2a7655] text-white"
                        : "border border-[#8fc39d] bg-white text-[#2d7755]"
                    }`}
                  >
                    {index < 2 ? <Check size={14} /> : index + 1}
                  </span>
                  <span className="hidden truncate text-[11px] font-bold text-[#466b56] sm:block">
                    {step}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="mx-2 h-px flex-1 bg-[#b7d4bb] sm:mx-4" />
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {["Income", "Expenses", "Savings behavior"].map((item) => (
              <button
                key={item}
                onClick={() => setConsent((current) => ({ ...current, [item]: !current[item] }))}
                className={`focus-ring inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                  consent[item]
                    ? "border-[#8fc49b] bg-white text-[#27734f]"
                    : "border-[#cbdccd] bg-transparent text-[#829287]"
                }`}
              >
                <span
                  className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${
                    consent[item] ? "border-[#32845d] bg-[#32845d] text-white" : "border-[#aabcae]"
                  }`}
                >
                  {consent[item] && <Check size={10} strokeWidth={3} />}
                </span>
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeView({ dashboard, user, source, onTab, onExplain, onRefresh }) {
  const score = getScore(dashboard);
  const bufferDays = getBufferDays(dashboard);
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="mb-1 text-xs font-medium text-[#75887d]">Friday, September 04, 2026</div>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#153c2d] sm:text-4xl">
            Good morning, {getUserName(user).split(" ")[0]}.
          </h1>
          <p className="mt-1 text-sm text-[#687c71]">
            Here’s the clearest view of your money today.
          </p>
        </div>
        {source === "demo" && (
          <button
            onClick={onRefresh}
            className="focus-ring inline-flex w-fit items-center gap-2 rounded-xl border border-[#e3d6b9] bg-[#fff9ea] px-3 py-2 text-xs font-bold text-[#916a2f]"
          >
            <CloudOff size={14} /> Demo data · Try refresh
          </button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="balance-glow animate-float-in rounded-3xl bg-[#194c39] p-5 text-white sm:p-7">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#b0d2b5]">
                <Wallet size={14} /> How much do I have?
              </div>
              <div className="mt-5 font-display text-4xl font-semibold tracking-[-0.07em] sm:text-5xl">
                {formatCurrency(dashboard.netBalance)}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-[#b6d7bd]">
                <ArrowUpRight size={14} /> +8.4% from last month
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 p-2.5 text-[#bde4c5]">
              <Landmark size={21} />
            </div>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/15 pt-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#94c0a0]">
                Safe to spend
              </div>
              <div className="mt-1 font-display text-xl font-semibold">{formatCurrency(18200)}</div>
              <div className="mt-1 text-[11px] text-[#a6cdb0]">through Sep 11</div>
            </div>
            <div className="border-l border-white/15 pl-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#94c0a0]">
                Buffer covered
              </div>
              <div className="mt-1 font-display text-xl font-semibold">{bufferDays} days</div>
              <div className="mt-1 text-[11px] text-[#a6cdb0]">Target: 21 days</div>
            </div>
          </div>
        </section>

        <section className="animate-float-in delay-1 rounded-3xl border border-[#e0e7de] bg-white p-5 soft-shadow sm:p-6">
          <SectionHeading eyebrow="Resilience snapshot" title="Can I handle a wobble?" action="Explain" onAction={onExplain} />
          <div className="flex items-center gap-5">
            <ProgressRing value={score} size={122} />
            <div>
              <Pill tone="green">
                <ShieldCheck size={12} /> Steady footing
              </Pill>
              <p className="mt-3 text-sm leading-5 text-[#64786c]">
                Your buffer is growing. Keep your next two weeks protected.
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-[#edf0eb] pt-4 text-xs">
            <span className="text-[#7c8f83]">Last updated just now</span>
            <button onClick={() => onTab("resilience")} className="font-bold text-[#297653]">
              View forecast <ChevronRight className="inline" size={14} />
            </button>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="animate-float-in delay-2 rounded-3xl border border-[#e0e7de] bg-white p-5 soft-shadow sm:p-6">
          <SectionHeading eyebrow="Cash-flow preview" title="What’s coming up?" action="Full forecast" onAction={() => onTab("resilience")} />
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#fff7e9] p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#9b6d2b]">
                <ArrowDownRight size={14} /> Essentials
              </div>
              <div className="mt-2 font-display text-xl font-semibold text-[#503b1c]">{formatCurrency(6900)}</div>
              <div className="mt-1 text-[11px] text-[#9f8b68]">next 7 days</div>
            </div>
            <div className="rounded-2xl bg-[#edf7ef] p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#32704d]">
                <ArrowUpRight size={14} /> Expected income
              </div>
              <div className="mt-2 font-display text-xl font-semibold text-[#204e38]">{formatCurrency(12400)}</div>
              <div className="mt-1 text-[11px] text-[#71927c]">next 7 days</div>
            </div>
          </div>
          <ForecastChart compact />
          <div className="mt-2 flex items-center gap-2 text-xs text-[#6d8175]">
            <span className="h-2 w-2 rounded-full bg-[#297957]" /> Your projected balance stays above your safety line.
          </div>
        </section>

        <section className="animate-float-in delay-3 rounded-3xl border border-[#f2d7c7] bg-[#fff8f2] p-5 soft-shadow sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.17em] text-[#b66a48]">
                <Zap size={14} /> What should I do today?
              </div>
              <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.04em] text-[#5e3424]">
                Give tomorrow a little more room.
              </h2>
            </div>
            <div className="rounded-xl bg-[#ffe6d8] p-2 text-[#b45d39]">
              <PiggyBank size={19} />
            </div>
          </div>
          <p className="mt-3 text-sm leading-5 text-[#876657]">
            Based on your rhythm this week, putting away a small amount now keeps your essentials covered later.
          </p>
          <div className="mt-5 flex items-end justify-between rounded-2xl bg-white/75 p-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a8806d]">Recommended today</div>
              <div className="mt-1 font-display text-3xl font-semibold tracking-[-0.06em] text-[#8b472f]">
                {formatCurrency(120)}
              </div>
            </div>
            <button onClick={() => onTab("save")} className="focus-ring rounded-xl bg-[#c8643f] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#b45231]">
              Review plan
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[#9a705c]">
            <AlertCircle size={14} /> Rent is your next high-priority expense.
          </div>
        </section>
      </div>
    </div>
  );
}

function ResilienceView({ dashboard, onBack }) {
  const [showModal, setShowModal] = useState(false);
  const score = getScore(dashboard);
  const bufferDays = getBufferDays(dashboard);
  return (
    <div className="space-y-5">
      <PageIntro icon={Gauge} eyebrow="Module 2" title="Your resilience, explained." detail="A calmer view of how long your current plan can carry you." onBack={onBack} />
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-3xl bg-[#194c39] p-6 text-white soft-shadow sm:p-8">
          <div className="text-xs font-bold uppercase tracking-[0.15em] text-[#abd1b1]">Resilience score</div>
          <div className="mt-5 flex items-center justify-between gap-4">
            <ProgressRing value={score} size={160} />
            <div className="text-right">
              <Pill tone="green" className="bg-white/10 text-[#c8e7ca]">
                <TrendingUp size={12} /> +6 this month
              </Pill>
              <div className="mt-5 font-display text-3xl font-semibold">{bufferDays} days</div>
              <div className="text-xs text-[#a9cdb1]">of essentials covered</div>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} className="mt-7 flex w-full items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-left text-xs font-bold text-[#d1e7d3] hover:bg-white/15">
            <span className="flex items-center gap-2"><CircleHelp size={15} /> Explain my score</span>
            <ChevronRight size={15} />
          </button>
        </section>
        <section className="rounded-3xl border border-[#e0e7de] bg-white p-5 soft-shadow sm:p-7">
          <SectionHeading eyebrow="Cash-flow outlook" title="30-day forecast" />
          <div className="mb-5 flex items-end justify-between">
            <div>
              <div className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#1c4e38]">{formatCurrency(48250)}</div>
              <div className="mt-1 text-xs text-[#788b80]">projected ending balance</div>
            </div>
            <Pill tone="green"><ShieldCheck size={12} /> Above safety line</Pill>
          </div>
          <ForecastChart />
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="rounded-xl bg-[#f4f8f2] p-2"><div className="font-bold text-[#297957]">₹12.4k</div><div className="mt-1 text-[#819187]">income</div></div>
            <div className="rounded-xl bg-[#fff8ee] p-2"><div className="font-bold text-[#a8732a]">₹6.9k</div><div className="mt-1 text-[#819187]">essentials</div></div>
            <div className="rounded-xl bg-[#f4f5fb] p-2"><div className="font-bold text-[#586a9e]">₹120</div><div className="mt-1 text-[#819187]">safe-to-save</div></div>
          </div>
        </section>
      </div>
      <section className="rounded-3xl border border-[#e0e7de] bg-white p-5 soft-shadow sm:p-6">
        <SectionHeading eyebrow="What moves the number" title="The three factors behind your score" />
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["Buffer days", "18 days", "How long your essentials are covered.", "bg-[#eaf5e9]", "text-[#28764f]"],
            ["Income rhythm", "Stable", "Your recent income is arriving predictably.", "bg-[#eef2ff]", "text-[#5168a5]"],
            ["Cash volatility", "Low", "Your balance has fewer sharp swings.", "bg-[#fff1e9]", "text-[#a35d3c]"],
          ].map(([title, value, detail, bg, color]) => (
            <div key={title} className={`rounded-2xl ${bg} p-4`}>
              <div className={`text-[10px] font-bold uppercase tracking-[0.15em] ${color}`}>{title}</div>
              <div className={`mt-3 font-display text-xl font-semibold ${color}`}>{value}</div>
              <p className="mt-2 text-xs leading-5 text-[#708076]">{detail}</p>
            </div>
          ))}
        </div>
      </section>
      {showModal && (
        <Modal title="How your score is built" onClose={() => setShowModal(false)}>
          <p className="text-sm leading-6 text-[#63766b]">
            Your score balances the cash you can access, the steadiness of your income, and the amount your balance moves around. It is designed to show direction, not judge a single day.
          </p>
          <div className="mt-5 space-y-3">
            {[
              ["Buffer days", "50%", "18 days gives you a reliable cushion."],
              ["Income stability", "30%", "Your recent earning pattern is consistent."],
              ["Cash volatility", "20%", "Fewer sharp swings help keep plans steady."],
            ].map(([label, percent, copy]) => (
              <div key={label} className="rounded-2xl bg-[#f4f8f2] p-3">
                <div className="flex justify-between text-xs font-bold text-[#2d6047]"><span>{label}</span><span>{percent}</span></div>
                <div className="mt-2 text-xs text-[#77897f]">{copy}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

function PageIntro({ icon: Icon, eyebrow, title, detail, onBack }) {
  return (
    <div className="flex items-start gap-3">
      {onBack && <button onClick={onBack} className="mt-1 rounded-xl border border-[#e1e8df] bg-white p-2 text-[#567164] hover:bg-[#f1f6ef]"><ChevronRight className="rotate-180" size={16} /></button>}
      <div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6c8b79]"><Icon size={14} /> {eyebrow}</div>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.06em] text-[#153c2d]">{title}</h1>
        <p className="mt-1 text-sm text-[#708178]">{detail}</p>
      </div>
    </div>
  );
}

function SavingsView({ onBack, showToast }) {
  const [income, setIncome] = useState(250);
  const [committed, setCommitted] = useState(100);
  const [buffer, setBuffer] = useState(0);
  const [behavior, setBehavior] = useState("Smart Save");
  const [result, setResult] = useState(120);
  const [calculating, setCalculating] = useState(false);
  const [decision, setDecision] = useState("");

  const calculate = async () => {
    setCalculating(true);
    try {
      const response = await apiFetch("/api/savings/calculate", {
        method: "POST",
        body: JSON.stringify({ dailyIncome: income, dailyExpenses: committed + buffer }),
      });
      if (!response.ok) throw new Error("Calculation unavailable");
      const data = await response.json();
      setResult(data.safeToSave ?? data.dailySafeToSave ?? 0);
    } catch {
      setResult(Math.max(0, (income - committed - buffer) * 0.8));
      showToast("Calculated locally while the API is reconnecting.");
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageIntro icon={PiggyBank} eyebrow="Module 3" title="Make saving feel doable." detail="A small, safe move beats a perfect plan you cannot keep." onBack={onBack} />
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-[#e0e7de] bg-white p-5 soft-shadow sm:p-7">
          <SectionHeading eyebrow="Safe-to-save engine" title="What feels comfortable today?" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Daily income", income, setIncome, "Your average"],
              ["Committed expenses", committed, setCommitted, "Essentials only"],
              ["Safety buffer", buffer, setBuffer, "Extra breathing room"],
            ].map(([label, value, setter, helper]) => (
              <label key={label} className="block">
                <span className="text-xs font-bold text-[#506b5d]">{label}</span>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute left-3 top-2.5 text-sm text-[#8a9d91]">₹</span>
                  <input
                    className="focus-ring w-full rounded-xl border border-[#dce7dc] bg-[#fbfcf9] py-2.5 pl-7 pr-2 text-sm font-bold text-[#294d3b] outline-none"
                    type="number"
                    min="0"
                    value={value}
                    onChange={(event) => setter(Number(event.target.value))}
                  />
                </div>
                <span className="mt-1 block text-[10px] text-[#829188]">{helper}</span>
              </label>
            ))}
          </div>
          <div className="mt-7 rounded-2xl bg-[#eff7ed] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6c9275]">Your recommendation</div>
                <div className="mt-1 font-display text-4xl font-semibold tracking-[-0.08em] text-[#28704d]">{formatCurrency(result)}</div>
                <div className="mt-1 text-xs text-[#6e8977]">daily safe-to-save</div>
              </div>
              <button onClick={calculate} disabled={calculating} className="focus-ring rounded-xl bg-[#2b7955] px-3 py-2 text-xs font-bold text-white hover:bg-[#226545] disabled:opacity-60">
                {calculating ? "Calculating..." : "Recalculate"}
              </button>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#d6e8d5]">
              <div className="h-full rounded-full bg-[#56a06f] transition-all" style={{ width: `${Math.min(100, Math.max(8, result / 2))}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-medium text-[#7c9684]"><span>Protect essentials first</span><span>Keep building momentum</span></div>
          </div>
        </section>
        <section className="rounded-3xl border border-[#e0e7de] bg-white p-5 soft-shadow sm:p-7">
          <SectionHeading eyebrow="Choose your rhythm" title="How do you want to save?" />
          <div className="space-y-2">
            {[
              ["Smart Save", "Adjusts with your income and expenses.", Sparkles],
              ["% of Income", "Put a consistent slice of every payment away.", TrendingUp],
              ["Round-up", "Turn everyday spending into tiny wins.", Plus],
            ].map(([label, detail, Icon]) => (
              <button key={label} onClick={() => setBehavior(label)} className={`focus-ring flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${behavior === label ? "border-[#9ac6a3] bg-[#f0f8ee]" : "border-[#e4eae2] hover:bg-[#fafcf9]"}`}>
                <span className={`rounded-xl p-2 ${behavior === label ? "bg-[#dcefdc] text-[#28764f]" : "bg-[#f0f3ee] text-[#72857a]"}`}><Icon size={16} /></span>
                <span className="min-w-0"><span className="block text-sm font-bold text-[#315743]">{label}</span><span className="mt-1 block text-xs leading-4 text-[#7b8c82]">{detail}</span></span>
                {behavior === label && <Check className="ml-auto mt-1 shrink-0 text-[#32845d]" size={16} />}
              </button>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-[#f0e3c9] bg-[#fffaf0] p-3 text-xs leading-5 text-[#8c754d]">
            <Info className="mr-1 inline" size={14} /> This recommendation never moves money without your say-so.
          </div>
          <div className="mt-5 flex gap-2">
            <button onClick={() => { setDecision("accepted"); showToast("Your saving plan is ready for review."); }} className="focus-ring flex-1 rounded-xl bg-[#2b7955] px-3 py-3 text-xs font-bold text-white hover:bg-[#226545]">Accept plan</button>
            <button onClick={() => setDecision("adjusted")} className="focus-ring rounded-xl border border-[#d9e4d8] px-3 py-3 text-xs font-bold text-[#397054] hover:bg-[#f4f8f2]">Adjust</button>
            <button onClick={() => setDecision("skipped")} className="focus-ring rounded-xl border border-transparent px-3 py-3 text-xs font-bold text-[#85948b] hover:bg-[#f5f6f2]">Skip</button>
          </div>
          {decision && <div className="mt-3 text-center text-xs font-bold text-[#5e7a69]">{decision === "accepted" ? "Plan accepted — you stay in control." : decision === "adjusted" ? "Adjust the inputs above to make it yours." : "Skipped for today. No judgment."}</div>}
        </section>
      </div>
    </div>
  );
}

function CreditView({ onBack, showToast }) {
  const [amount, setAmount] = useState(3000);
  const [term, setTerm] = useState(6);
  const [result, setResult] = useState(null);
  const runCheck = () => {
    const monthlyPayment = (amount * 1.12) / term;
    const debtStress = monthlyPayment / 18000;
    const approved = debtStress <= 0.4 && amount <= 8000;
    setResult({ approved, monthlyPayment, debtStress });
  };
  return (
    <div className="space-y-5">
      <PageIntro icon={CreditCard} eyebrow="Module 4" title="Credit with guardrails." detail="Borrowing should add stability, not move the worry somewhere else." onBack={onBack} />
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-[#e0e7de] bg-white p-5 soft-shadow sm:p-7">
          <SectionHeading eyebrow="Responsible credit" title="How much would help?" />
          <label className="block text-xs font-bold text-[#506b5d]">Request amount
            <div className="relative mt-2">
              <span className="pointer-events-none absolute left-3 top-3 text-sm text-[#8a9d91]">₹</span>
              <input type="number" min="500" max="25000" value={amount} onChange={(event) => setAmount(Number(event.target.value))} className="focus-ring w-full rounded-xl border border-[#dce7dc] bg-[#fbfcf9] py-3 pl-7 pr-3 text-lg font-bold text-[#294d3b] outline-none" />
            </div>
          </label>
          <div className="mt-5">
            <div className="flex justify-between text-xs font-bold text-[#506b5d]"><span>Repayment term</span><span>{term} months</span></div>
            <input type="range" min="3" max="12" value={term} onChange={(event) => setTerm(Number(event.target.value))} className="mt-4 w-full accent-[#2b7955]" />
            <div className="mt-1 flex justify-between text-[10px] text-[#83948a]"><span>3 months</span><span>12 months</span></div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-[#f2f7ef] p-3"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#76927b]">Affordability ceiling</div><div className="mt-2 font-display text-xl font-semibold text-[#2a6849]">₹8,000</div></div>
            <div className="rounded-2xl bg-[#fff7eb] p-3"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9c7c4c]">Stress limit</div><div className="mt-2 font-display text-xl font-semibold text-[#876637]">40%</div></div>
          </div>
          <button onClick={runCheck} className="focus-ring mt-6 w-full rounded-xl bg-[#2b7955] py-3 text-xs font-bold text-white hover:bg-[#226545]">Run affordability check</button>
          <p className="mt-3 text-center text-[11px] text-[#819087]">No credit check is run. This is a planning simulation.</p>
        </section>
        <section className="rounded-3xl border border-[#e0e7de] bg-[#f2f7ef] p-5 soft-shadow sm:p-7">
          {!result ? (
            <EmptyState icon={ShieldCheck} title="Your matched terms will appear here" detail="We’ll compare the request with your cash-flow capacity before suggesting anything." />
          ) : (
            <div className="animate-float-in">
              <Pill tone={result.approved ? "green" : "orange"}>{result.approved ? <ShieldCheck size={12} /> : <AlertCircle size={12} />} {result.approved ? "Matched terms" : "Pause recommended"}</Pill>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.06em] text-[#1e5038]">{result.approved ? "This could fit your plan." : "This would stretch your plan."}</h2>
              <p className="mt-3 text-sm leading-6 text-[#6e8075]">{result.approved ? "Your estimated repayment stays below the safety circuit breaker. Keep your essentials protected first." : "The estimated repayment crosses the debt-stress circuit breaker. A smaller amount or more time would be safer."}</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/75 p-4"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7d9281]">Est. monthly</div><div className="mt-2 font-display text-2xl font-semibold text-[#2a6949]">{formatCurrency(result.monthlyPayment)}</div></div>
                <div className="rounded-2xl bg-white/75 p-4"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7d9281]">Debt stress</div><div className="mt-2 font-display text-2xl font-semibold text-[#2a6949]">{Math.round(result.debtStress * 100)}%</div></div>
              </div>
              {result.approved ? <button onClick={() => showToast("Offer saved. Nothing has been borrowed.")} className="mt-6 rounded-xl bg-[#2b7955] px-4 py-3 text-xs font-bold text-white">Save this offer</button> : <button onClick={() => setAmount(Math.round(amount * 0.65))} className="mt-6 rounded-xl border border-[#d8c7aa] bg-white px-4 py-3 text-xs font-bold text-[#8a6835]">Try a smaller amount</button>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function GuidanceView({ onBack }) {
  const prompts = ["How much should I save?", "Can I afford this loan?", "Why did my score change?"];
  const answers = {
    "How much should I save?": "Start with the amount your plan can repeat. Today, ₹120 keeps your essentials covered and still builds a little momentum.",
    "Can I afford this loan?": "A loan feels affordable when the repayment stays below 40% of your discretionary cash flow. Try the Credit tab to compare a few amounts.",
    "Why did my score change?": "Your score moves with your buffer days, income rhythm, and cash volatility. A steadier week can help even before your balance gets bigger.",
  };
  const [messages, setMessages] = useState([{ from: "bot", text: "Hi, I’m here to make the numbers feel a little less heavy. What are you thinking about?" }]);
  const ask = (prompt) => setMessages((current) => [...current, { from: "user", text: prompt }, { from: "bot", text: answers[prompt] }]);
  return (
    <div className="space-y-5">
      <PageIntro icon={MessageCircle} eyebrow="Module 6" title="A calm second opinion." detail="Plain-language guidance for the decision in front of you." onBack={onBack} />
      <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-[#e0e7de] bg-white soft-shadow">
        <div className="flex items-center gap-3 border-b border-[#edf0eb] bg-[#f2f8f0] px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d9eed9] text-[#2a7650]"><Bot size={20} /></div>
          <div><div className="text-sm font-bold text-[#2f5b43]">ResilientGuide</div><div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#78917f]"><span className="h-1.5 w-1.5 rounded-full bg-[#63a574]" /> Ready when you are</div></div>
          <MoreHorizontal className="ml-auto text-[#8aa094]" size={19} />
        </div>
        <div className="min-h-[330px] space-y-4 bg-[#fbfcf9] p-5">
          {messages.map((message, index) => (
            <div key={`${message.text}-${index}`} className={`flex ${message.from === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-5 ${message.from === "user" ? "rounded-br-md bg-[#276f4e] text-white" : "rounded-bl-md border border-[#e0eae0] bg-white text-[#60756a]"}`}>{message.text}</div>
            </div>
          ))}
        </div>
        <div className="border-t border-[#edf0eb] p-4">
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#8a9b91]">Try asking</div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hidden">
            {prompts.map((prompt) => <button key={prompt} onClick={() => ask(prompt)} className="focus-ring shrink-0 rounded-xl border border-[#dce7dc] bg-[#f9fcf8] px-3 py-2 text-xs font-bold text-[#527260] hover:border-[#9bc0a1] hover:bg-[#eef7ed]">{prompt}</button>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function SimulatorView({ onBack }) {
  const [scenario, setScenario] = useState("save");
  const [amount, setAmount] = useState(200);
  const baseBuffer = 18;
  const projectedBuffer = scenario === "save" ? baseBuffer + amount / 100 : baseBuffer - amount / 100;
  const projectedScore = Math.round(78 + (projectedBuffer - baseBuffer) * 0.8);
  return (
    <section className="rounded-3xl border border-[#e0e7de] bg-white p-5 soft-shadow sm:p-7">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <PageIntro icon={SlidersHorizontal} eyebrow="Module 5 · What-if simulator" title="Try a different tomorrow." detail="Explore impact without touching your actual money." onBack={onBack} />
        <Pill tone="blue"><RotateCcw size={12} /> No real transactions</Pill>
      </div>
      <div className="mt-7 flex flex-wrap gap-2">
        <button onClick={() => setScenario("save")} className={`rounded-xl px-4 py-2.5 text-xs font-bold ${scenario === "save" ? "bg-[#2b7955] text-white" : "border border-[#dbe5db] text-[#5c7769]"}`}>Save ₹200 / week</button>
        <button onClick={() => setScenario("drop")} className={`rounded-xl px-4 py-2.5 text-xs font-bold ${scenario === "drop" ? "bg-[#c96a46] text-white" : "border border-[#dbe5db] text-[#5c7769]"}`}>Income drops by 20%</button>
      </div>
      <div className="mt-7 max-w-xl">
        <div className="flex justify-between text-xs font-bold text-[#4c6a59]"><span>{scenario === "save" ? "Weekly amount" : "Income drop"}</span><span>{scenario === "save" ? formatCurrency(amount) : `${amount}%`}</span></div>
        <input type="range" min={scenario === "save" ? 50 : 5} max={scenario === "save" ? 500 : 40} value={amount} onChange={(event) => setAmount(Number(event.target.value))} className="mt-4 w-full accent-[#2b7955]" />
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-[#f0f7ee] p-4"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#78947f]">Buffer days</div><div className="mt-2 font-display text-3xl font-semibold text-[#2a704d]">{projectedBuffer.toFixed(1)}</div><div className="mt-1 text-xs text-[#7a8c81]">{projectedBuffer > baseBuffer ? "more room" : "less room"}</div></div>
        <div className="rounded-2xl bg-[#eef2ff] p-4"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7382a9]">Resilience score</div><div className="mt-2 font-display text-3xl font-semibold text-[#53679e]">{projectedScore}</div><div className="mt-1 text-xs text-[#7a879e]">from 78 today</div></div>
        <div className="rounded-2xl bg-[#fff8ee] p-4"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9b8152]">Plan signal</div><div className="mt-2 font-display text-xl font-semibold text-[#8b6935]">{projectedBuffer > baseBuffer ? "Positive" : "Watch closely"}</div><div className="mt-1 text-xs text-[#857c6d]">no money moved</div></div>
      </div>
    </section>
  );
}

function Drawer({ title, icon: Icon, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button aria-label="Close drawer" onClick={onClose} className="absolute inset-0 bg-[#15382c]/20 backdrop-blur-[2px]" />
      <aside className="relative h-full w-full max-w-md overflow-y-auto bg-[#fbfcf8] p-5 shadow-2xl sm:p-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-[#e4f1e2] p-2 text-[#2c7551]"><Icon size={18} /></div><h2 className="font-display text-xl font-semibold tracking-[-0.04em] text-[#1b4936]">{title}</h2></div>
          <IconButton label="Close" onClick={onClose}><X size={18} /></IconButton>
        </div>
        <div className="mt-7">{children}</div>
      </aside>
    </div>
  );
}

function DataControlDrawer({ onClose, showToast }) {
  const [connections, setConnections] = useState([
    { name: "Primary bank account", detail: "Connected · synced 4 min ago", active: true, icon: Landmark },
    { name: "Savings account", detail: "Connected · synced yesterday", active: true, icon: PiggyBank },
  ]);
  const revoke = (index) => {
    setConnections((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, active: false, detail: "Access revoked" } : item));
    showToast("Access revoked. Your data stays yours.");
  };
  return (
    <Drawer title="Data control" icon={Database} onClose={onClose}>
      <div className="rounded-2xl bg-[#eef7ec] p-4 text-sm leading-5 text-[#587566]"><LockKeyhole className="mr-2 inline text-[#2f7954]" size={16} /> You decide what ResilientBank can see and for how long.</div>
      <div className="mt-6 text-[10px] font-bold uppercase tracking-[0.15em] text-[#82948a]">Connected accounts</div>
      <div className="mt-3 space-y-2">
        {connections.map((connection, index) => {
          const ConnectionIcon = connection.icon;
          return <div key={connection.name} className="rounded-2xl border border-[#e1e9df] bg-white p-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-[#f0f5ef] p-2 text-[#547363]"><ConnectionIcon size={17} /></div><div className="min-w-0 flex-1"><div className="text-sm font-bold text-[#355746]">{connection.name}</div><div className={`mt-1 text-[11px] ${connection.active ? "text-[#769181]" : "text-[#b46a4e]"}`}>{connection.detail}</div></div><span className={`h-2 w-2 rounded-full ${connection.active ? "bg-[#65a674]" : "bg-[#d47758]"}`} /></div>{connection.active && <button onClick={() => revoke(index)} className="mt-4 text-xs font-bold text-[#a05a40] hover:text-[#7d3f2a]">Revoke access</button>}</div>;
        })}
      </div>
      <div className="mt-7 border-t border-[#e3eae1] pt-6">
        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#82948a]">Your data</div>
        <button onClick={() => showToast("Data deletion request started. We’ll keep you informed.")} className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-[#f0d7ce] bg-[#fff8f5] p-4 text-left hover:bg-[#fff2ec]"><Trash2 className="text-[#b45f43]" size={18} /><span><span className="block text-sm font-bold text-[#8d4d38]">Delete my data</span><span className="mt-1 block text-xs text-[#a47b6b]">Request permanent deletion from your connected data.</span></span></button>
      </div>
    </Drawer>
  );
}

function NotificationDrawer({ onClose }) {
  const [frequency, setFrequency] = useState("Balanced");
  return (
    <Drawer title="Smart notifications" icon={BellRing} onClose={onClose}>
      <div className="rounded-2xl bg-[#fff7eb] p-4"><div className="flex items-center gap-2 text-xs font-bold text-[#98672d]"><AlertCircle size={15} /> 1 needs your attention</div><div className="mt-2 text-sm font-semibold text-[#61451f]">Rent is due in 4 days</div><div className="mt-1 text-xs text-[#997e5b]">Your projected balance has it covered.</div></div>
      <div className="mt-6"><div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#82948a]">Urgency</div><div className="mt-3 space-y-2"><div className="flex items-center gap-3 rounded-2xl border border-[#f0dfc6] bg-[#fffaf1] p-3"><span className="h-2.5 w-2.5 rounded-full bg-[#e0a04c]" /><div><div className="text-sm font-bold text-[#76572c]">Rent is due in 4 days</div><div className="mt-1 text-xs text-[#987e5d]">High priority · sent now</div></div></div></div></div>
      <div className="mt-6"><div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#82948a]">Good to know</div><div className="mt-3 space-y-2"><div className="flex items-center gap-3 rounded-2xl border border-[#e1e9df] bg-white p-3"><span className="h-2.5 w-2.5 rounded-full bg-[#75a6c2]" /><div><div className="text-sm font-bold text-[#466475]">Your buffer grew this week</div><div className="mt-1 text-xs text-[#7b8d94]">FYI · yesterday</div></div></div></div></div>
      <div className="mt-7 border-t border-[#e3eae1] pt-6"><div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#82948a]">Notification frequency</div><div className="mt-3 grid grid-cols-3 gap-2">{["Quiet", "Balanced", "Helpful"].map((option) => <button key={option} onClick={() => setFrequency(option)} className={`rounded-xl border py-2 text-xs font-bold ${frequency === option ? "border-[#9ec5a5] bg-[#edf7ec] text-[#337052]" : "border-[#e0e8df] text-[#7c8d83]"}`}>{option}</button>)}</div><div className="mt-2 text-[11px] text-[#819189]">You’re on {frequency.toLowerCase()} reminders.</div></div>
    </Drawer>
  );
}

function Modal({ title, onClose, children }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><button aria-label="Close modal" onClick={onClose} className="absolute inset-0 bg-[#15382c]/25 backdrop-blur-sm" /><div className="relative w-full max-w-md rounded-3xl bg-[#fbfcf8] p-6 shadow-2xl sm:p-7"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-semibold tracking-[-0.04em] text-[#1b4936]">{title}</h2><IconButton label="Close" onClick={onClose}><X size={18} /></IconButton></div><div className="mt-5">{children}</div></div></div>;
}

function SystemLoop() {
  const loop = [["Income event", ArrowUpRight], ["Cash-flow analysis", Network], ["Score update", RefreshCw], ["Risk check", ShieldCheck], ["Dashboard refresh", Sparkles]];
  return <section className="rounded-3xl border border-[#dce8dc] bg-[#edf6eb] p-4 sm:p-5"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#65846d]"><Zap size={13} /> Module 9 · System loop</div><div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hidden">{loop.map(([label, Icon], index) => <div key={label} className="flex shrink-0 items-center gap-2">{index > 0 && <ChevronRight size={14} className="text-[#91b19a]" />}<div className="flex items-center gap-2 rounded-xl bg-white/75 px-3 py-2 text-xs font-bold text-[#47735a]"><Icon size={14} /> {label}</div></div>)}</div><div className="mt-3 text-[11px] text-[#789080]">Every new signal helps your plan become more useful, not more complicated.</div></section>;
}

function App() {
  const [users, setUsers] = useState(fallbackUsers);
  const [selectedId, setSelectedId] = useState(fallbackUsers[0].id);
  const [dashboard, setDashboard] = useState(fallbackDashboard(fallbackUsers[0]));
  const [activeTab, setActiveTab] = useState("home");
  const [usersLoading, setUsersLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [source, setSource] = useState("demo");
  const [drawer, setDrawer] = useState(null);
  const [consent, setConsent] = useState({ Income: true, Expenses: true, "Savings behavior": false });
  const [toast, setToast] = useState("");

  const selectedUser = useMemo(() => users.find((user) => user.id === selectedId) || users[0], [selectedId, users]);

  const loadUsers = async () => {
    setUsersLoading(true);
    if (!getToken()) {
      setUsers(fallbackUsers);
      setSource("demo");
      setUsersLoading(false);
      return;
    }
    try {
      const response = await apiFetch("/api/users");
      if (!response.ok) throw new Error("Users unavailable");
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error("No users");
      setUsers(data);
      setSelectedId((current) => data.some((user) => user.id === current) ? current : data[0].id);
      setSource("live");
    } catch {
      setUsers(fallbackUsers);
      setSource("demo");
    } finally {
      setUsersLoading(false);
    }
  };

  const loadDashboard = async (userId) => {
    setDashboardLoading(true);
    if (!getToken()) {
      const user = users.find((item) => item.id === userId) || fallbackUsers[0];
      setDashboard(fallbackDashboard(user));
      setSource("demo");
      setDashboardLoading(false);
      return;
    }
    try {
      const response = await apiFetch(`/api/dashboard/${encodeURIComponent(userId)}`);
      if (!response.ok) throw new Error("Dashboard unavailable");
      setDashboard(await response.json());
      setSource("live");
    } catch {
      const user = users.find((item) => item.id === userId) || fallbackUsers[0];
      setDashboard(fallbackDashboard(user));
      setSource("demo");
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => { if (selectedId) loadDashboard(selectedId); }, [selectedId]);
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(""), 3200); return () => clearTimeout(timer); }, [toast]);

  const showToast = (message) => setToast(message);
  const chooseTab = (tab) => setActiveTab(tab);

  const content = {
    home: <HomeView dashboard={dashboard} user={selectedUser} source={source} onTab={chooseTab} onExplain={() => setActiveTab("resilience")} onRefresh={() => { loadUsers(); loadDashboard(selectedId); }} />,
    resilience: <ResilienceView dashboard={dashboard} onBack={() => setActiveTab("home")} />,
    save: <SavingsView onBack={() => setActiveTab("home")} showToast={showToast} />,
    credit: <CreditView onBack={() => setActiveTab("home")} showToast={showToast} />,
    guidance: <div className="space-y-5"><GuidanceView onBack={() => setActiveTab("home")} /><SimulatorView onBack={() => setActiveTab("home")} /></div>,
  }[activeTab];

  return (
    <div className="min-h-screen pb-24 text-[#15231f]">
      <header className="sticky top-0 z-30 border-b border-[#e4eae1]/80 bg-[#f7f8f3]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <button onClick={() => setActiveTab("home")} className="focus-ring flex items-center gap-2.5 text-left">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1c533d] text-[#c2e3c3]"><ShieldCheck size={19} /></span>
            <span><span className="block font-display text-sm font-bold tracking-[-0.03em] text-[#194633]">Resilient<span className="text-[#c56a46]">Bank</span></span><span className="hidden text-[9px] font-bold uppercase tracking-[0.15em] text-[#829187] sm:block">Your steadier money life</span></span>
          </button>
          <div className="hidden items-center gap-1 rounded-xl border border-[#e2e9df] bg-white/75 p-1 md:flex">
            {tabs.slice(0, 4).map(({ id, label }) => <button key={id} onClick={() => setActiveTab(id)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${activeTab === id ? "bg-[#e9f3e7] text-[#2a704e]" : "text-[#7d8e84] hover:text-[#35634d]"}`}>{label}</button>)}
          </div>
          <div className="flex items-center gap-2">
            <IconButton label="Data control" onClick={() => setDrawer("data")} active={drawer === "data"}><Database size={17} /></IconButton>
            <IconButton label="Smart notifications" onClick={() => setDrawer("notifications")} active={drawer === "notifications"}><Bell size={17} /></IconButton>
            <div className="hidden h-10 items-center gap-2 rounded-xl border border-[#e0e8df] bg-white/80 px-2.5 sm:flex">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#e5f0e3] text-[#367454]"><UserRound size={14} /></span>
              <select aria-label="Select profile" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="max-w-[128px] bg-transparent text-xs font-bold text-[#426353] outline-none">
                {users.map((user) => <option key={user.id} value={user.id}>{getUserName(user)}</option>)}
              </select>
              <ChevronDown size={13} className="text-[#83928a]" />
            </div>
            <button onClick={() => setDrawer("profile")} className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5f0e3] text-[#367454] sm:hidden"><Menu size={18} /></button>
          </div>
        </div>
        <div className="border-t border-[#e6ebe4] px-4 py-2 sm:hidden">
          <div className="flex items-center gap-2">
            <UserRound size={14} className="text-[#6e8878]" />
            <select aria-label="Select profile" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="flex-1 bg-transparent text-xs font-bold text-[#426353] outline-none">
              {users.map((user) => <option key={user.id} value={user.id}>{getUserName(user)}</option>)}
            </select>
            {usersLoading && <LoadingBar />}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        {activeTab === "home" && <StepperBanner consent={consent} setConsent={setConsent} />}
        {dashboardLoading && <LoadingBar />}
        {content}
        {activeTab === "home" && <SystemLoop />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#e0e7dd] bg-[#fbfcf8]/95 px-3 py-2 backdrop-blur-lg md:hidden">
        <div className="mx-auto flex max-w-md justify-around">
          {tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setActiveTab(id)} className={`focus-ring flex min-w-[58px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold ${activeTab === id ? "text-[#28724f]" : "text-[#829189]"}`}><Icon size={18} strokeWidth={activeTab === id ? 2.4 : 1.8} /><span>{label}</span></button>)}
        </div>
      </nav>

      {drawer === "data" && <DataControlDrawer onClose={() => setDrawer(null)} showToast={showToast} />}
      {drawer === "notifications" && <NotificationDrawer onClose={() => setDrawer(null)} />}
      {drawer === "profile" && <Drawer title="Choose a profile" icon={UserRound} onClose={() => setDrawer(null)}><div className="space-y-2">{users.map((user) => <button key={user.id} onClick={() => { setSelectedId(user.id); setDrawer(null); }} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${selectedId === user.id ? "border-[#9fc8a5] bg-[#eef7ed]" : "border-[#e2e9e0] bg-white"}`}><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e7f0e4] text-[#347352]"><UserRound size={15} /></span><span className="text-sm font-bold text-[#416353]">{getUserName(user)}</span>{selectedId === user.id && <Check className="ml-auto text-[#2c7953]" size={16} />}</button>)}</div></Drawer>}
      {toast && <div className="animate-float-in fixed bottom-24 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-[#1b4e39] px-4 py-3 text-xs font-bold text-white shadow-xl md:bottom-6"><Check size={15} className="text-[#bfe4c3]" />{toast}</div>}
    </div>
  );
}

export default App;