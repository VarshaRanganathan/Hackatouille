import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bot,
  CalendarDays,
  Check,
  ChevronDown,
  CreditCard,
  Database,
  Gauge,
  Home,
  Info,
  Leaf,
  LockKeyhole,
  MessageCircle,
  PiggyBank,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  TrendingUp,
  WalletCards,
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

const people = [
  ["Ravi Kumar", "Delivery Worker"],
  ["Meera Nair", "Freelance Designer"],
  ["Arjun Singh", "Cab Driver"],
  ["Pooja Shah", "Home Baker"],
  ["Vikram Rao", "Electrician"],
  ["Ananya Iyer", "Content Writer"],
  ["Karan Patel", "Delivery Worker"],
  ["Neha Das", "Tutor"],
  ["Sanjay Gupta", "Plumber"],
  ["Ishita Bose", "Photographer"],
  ["Rahul Menon", "Cab Driver"],
  ["Kavya Reddy", "Tailor"],
  ["Amit Joshi", "Mechanic"],
  ["Sneha Pillai", "Beauty Professional"],
  ["Dev Malhotra", "Video Editor"],
  ["Nandini Roy", "Home Chef"],
  ["Sameer Khan", "Delivery Worker"],
  ["Ritu Verma", "Tutor"],
  ["Aditya Jain", "Web Developer"],
  ["Farah Ali", "Craft Seller"],
  ["Gopal Yadav", "Electrician"],
  ["Tanya Kapoor", "Graphic Designer"],
  ["Manoj Sethi", "Cab Driver"],
  ["Shreya Kulkarni", "Dance Teacher"],
  ["Nikhil Bhat", "Photographer"],
  ["Asha Thomas", "Home Baker"],
  ["Rohan Desai", "Fitness Coach"],
  ["Divya Mishra", "Content Writer"],
  ["Harish Naidu", "Repair Technician"],
  ["Lakshmi Krishnan", "Tailor"],
];

const demoUsers = people.map(([full_name, role], index) => ({
  id: `demo-user-${String(index + 1).padStart(2, "0")}`,
  full_name,
  role,
  user_type: index === 0 ? "admin" : "member",
}));

const demoDashboard = (user) => ({
  profile: user,
  resilienceScore: { score: 68, buffer_days: 12 },
  creditOffers: [],
  netBalance: 6850,
});

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const getToken = () =>
  window.localStorage.getItem("resilientbank_access_token") || "";

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body) headers.set("Content-Type", "application/json");
  return fetch(path, { ...options, headers });
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Badge({ children, tone = "green" }) {
  const tones = {
    green: "bg-[#E7F3ED] text-[#25614E]",
    amber: "bg-[#FFF3D9] text-[#8A5A08]",
    blue: "bg-[#EBF2FF] text-[#315E9A]",
  };
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold", tones[tone])}>
      {children}
    </span>
  );
}

function Card({ children, className = "" }) {
  return (
    <section className={cx("rounded-[24px] border border-[#E7EBE9] bg-white p-5 shadow-[0_8px_30px_rgba(15,65,53,0.06)] sm:p-6", className)}>
      {children}
    </section>
  );
}

function SectionTitle({ label, title, action, onAction }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        {label && <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.17em] text-[#71837E]">{label}</p>}
        <h2 className="text-xl font-bold tracking-[-0.035em] text-[#202826]">{title}</h2>
      </div>
      {action && (
        <button onClick={onAction} className="focus-ring shrink-0 text-xs font-bold text-[#0F684F]">
          {action}
        </button>
      )}
    </div>
  );
}

function PageHeading({ eyebrow, title, copy }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#5F7B71]">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-0.055em] text-[#17231F] sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-[#66736F]">{copy}</p>
    </div>
  );
}

function CashFlowChart({ large = false }) {
  return (
    <div className={large ? "h-56" : "h-32"}>
      <svg viewBox="0 0 500 160" preserveAspectRatio="none" className="h-full w-full" role="img" aria-label="30 day cash flow forecast">
        <defs>
          <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2C8068" stopOpacity=".28" />
            <stop offset="100%" stopColor="#2C8068" stopOpacity=".02" />
          </linearGradient>
        </defs>
        <line x1="0" y1="122" x2="500" y2="122" stroke="#D9A441" strokeDasharray="5 5" />
        <path d="M0 112 C45 105 62 78 105 87 S167 114 210 92 S273 52 325 69 S390 97 432 58 S480 37 500 43 L500 160 L0 160Z" fill="url(#cashFill)" />
        <path d="M0 112 C45 105 62 78 105 87 S167 114 210 92 S273 52 325 69 S390 97 432 58 S480 37 500 43" fill="none" stroke="#1F7159" strokeWidth="4" strokeLinecap="round" />
        <circle cx="210" cy="92" r="6" fill="#D99A2B" stroke="white" strokeWidth="4" />
      </svg>
    </div>
  );
}

