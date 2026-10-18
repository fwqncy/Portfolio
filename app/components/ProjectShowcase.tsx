import type { ReactNode } from "react";
import ProjectVideo from "./ProjectVideo";

// Split media for a work row: source on the left, a recording of the shipped product on the right.

export type Lang = "go" | "ts" | "rust" | "python" | "csharp" | "java";

const KEYWORDS: Record<Lang, string[]> = {
  go: ["func", "for", "if", "return", "continue", "nil", "var", "range", "select", "case", "default"],
  ts: ["export", "const", "let", "return", "import", "from", "async", "await", "for", "of", "if", "new", "function"],
  rust: ["impl", "pub", "fn", "for", "in", "let", "mut", "self", "Self", "if", "return"],
  python: ["def", "async", "await", "return", "if", "not", "for", "in", "with", "as", "yield", "None"],
  csharp: ["public", "private", "async", "await", "return", "if", "var", "new", "null", "class", "record", "this", "throw"],
  java: ["public", "private", "final", "class", "return", "new", "void", "var", "throws", "import", "if", "this"],
};

const TOKEN = /(\/\/.*$)|("(?:[^"\\]|\\.)*")|(\b\d[\d_.]*\b)|(\b[A-Za-z_]\w*\b)/gm;
const TOKEN_PY = /(#.*$)|("(?:[^"\\]|\\.)*")|(\b\d[\d_.]*\b)|(\b[A-Za-z_]\w*\b)/gm;

function highlight(line: string, lang: Lang): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of line.matchAll(lang === "python" ? TOKEN_PY : TOKEN)) {
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

// Syntax-highlighted file excerpt; also used full-size in case studies (variant "full").
export function Code({ file, lang, src, variant }: { file: string; lang: Lang; src: string; variant?: "full" }) {
  const lines = src.replace(/^\n/, "").replace(/\n$/, "").split("\n");
  return (
    <div className="show-code" data-variant={variant}>
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

const ARACHNE_SRC = `
# arachne/api.py: grounded answers, streamed with citations
@app.post("/ask")
async def ask(q: Question, user: User = Depends(current_user)):
    chat_id = await chats.open_chat(q.chat_id, user, first_message=q.text)
    history = await chats.history(chat_id)
    await chats.add_message(chat_id, "user", q.text)

    hits = await search(retrieval_query(q.text, history), team=user.team, k=TOP_K)
    if not hits:
        message_id = await chats.add_message(chat_id, "assistant", NO_ANSWER)
        return {"answer": None, "reason": "no matching documents", ...}

    prompt = build_prompt(q.text, hits, profile=await insights.prompt_profile(user))

    async def stream():
        answer, usage = [], None
        async with client.messages.stream(
            model=MODEL,
            max_tokens=800,
            system=SYSTEM_PROMPT,
            messages=[*history, {"role": "user", "content": prompt}],
        ) as s:
            async for text in s.text_stream:
                answer.append(text)
                yield text`;

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
	job, err := decode(res[0])
	job.Stolen = true
	w.steals.Add(1)
	return job, true
}`

const LEDGERLINE_SRC = `
// modules/payouts/router.ts
import { z } from "zod";
import { BrowseInput, CreatePayoutInput, PayoutStatus } from "./schema";
import { protectedProcedure, router, withRiskCheck } from "./trpc";

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

  summary: protectedProcedure.query(({ ctx }) => ctx.payouts.summary()),
});`

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
}`

const ROSTRA_SRC = `
// Rostra.Api/Shifts/SwapEndpoints.cs
public static class SwapEndpoints
{
    public static void MapSwaps(this WebApplication app)
    {
        app.MapPost("/shifts/{id:int}/swap", RequestSwap)
            .RequireAuthorization("Staff")
            .AddEndpointFilter<OwnShiftFilter>();
    }

    static async Task<IResult> RequestSwap(
        int id, SwapRequest req, RostraDb db, INotifier notify)
    {
        var shift = await db.Shifts
            .Include(s => s.Staff)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (shift is null) return Results.NotFound();

        var cover = await db.Staff.FindAsync(req.CoverId);
        if (cover is null || !cover.CanWork(shift))
            return Results.Conflict("Cover is not available");

        shift.PendingCoverId = cover.Id;
        await db.SaveChangesAsync();
        await notify.ManagerAsync(shift, cover);
        return Results.Accepted();
    }
}`

const TRAWLER_SRC = `
// src/main/java/dev/sayef/trawler/StockController.java
@RestController
@RequestMapping("/api/stock")
class StockController {
    private final StockService stock;

    StockController(StockService stock) { this.stock = stock; }

    @GetMapping("/low")
    List<StockItem> lowStock(@RequestParam long storeId) {
        return stock.belowPar(storeId);
    }

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    PurchaseOrder reorder(@Valid @RequestBody ReorderRequest req) {
        return stock.raiseOrder(req.storeId(), req.supplierId());
    }
}`;

const SHOWCASE: Record<string, { file: string; lang: Lang; src: string }> = {
  arachne: { file: "arachne/api.py", lang: "python", src: ARACHNE_SRC },
  relay: { file: "relay/worker.go", lang: "go", src: RELAY_SRC },
  ledgerline: { file: "modules/payouts/router.ts", lang: "ts", src: LEDGERLINE_SRC },
  rostra: { file: "Shifts/SwapEndpoints.cs", lang: "csharp", src: ROSTRA_SRC },
  trawler: { file: "trawler/StockController.java", lang: "java", src: TRAWLER_SRC },
  fieldnote: { file: "engine/src/sync/merge.rs", lang: "rust", src: FIELDNOTE_SRC },
};

export default function ProjectShowcase({
  id,
  title,
  video,
}: {
  id: string;
  title: string;
  video?: { src: string; poster: string };
}) {
  const s = SHOWCASE[id];
  if (!s) return null;
  return (
    <figure
      className="work-media show"
      data-video={video ? "true" : undefined}
      aria-label={`${title}: source code and the finished product`}
    >
      <div className="show-half">
        <span className="show-label mono">Code</span>
        <Code file={s.file} lang={s.lang} src={s.src} />
      </div>
      <div className="show-divider" aria-hidden="true" />
      <div className="show-half">
        <span className="show-label mono">Product</span>
        {video && (
          <div className="show-app show-app-video">
            <ProjectVideo className="show-video" src={video.src} poster={video.poster} label={`${title} in action`} />
          </div>
        )}
      </div>
    </figure>
  );
}
