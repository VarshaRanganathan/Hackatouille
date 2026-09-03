import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Bot,
  Check,
  ChevronRight,
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
  Sparkles,
  Trash2,
  TrendingUp,
  WalletCards,
  X,
  Zap,
} from "lucide-react";

const ONBOARDING_MARKER = "rb_onboarding_complete";

const tabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "resilience", label: "Resilience", icon: Gauge },
  { id: "save", label: "Save", icon: PiggyBank },
  { id: "credit", label: "Credit", icon: CreditCard },
  { id: "guidance", label: "Guidance", icon: MessageCircle },
];

const questions = [
  { key: "income_range_min", label: "What is the least you earn on a work day?", prefix: "₹", type: "number", placeholder: "700" },
  { key: "income_range_max", label: "What is the most you earn on a work day?", prefix: "₹", type: "number", placeholder: "1,500" },
  { key: "work_days_per_week", label: "How many days do you usually work each week?", type: "number", placeholder: "6", max: 7 },
  { key: "income_frequency", label: "How often do you usually get paid?", type: "choice", options: ["Daily", "Weekly", "Every two weeks", "Monthly"] },
  { key: "rent", label: "How much is your monthly rent or home payment?", prefix: "₹", type: "number", placeholder: "3,200" },
  { key: "utilities", label: "How much do you spend on electricity and utilities each month?", prefix: "₹", type: "number", placeholder: "850" },
  { key: "food", label: "How much does your household spend on food each month?", prefix: "₹", type: "number", placeholder: "3,000" },
  { key: "transport", label: "How much do you spend on fuel and transport each month?", prefix: "₹", type: "number", placeholder: "1,500" },
  { key: "debt_payment", label: "How much do you pay toward loans or debt each month?", prefix: "₹", type: "number", placeholder: "0" },
  { key: "other_essentials", label: "Any other essential monthly costs?", prefix: "₹", type: "number", placeholder: "0" },
  { key: "current_balance", label: "How much money can you use right now?", prefix: "₹", type: "number", placeholder: "6,850" },
  { key: "current_savings", label: "How much have you already set aside for emergencies?", prefix: "₹", type: "number", placeholder: "3,400" },
  { key: "emergency_goal", label: "How much emergency money would help you feel safer?", prefix: "₹", type: "number", placeholder: "5,000" },
  { key: "goal_months", label: "How many months would you like to reach that goal in?", type: "number", placeholder: "6" },
  { key: "household_size", label: "How many people share your household costs?", type: "number", placeholder: "3" },
  { key: "dependents", label: "How many people depend on your income?", type: "number", placeholder: "2" },
  { key: "income_predictability", label: "How predictable does your income feel?", type: "choice", options: ["Very unpredictable", "A little unpredictable", "Mostly steady", "Very steady"] },
  { key: "saving_style", label: "Which saving style feels easiest?", type: "choice", options: ["Small amounts daily", "Once a week", "Whenever I get paid", "Let the app suggest"] },
  { key: "main_money_worry", label: "What worries you most about money?", type: "choice", options: ["Bills arriving before income", "Emergency costs", "Debt payments", "Not saving enough"] },
  { key: "primary_goal", label: "What would you most like ResilientBank to help with?", type: "choice", options: ["Cover bills on time", "Build emergency savings", "Borrow more safely", "Understand my cash flow"] },
];

const initialAnswers = {
  income_range_min: "",
  income_range_max: "",
  work_days_per_week: "",
  income_frequency: "",
  rent: "",
  utilities: "",
  food: "",
  transport: "",
  debt_payment: "0",
  other_essentials: "0",
  current_balance: "",
  current_savings: "",
  emergency_goal: "",
  goal_months: "",
  household_size: "",
  dependents: "",
  income_predictability: "",
  saving_style: "",
  main_money_worry: "",
  primary_goal: "",
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body) headers.set("Content-Type", "application/json");
  return fetch(path, { ...options, headers, credentials: "include" });
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-[#0F4135] text-white shadow-lg shadow-[#0F4135]/15">
        <ShieldCheck size={23} />
        <Leaf size={10} className="absolute right-2 top-2 text-[#91D0B2]" />
      </span>
      <span>
        <strong className="block text-base tracking-[-0.04em] text-[#0F4135]">ResilientBank</strong>
        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#7A8782]">Steady money, one day at a time</span>
      </span>
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, type = "button", className = "" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "focus-ring flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0F4135] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0F4135]/10 transition hover:bg-[#155343] disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
    >
      {children}
    </button>
  );
}

