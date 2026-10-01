import type { ReactNode } from "react";

// Split media for a work row: source on the left, the shipped product on the right.

type Lang = "go" | "ts" | "rust";

const KEYWORDS: Record<Lang, string[]> = {
  go: ["func", "for", "if", "return", "continue", "nil", "var", "range", "select", "case", "default"],
  ts: ["export", "const", "return", "import", "from", "async", "await"],
  rust: ["impl", "pub", "fn", "for", "in", "let", "mut", "self", "Self", "if", "return"],
};

const TOKEN = /(\/\/.*$)|("(?:[^"\\]|\\.)*")|(\b\d[\d_.]*\b)|(\b[A-Za-z_]\w*\b)/gm;

function highlight(line: string, lang: Lang): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of line.matchAll(TOKEN)) {
    const i = m.index ?? 0;
    if (i > last) out.push(line.slice(last, i));
    const [text, comment, str, num, word] = m;
    let cls: string | null = null;
    if (comment) cls = "tk-com";
    else if (str) cls = "tk-str";
    else if (num) cls = "tk-num";
    else if (word && KEYWORDS[lang].includes(word)) cls = "tk-key";
    else if (word && line[i + word.length] === "(") cls = "tk-fn";
    else if (word && /^[A-Z]/.test(word)) cls = "tk-type";
    out.push(cls ? <span key={i} className={cls}>{text}</span> : text);
    last = i + text.length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

function Code({ file, lang, src }: { file: string; lang: Lang; src: string }) {
  const lines = src.replace(/^\n/, "").replace(/\n$/, "").split("\n");
  return (
    <div className="show-code">
      <p className="show-tab mono">
        <span className="show-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        {file}
      </p>
      <pre className="mono">
        <code>
          {lines.map((l, n) => (
            <span className="show-line" key={n}>
              <span className="show-ln" aria-hidden="true">{n + 1}</span>
              {highlight(l, lang)}
              {"\n"}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

const RELAY_SRC = `
// worker.go: steal from peers when idle
func (w *Worker) Run(ctx context.Context) {
  for ctx.Err() == nil {
    job, ok := w.local.Pop()
    if !ok {
      job, ok = w.steal(ctx)
    }
    if !ok {
      w.park(ctx, 50*time.Millisecond)
      continue
    }
    w.exec(ctx, job)
  }
}

func (w *Worker) steal(ctx context.Context) (Job, bool) {
  res, _, err := w.rdb.XAutoClaim(ctx,
    &redis.XAutoClaimArgs{
      Stream: "relay:jobs", Group: "workers",
      Consumer: w.id, MinIdle: 2 * time.Second,
      Start: "0-0", Count: 1,
    }).Result()
  if err != nil || len(res) == 0 {
    return Job{}, false
  }
  return decode(res[0]), true
}`;

const LEDGERLINE_SRC = `
// modules/payouts/router.ts
export const payoutsRouter = router({
  list: protectedProcedure
    .input(z.object({ status: PayoutStatus }))
    .query(({ ctx, input }) =>
      ctx.db.payout.findMany({
        where: { status: input.status },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ),

  approve: withRiskCheck(protectedProcedure)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.audit("payout.approve", input.id);
      return ctx.payouts.approve(input.id);
    }),
});

// apps/console/modules.ts
export const modules = [risk, payouts, support];`;

const FIELDNOTE_SRC = `
// sync/merge.rs: conflict-free on reconnect
impl Note {
    pub fn merge(&mut self, remote: &Note) {
        for (id, op) in &remote.ops {
            self.ops.entry(*id).or_insert(op.clone());
        }
        self.clock.join(&remote.clock);
        self.body = self.ops.render();
    }

    pub fn persist(&self, db: &Connection) -> Result<()> {
        let tx = db.unchecked_transaction()?;
        for op in self.ops.since(self.synced_at) {
            tx.execute(
                "INSERT OR IGNORE INTO ops VALUES (?1, ?2)",
                params![op.id, op.to_bytes()],
            )?;
        }
        tx.commit()
    }
}`;

function RelayApp() {
  const workers = [92, 88, 95, 90, 86, 93, 89, 91];
  return (
    <div className="show-app app-relay">
      <div className="app-bar">
        <span className="app-title">relay</span>
        <span className="app-pill">
          <i className="app-live" /> prod
        </span>
      </div>
      <div className="app-stats">
        <div>
          <span className="app-k">p95 queue latency</span>
          <span className="app-v">240 ms</span>
          <span className="app-delta">from 1.8 s</span>
        </div>
        <div>
          <span className="app-k">throughput</span>
          <span className="app-v">12.4k/s</span>
        </div>
      </div>
      <svg className="app-spark" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true">
        <path
          className="app-spark-fill"
          d="M0,8 L18,12 L36,6 L54,14 L72,10 L90,30 L108,44 L126,46 L144,45 L162,47 L180,46 L200,47 L200,60 L0,60Z"
        />
        <path
          className="app-spark-line"
          d="M0,8 L18,12 L36,6 L54,14 L72,10 L90,30 L108,44 L126,46 L144,45 L162,47 L180,46 L200,47"
        />
        <line className="app-spark-mark" x1="90" y1="0" x2="90" y2="60" />
      </svg>
      <p className="app-k">work-stealing workers</p>
      <ul className="app-workers">
        {workers.map((v, i) => (
          <li key={i}>
            <span>w{i + 1}</span>
            <span className="app-bar-track">
              <span style={{ width: `${v}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LedgerlineApp() {
  const rows = [
    { id: "po_8f21", who: "Northwind Ltd", amt: "£12,480.00", s: "pending" },
    { id: "po_8f1c", who: "Acme Freight", amt: "£3,915.20", s: "review" },
    { id: "po_8f0a", who: "Kite & Co", amt: "£842.00", s: "paid" },
    { id: "po_8ef7", who: "Blue Harbour", amt: "£27,100.00", s: "paid" },
    { id: "po_8ee3", who: "Lumen Studio", amt: "£1,260.75", s: "paid" },
  ];
  return (
    <div className="show-app app-ledger">
      <aside className="app-side">
        <span className="app-title">ledgerline</span>
        <span>Risk</span>
        <span data-active="true">Payouts</span>
        <span>Support</span>
      </aside>
      <div className="app-main">
        <div className="app-bar">
          <span>Payouts</span>
          <span className="app-btn">Approve</span>
        </div>
        <ul className="app-rows">
          {rows.map((r) => (
            <li key={r.id}>
              <span className="app-who">
                {r.who}
                <span className="mono">{r.id}</span>
              </span>
              <span className="app-amt mono">{r.amt}</span>
              <span className="app-status" data-s={r.s}>
                {r.s}
              </span>
            </li>
          ))}
        </ul>
        <p className="app-foot mono">payouts@v3.12 · deployed 14 min ago</p>
      </div>
    </div>
  );
}

function FieldnoteApp() {
  const notes = [
    { t: "Transect B, plot 4", d: "Lichen cover up ~20% since…", ok: true },
    { t: "Water sample log", d: "pH 6.8, turbidity low, 2 vials", ok: true },
    { t: "Bird count, ridge", d: "3× ptarmigan, 1× raven", ok: true },
    { t: "Camp inventory", d: "Fuel for 4 more days", ok: true },
  ];
  return (
    <div className="show-app app-field">
      <div className="app-phone">
        <div className="app-notch" aria-hidden="true" />
        <div className="app-bar">
          <span className="app-title">Field notes</span>
          <span className="app-pill">
            <i className="app-live" /> synced
          </span>
        </div>
        <ul className="app-notes">
          {notes.map((n) => (
            <li key={n.t}>
              <span className="app-note-t">{n.t}</span>
              <span className="app-note-d">{n.d}</span>
            </li>
          ))}
        </ul>
        <p className="app-toast">
          Back online after 3 days · 41 edits merged, 0 conflicts
        </p>
      </div>
    </div>
  );
}

const SHOWCASE: Record<string, { file: string; lang: Lang; src: string; app: () => ReactNode }> = {
  relay: { file: "relay/worker.go", lang: "go", src: RELAY_SRC, app: RelayApp },
  ledgerline: { file: "payouts/router.ts", lang: "ts", src: LEDGERLINE_SRC, app: LedgerlineApp },
  fieldnote: { file: "sync/merge.rs", lang: "rust", src: FIELDNOTE_SRC, app: FieldnoteApp },
};

export default function ProjectShowcase({ id, title }: { id: string; title: string }) {
  const s = SHOWCASE[id];
  if (!s) return null;
  const App = s.app;
  return (
    <figure className="work-media show" aria-label={`${title}: source code and the finished product`}>
      <div className="show-half">
        <span className="show-label mono">Code</span>
        <Code file={s.file} lang={s.lang} src={s.src} />
      </div>
      <div className="show-divider" aria-hidden="true" />
      <div className="show-half">
        <span className="show-label mono">Product</span>
        <App />
      </div>
    </figure>
  );
}
