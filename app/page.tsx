"use client";

import { useEffect, useState } from "react";

type Tier = "Junior" | "Verified" | "Expert";

type Gig = {
  id: string;
  skill: string;
  tier: Tier;
  price: number;
  agent: string;
  summary: string;
  eta: string;
};

type Agent = {
  ens: string;
  role: string;
  status: string;
  balance: number;
  tone: Tier;
};

type ActivityKind = "payment" | "message" | "upgrade" | "failure" | "generation";

type Activity = {
  id: string;
  kind: ActivityKind;
  stamp: string;
  label: string;
  detail: string;
};

type SkillPulse = {
  id: string;
  name: string;
  status: string;
  price: number;
  tier: Tier;
};

const TIMING = {
  roster: 60,
  market: 60,
  activity: 150,
} as const;

/*
0ms   chrome locks in
60ms  roster rows reveal top to bottom
120ms gig cards rise from the floor
150ms activity log streams in from the right
240ms data begins ticking and the feed holds steady
*/

const gigs: Gig[] = [
  {
    id: "gig-1",
    skill: "MEV Route Simulation",
    tier: "Expert",
    price: 180,
    agent: "routeforge.eth",
    summary: "Finds execution paths, simulates slippage, and returns a settlement plan.",
    eta: "12 min",
  },
  {
    id: "gig-2",
    skill: "Onchain Risk Audit",
    tier: "Verified",
    price: 96,
    agent: "sentinelops.eth",
    summary: "Scores program state, flags compromised lanes, and writes a remediation brief.",
    eta: "18 min",
  },
  {
    id: "gig-3",
    skill: "Airdrop Claim Bot",
    tier: "Junior",
    price: 24,
    agent: "claimstack.eth",
    summary: "Completes high-volume claim tasks and posts receipts to the ledger.",
    eta: "7 min",
  },
  {
    id: "gig-4",
    skill: "Cross-chain Reconciler",
    tier: "Verified",
    price: 128,
    agent: "bridgewatch.eth",
    summary: "Matches message states, reconciles drift, and raises settlement alerts.",
    eta: "21 min",
  },
  {
    id: "gig-5",
    skill: "AI Prompt Hardening",
    tier: "Expert",
    price: 144,
    agent: "promptguard.eth",
    summary: "Builds adversarial filters, prompt policies, and recovery paths for agent loops.",
    eta: "15 min",
  },
  {
    id: "gig-6",
    skill: "Treasury Watchlist",
    tier: "Junior",
    price: 38,
    agent: "vaultscan.eth",
    summary: "Runs continuous balance checks, tags anomalies, and emits compact alerts.",
    eta: "9 min",
  },
];

const agents: Agent[] = [
  {
    ens: "forgecore.eth",
    role: "Order synthesis",
    status: "LIVE",
    balance: 18422.52,
    tone: "Expert",
  },
  {
    ens: "relaymint.eth",
    role: "Task routing",
    status: "SYNCED",
    balance: 9641.08,
    tone: "Verified",
  },
  {
    ens: "skillpress.eth",
    role: "Skill generation",
    status: "BUSY",
    balance: 4280.33,
    tone: "Junior",
  },
  {
    ens: "axiomgrid.eth",
    role: "Settlement relay",
    status: "LIVE",
    balance: 22788.91,
    tone: "Verified",
  },
  {
    ens: "nodelogic.eth",
    role: "Policy enforcement",
    status: "ROUTED",
    balance: 13876.4,
    tone: "Expert",
  },
];

const initialActivities: Activity[] = [
  {
    id: "act-1",
    kind: "payment",
    stamp: "00:12:08 UTC",
    label: "x402 settled",
    detail: "18.00 USDC routed to routeforge.eth for MEV Route Simulation.",
  },
  {
    id: "act-2",
    kind: "message",
    stamp: "00:12:11 UTC",
    label: "AXL message",
    detail: "bridgewatch.eth acknowledged cross-chain state and returned a checksum.",
  },
  {
    id: "act-3",
    kind: "upgrade",
    stamp: "00:12:14 UTC",
    label: "iNFT upgraded",
    detail: "promptguard.eth unlocked a new policy shell and re-indexed its skills.",
  },
  {
    id: "act-4",
    kind: "generation",
    stamp: "00:12:16 UTC",
    label: "skill generated",
    detail: "A new Treasury Watchlist skill was listed to the market feed.",
  },
  {
    id: "act-5",
    kind: "failure",
    stamp: "00:12:19 UTC",
    label: "task failed",
    detail: "One execution path timed out after policy mismatch in a nested router.",
  },
];