function WelcomeStage({ identity, setIdentity, onContinue }) {
  const ready = identity.full_name.trim().length >= 2 && identity.work_type.trim().length >= 2;
  return (
    <OnboardingShell stage={1}>
      <div className="mx-auto max-w-lg">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F3ED] px-3 py-1.5 text-xs font-bold text-[#24644F]">
          <Sparkles size={13} /> A simple plan for uneven income
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-[-0.065em] text-[#18231F] sm:text-5xl">
          Let’s start with your name.
        </h1>
        <p className="mt-4 text-base leading-7 text-[#66746F]">
          We’ll ask a few everyday questions, then show how much is safe to spend, save, and keep for bills.
        </p>
        <div className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-bold text-[#3D4A45]">Your full name</span>
            <input
              autoFocus
              value={identity.full_name}
              onChange={(event) => setIdentity((current) => ({ ...current, full_name: event.target.value }))}
              placeholder="Ravi Kumar"
              className="focus-ring mt-2 w-full rounded-2xl border border-[#D9E1DD] bg-white px-4 py-3.5 text-base font-semibold text-[#293630] outline-none placeholder:font-normal placeholder:text-[#A0ABA6]"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-[#3D4A45]">What work do you do?</span>
            <input
              value={identity.work_type}
              onChange={(event) => setIdentity((current) => ({ ...current, work_type: event.target.value }))}
              placeholder="Delivery / Gig Worker"
              className="focus-ring mt-2 w-full rounded-2xl border border-[#D9E1DD] bg-white px-4 py-3.5 text-base font-semibold text-[#293630] outline-none placeholder:font-normal placeholder:text-[#A0ABA6]"
            />
          </label>
        </div>
        <PrimaryButton onClick={onContinue} disabled={!ready} className="mt-8">
          Continue to permissions <ArrowRight size={17} />
        </PrimaryButton>
        <p className="mt-4 text-center text-xs leading-5 text-[#82908A]">Your answers are used only to build your money plan.</p>
      </div>
    </OnboardingShell>
  );
}

function ConsentToggle({ checked, onChange, title, detail, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cx(
        "focus-ring flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition",
        checked ? "border-[#86B5A5] bg-[#EDF7F2]" : "border-[#E0E6E3] bg-white",
      )}
    >
      <span className={cx("grid h-10 w-10 shrink-0 place-items-center rounded-xl", checked ? "bg-[#D6EDE3] text-[#17634D]" : "bg-[#F0F3F1] text-[#71807A]")}>
        <Icon size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-sm text-[#34423D]">{title}</strong>
        <span className="mt-1 block text-xs leading-5 text-[#74817C]">{detail}</span>
      </span>
      <span className={cx("relative h-7 w-12 shrink-0 rounded-full transition", checked ? "bg-[#1D7258]" : "bg-[#CCD5D1]")}>
        <span className={cx("absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all", checked ? "left-6" : "left-1")} />
      </span>
    </button>
  );
}

function TermsSheet({ onClose, onAccept }) {
  const termsCards = [
    {
      icon: ShieldCheck,
      title: "Data Ownership & Privacy",
      text: "Your data belongs to you. We only analyze what you consent to share, and we never sell your personal details or screen-scrape your bank accounts.",
    },
    {
      icon: WalletCards,
      title: "Guidance, Not Automatic Transfers",
      text: "ResilientBank helps you calculate safe savings and affordability limits. The app will NEVER move money, issue loans, or make withdrawals without your direct approval.",
    },
    {
      icon: SlidersHorizontal,
      title: "Total Control & Erasure",
      text: "You can pause recommendations, change your settings, or delete your connected data permanently at any time from the Data Control tab.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close terms"
        onClick={onClose}
        className="absolute inset-0 bg-[#10251E]/55 backdrop-blur-sm"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-title"
        className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-[30px] bg-[#F8F9FA] px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:max-w-xl sm:rounded-[30px] sm:p-6"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#CAD5D0] sm:hidden" />
        <div className="flex items-start justify-between gap-4 px-1">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5F2EC] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#2D6955]">
              <ShieldCheck size={12} /> Plain-language promise
            </span>
            <h2 id="terms-title" className="mt-3 text-2xl font-bold tracking-[-0.045em] text-[#18231F]">
              ResilientBank Terms of Service
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#68766F]">
              Three simple things to know before you continue.
            </p>
          </div>
          <button type="button" onClick={onClose} className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#DDE4E0] bg-white text-[#53635D]">
            <X size={18} />
          </button>
        </div>
        <div className="mt-5 space-y-3">
          {termsCards.map(({ icon: Icon, title, text }, index) => (
            <article key={title} className="rounded-2xl border border-[#E0E7E3] bg-white p-4">
              <div className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#E8F3EE] text-[#20664F]">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#799087]">Promise {index + 1}</p>
                  <h3 className="mt-1 text-sm font-bold text-[#2D3C36]">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-[#65736E]">{text}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
        <PrimaryButton onClick={onAccept} className="mt-5">
          <Check size={17} /> I Understand & Agree
        </PrimaryButton>
      </section>
    </div>
  );
}

function ConsentStage({ terms, setTerms, consent, setConsent, onBack, onContinue }) {
  const [showTerms, setShowTerms] = useState(false);
  const allAllowed = terms && Object.values(consent).every(Boolean);
  return (
    <OnboardingShell stage={2}>
      <div className="mx-auto max-w-xl">
        <button onClick={onBack} className="focus-ring mb-6 flex items-center gap-1 text-xs font-bold text-[#52665E]"><ArrowLeft size={15} /> Back</button>
        <h1 className="text-3xl font-bold tracking-[-0.055em] text-[#18231F] sm:text-4xl">You choose what we can use.</h1>
        <p className="mt-3 text-sm leading-6 text-[#68766F]">These permissions help us calculate a useful plan. You can delete your data later from Data Control.</p>
        <div className="mt-7 space-y-3">
          <ConsentToggle checked={consent.income} onChange={(value) => setConsent((current) => ({ ...current, income: value }))} title="Income analysis" detail="Use your earning range to spot stronger and slower days." icon={TrendingUp} />
          <ConsentToggle checked={consent.expenses} onChange={(value) => setConsent((current) => ({ ...current, expenses: value }))} title="Expense estimation" detail="Use your bills to protect essential money first." icon={WalletCards} />
          <ConsentToggle checked={consent.savings} onChange={(value) => setConsent((current) => ({ ...current, savings: value }))} title="Savings goals" detail="Use your target to suggest small, realistic steps." icon={PiggyBank} />
        </div>
        <div className="focus-ring mt-5 flex items-start gap-3 rounded-2xl border border-[#E0E6E3] bg-white p-4">
          <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
            <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#0F4135]" />
            <span><strong className="block text-sm leading-5 text-[#34423D]">I agree to the Terms & Conditions and Privacy Policy</strong><span className="mt-1 block text-xs leading-5 text-[#74817C]">I understand this is guidance, not a promise of income or credit.</span></span>
          </label>
          <button type="button" onClick={() => setShowTerms(true)} className="focus-ring shrink-0 rounded-xl bg-[#E9F3EE] px-3 py-2 text-xs font-bold text-[#17634D]">
            Read T&amp;C
          </button>
        </div>
        {!allAllowed && <p className="mt-3 flex items-center gap-2 text-xs text-[#8A641E]"><Info size={14} /> Turn on all three items and accept the terms to continue.</p>}
        <PrimaryButton onClick={onContinue} disabled={!allAllowed} className="mt-7">Start the questions <ArrowRight size={17} /></PrimaryButton>
      </div>
      {showTerms && <TermsSheet onClose={() => setShowTerms(false)} onAccept={() => { setTerms(true); setShowTerms(false); }} />}
    </OnboardingShell>
  );
}

function QuestionInput({ question, value, onChange }) {
  if (question.type === "choice") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {question.options.map((option) => (
          <button
            type="button"
            key={option}
            onClick={() => onChange(option)}
            className={cx(
              "focus-ring flex min-h-16 items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-bold transition",
              value === option ? "border-[#0F4135] bg-[#EAF5EF] text-[#164D3D]" : "border-[#DDE4E0] bg-white text-[#53625C]",
            )}
          >
            {option}
            {value === option && <Check size={17} />}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {question.prefix && <span className="absolute left-4 top-4 text-lg font-bold text-[#66756F]">{question.prefix}</span>}
      <input
        autoFocus
        type="number"
        min="0"
        max={question.max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={question.placeholder}
        className={cx(
          "focus-ring w-full [appearance:textfield] rounded-2xl border border-[#D9E1DD] bg-white py-4 pr-4 text-2xl font-bold text-[#26332E] outline-none placeholder:text-[#AFB8B4] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          question.prefix ? "pl-10" : "pl-4",
        )}
      />
    </div>
  );
}

function QuestionnaireStage({ answers, setAnswers, questionIndex, setQuestionIndex, onBack, onSubmit, submitting, error }) {
  const question = questions[questionIndex];
  const value = answers[question.key];
  const valid = value !== "" && value !== null && value !== undefined;
  const progress = ((questionIndex + 1) / questions.length) * 100;

  const previous = () => {
    if (questionIndex === 0) onBack();
    else setQuestionIndex((current) => current - 1);
  };

  const next = () => {
    if (questionIndex === questions.length - 1) onSubmit();
    else setQuestionIndex((current) => current + 1);
  };

  return (
    <OnboardingShell stage={3}>
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between text-xs font-bold text-[#5D7068]">
          <span>Step {questionIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#DDE7E2]">
          <div className="h-full rounded-full bg-[#1F755A] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="min-h-[360px] py-10 sm:min-h-[390px] sm:py-14">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6D8178]">Your money today</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-[-0.055em] text-[#18231F] sm:text-4xl">{question.label}</h1>
          <div className="mt-8"><QuestionInput question={question} value={value} onChange={(nextValue) => setAnswers((current) => ({ ...current, [question.key]: nextValue }))} /></div>
          {error && questionIndex === questions.length - 1 && <div className="mt-5 flex gap-2 rounded-2xl bg-[#FFF1E8] p-4 text-sm leading-6 text-[#8C4E31]"><AlertTriangle className="mt-1 shrink-0" size={17} />{error}</div>}
        </div>
        <div className="flex gap-3 border-t border-[#E0E6E3] pt-5">
          <button onClick={previous} disabled={submitting} className="focus-ring flex items-center gap-2 rounded-2xl border border-[#D8E0DC] bg-white px-5 py-3.5 text-sm font-bold text-[#53635D]"><ArrowLeft size={16} /> Back</button>
          <PrimaryButton onClick={next} disabled={!valid || submitting}>
            {submitting ? "Building your plan..." : questionIndex === questions.length - 1 ? "Build my plan" : "Next question"}
            {!submitting && <ArrowRight size={17} />}
          </PrimaryButton>
        </div>
      </div>
    </OnboardingShell>
  );
}

function OnboardingShell({ stage, children }) {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <header className="border-b border-[#E4E9E6] bg-white/85 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between"><Brand /><span className="rounded-full bg-[#ECF5F1] px-3 py-1.5 text-[11px] font-bold text-[#356555]">Stage {stage} of 3</span></div>
      </header>
      <main className="px-4 py-10 sm:px-6 sm:py-16">{children}</main>
    </div>
  );
}

function ScoreRing({ score }) {
  return (
    <div className="relative grid h-36 w-36 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#258064 ${score * 3.6}deg, #DDEAE5 0deg)` }}>
      <div className="grid h-[122px] w-[122px] place-items-center rounded-full bg-white text-center">
        <div><strong className="block text-4xl tracking-[-0.07em] text-[#0F4135]">{Math.round(score)}</strong><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#78857F]">out of 100</span></div>
      </div>
    </div>
  );
}

function Card({ children, className = "" }) {
  return <section className={cx("rounded-[24px] border border-[#E4E9E6] bg-white p-5 shadow-[0_8px_30px_rgba(15,65,53,.06)] sm:p-6", className)}>{children}</section>;
}

function CashChart() {
  return (
    <svg viewBox="0 0 500 130" preserveAspectRatio="none" className="h-36 w-full" role="img" aria-label="Balance forecast">
      <defs><linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3D9879" stopOpacity=".3" /><stop offset="100%" stopColor="#3D9879" stopOpacity="0" /></linearGradient></defs>
      <path d="M0 102 C55 92 72 65 120 74 S190 104 238 80 S307 46 360 59 S431 45 500 28 L500 130 L0 130Z" fill="url(#balanceFill)" />
      <path d="M0 102 C55 92 72 65 120 74 S190 104 238 80 S307 46 360 59 S431 45 500 28" fill="none" stroke="#26755B" strokeWidth="4" strokeLinecap="round" />
      <line x1="0" y1="110" x2="500" y2="110" stroke="#D79A2B" strokeDasharray="6 5" />
    </svg>
  );
}

function HomeTab({ dashboard, name, setTab, showToast }) {
  const balance = Number(dashboard.current_balance) || 0;
  const burn = Number(dashboard.daily_burn_rate) || 0;
  const safeToSpend = Math.max(0, balance - burn * 7);
  const bills = dashboard.upcoming_bills || [];
  return (
    <div className="space-y-5">
      <div><p className="text-xs font-medium text-[#72807B]">Your plan is ready</p><h1 className="mt-1 text-3xl font-bold tracking-[-0.055em] text-[#18231F]">Hi, {name.split(" ")[0]}. Here’s your money today.</h1></div>
      <section className="rounded-[28px] bg-[#0F4135] p-5 text-white shadow-xl shadow-[#0F4135]/15 sm:p-7">
        <p className="flex items-center gap-2 text-xs font-bold text-[#B5D3C8]"><WalletCards size={15} /> Money you can use now</p>
        <strong className="mt-4 block text-5xl tracking-[-0.075em]">{money(balance)}</strong>
        <div className="mt-7 grid grid-cols-2 gap-4 border-t border-white/15 pt-5">
          <div><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9DBFB3]">Safe to spend</span><strong className="mt-1 block text-2xl">{money(safeToSpend)}</strong></div>
          <div className="border-l border-white/15 pl-4"><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9DBFB3]">Bills covered</span><strong className="mt-1 block text-2xl">{Number(dashboard.buffer_days || 0).toFixed(0)} days</strong></div>
        </div>
      </section>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <Card>
          <h2 className="text-xl font-bold text-[#26332E]">What’s coming up?</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {bills.length ? bills.slice(0, 4).map((bill) => <div key={bill.id} className="rounded-2xl bg-[#FFF7E4] p-3"><Zap size={15} className="text-[#A16A0B]" /><strong className="mt-2 block text-sm text-[#554421]">{bill.name}</strong><span className="mt-1 block text-lg font-bold text-[#2D302E]">{money(bill.amount)}</span><span className="text-[11px] text-[#857452]">in {bill.due_in_days} days</span></div>) : <p className="col-span-2 rounded-2xl bg-[#F5F7F6] p-4 text-sm text-[#6E7B76]">No upcoming bills have been added yet.</p>}
          </div>
          <div className="mt-4 rounded-2xl bg-[#F6F8F7] p-3"><CashChart /></div>
        </Card>
        <Card className="border-[#F0D9A8] bg-[#FFFDF8]">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF1CF] px-2.5 py-1 text-[11px] font-bold text-[#80560C]"><Sparkles size={12} /> Today’s suggestion</span>
          <h2 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-[#322D23]">Keep today’s saving small and safe.</h2>
          <p className="mt-3 text-sm leading-6 text-[#70695B]">Your daily bill cost is about <strong>{money(burn)}</strong>. Check today’s income before moving anything.</p>
          <button onClick={() => setTab("save")} className="focus-ring mt-5 w-full rounded-2xl bg-[#0F4135] py-3 text-sm font-bold text-white">Check what I can save</button>
          <button onClick={() => showToast("Skipped for today. No money moved.")} className="focus-ring mt-2 w-full py-2 text-xs font-bold text-[#78837F]">Skip today</button>
        </Card>
      </div>
    </div>
  );
}

function ResilienceTab({ dashboard }) {
  const score = Number(dashboard.resilience_score) || 0;
  return (
    <div className="space-y-5">
      <div><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#63776F]">Resilience</p><h1 className="mt-2 text-3xl font-bold tracking-[-0.055em] text-[#18231F]">How ready am I for a slow week?</h1></div>
      <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <Card className="flex flex-col items-center text-center"><ScoreRing score={score} /><h2 className="mt-5 text-2xl font-bold text-[#173E32]">{Number(dashboard.buffer_days || 0).toFixed(0)} days covered</h2><p className="mt-2 text-sm leading-6 text-[#68766F]">This is how long your current balance could cover essential daily costs.</p></Card>
        <Card><h2 className="text-xl font-bold text-[#26332E]">Your 30-day balance</h2><p className="mt-1 text-xs text-[#71807A]">The amber line shows your safety level.</p><div className="mt-4"><CashChart /></div></Card>
      </div>
      <Card><h2 className="text-xl font-bold text-[#26332E]">What shapes your score?</h2><div className="mt-4 space-y-3">{[["Bill cushion", Math.min(100, (Number(dashboard.buffer_days) / 30) * 100)], ["Income steadiness", 70], ["Cash ups and downs", 75]].map(([label, value]) => <div key={label}><div className="flex justify-between text-xs font-bold text-[#52615C]"><span>{label}</span><span>{Math.round(value)}/100</span></div><div className="mt-2 h-2 rounded-full bg-[#DFE8E4]"><div className="h-full rounded-full bg-[#287B60]" style={{ width: `${value}%` }} /></div></div>)}</div></Card>
    </div>
  );
}

function SaveTab({ dashboard, showToast }) {
  const [inflow, setInflow] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const calculate = async () => {
    setLoading(true);
    try {
      const response = await request("/api/savings/calculate", { method: "POST", body: JSON.stringify({ today_inflow: Number(inflow) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "We could not calculate that.");
      setResult(data.safe_to_save);
    } catch (error) {
      showToast(error.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-5">
      <div><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#63776F]">Save</p><h1 className="mt-2 text-3xl font-bold tracking-[-0.055em] text-[#18231F]">What can I safely save today?</h1><p className="mt-2 text-sm text-[#6E7B76]">Tell us what came in today. We’ll protect your daily bill cost first.</p></div>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <Card>
          <label className="text-sm font-bold text-[#42514B]">Money received today<div className="relative mt-2"><span className="absolute left-4 top-4 text-lg font-bold text-[#67766F]">₹</span><input type="number" min="0" value={inflow} onChange={(event) => setInflow(event.target.value)} placeholder="1,200" className="focus-ring w-full [appearance:textfield] rounded-2xl border border-[#D9E1DD] py-4 pl-10 pr-4 text-2xl font-bold outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" /></div></label>
          <div className="mt-4 rounded-2xl bg-[#F3F6F4] p-4 text-sm text-[#607069]">Your saved daily bill cost: <strong>{money(dashboard.daily_burn_rate)}</strong></div>
          <PrimaryButton onClick={calculate} disabled={!inflow || loading} className="mt-5">{loading ? "Checking..." : "Show my safe amount"}</PrimaryButton>
        </Card>
        <Card className="bg-[#EAF5EF]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5E796F]">Safe to save</p>
          <strong className="mt-3 block text-5xl tracking-[-0.075em] text-[#17634D]">{result === null ? "—" : money(result)}</strong>
          <p className="mt-3 text-sm leading-6 text-[#5E746B]">{result === null ? "Enter today’s income to see an amount." : "This leaves room for your usual daily costs and an extra safety margin."}</p>
          {result > 0 && <button onClick={() => showToast(`${money(result)} added to your saving plan.`)} className="focus-ring mt-6 rounded-2xl bg-[#0F4135] px-5 py-3 text-sm font-bold text-white">Save this amount</button>}
        </Card>
      </div>
    </div>
  );
}

function CreditTab({ dashboard, showToast }) {
  const [amount, setAmount] = useState("");
  const capacity = Math.max(0, (Number(dashboard.profile?.avg_daily_income) || 0) * 5 - Number(dashboard.monthly_essential_expenses || 0) / 4);
  const safe = Number(amount) > 0 && Number(amount) <= Math.max(3000, capacity);
  return (
    <div className="space-y-5">
      <div><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#63776F]">Credit</p><h1 className="mt-2 text-3xl font-bold tracking-[-0.055em] text-[#18231F]">Borrow safely.</h1><p className="mt-2 text-sm text-[#6E7B76]">Check an amount before it cuts into your bill money.</p></div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card><label className="text-sm font-bold text-[#42514B]">Amount you are thinking about<div className="relative mt-2"><span className="absolute left-4 top-4 text-lg font-bold text-[#67766F]">₹</span><input type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="3,000" className="focus-ring w-full [appearance:textfield] rounded-2xl border border-[#D9E1DD] py-4 pl-10 pr-4 text-2xl font-bold outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" /></div></label><p className="mt-4 rounded-2xl bg-[#F3F6F4] p-4 text-sm text-[#607069]">Estimated repayment room: <strong>{money(Math.max(3000, capacity))}</strong></p></Card>
        <Card className={amount && !safe ? "border-[#EFCF91] bg-[#FFFDF8]" : ""}>{!amount ? <p className="flex min-h-32 items-center justify-center text-center text-sm text-[#71807A]">Enter an amount to see whether it fits.</p> : safe ? <div><span className="inline-flex items-center gap-1 rounded-full bg-[#DFF1E8] px-3 py-1 text-xs font-bold text-[#21654F]"><Check size={13} /> Looks manageable</span><h2 className="mt-4 text-2xl font-bold text-[#173E32]">{money(amount)} can fit your current plan.</h2><button onClick={() => showToast("Borrowing plan saved. No loan was taken.")} className="focus-ring mt-5 rounded-2xl bg-[#0F4135] px-5 py-3 text-sm font-bold text-white">Save this plan</button></div> : <div><span className="inline-flex items-center gap-1 rounded-full bg-[#FFF0CF] px-3 py-1 text-xs font-bold text-[#80570C]"><AlertTriangle size={13} /> Too much right now</span><h2 className="mt-4 text-2xl font-bold text-[#5B4114]">This could leave too little for bills.</h2><p className="mt-2 text-sm leading-6 text-[#75674D]">Try {money(Math.max(3000, capacity))} or less to keep a safer cushion.</p></div>}</Card>
      </div>
    </div>
  );
}

function GuidanceTab({ dashboard }) {
  const [mode, setMode] = useState("assistant");
  const [weekly, setWeekly] = useState(200);
  const [messages, setMessages] = useState([{ from: "bot", text: "Ask me about saving, bills, or a slower work week." }]);
  const ask = (text) => setMessages((current) => [...current, { from: "user", text }, { from: "bot", text: `Based on your ${Number(dashboard.buffer_days || 0).toFixed(0)}-day bill cushion, keep the next step small and leave your essential money untouched.` }]);
  return (
    <div className="space-y-5">
      <div><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#63776F]">Guidance</p><h1 className="mt-2 text-3xl font-bold tracking-[-0.055em] text-[#18231F]">A calm second opinion.</h1></div>
      <div className="mx-auto grid max-w-lg grid-cols-2 rounded-2xl border border-[#DDE5E1] bg-white p-1.5"><button onClick={() => setMode("assistant")} className={cx("focus-ring flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold", mode === "assistant" ? "bg-[#0F4135] text-white" : "text-[#687771]")}><Bot size={15} /> Ask a question</button><button onClick={() => setMode("simulator")} className={cx("focus-ring flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold", mode === "simulator" ? "bg-[#0F4135] text-white" : "text-[#687771]")}><SlidersHorizontal size={15} /> Try a plan</button></div>
      <div className={mode === "assistant" ? "block" : "hidden"}><Card className="mx-auto max-w-3xl"><div className="min-h-72 space-y-3">{messages.map((message, index) => <div key={index} className={cx("flex", message.from === "user" ? "justify-end" : "justify-start")}><p className={cx("max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6", message.from === "user" ? "rounded-br-md bg-[#0F4135] text-white" : "rounded-bl-md bg-[#F1F6F3] text-[#53635D]")}>{message.text}</p></div>)}</div><div className="flex gap-2 overflow-x-auto border-t border-[#E5EAE7] pt-4 scrollbar-hidden">{["Can I save today?", "Can I afford a loan?", "What if work is slow?"].map((prompt) => <button key={prompt} onClick={() => ask(prompt)} className="focus-ring shrink-0 rounded-xl border border-[#DDE4E0] px-3 py-2 text-xs font-bold text-[#4C6057]">{prompt}</button>)}</div></Card></div>
      <div className={mode === "simulator" ? "block" : "hidden"}><Card className="mx-auto max-w-3xl"><span className="inline-flex items-center gap-1 rounded-full bg-[#E9F1FF] px-3 py-1 text-xs font-bold text-[#385F94]"><RefreshCw size={12} /> This is only a test</span><h2 className="mt-4 text-2xl font-bold text-[#28352F]">What if I save {money(weekly)} each week?</h2><input type="range" min="50" max="500" step="50" value={weekly} onChange={(event) => setWeekly(Number(event.target.value))} className="mt-7 w-full accent-[#0F4135]" /><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-[#EDF7F2] p-4"><span className="text-[10px] font-bold uppercase text-[#60786E]">New bill cushion</span><strong className="mt-2 block text-2xl text-[#17634D]">{Math.round(Number(dashboard.buffer_days || 0) + weekly / 100)} days</strong></div><div className="rounded-2xl bg-[#EDF7F2] p-4"><span className="text-[10px] font-bold uppercase text-[#60786E]">New score</span><strong className="mt-2 block text-2xl text-[#17634D]">{Math.min(100, Math.round(Number(dashboard.resilience_score || 0) + weekly / 80))}/100</strong></div></div></Card></div>
    </div>
  );
}

function Drawer({ title, icon: Icon, close, children }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button aria-label="Close" onClick={close} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
      <aside className="relative z-50 h-full w-full max-w-md overflow-y-auto bg-[#F8F9FA] p-5 shadow-2xl sm:p-7">
        <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="rounded-xl bg-[#E5F0EB] p-2 text-[#21664F]"><Icon size={18} /></span><h2 className="text-xl font-bold text-[#293630]">{title}</h2></div><button onClick={close} className="focus-ring rounded-xl border border-[#DDE4E0] bg-white p-2"><X size={18} /></button></div>
        <div className="mt-6">{children}</div>
      </aside>
    </div>
  );
}

function DataDrawer({ close, onReset, resetting }) {
  return (
    <Drawer title="Data control" icon={LockKeyhole} close={close}>
      <div className="rounded-2xl bg-[#EAF5EF] p-4 text-sm leading-6 text-[#516B61]"><ShieldCheck className="mr-1 inline text-[#17634D]" size={16} /> Your answers are used to build this plan. You can clear them whenever you want.</div>
      <div className="mt-5 rounded-2xl border border-[#E0E6E3] bg-white p-4"><div className="flex items-center gap-3"><span className="rounded-xl bg-[#F1F5F3] p-2 text-[#536A60]"><Database size={17} /></span><div><strong className="block text-sm text-[#34423D]">Your onboarding answers</strong><span className="text-xs text-[#78857F]">Used for your active plan</span></div></div></div>
      <div className="mt-7 border-t border-[#E0E6E3] pt-6">
        <h3 className="text-sm font-bold text-[#7B3F2B]">Start over</h3>
        <p className="mt-2 text-xs leading-5 text-[#7A6B65]">This clears the active profile, bills, income pattern, and score. You’ll return to the name screen.</p>
        <button onClick={onReset} disabled={resetting} className="focus-ring mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#E8C8BC] bg-[#FFF5F1] px-4 py-3 text-sm font-bold text-[#994A30] disabled:opacity-50"><Trash2 size={16} />{resetting ? "Clearing..." : "Reset app / Onboard new user"}</button>
      </div>
    </Drawer>
  );
}

function NotificationsDrawer({ close }) {
  return <Drawer title="Notifications" icon={Bell} close={close}><div className="rounded-2xl bg-[#FFF4D8] p-4"><strong className="flex items-center gap-2 text-sm text-[#80580F]"><AlertTriangle size={16} /> Your next bill is coming up</strong><p className="mt-2 text-xs leading-5 text-[#816E49]">Open Home to see what is due and how much is already protected.</p></div><div className="mt-3 rounded-2xl bg-[#EAF5EF] p-4"><strong className="flex items-center gap-2 text-sm text-[#245F4B]"><TrendingUp size={16} /> Your plan updates as income changes</strong><p className="mt-2 text-xs leading-5 text-[#647A71]">We’ll keep suggestions small when work is slower.</p></div></Drawer>;
}

function MainApp({ dashboard, setDashboard, onRequireOnboarding }) {
  const [tab, setTab] = useState("home");
  const [drawer, setDrawer] = useState(null);
  const [toast, setToast] = useState("");
  const [resetting, setResetting] = useState(false);
  const name = dashboard.profile?.full_name || "there";

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const reset = async () => {
    setResetting(true);
    try {
      const response = await request("/api/users/reset", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "We could not reset the app.");
      window.localStorage.removeItem(ONBOARDING_MARKER);
      setDashboard(null);
      setDrawer(null);
      onRequireOnboarding();
    } catch (error) {
      setToast(error.message);
      setResetting(false);
    }
  };

  const content = {
    home: <HomeTab dashboard={dashboard} name={name} setTab={setTab} showToast={setToast} />,
    resilience: <ResilienceTab dashboard={dashboard} />,
    save: <SaveTab dashboard={dashboard} showToast={setToast} />,
    credit: <CreditTab dashboard={dashboard} showToast={setToast} />,
    guidance: <GuidanceTab dashboard={dashboard} />,
  }[tab];

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <header className="sticky top-0 z-30 border-b border-[#E4E9E6] bg-[#F8F9FA]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-6"><button onClick={() => setTab("home")} className="focus-ring mr-auto"><Brand /></button><button aria-label="Data control" onClick={() => setDrawer("data")} className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-[#DDE4E0] bg-white text-[#536A60]"><LockKeyhole size={17} /></button><button aria-label="Notifications" onClick={() => setDrawer("notifications")} className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-[#DDE4E0] bg-white text-[#536A60]"><Bell size={17} /></button><div className="hidden rounded-xl border border-[#DDE4E0] bg-white px-3 py-2 sm:block"><strong className="block max-w-40 truncate text-xs text-[#34423D]">{name}</strong><span className="block max-w-40 truncate text-[10px] text-[#78857F]">{dashboard.profile?.work_type || "Independent worker"}</span></div></div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5 pb-32 sm:px-6 sm:py-7 sm:pb-32">{content}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#DFE5E2] bg-white/95 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-lg"><div className="mx-auto flex max-w-xl justify-around px-2">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={cx("focus-ring flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold", tab === id ? "bg-[#E9F3EE] text-[#0F5D47]" : "text-[#7A8782]")}><Icon size={19} strokeWidth={tab === id ? 2.5 : 1.8} />{label}</button>)}</div></nav>
      {drawer === "data" && <DataDrawer close={() => setDrawer(null)} onReset={reset} resetting={resetting} />}
      {drawer === "notifications" && <NotificationsDrawer close={() => setDrawer(null)} />}
      {toast && <div className="pointer-events-none fixed top-16 left-1/2 z-50 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-xl bg-[#0F4135] px-4 py-3 text-xs font-bold whitespace-nowrap text-white shadow-xl"><Check size={15} />{toast}</div>}
    </div>
  );
}

export default function App() {
  const [checking, setChecking] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [stage, setStage] = useState(1);
  const [identity, setIdentity] = useState({ full_name: "", work_type: "" });
  const [terms, setTerms] = useState(false);
  const [consent, setConsent] = useState({ income: true, expenses: true, savings: true });
  const [answers, setAnswers] = useState(initialAnswers);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const checkActiveDashboard = async () => {
    setChecking(true);
    try {
      const response = await request("/api/dashboard/active");
      const data = await response.json();
      const localOnboardingExists = window.localStorage.getItem(ONBOARDING_MARKER) === "true";
      if (response.ok && localOnboardingExists && data.onboarded && data.profile) setDashboard(data);
      else {
        setDashboard(null);
        setStage(1);
      }
    } catch {
      setDashboard(null);
      setStage(1);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkActiveDashboard();
  }, []);

  const submitOnboarding = async () => {
    setSubmitting(true);
    setError("");
    const minimum = Number(answers.income_range_min);
    const maximum = Number(answers.income_range_max);
    const payload = {
      ...answers,
      ...identity,
      terms_accepted: terms,
      consent_income_analysis: consent.income,
      consent_expense_estimation: consent.expenses,
      consent_savings_goals: consent.savings,
      avg_daily_income: (minimum + maximum) / 2,
    };

    try {
      const response = await request("/api/users/onboard", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "We could not build your plan.");
      window.localStorage.setItem(ONBOARDING_MARKER, "true");
      setDashboard({
        profile: data.profile,
        current_balance: data.current_balance,
        resilience_score: data.resilience_score,
        buffer_days: data.buffer_days,
        daily_burn_rate: data.daily_burn_rate,
        monthly_essential_expenses: data.monthly_essential_expenses,
        upcoming_bills: data.upcoming_bills,
      });
    } catch (submitError) {
      setError(`${submitError.message} Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  const restartOnboarding = () => {
    setStage(1);
    setIdentity({ full_name: "", work_type: "" });
    setTerms(false);
    setConsent({ income: true, expenses: true, savings: true });
    setAnswers(initialAnswers);
    setQuestionIndex(0);
    setError("");
  };

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F8F9FA] px-4 text-center">
        <div><span className="mx-auto grid h-14 w-14 animate-pulse place-items-center rounded-2xl bg-[#0F4135] text-white"><ShieldCheck size={27} /></span><h1 className="mt-4 text-xl font-bold text-[#26332E]">Getting your plan ready…</h1><p className="mt-2 text-sm text-[#74817C]">This will only take a moment.</p></div>
      </div>
    );
  }

  if (dashboard) {
    return <MainApp dashboard={dashboard} setDashboard={setDashboard} onRequireOnboarding={restartOnboarding} />;
  }

  if (stage === 1) {
    return <WelcomeStage identity={identity} setIdentity={setIdentity} onContinue={() => setStage(2)} />;
  }

  if (stage === 2) {
    return <ConsentStage terms={terms} setTerms={setTerms} consent={consent} setConsent={setConsent} onBack={() => setStage(1)} onContinue={() => setStage(3)} />;
  }

  return <QuestionnaireStage answers={answers} setAnswers={setAnswers} questionIndex={questionIndex} setQuestionIndex={setQuestionIndex} onBack={() => setStage(2)} onSubmit={submitOnboarding} submitting={submitting} error={error} />;
}