function ScoreRing({ score = 68, size = 142 }) {
  return (
    <div
      className="relative grid shrink-0 place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(#218064 ${score * 3.6}deg, #E2EEE9 0deg)`,
      }}
    >
      <div className="grid place-items-center rounded-full bg-white" style={{ width: size - 15, height: size - 15 }}>
        <div className="text-center">
          <strong className="block text-4xl tracking-[-0.07em] text-[#0F4135]">{score}</strong>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#77857F]">out of 100</span>
        </div>
      </div>
    </div>
  );
}

function HomeTab({ dashboard, user, showToast, setTab, openWhy }) {
  const balance = dashboard?.netBalance ?? 6850;
  const score = dashboard?.resilienceScore?.score ?? 68;
  const bufferDays = dashboard?.resilienceScore?.buffer_days ?? 12;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium text-[#71807A]">Friday, 4 September</p>
        <h1 className="mt-1 text-3xl font-bold tracking-[-0.055em] text-[#17231F]">
          Hi, {user.full_name.split(" ")[0]}. Here’s your money today.
        </h1>
      </div>

      <section className="overflow-hidden rounded-[28px] bg-[#0F4135] p-5 text-white shadow-[0_16px_40px_rgba(15,65,53,0.2)] sm:p-7">
        <div className="flex items-start justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold text-[#B9D7CC]">
              <WalletCards size={15} /> How much do I have?
            </p>
            <div className="mt-4 text-5xl font-bold tracking-[-0.075em]">{money(balance)}</div>
            <p className="mt-2 text-xs text-[#A8C9BE]">Available across your connected accounts</p>
          </div>
          <span className="rounded-2xl bg-white/10 p-3 text-[#C9E4DA]"><ShieldCheck size={22} /></span>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-4 border-t border-white/15 pt-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9EC2B6]">Safe to spend</p>
            <strong className="mt-1 block text-2xl">{money(2300)}</strong>
            <p className="mt-1 text-[11px] text-[#A8C9BE]">Bills are protected</p>
          </div>
          <div className="border-l border-white/15 pl-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9EC2B6]">Next income</p>
            <strong className="mt-1 block text-2xl">{money(1850)}</strong>
            <p className="mt-1 text-[11px] text-[#A8C9BE]">Expected tomorrow</p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <Card>
          <SectionTitle label="Bills and earnings" title="What’s coming up?" />
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              ["Electricity", "₹850", "in 3 days", Zap, "amber"],
              ["Rent", "₹3,200", "in 5 days", CalendarDays, "amber"],
              ["Expected income", "₹8,500", "over 14 days", TrendingUp, "green"],
            ].map(([name, amount, when, Icon, tone]) => (
              <div key={name} className={cx("rounded-2xl p-3.5", tone === "amber" ? "bg-[#FFF8E8]" : "bg-[#ECF6F1]")}>
                <Icon size={16} className={tone === "amber" ? "text-[#A66B0B]" : "text-[#247359]"} />
                <p className="mt-3 text-xs font-bold text-[#45514D]">{name}</p>
                <strong className="mt-1 block text-lg text-[#202826]">{amount}</strong>
                <span className="text-[11px] text-[#77827E]">{when}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-[#F6F8F7] p-3">
            <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-[#64736D]">
              <span>30-day cash flow</span>
              <span className="text-[#257059]">Stays above your safety line</span>
            </div>
            <CashFlowChart />
          </div>
        </Card>

        <Card className="border-[#F1DEB7] bg-[#FFFDF8]">
          <Badge tone="amber"><Zap size={12} /> Today’s suggestion</Badge>
          <h2 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-[#302B22]">Your earnings were higher this week.</h2>
          <p className="mt-2 text-sm leading-6 text-[#6E675A]">You can safely save <strong className="text-[#17664E]">₹300 today</strong> and still keep your bill money covered.</p>
          <button onClick={openWhy} className="focus-ring mt-3 text-xs font-bold text-[#8B5C11] underline decoration-[#D8B46F] underline-offset-4">Why ₹300?</button>
          <div className="mt-5 grid grid-cols-[1.35fr_1fr_.75fr] gap-2">
            <button onClick={() => showToast("₹300 added to your saving plan.")} className="focus-ring rounded-xl bg-[#0F4135] px-3 py-3 text-xs font-bold text-white">Save ₹300</button>
            <button onClick={() => setTab("save")} className="focus-ring rounded-xl border border-[#D8DED9] bg-white px-3 py-3 text-xs font-bold text-[#40514B]">Adjust</button>
            <button onClick={() => showToast("Skipped for today. No money moved.")} className="focus-ring rounded-xl px-2 py-3 text-xs font-bold text-[#75817C]">Skip</button>
          </div>
        </Card>
      </div>

      <button onClick={() => setTab("resilience")} className="focus-ring flex w-full items-center gap-4 rounded-[24px] border border-[#DDE9E4] bg-[#EDF7F2] p-4 text-left sm:p-5">
        <ScoreRing score={score} size={92} />
        <span className="min-w-0 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5B796E]">Your resilience</span>
          <strong className="mt-1 block text-xl text-[#173E32]">You have {bufferDays} days of bills covered.</strong>
          <span className="mt-1 block text-xs leading-5 text-[#61766E]">Your score is {score}/100. You’re building a useful safety cushion.</span>
        </span>
        <ArrowRight size={20} className="shrink-0 text-[#2C705A]" />
      </button>
    </div>
  );
}

function ResilienceTab({ dashboard, openExplanation }) {
  const score = dashboard?.resilienceScore?.score ?? 68;
  const days = dashboard?.resilienceScore?.buffer_days ?? 12;
  const factors = [
    ["Income steadiness", 72, "Your earnings arrive most weeks.", ArrowUpRight],
    ["Savings balance", 64, "Your emergency fund is growing.", PiggyBank],
    ["Cash ups and downs", 58, "A few low-income days need watching.", RefreshCw],
  ];

  return (
    <div className="space-y-5">
      <PageHeading eyebrow="Resilience" title="How ready am I for a slow week?" copy="One simple score that shows how well your money can handle a surprise." />
      <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
        <Card className="flex flex-col items-center justify-center text-center">
          <ScoreRing score={score} size={170} />
          <h2 className="mt-5 text-2xl font-bold text-[#173E32]">{days} days covered</h2>
          <p className="mt-2 max-w-xs text-sm leading-6 text-[#68766F]">If income stopped today, your current cash could cover about {days} days of essential bills.</p>
          <Badge tone="green"><TrendingUp size={12} /> Up 4 points this month</Badge>
        </Card>
        <Card>
          <SectionTitle label="Next 30 days" title="Your balance forecast" />
          <div className="flex items-center gap-2 rounded-xl bg-[#FFF6DF] px-3 py-2 text-xs font-bold text-[#855B12]">
            <AlertTriangle size={14} /> Sep 13–15 may be a lower-income patch
          </div>
          <div className="mt-4"><CashFlowChart large /></div>
          <div className="mt-1 flex justify-between text-[10px] text-[#84908B]"><span>Today</span><span>10 days</span><span>20 days</span><span>30 days</span></div>
        </Card>
      </div>
      <Card>
        <SectionTitle label="What affects your score" title="Three things to watch" action="Explain my score" onAction={openExplanation} />
        <div className="space-y-3">
          {factors.map(([label, value, copy, Icon]) => (
            <div key={label} className="rounded-2xl bg-[#F7F9F8] p-4">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-[#E6F1EC] p-2 text-[#276D56]"><Icon size={16} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3 text-sm font-bold text-[#34423D]"><span>{label}</span><span>{value}/100</span></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#DFE8E4]"><div className="h-full rounded-full bg-[#2C8068]" style={{ width: `${value}%` }} /></div>
                  <p className="mt-2 text-xs text-[#74817C]">{copy}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SaveTab({ showToast }) {
  const [income, setIncome] = useState(1200);
  const [expenses, setExpenses] = useState(700);
  const [buffer, setBuffer] = useState(200);
  const [safeAmount, setSafeAmount] = useState(300);
  const [style, setStyle] = useState("Smart Save");
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    const adjustedExpenses = expenses + buffer;
    try {
      const response = await apiFetch("/api/savings/calculate", {
        method: "POST",
        body: JSON.stringify({ dailyIncome: income, dailyExpenses: adjustedExpenses }),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setSafeAmount(data.safeToSave ?? 0);
    } catch {
      setSafeAmount(Math.max(0, (income - adjustedExpenses) * 0.8));
      showToast("We calculated this on your phone while reconnecting.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeading eyebrow="Save" title="Build a cushion without missing a bill." copy="Pick an amount that fits today. If money gets tight, your plan pauses automatically." />
      <Card className="bg-[#0F4135] text-white">
        <div className="flex items-end justify-between gap-3">
          <div><p className="text-xs font-bold text-[#B7D5CB]">Emergency goal</p><strong className="mt-2 block text-3xl tracking-[-0.05em]">₹3,400 <span className="text-base font-medium text-[#A7C7BC]">/ ₹5,000</span></strong></div>
          <span className="text-sm font-bold text-[#CDE1DA]">68%</span>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/15"><div className="h-full w-[68%] rounded-full bg-[#70C49D]" /></div>
        <p className="mt-3 text-xs text-[#A7C7BC]">₹1,600 more gives you a stronger emergency cushion.</p>
      </Card>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <Card>
          <SectionTitle label="Safe-to-save calculator" title="What can I save today?" />
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Daily income", income, setIncome],
              ["Expenses", expenses, setExpenses],
              ["Safety buffer", buffer, setBuffer],
            ].map(([label, value, setter]) => (
              <label key={label} className="text-xs font-bold text-[#52615C]">
                {label}
                <div className="relative mt-2">
                  <span className="absolute left-3 top-3 text-[#71807A]">₹</span>
                  <input type="number" min="0" value={value} onChange={(event) => setter(Number(event.target.value))} className="focus-ring w-full [appearance:textfield] rounded-xl border border-[#DDE4E0] bg-[#FAFBFA] py-3 pl-7 pr-3 text-sm font-bold text-[#26332E] outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                </div>
              </label>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-[#EAF5EF] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5D7B70]">Safe daily saving</p>
            <div className="mt-1 flex items-end justify-between gap-3">
              <strong className="text-4xl tracking-[-0.07em] text-[#17634D]">{money(safeAmount)}</strong>
              <button onClick={calculate} disabled={loading} className="focus-ring rounded-xl bg-[#0F4135] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{loading ? "Checking..." : "Calculate"}</button>
            </div>
            <p className="mt-2 text-xs text-[#60776E]">Income − expenses − safety buffer, with extra room left in your account.</p>
          </div>
        </Card>
        <Card>
          <SectionTitle label="Saving style" title="Choose what feels easiest" />
          <div className="space-y-2">
            {[
              ["Round-up spare change", "Save the small difference after each spend."],
              ["% of Income", "Save the same share whenever you get paid."],
              ["Smart Save", "Let your amount adjust when earnings change."],
            ].map(([name, copy]) => (
              <button key={name} onClick={() => setStyle(name)} className={cx("focus-ring flex w-full items-start gap-3 rounded-2xl border p-3 text-left", style === name ? "border-[#87B6A6] bg-[#EDF7F2]" : "border-[#E4E9E6]")}>
                <span className={cx("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border", style === name ? "border-[#1F7259] bg-[#1F7259] text-white" : "border-[#B8C3BE]")}>{style === name && <Check size={12} />}</span>
                <span><strong className="block text-sm text-[#35443E]">{name}</strong><span className="mt-1 block text-xs leading-5 text-[#74817C]">{copy}</span></span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-2 rounded-2xl bg-[#FFF7E6] p-3 text-xs leading-5 text-[#785819]"><ShieldCheck className="mt-0.5 shrink-0" size={16} /> If cash gets low, savings pause automatically to protect your bill money.</div>
        </Card>
      </div>
    </div>
  );
}

function CreditTab({ showToast }) {
  const [purpose, setPurpose] = useState("Vehicle repair");
  const [amount, setAmount] = useState(3000);
  const [checked, setChecked] = useState(false);
  const affordable = amount <= 4000;
  const saferAmount = Math.min(3500, Math.round(amount * 0.7 / 100) * 100);

  return (
    <div className="space-y-5">
      <PageHeading eyebrow="Credit" title="Borrow safely, not hopefully." copy="We check the repayment against your real bill money before showing a plan." />
      <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <Card>
          <SectionTitle label="Start here" title="What do you need help with?" />
          <div className="flex flex-wrap gap-2">
            {["Vehicle repair", "Medical", "Bridge to next income"].map((item) => (
              <button key={item} onClick={() => { setPurpose(item); setChecked(false); }} className={cx("focus-ring rounded-xl border px-3 py-2.5 text-xs font-bold", purpose === item ? "border-[#0F4135] bg-[#0F4135] text-white" : "border-[#DDE4E0] text-[#56645F]")}>{item}</button>
            ))}
          </div>
          <label className="mt-5 block text-xs font-bold text-[#52615C]">
            Requested amount
            <div className="relative mt-2">
              <span className="absolute left-3 top-3 text-[#71807A]">₹</span>
              <input type="number" min="500" value={amount} onChange={(event) => { setAmount(Number(event.target.value)); setChecked(false); }} className="focus-ring w-full [appearance:textfield] rounded-xl border border-[#DDE4E0] bg-[#FAFBFA] py-3 pl-7 pr-3 text-lg font-bold text-[#26332E] outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
            </div>
          </label>
          <div className="mt-5 rounded-2xl bg-[#F5F7F6] p-4">
            <div className="flex justify-between text-xs text-[#68766F]"><span>Average income</span><strong>₹18,000</strong></div>
            <div className="mt-2 flex justify-between text-xs text-[#68766F]"><span>Essential expenses</span><strong>₹12,000</strong></div>
            <div className="mt-3 border-t border-[#E0E6E2] pt-3 flex justify-between text-sm font-bold text-[#285D4B]"><span>Repayment capacity</span><span>₹6,000</span></div>
          </div>
          <button onClick={() => setChecked(true)} className="focus-ring mt-5 w-full rounded-xl bg-[#0F4135] py-3 text-sm font-bold text-white">Check what is safe</button>
        </Card>
        <Card className={checked && !affordable ? "border-[#F0D49E] bg-[#FFFDF8]" : ""}>
          {!checked ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <span className="rounded-2xl bg-[#EAF4EF] p-4 text-[#216A53]"><ShieldCheck size={28} /></span>
              <h2 className="mt-4 text-xl font-bold text-[#2D3935]">Your safe plan will appear here.</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#71807A]">We’ll protect your next bills before suggesting any repayment.</p>
            </div>
          ) : affordable ? (
            <div className="animate-float-in">
              <Badge tone="green"><Check size={12} /> This fits your safety limit</Badge>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.055em] text-[#173F33]">{money(amount)} over 6 weeks</h2>
              <p className="mt-2 text-sm leading-6 text-[#68766F]">For {purpose.toLowerCase()}, this plan keeps your bills covered and stays below your ₹4,000 limit.</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#EDF6F2] p-4"><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#688076]">Weekly payment</span><strong className="mt-2 block text-2xl text-[#1B654E]">{money(amount / 6)}</strong></div>
                <div className="rounded-2xl bg-[#F5F7F6] p-4"><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#71807A]">Bill buffer after</span><strong className="mt-2 block text-2xl text-[#34443E]">10 days</strong></div>
              </div>
              <button onClick={() => showToast("Safe borrowing plan saved. No loan was taken.")} className="focus-ring mt-6 rounded-xl bg-[#0F4135] px-5 py-3 text-sm font-bold text-white">Save this plan</button>
            </div>
          ) : (
            <div className="animate-float-in">
              <Badge tone="amber"><AlertTriangle size={12} /> Safety limit</Badge>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.055em] text-[#5F4311]">This amount is too high right now.</h2>
              <p className="mt-3 text-sm leading-6 text-[#75654A]">It takes too much of your cash and drops your bill buffer below 7 days. We won’t call that affordable.</p>
              <div className="mt-5 rounded-2xl bg-[#FFF4D8] p-4"><span className="text-xs font-bold text-[#805A12]">A safer amount</span><strong className="mt-1 block text-3xl text-[#704C0A]">{money(saferAmount)}</strong><p className="mt-1 text-xs text-[#816B42]">This keeps more room for rent, electricity and food.</p></div>
              <button onClick={() => { setAmount(saferAmount); setChecked(true); }} className="focus-ring mt-6 rounded-xl bg-[#8C620E] px-5 py-3 text-sm font-bold text-white">Use safer amount</button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function GuidanceTab() {
  const [mode, setMode] = useState("assistant");
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi Ravi. Ask me about saving, bills or borrowing. I’ll keep the answer simple." },
  ]);
  const [weekly, setWeekly] = useState(200);
  const answers = {
    "Can I save ₹500 today?": "₹500 would make this week a little tight. ₹300 is safer because it keeps your rent and electricity money protected.",
    "Can I afford this loan?": "A ₹3,000 plan looks manageable over 6 weeks. Anything above ₹4,000 would cut too far into your bill cushion.",
    "Why is my score 68?": "Your income has been fairly steady and you have 12 days of bills covered. A few lower-income days are keeping the score from rising faster.",
  };
  const ask = (question) =>
    setMessages((current) => [...current, { from: "user", text: question }, { from: "bot", text: answers[question] }]);
  const projectedSavings = 3400 + weekly * 4;
  const projectedDays = 12 + Math.round(weekly / 100);
  const projectedScore = Math.min(100, 68 + Math.round(weekly / 80));

  return (
    <div className="space-y-5">
      <PageHeading eyebrow="Guidance" title="A calm second opinion." copy="Ask a simple question or test a plan before you act." />
      <div className="mx-auto grid max-w-lg grid-cols-2 rounded-2xl border border-[#DDE5E1] bg-white p-1.5 shadow-sm">
        <button onClick={() => setMode("assistant")} className={cx("focus-ring flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-colors", mode === "assistant" ? "bg-[#0F4135] text-white" : "text-[#61716B]")}><Bot size={15} /> AI Assistant</button>
        <button onClick={() => setMode("simulator")} className={cx("focus-ring flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-colors", mode === "simulator" ? "bg-[#0F4135] text-white" : "text-[#61716B]")}><SlidersHorizontal size={15} /> What-If Simulator</button>
      </div>

      <div className={mode === "assistant" ? "block" : "hidden"}>
        <Card className="mx-auto max-w-3xl overflow-hidden p-0 sm:p-0">
          <div className="flex items-center gap-3 border-b border-[#E8ECEA] bg-[#F1F7F4] px-5 py-4">
            <span className="rounded-xl bg-[#DCEEE6] p-2 text-[#246B54]"><Bot size={19} /></span>
            <div><strong className="block text-sm text-[#29463C]">Resilient Assistant</strong><span className="text-[11px] text-[#71867D]">Answers based on your current plan</span></div>
          </div>
          <div className="min-h-80 space-y-3 bg-[#FBFCFB] p-5">
            {messages.map((message, index) => (
              <div key={index} className={cx("flex", message.from === "user" ? "justify-end" : "justify-start")}>
                <p className={cx("max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6", message.from === "user" ? "rounded-br-md bg-[#0F4135] text-white" : "rounded-bl-md border border-[#E2E9E5] bg-white text-[#53635D]")}>{message.text}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-[#E8ECEA] p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#7B8984]">Tap a question</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hidden">
              {Object.keys(answers).map((question) => <button key={question} onClick={() => ask(question)} className="focus-ring shrink-0 rounded-xl border border-[#DDE5E1] bg-white px-3 py-2.5 text-xs font-bold text-[#40564D]">{question}</button>)}
            </div>
          </div>
        </Card>
      </div>

      <div className={mode === "simulator" ? "block" : "hidden"}>
        <Card className="mx-auto max-w-3xl">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div><Badge tone="blue"><RefreshCw size={12} /> This is only a test</Badge><h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-[#293631]">What if I save {money(weekly)} each week?</h2><p className="mt-1 text-sm text-[#6E7B76]">Move the slider. No real money moves.</p></div>
            <span className="rounded-2xl bg-[#EAF5EF] p-3 text-[#246B54]"><SlidersHorizontal size={22} /></span>
          </div>
          <div className="mt-7">
            <div className="flex justify-between text-xs font-bold text-[#4C5D56]"><span>Weekly saving</span><span className="min-w-20 text-right tabular-nums">{money(weekly)}</span></div>
            <input type="range" min="50" max="500" step="50" value={weekly} onChange={(event) => setWeekly(Number(event.target.value))} className="mt-5 w-full accent-[#0F4135]" />
            <div className="mt-2 flex justify-between text-[10px] text-[#83908B]"><span>₹50</span><span>₹500</span></div>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              ["Emergency savings", money(projectedSavings), "₹3,400 today"],
              ["Buffer days", `${projectedDays} days`, "12 days today"],
              ["Resilience score", `${projectedScore}/100`, "68 today"],
            ].map(([label, value, before]) => (
              <div key={label} className="min-h-32 rounded-2xl bg-[#F1F7F4] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#667C73]">{label}</p>
                <strong className="mt-3 block text-2xl tabular-nums text-[#17614C]">{value}</strong>
                <span className="mt-1 block text-[11px] text-[#7C8984]">{before}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Sheet({ title, icon: Icon, onClose, children }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button aria-label="Close" onClick={onClose} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
      <aside className="relative z-50 h-full w-full max-w-md overflow-y-auto bg-[#F8F9FA] p-5 shadow-2xl sm:p-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><span className="rounded-xl bg-[#E4F0EB] p-2 text-[#21664F]"><Icon size={18} /></span><h2 className="text-xl font-bold text-[#25312D]">{title}</h2></div>
          <button aria-label="Close sheet" onClick={onClose} className="focus-ring rounded-xl border border-[#DFE5E2] bg-white p-2 text-[#5C6A65]"><X size={18} /></button>
        </div>
        <div className="mt-6">{children}</div>
      </aside>
    </div>
  );
}

function ProfileSheet({ users, selectedId, selectUser, close }) {
  return (
    <Sheet title="Choose a profile" icon={ShieldCheck} onClose={close}>
      <p className="mb-4 text-sm leading-6 text-[#66736F]">Switch between the 30 demo profiles to see how different income patterns affect the plan.</p>
      <div className="space-y-2">
        {users.map((user) => (
          <button key={user.id} onClick={() => selectUser(user.id)} className={cx("focus-ring flex w-full items-center gap-3 rounded-2xl border p-3 text-left", selectedId === user.id ? "border-[#7DAE9E] bg-[#EAF5EF]" : "border-[#E2E7E4] bg-white")}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0F4135] text-sm font-bold text-white">{user.full_name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
            <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#34423D]">{user.full_name}</strong><span className="mt-0.5 block truncate text-xs text-[#74817C]">{user.role || "Gig Worker"}</span></span>
            {selectedId === user.id && <Check size={17} className="text-[#17664E]" />}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

function DataSheet({ close, showToast }) {
  const [accounts, setAccounts] = useState([
    { name: "Primary bank account", detail: "Updated 5 minutes ago", shared: true },
    { name: "Savings account", detail: "Updated yesterday", shared: true },
  ]);
  return (
    <Sheet title="Data control" icon={LockKeyhole} onClose={close}>
      <div className="rounded-2xl bg-[#EAF5EF] p-4 text-sm leading-6 text-[#49665B]"><LockKeyhole className="mr-1 inline text-[#17664E]" size={16} /> You choose what is shared. You can stop access at any time.</div>
      <div className="mt-5 space-y-3">
        {accounts.map((account, index) => (
          <div key={account.name} className="rounded-2xl border border-[#E2E7E4] bg-white p-4">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-[#F1F5F3] p-2 text-[#466057]"><Database size={17} /></span><div className="flex-1"><strong className="block text-sm text-[#34423D]">{account.name}</strong><span className="text-xs text-[#78857F]">{account.shared ? account.detail : "Sharing stopped"}</span></div><span className={cx("h-2.5 w-2.5 rounded-full", account.shared ? "bg-[#4D9B76]" : "bg-[#C87A5C]")} /></div>
            {account.shared && <button onClick={() => { setAccounts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, shared: false } : item)); showToast("Sharing stopped for this account."); }} className="focus-ring mt-4 text-xs font-bold text-[#A04D32]">Stop sharing</button>}
          </div>
        ))}
      </div>
      <button onClick={() => showToast("Your data deletion request has started.")} className="focus-ring mt-7 flex w-full items-center gap-3 rounded-2xl border border-[#EECFC3] bg-[#FFF6F2] p-4 text-left"><Trash2 size={18} className="text-[#A84E32]" /><span><strong className="block text-sm text-[#8A432D]">Delete my data</strong><span className="mt-1 block text-xs text-[#966B5D]">Permanently remove your connected information.</span></span></button>
    </Sheet>
  );
}

function NotificationSheet({ close }) {
  const [frequency, setFrequency] = useState("Balanced");
  return (
    <Sheet title="Notifications" icon={Bell} onClose={close}>
      <SectionTitle label="Needs attention" title="Urgent" />
      <div className="space-y-2">
        <div className="rounded-2xl bg-[#FFF4D8] p-4"><div className="flex items-center gap-2 text-sm font-bold text-[#80580F]"><AlertTriangle size={16} /> Electricity is due in 3 days</div><p className="mt-1 text-xs text-[#8A744B]">₹850 is already included in your safe-to-spend amount.</p></div>
        <div className="rounded-2xl bg-[#FFF8E9] p-4"><div className="flex items-center gap-2 text-sm font-bold text-[#80580F]"><CalendarDays size={16} /> Rent is due in 5 days</div><p className="mt-1 text-xs text-[#8A744B]">Keep ₹3,200 untouched for this bill.</p></div>
      </div>
      <div className="mt-6"><SectionTitle label="No action needed" title="Good to know" /></div>
      <div className="rounded-2xl bg-[#EAF5EF] p-4"><div className="flex items-center gap-2 text-sm font-bold text-[#245F4B]"><ArrowUpRight size={16} /> You earned more this week</div><p className="mt-1 text-xs text-[#657B72]">That is why today’s safe saving rose to ₹300.</p></div>
      <div className="mt-7 border-t border-[#E0E6E3] pt-6">
        <p className="text-xs font-bold text-[#53625C]">How often should we remind you?</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {["Quiet", "Balanced", "Helpful"].map((item) => <button key={item} onClick={() => setFrequency(item)} className={cx("focus-ring rounded-xl border py-2.5 text-xs font-bold", frequency === item ? "border-[#0F4135] bg-[#0F4135] text-white" : "border-[#DDE4E0] bg-white text-[#61706A]")}>{item}</button>)}
        </div>
      </div>
    </Sheet>
  );
}

function WhyModal({ close }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center p-4">
      <button aria-label="Close explanation" onClick={close} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
      <div className="relative z-50 w-full max-w-md rounded-[26px] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-[#293630]">Why ₹300?</h2><button onClick={close} className="focus-ring rounded-xl border border-[#DFE5E2] p-2"><X size={17} /></button></div>
        <p className="mt-3 text-sm leading-6 text-[#63716C]">We start with today’s income, protect your expenses and keep a safety buffer.</p>
        <div className="mt-5 space-y-2 rounded-2xl bg-[#F6F8F7] p-4 text-sm">
          <div className="flex justify-between"><span>Today’s income</span><strong className="text-[#17664E]">₹1,200</strong></div>
          <div className="flex justify-between"><span>Expenses</span><strong>− ₹700</strong></div>
          <div className="flex justify-between"><span>Safety buffer</span><strong>− ₹200</strong></div>
          <div className="flex justify-between border-t border-[#DDE4E0] pt-3 text-base"><strong>Safe to save</strong><strong className="text-[#17664E]">₹300</strong></div>
        </div>
        <p className="mt-4 flex gap-2 text-xs leading-5 text-[#6A7973]"><Info className="mt-0.5 shrink-0" size={14} /> If your income or bills change, this amount changes too.</p>
      </div>
    </div>
  );
}

function ScoreExplanation({ close }) {
  return (
    <Sheet title="What your score means" icon={Gauge} onClose={close}>
      <p className="text-sm leading-6 text-[#64736D]">Your score is not a grade. It is a quick way to see how much room your money has when work is slow or a surprise bill arrives.</p>
      <div className="mt-5 space-y-3">
        {[
          ["Income steadiness", "Are earnings arriving regularly?"],
          ["Savings balance", "How much emergency money is ready?"],
          ["Cash ups and downs", "How sharply does your balance change?"],
        ].map(([title, copy]) => <div key={title} className="rounded-2xl bg-white p-4"><strong className="text-sm text-[#34423D]">{title}</strong><p className="mt-1 text-xs leading-5 text-[#74817C]">{copy}</p></div>)}
      </div>
    </Sheet>
  );
}

function SystemLoop() {
  const steps = ["Income received", "Cash flow calculated", "Safety check", "App updated"];
  return (
    <div className="rounded-2xl border border-[#E1E8E4] bg-[#F1F6F3] p-4">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#687B73]"><ShieldCheck size={13} /> Quiet checks in the background</p>
      <div className="mt-3 flex items-center gap-2 overflow-x-auto scrollbar-hidden">
        {steps.map((step, index) => <div key={step} className="flex shrink-0 items-center gap-2">{index > 0 && <ArrowRight size={13} className="text-[#9AA9A3]" />}<span className="rounded-lg bg-white px-3 py-2 text-[11px] font-bold text-[#52665E]">{step}</span></div>)}
      </div>
    </div>
  );
}

export default function App() {
  const [users, setUsers] = useState(demoUsers);
  const [selectedId, setSelectedId] = useState(demoUsers[0].id);
  const [dashboard, setDashboard] = useState(demoDashboard(demoUsers[0]));
  const [tab, setTab] = useState("home");
  const [sheet, setSheet] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedUser = useMemo(() => users.find((user) => user.id === selectedId) || demoUsers[0], [users, selectedId]);

  useEffect(() => {
    if (!getToken()) return;
    apiFetch("/api/users")
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setUsers(data.map((user, index) => ({ ...user, role: user.role || people[index % people.length][1] })));
          setSelectedId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    if (!getToken()) {
      setDashboard(demoDashboard(selectedUser));
      setLoading(false);
      return;
    }
    apiFetch(`/api/dashboard/${encodeURIComponent(selectedId)}`)
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then(setDashboard)
      .catch(() => setDashboard(demoDashboard(selectedUser)))
      .finally(() => setLoading(false));
  }, [selectedId]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const chooseUser = (id) => {
    setSelectedId(id);
    setSheet(null);
    setToast("Profile switched.");
  };

  const tabContent = {
    home: <HomeTab dashboard={dashboard} user={selectedUser} showToast={setToast} setTab={setTab} openWhy={() => setModal("why")} />,
    resilience: <ResilienceTab dashboard={dashboard} openExplanation={() => setSheet("score")} />,
    save: <SaveTab showToast={setToast} />,
    credit: <CreditTab showToast={setToast} />,
    guidance: <GuidanceTab />,
  }[tab];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#222A27]">
      <header className="sticky top-0 z-30 border-b border-[#E4E9E6] bg-[#F8F9FA]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-6">
          <button onClick={() => setTab("home")} className="focus-ring mr-auto flex items-center gap-2 text-left">
            <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-[#0F4135] text-white"><ShieldCheck size={21} /><Leaf size={10} className="absolute right-1.5 top-1.5 text-[#8DD0AF]" /></span>
            <span className="hidden sm:block"><strong className="block text-sm tracking-[-0.03em] text-[#0F4135]">ResilientBank</strong><span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#78857F]">Steady money, one day at a time</span></span>
          </button>
          <button aria-label="Data control" onClick={() => setSheet("data")} className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-[#DFE5E2] bg-white text-[#466057]"><LockKeyhole size={17} /></button>
          <button aria-label="Notifications" onClick={() => setSheet("notifications")} className="focus-ring relative grid h-10 w-10 place-items-center rounded-xl border border-[#DFE5E2] bg-white text-[#466057]"><Bell size={17} /><span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-[#D39424]" /></button>
          <button onClick={() => setSheet("profiles")} className="focus-ring flex min-w-0 items-center gap-2 rounded-xl border border-[#DDE4E0] bg-white px-2.5 py-2 text-left sm:px-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#E6F1EC] text-[10px] font-bold text-[#1F6A52]">{selectedUser.full_name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
            <span className="hidden min-w-0 sm:block"><strong className="block max-w-36 truncate text-xs text-[#34423D]">{selectedUser.full_name}</strong><span className="block max-w-36 truncate text-[10px] text-[#77847F]">{selectedUser.role || "Gig Worker"}</span></span>
            <ChevronDown size={13} className="text-[#77847F]" />
          </button>
        </div>
        <button onClick={() => setSheet("profiles")} className="focus-ring flex w-full items-center justify-center gap-1 border-t border-[#E7EBE9] py-2 text-xs font-bold text-[#42564E] sm:hidden">{selectedUser.full_name} <span className="font-medium text-[#7A8782]">• {selectedUser.role || "Gig Worker"}</span><ChevronDown size={13} /></button>
      </header>

      {loading && <div className="fixed left-0 right-0 top-[65px] z-20 h-0.5 overflow-hidden bg-[#DCE9E4]"><div className="h-full w-1/2 animate-pulse rounded-full bg-[#1F7159]" /></div>}

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 pb-32 sm:px-6 sm:py-7 sm:pb-32">
        {tabContent}
        <SystemLoop />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#DFE5E2] bg-white/95 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-lg">
        <div className="mx-auto flex max-w-xl justify-around px-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={cx("focus-ring flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold transition-colors", tab === id ? "bg-[#E9F3EE] text-[#0F5D47]" : "text-[#7A8782]")}>
              <Icon size={19} strokeWidth={tab === id ? 2.5 : 1.8} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {sheet === "profiles" && <ProfileSheet users={users} selectedId={selectedId} selectUser={chooseUser} close={() => setSheet(null)} />}
      {sheet === "data" && <DataSheet close={() => setSheet(null)} showToast={setToast} />}
      {sheet === "notifications" && <NotificationSheet close={() => setSheet(null)} />}
      {sheet === "score" && <ScoreExplanation close={() => setSheet(null)} />}
      {modal === "why" && <WhyModal close={() => setModal(null)} />}
      {toast && <div className="pointer-events-none fixed top-16 left-1/2 z-50 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-xl bg-[#0F4135] px-4 py-3 text-xs font-bold whitespace-nowrap text-white shadow-xl"><Check size={15} className="text-[#A9D7C5]" />{toast}</div>}
    </div>
  );
}