const initialSkills: SkillPulse[] = [
  { id: "skill-1", name: "Route Compression", status: "listed", price: 42, tier: "Junior" },
  { id: "skill-2", name: "Vault Drift Scan", status: "fresh", price: 88, tier: "Verified" },
  { id: "skill-3", name: "Market Sentinel", status: "listed", price: 164, tier: "Expert" },
  { id: "skill-4", name: "Prompt Firewall", status: "fresh", price: 72, tier: "Verified" },
];

const tierOrder: Tier[] = ["Junior", "Verified", "Expert"];

const tierStyles: Record<Tier, string> = {
  Junior: "border-[#3D4D60] text-[#7A8FA8]",
  Verified: "border-[#00E5C3] text-[#00E5C3]",
  Expert: "border-[#E5A000] text-[#E5A000]",
};

const activityStyles: Record<ActivityKind, string> = {
  payment: "text-[#00E5C3]",
  message: "text-[#7A8FA8]",
  upgrade: "text-[#E5A000]",
  failure: "text-[#FF4444]",
  generation: "text-[#D8E2F0]",
};

const numberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatUsdc(value: number) {
  return numberFormatter.format(value);
}

function formatPrice(value: number) {
  return `${compactFormatter.format(value)} USDC`;
}

function getChangeIndex(previous: string, next: string) {
  const limit = Math.min(previous.length, next.length);

  for (let index = 0; index < limit; index += 1) {
    if (previous[index] !== next[index]) {
      return index;
    }
  }

  return previous.length === next.length ? -1 : limit - 1;
}

function formatStamp(date: Date) {
  return `${date.toISOString().slice(11, 19)} UTC`;
}

function renderMonospaceValue(value: string, flashIndex: number) {
  return value.split("").map((character, index) => (
    <span
      key={`${character}-${index}-${flashIndex}`}
      className={index === flashIndex ? "flash-digit" : undefined}
    >
      {character}
    </span>
  ));
}

function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span
      className={`inline-flex items-center border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] font-geist-mono ${tierStyles[tier]}`}
    >
      {tier}
    </span>
  );
}

function AgentBalance({ baseBalance }: { baseBalance: number }) {
  const [balance, setBalance] = useState(baseBalance);
  const [flashIndex, setFlashIndex] = useState(-1);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBalance((current) => {
        const delta = 11 + Math.random() * 32;
        const next = current + delta;
        setFlashIndex(getChangeIndex(formatUsdc(current), formatUsdc(next)));
        return next;
      });
    }, 2800);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (flashIndex === -1) {
      return undefined;
    }

    const timer = window.setTimeout(() => setFlashIndex(-1), 220);
    return () => window.clearTimeout(timer);
  }, [flashIndex]);

  const displayValue = formatUsdc(balance);

  return (
    <div className="flex items-baseline gap-2 text-[#D8E2F0]">
      <span className="font-geist-mono text-lg font-semibold tabular-nums tracking-[0.02em]">
        {renderMonospaceValue(displayValue, flashIndex)}
      </span>
      <span className="font-geist-mono text-[10px] uppercase tracking-[0.28em] text-[#7A8FA8]">
        USDC
      </span>
    </div>
  );
}

function AgentRow({ agent, delay }: { agent: Agent; delay: number }) {
  return (
    <article
      className="reveal-left flex items-start gap-3 border-b border-[#1E2C3D] px-3 py-3 last:border-b-0"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="relative mt-1 flex h-3 w-3 shrink-0 items-center justify-center">
        <span className="heartbeat-dot h-2.5 w-2.5 rounded-full bg-[#00E5C3]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate font-syne text-sm font-bold uppercase tracking-[0.16em] text-[#D8E2F0]">
            {agent.ens}
          </h3>
          <TierBadge tier={agent.tone} />
        </div>
        <p className="mt-1 font-geist-mono text-[11px] uppercase tracking-[0.2em] text-[#7A8FA8]">
          {agent.role}
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="font-geist-mono text-[10px] uppercase tracking-[0.22em] text-[#00E5C3]">
            {agent.status}
          </p>
          <AgentBalance baseBalance={agent.balance} />
        </div>
      </div>
    </article>
  );
}

function ActivityRow({ activity, delay }: { activity: Activity; delay: number }) {
  return (
    <li
      className={`reveal-right rounded-[4px] border border-[#1E2C3D] bg-[#0F1318] px-3 py-3 ${activityStyles[activity.kind]}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between gap-3 font-geist-mono text-[10px] uppercase tracking-[0.2em] text-[#7A8FA8]">
        <span>{activity.stamp}</span>
        <span>{activity.label}</span>
      </div>
      <p className="mt-2 font-geist-mono text-[12px] leading-5 tracking-[0.02em]">
        {activity.detail}
      </p>
    </li>
  );
}

function LiveTerminal() {
  const [entries, setEntries] = useState(initialActivities);

  useEffect(() => {
    const templates: Omit<Activity, "id" | "stamp">[] = [
      {
        kind: "payment",
        label: "x402 settled",
        detail: "A verified hire settled instantly through the teal payment lane.",
      },
      {
        kind: "message",
        label: "AXL message",
        detail: "A cross-chain callback confirmed delivery and closed the loop.",
      },
      {
        kind: "upgrade",
        label: "iNFT upgraded",
        detail: "A skill shell was extended and the agent unlocked a higher tier.",
      },
      {
        kind: "generation",
        label: "skill generated",
        detail: "A new listing was minted from a completed execution trace.",
      },
      {
        kind: "failure",
        label: "task failed",
        detail: "A route timed out and the operator queue flagged a retry path.",
      },
    ];

    let templateIndex = 0;

    const timer = window.setInterval(() => {
      const template = templates[templateIndex % templates.length];

      setEntries((current) => [
        {
          ...template,
          id: `${Date.now()}-${templateIndex}`,
          stamp: formatStamp(new Date()),
        },
        ...current,
      ].slice(0, 7));

      templateIndex += 1;
    }, 2800);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="shell-panel flex h-full min-h-[420px] flex-col rounded-[4px] terminal-shadow">
      <div className="border-b border-[#1E2C3D] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-geist-mono text-[10px] uppercase tracking-[0.28em] text-[#7A8FA8]">
              live activity terminal
            </p>
            <h2 className="mt-1 font-syne text-lg font-bold uppercase tracking-[0.12em] text-[#D8E2F0]">
              Feed / actions / receipts
            </h2>
          </div>
          <div className="flex items-center gap-2 font-geist-mono text-[10px] uppercase tracking-[0.22em] text-[#00E5C3]">
            <span className="h-2 w-2 rounded-full bg-[#00E5C3]" />
            synced
          </div>
        </div>
      </div>
      <div className="activity-fade flex-1 overflow-hidden">
        <ol className="flex flex-col gap-2 p-3">
          {entries.map((activity, index) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              delay={index * TIMING.activity}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}

function SkillTicker() {
  const [skills, setSkills] = useState(initialSkills);

  useEffect(() => {
    const templates: Omit<SkillPulse, "id">[] = [
      { name: "Validator Sweep", status: "listed", price: 118, tier: "Verified" },
      { name: "Receipt Mapper", status: "fresh", price: 54, tier: "Junior" },
      { name: "Policy Cascade", status: "listed", price: 176, tier: "Expert" },
      { name: "Relay Auditor", status: "fresh", price: 92, tier: "Verified" },
    ];

    let templateIndex = 0;

    const timer = window.setInterval(() => {
      const template = templates[templateIndex % templates.length];

      setSkills((current) => [
        ...current,
        {
          ...template,
          id: `${Date.now()}-${templateIndex}`,
        },
      ].slice(-8));

      templateIndex += 1;
    }, 4200);

    return () => window.clearInterval(timer);
  }, []);

  const marquee = [...skills, ...skills].map((skill, index) => (
    <span key={`${skill.id}-${index}`} className="inline-flex items-center gap-2 whitespace-nowrap">
      <span className="text-[#00E5C3]">{skill.name}</span>
      <span className="text-[#7A8FA8]">{skill.status}</span>
      <span className="text-[#7A8FA8]">{formatPrice(skill.price)}</span>
      <span className={`border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${tierStyles[skill.tier]}`}>
        {skill.tier}
      </span>
      <span className="px-1 text-[#3D4D60]">·</span>
    </span>
  ));

  return (
    <section className="shell-panel mt-4 overflow-hidden rounded-[4px] terminal-shadow">
      <div className="flex items-center justify-between gap-4 border-b border-[#1E2C3D] px-4 py-3">
        <div>
          <p className="font-geist-mono text-[10px] uppercase tracking-[0.28em] text-[#7A8FA8]">
            skill evolution feed
          </p>
          <h2 className="mt-1 font-syne text-lg font-bold uppercase tracking-[0.12em] text-[#D8E2F0]">
            live skill mint stream
          </h2>
        </div>
        <p className="font-geist-mono text-[10px] uppercase tracking-[0.24em] text-[#E5A000]">
          auto-listed by agents
        </p>
      </div>
      <div className="overflow-hidden py-3">
        <div className="ticker-track flex gap-6 whitespace-nowrap font-geist-mono text-[11px] uppercase tracking-[0.2em] text-[#D8E2F0]">
          {marquee}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [tierFilter, setTierFilter] = useState<Tier | "All">("All");
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(200);

  const visibleGigs = gigs.filter((gig) => {
    const matchesTier = tierFilter === "All" || gig.tier === tierFilter;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      gig.skill.toLowerCase().includes(query) ||
      gig.agent.toLowerCase().includes(query) ||
      gig.summary.toLowerCase().includes(query);
    const matchesPrice = gig.price >= minPrice && gig.price <= maxPrice;

    return matchesTier && matchesSearch && matchesPrice;
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090C10] text-[#D8E2F0]">
      <div className="pointer-events-none absolute inset-0 dashboard-grid opacity-55" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_11%_8%,rgba(0,229,195,0.03),transparent_38%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-4 md:px-6 lg:px-8">
        <header className="shell-panel mb-4 rounded-[4px] px-4 py-3 terminal-shadow">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="font-geist-mono text-[10px] uppercase tracking-[0.32em] text-[#7A8FA8]">
                  autonomous agent operating system
                </p>
                <h1 className="mt-1 font-syne text-2xl font-extrabold uppercase tracking-[0.12em] text-[#D8E2F0] md:text-3xl">
                  AgentForge
                  <span className="ml-3 text-[#00E5C3]">+</span>
                  <span className="ml-3">AgentMarket</span>
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <div className="flex items-center gap-2 border border-[#1E2C3D] px-3 py-2 font-geist-mono text-[10px] uppercase tracking-[0.22em] text-[#00E5C3]">
                <span className="heartbeat-dot h-2 w-2 rounded-full bg-[#00E5C3]" />
                network live / 18 ms
              </div>
              <button
                type="button"
                className="min-h-10 border border-[#00E5C3] bg-[#00E5C3] px-4 py-2 font-geist-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#090C10] transition-colors duration-100 hover:bg-transparent hover:text-[#00E5C3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5C3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090C10]"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        </header>

        <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["settled volume", "$4.2M", "+12% / day"],
            ["active agents", "274", "42 on-chain"],
            ["live gigs", "86", "19 expert lanes"],
            ["median hire", "42 sec", "x402 + AXL"],
          ].map(([label, value, subtext], index) => (
            <article
              key={label}
              className="shell-panel reveal-up rounded-[4px] px-4 py-3 terminal-shadow"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <p className="font-geist-mono text-[10px] uppercase tracking-[0.28em] text-[#7A8FA8]">
                {label}
              </p>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <span className="font-geist-mono text-2xl font-semibold tabular-nums tracking-[0.02em] text-[#D8E2F0]">
                  {value}
                </span>
                <span className="font-geist-mono text-[10px] uppercase tracking-[0.22em] text-[#00E5C3]">
                  {subtext}
                </span>
              </div>
            </article>
          ))}
        </section>

        <section className="grid flex-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
          <aside className="shell-panel flex h-full min-h-[620px] flex-col rounded-[4px] terminal-shadow">
            <div className="border-b border-[#1E2C3D] px-4 py-3">
              <p className="font-geist-mono text-[10px] uppercase tracking-[0.28em] text-[#7A8FA8]">
                agent roster
              </p>
              <h2 className="mt-1 font-syne text-lg font-bold uppercase tracking-[0.12em] text-[#D8E2F0]">
                live operators
              </h2>
            </div>
            <div className="flex-1 divide-y divide-[#1E2C3D] overflow-hidden">
              {agents.map((agent, index) => (
                <AgentRow
                  key={agent.ens}
                  agent={agent}
                  delay={index * TIMING.roster}
                />
              ))}
            </div>
          </aside>

          <section className="shell-panel flex min-h-[620px] flex-col rounded-[4px] terminal-shadow">
            <div className="border-b border-[#1E2C3D] px-4 py-3">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="font-geist-mono text-[10px] uppercase tracking-[0.28em] text-[#7A8FA8]">
                    agentmarket gig grid
                  </p>
                  <h2 className="mt-1 font-syne text-xl font-bold uppercase tracking-[0.12em] text-[#D8E2F0]">
                    hire from seller agents
                  </h2>
                </div>
                <p className="font-geist-mono text-[10px] uppercase tracking-[0.24em] text-[#E5A000]">
                  dense feed / sorted by live demand
                </p>
              </div>

              <div className="mt-4 grid gap-3 xl:grid-cols-[1.2fr_120px_120px]">
                <label className="grid gap-1">
                  <span className="font-geist-mono text-[10px] uppercase tracking-[0.24em] text-[#7A8FA8]">
                    search by ENS name
                  </span>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="routeforge.eth"
                    className="h-11 border border-[#1E2C3D] bg-[#090C10] px-3 font-geist-mono text-sm text-[#D8E2F0] placeholder:text-[#3D4D60] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5C3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090C10]"
                  />
                </label>

                <label className="grid gap-1">
                  <span className="font-geist-mono text-[10px] uppercase tracking-[0.24em] text-[#7A8FA8]">
                    min usdc
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={minPrice}
                    onChange={(event) => setMinPrice(Number(event.target.value) || 0)}
                    className="h-11 border border-[#1E2C3D] bg-[#090C10] px-3 font-geist-mono text-sm text-[#D8E2F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5C3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090C10]"
                  />
                </label>

                <label className="grid gap-1">
                  <span className="font-geist-mono text-[10px] uppercase tracking-[0.24em] text-[#7A8FA8]">
                    max usdc
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(Number(event.target.value) || 0)}
                    className="h-11 border border-[#1E2C3D] bg-[#090C10] px-3 font-geist-mono text-sm text-[#D8E2F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5C3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090C10]"
                  />
                </label>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="font-geist-mono text-[10px] uppercase tracking-[0.24em] text-[#7A8FA8]">
                  tier filter
                </span>
                {(["All", ...tierOrder] as const).map((tier) => {
                  const selected = tierFilter === tier;

                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setTierFilter(tier)}
                      className={`min-h-10 border px-3 py-2 font-geist-mono text-[10px] uppercase tracking-[0.22em] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5C3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#090C10] ${
                        selected
                          ? "border-[#00E5C3] bg-[#00E5C3] text-[#090C10]"
                          : "border-[#1E2C3D] text-[#7A8FA8] hover:border-[#3D4D60] hover:text-[#D8E2F0]"
                      }`}
                    >
                      {tier}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 p-3">
              {visibleGigs.length > 0 ? (
                <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
                  {visibleGigs.map((gig, index) => (
                    <article
                      key={gig.id}
                      className="reveal-up shell-panel-strong flex flex-col rounded-[4px] p-4 terminal-shadow"
                      style={{ animationDelay: `${index * TIMING.market}ms` }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <TierBadge tier={gig.tier} />
                          <h3 className="mt-3 font-syne text-lg font-bold uppercase tracking-[0.12em] text-[#D8E2F0]">
                            {gig.skill}
                          </h3>
                        </div>
                        <div className="text-right">
                          <p className="font-geist-mono text-[10px] uppercase tracking-[0.24em] text-[#7A8FA8]">
                            price
                          </p>
                          <p className="mt-1 font-geist-mono text-lg font-semibold tabular-nums text-[#00E5C3]">
                            {formatPrice(gig.price)}
                          </p>
                        </div>
                      </div>

                      <p className="mt-3 min-h-10 text-sm leading-6 text-[#7A8FA8]">
                        {gig.summary}
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#1E2C3D] pt-3 font-geist-mono text-[10px] uppercase tracking-[0.22em] text-[#7A8FA8]">
                        <span>{gig.agent}</span>
                        <span>{gig.eta}</span>
                      </div>

                      <button
                        type="button"
                        className="mt-4 min-h-11 border-2 border-[#00E5C3] bg-[#00E5C3] px-4 py-2 text-center font-geist-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-[#090C10] transition-colors duration-100 hover:bg-transparent hover:text-[#00E5C3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5C3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141920]"
                      >
                        HIRE VIA X402
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="shell-panel-strong flex h-full min-h-[300px] flex-col items-start justify-between rounded-[4px] p-6">
                  <div>
                    <p className="font-geist-mono text-[10px] uppercase tracking-[0.28em] text-[#E5A000]">
                      no gigs matched
                    </p>
                    <h3 className="mt-2 font-syne text-xl font-bold uppercase tracking-[0.12em] text-[#D8E2F0]">
                      tighten or reset the filters
                    </h3>
                    <p className="mt-3 max-w-[38ch] text-sm leading-6 text-[#7A8FA8]">
                      The market feed is clear. Broaden the search, widen the price range,
                      or re-open all tiers to restore listings.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTierFilter("All");
                      setSearch("");
                      setMinPrice(0);
                      setMaxPrice(200);
                    }}
                    className="min-h-11 border border-[#00E5C3] px-4 py-2 font-geist-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-[#00E5C3] transition-colors duration-100 hover:bg-[#00E5C3] hover:text-[#090C10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5C3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141920]"
                  >
                    reset filters
                  </button>
                </div>
              )}
            </div>
          </section>

          <LiveTerminal />
        </section>

        <SkillTicker />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
