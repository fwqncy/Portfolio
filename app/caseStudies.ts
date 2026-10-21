// Long-form case studies, keyed by project id. Code excerpts are copied from each project's repository.

export type Snippet = { file: string; lang: "python" | "ts" | "js" | "go" | "rust" | "csharp" | "java"; src: string };
export type Section = { heading: string; body: string[]; code?: Snippet };

export const caseStudies: Record<string, Section[]> = {
  arachne: [
    {
      heading: "Where it started",
      body: [
        "Arachne began as a university assignment I did for Telstra in my final year: an internal assistant that helps staff find answers in company documents.",
        "I've since rebuilt it from scratch and put my own spin on it. The web running through everything (the name, the orb web you grow by asking questions, Spider-Sense, and ranks from Spiderling to Arachne Sentinel) is a not-so-subtle hint at my love for Spider-Man.",
      ],
    },
    {
      heading: "The problem",
      body: [
        "Staff lose time digging through handbooks and policies, and an assistant that guesses is worse than no answer at all. Arachne only answers from the documents each person is allowed to see, cites the page or section behind every claim, and says plainly when the documents don't cover something.",
      ],
    },
    {
      heading: "How it answers",
      body: [
        "Questions are embedded locally, matched against document passages in Postgres with pgvector, filtered to the asker's team, and sent to Claude as numbered sources. The answer streams back word by word, followed by its citations, so every [1] opens the exact passage it came from.",
      ],
      code: {
        file: "arachne/api.py",
        lang: "python",
        src: `
async def search(text: str, team: str, k: int) -> List[Hit]:
    vec = await embed(text)
    rows = await db.pool.fetch(
        """SELECT c.id, d.title, c.locator, c.content, 1 - (c.embedding <=> $1) AS score
           FROM chunks c JOIN documents d ON d.id = c.document_id
           WHERE d.team IN ('all', $2)
           ORDER BY c.embedding <=> $1
           LIMIT $3""",
        vec, team, k,
    )
    hits = [Hit(**dict(r)) for r in rows if r["score"] >= MIN_SCORE]
    return hits + await follow_references(hits, team)`,
      },
    },
    {
      heading: "Spider-Sense",
      body: [
        "After each answer, Arachne averages the embeddings of the passages it cited and suggests the neighbouring sections you'll probably need next. One click asks about them. Questions it couldn't answer collect in Holes in Your Web, a ready-made list of documentation gaps.",
      ],
      code: {
        file: "arachne/insights.py",
        lang: "python",
        src: `
async def spider_sense(answer: str, hits: List[Hit], team: str, limit: int = 3) -> List[dict]:
    """Passages that sit next to what the answer cited, but weren't part of it."""
    cited = [hits[n - 1].id for n in cited_numbers(answer) if 1 <= n <= len(hits)]
    if not cited:
        return []
    rows = await db.pool.fetch(
        """WITH centre AS (SELECT avg(embedding) AS v FROM chunks WHERE id = ANY($1::int[]))
           SELECT d.title, c.locator, c.content, 1 - (c.embedding <=> centre.v) AS score
           FROM chunks c JOIN documents d ON d.id = c.document_id, centre
           WHERE d.team IN ('all', $2) AND c.id <> ALL($3::int[])
           ORDER BY c.embedding <=> centre.v
           LIMIT 12""",
        cited, team, [h.id for h in hits],
    )`,
      },
    },
    {
      heading: "Your Web",
      body: [
        "Each person's knowledge is drawn as an orb web in Three.js. Every document anchors a spoke, the capture spiral gains rings as you ask more, each chat hangs on it as a dewdrop, and the sections Arachne has cited for you light up.",
      ],
      code: {
        file: "arachne/static/js/constellation.js",
        lang: "ts",
        src: `
// ---- spokes: one per document, with frame spokes between them ----
const nd = Math.max(docs.length, 1);
const docAngle = (i) => -Math.PI / 2 + (i / nd) * Math.PI * 2;
const rings = Math.max(3, Math.min(22, 3 + Math.round(questions * 0.7)));

// ---- chats: dewdrops along the spiral, tied to the sections they cited ----
chats.forEach((chat, k) => {
  const f = (k + 1) / (chats.length + 1);
  const a = -Math.PI / 2 + f * turns * Math.PI * 2;
  const r = R * (0.16 + 0.76 * f);
  const pos = new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0.35 + rand() * 0.4);
  dew.add(pos.toArray(), { size: 10, kind: KIND.text, alpha: 0.95, t: 0.3 + 0.6 * f, phase: rand() });
});`,
      },
    },
  ],
  ledgerline: [
    {
      heading: "Where it started",
      body: [
        "At one of my restaurants, doing anything in the back-office system lagged the whole console, especially inventory and timesheets. Every change meant reloading and logging in again.",
        "That frustration sparked Ledgerline, and with it my love for being financially literate.",
      ],
    },
    {
      heading: "The idea",
      body: [
        "Ledgerline is a payments console set like a newspaper. The Front Page writes its lead headline from live numbers, and Payouts, Risk, Support and the Ledger are separate desks. Each desk is its own module, so it loads, updates and fails on its own instead of dragging the whole console down with it.",
      ],
      code: {
        file: "apps/console/modules.ts",
        lang: "ts",
        src: `
export const modules = [risk, payouts, support];

// The newsroom: the front page and the ledger read across every desk.
export const newsroom = { lead: frontpage, archive: ledger };`,
      },
    },
    {
      heading: "One endpoint per module",
      body: [
        "Every module is served from its own endpoint with its own router and context. A deployment can mount just one module (LEDGERLINE_MODULES=payouts), and a console on another origin can point at it, so the risk, payouts and support teams ship on their own schedule.",
      ],
      code: {
        file: "apps/console/app/api/m/[module]/[trpc]/route.ts",
        lang: "ts",
        src: `
// Each module is served from its own endpoint (/api/m/<module>) with its own router and context.
async function handler(req: Request, { params }: { params: Promise<{ module: string }> }) {
  const { module: name } = await params;
  const mod = findModule(name);
  if (!mod) return Response.json({ error: \`Module "\${name}" is not mounted\` }, { status: 404, headers: corsHeaders });

  return fetchRequestHandler({
    endpoint: \`/api/m/\${name}\`,
    req,
    router: mod.router,
    createContext: async () => mod.createContext(await createBaseContext(name)),
  });
}`,
      },
    },
    {
      heading: "Risk before money moves",
      body: [
        "Money can't be recalled once it's sent, so every approval runs through Risk's standing orders first (payouts over £20,000 need a second review), lands in the audit log, and gets a five-second undo before it goes. When it does, a PAID stamp lands on the payout.",
      ],
      code: {
        file: "modules/payouts/router.ts",
        lang: "ts",
        src: `
approve: withRiskCheck(protectedProcedure)
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    await ctx.audit("payout.approve", input.id);
    return ctx.payouts.approve(input.id);
  }),`,
      },
    },
    {
      heading: "Desks that don't import each other",
      body: [
        "Modules never import one another. When one changes data it fires a browser event, and every mounted module (the ticker, the front page, the nav badges) refreshes its own cache.",
      ],
      code: {
        file: "packages/core/src/client.tsx",
        lang: "ts",
        src: `
const DATA_CHANGED = 'ledgerline:data-changed';

/**
 * Tells every mounted module (ticker, front page, nav badges) that data changed,
 * without the modules knowing about each other.
 */
window.dispatchEvent(new Event(DATA_CHANGED));`,
      },
    },
  ],
  rostra: [
    {
      heading: "Where it started",
      body: [
        "During my years managing restaurants, I loved spending time on the roster, and the staff loved checking it. Rostra gives rostering a more fun spin while staying informative, taking the best parts of every rostering tool I used.",
        "The design was sparked by my love for nature: an overgrown forest at golden hour on the sign-in page, and a low-poly cherry blossom tree on Home that grows the longer you use the app.",
      ],
    },
    {
      heading: "Swaps in one tap",
      body: [
        "Staff ask a teammate to cover from their phone, and the manager approves in one tap with the cost impact shown. Before a swap is even offered, Rostra checks the cover can actually work it.",
      ],
      code: {
        file: "src/Rostra.Api/Shifts/SwapEndpoints.cs",
        lang: "csharp",
        src: `
app.MapPost("/shifts/{id:int}/swap", RequestSwap)
    .RequireAuthorization("Staff")
    .AddEndpointFilter<OwnShiftFilter>();

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
}`,
      },
    },
    {
      heading: "Who can actually cover",
      body: [
        "Every cover suggestion explains itself. Rostra checks availability, approved leave, station training and clashes with the cover's other shifts, and shows the reason in the picker, like “Already working 4–11”.",
      ],
      code: {
        file: "src/Rostra.Api/Domain/Staff.cs",
        lang: "csharp",
        src: `
public bool CanWork(Shift shift) => WhyCannotWork(shift) is null;

/// <summary>Returns a short, human reason this person can't take the shift, or null if they can.</summary>
public string? WhyCannotWork(Shift shift)
{
    if (Id == shift.StaffId) return "Already on this shift";
    if (!IsActive || CompanyId != shift.CompanyId) return "Not on the roster";
    if (!AvailableDays.HasFlag(Week.DayFlag(shift.Start.DayOfWeek)))
        return $"Unavailable on {shift.Start.DayOfWeek}s";
    var day = DateOnly.FromDateTime(shift.Start);
    if (TimeOff.Any(t => t.Status == RequestStatus.Approved && t.From <= day && t.To >= day)) return "On leave";
    if (!Stations.HasFlag(shift.Station)) return $"Not trained on {shift.Station}";

    var clash = Shifts.FirstOrDefault(s => s.Id != shift.Id && s.Start < shift.End && shift.Start < s.End);
    if (clash is not null) return $"Already working {Week.Compact(clash.Start, clash.End)}";

    return null;
}`,
      },
    },
    {
      heading: "Labour cost, live",
      body: [
        "The roster shows labour cost against the week's budget as you build it, with weekend penalty rates applied, and flags award issues as warnings rather than blocks: under 10 hours' rest, over 38 hours a week, no meal break past 5 hours. The manager decides, but nothing slips through unnoticed.",
      ],
      code: {
        file: "src/Rostra.Api/Domain/Labour.cs",
        lang: "csharp",
        src: `
public static readonly Penalties Penalties = new(1.25m, 1.50m);

public static decimal Multiplier(DateTime start) => start.DayOfWeek switch
{
    DayOfWeek.Saturday => Penalties.Saturday,
    DayOfWeek.Sunday => Penalties.Sunday,
    _ => 1m,
};

public static decimal Cost(double hours, decimal rate, DateTime start) => (decimal)hours * rate * Multiplier(start);`,
      },
    },
    {
      heading: "The Grove",
      body: [
        "Your cherry blossom tree grows with the time you actively spend in Rostra, from Seedling to Ancient Tree. Apples are roster weeks (red once published or worked, green while still to come), fireflies are kudos from teammates, and petals drift down onto the lawn.",
      ],
      code: {
        file: "src/Rostra.Api/wwwroot/js/growth.js",
        lang: "ts",
        src: `
export const GROWTH_HOURS = 5;     // the curve's time constant: ~63% grown after 5 hours of use
export const FRUITING = 0.3;       // apples appear once the tree reaches this growth (~1.8 h)
export const growthFor = (seconds) => Math.min(0.995, Math.max(0.05, 1 - Math.exp(-(seconds / 3600) / GROWTH_HOURS)));
export const STAGES = [
  { at: 0, name: 'Seedling' }, { at: 0.15, name: 'Sapling' }, { at: FRUITING, name: 'Young Tree' },
  { at: 0.6, name: 'Mature Tree' }, { at: 0.85, name: 'Ancient Tree' },
];`,
      },
    },
    {
      heading: "Next version",
      body: [
        "Looking back, the feature I'd add next is a holiday and event tracker. It would flag public holidays and local events ahead of time, with staffing pointers on whether a shift needs more or stronger staff on, or fewer and newer staff, so the week's roster can be challenged against its budget before it's published.",
      ],
    },
  ],
  relay: [
    {
      heading: "Where it started",
      body: [
        "Relay started as a draft project idea, but it turned into the project that taught me logistics.",
        "When I was building my software business, I needed to truly understand the industry I'd be providing services for, so Relay became part of my research and development.",
      ],
    },
    {
      heading: "The problem",
      body: [
        "Logistics platforms run on background jobs: routing, labels, tracking syncs and stock picks. A single queue feeding one shared worker pool stalls when traffic bursts, because one slow job (a stuck ERP call, say) holds up everything behind it.",
      ],
    },
    {
      heading: "Work-stealing workers",
      body: [
        "Each worker keeps its own local queue, topped up from a Redis Stream. When it runs dry, it steals jobs that have sat idle for 2 seconds in a peer's pending list, so a slow or crashed worker can't strand work.",
      ],
      code: {
        file: "relay/worker.go",
        lang: "go",
        src: `
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
		}).Result()`,
      },
    },
    {
      heading: "Exactly one execution",
      body: [
        "Stealing means two workers can hold the same job, so Postgres decides who runs it. A conditional update only moves a job from queued to running once; the loser simply acknowledges the message and moves on. Failed attempts retry with backoff, up to three times.",
      ],
      code: {
        file: "internal/store/store.go",
        lang: "go",
        src: `
func (s *Store) Claim(ctx context.Context, id int64, worker string, stolen bool, at time.Time) (int, bool, error) {
	var attempts int
	err := s.pool.QueryRow(ctx, \`
		UPDATE jobs SET status = 'running', worker = $2, stolen = $3, started_at = $4, attempts = attempts + 1
		WHERE id = $1 AND status = 'queued' RETURNING attempts\`, id, worker, stolen, at).Scan(&attempts)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, false, nil
	}
	return attempts, err == nil, err
}`,
      },
    },
    {
      heading: "The results",
      body: [
        "Relay can switch between work-stealing and the old single-queue shape at runtime, so the two can be compared on the same machine. On a 12,000-job burst, p95 queue latency fell from 1.36 s to 693 ms, and throughput rose from about 8,100 to 15,500 jobs a second.",
      ],
    },
    {
      heading: "A realm that grows",
      body: [
        "To make logistics feel alive, every delivery earns XP for its mode, and a 3D map of the network levels up with it: sailboats become container ships, horse carts become road trains, and balloons become heavy-lift jets.",
      ],
      code: {
        file: "internal/realm/realm.go",
        lang: "go",
        src: `
// Thresholds is the XP (one per delivery) needed to reach each level.
var Thresholds = []int{0, 50, 150, 400, 1000}

var Tiers = map[string][]Tier{
	"sea": {
		{1, "Sailboat", "Fishing quay", "Single-mast sailboats ferry crates along the coast."},
		{2, "Galleon", "Merchant harbour", "Three-masted galleons carry bulk goods between ports."},
		{3, "Steamship", "Age of steam", "Coal-fired steamers keep schedules whatever the wind."},
		{4, "Coastal freighter", "Feeder port", "Feeder freighters shuttle stacked containers between hubs."},
		{5, "Container ship", "Deep-water terminal", "Ultra-large container ships berth at your docks."},
	},`,
      },
    },
  ],
  fieldnote: [
    {
      heading: "Where it started",
      body: [
        "The inspiration came when two of my crew members got lost on a hiking trip and had to call emergency services after being stuck for two nights.",
        "I'd also been wanting a decent note-taking app, like the paid subscription one I was using. Fieldnote is my take on both: a proper notes app that keeps working when there's no signal at all.",
      ],
    },
    {
      heading: "Works with no signal",
      body: [
        "Notes live in SQLite on the device, so writing never waits on a network. Every edit goes into an outbox; whenever the relay can be reached, the sync client pushes the outbox and pulls anything new, and with no signal the status bar simply says “Working offline”.",
      ],
      code: {
        file: "app/src/sync/client.ts",
        lang: "ts",
        src: `
while (more) {
  const outgoing = db.outbox(BATCH);
  const res = await fetch(\`\${this.state.server}/api/sync\`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ replica: this.vault.replica, cursor: Number(db.get('cursor') ?? 0), ops: outgoing }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(\`Relay answered \${res.status}\`);
  const body: { cursor: number; more: boolean; ops: Op[]; conflicts: number } = await res.json();
  db.clearOutbox(outgoing);
  const fresh = this.vault.applyRemote(body.ops);
  db.put('cursor', String(body.cursor));
  more = body.more || db.outboxSize() > 0;
}`,
      },
    },
    {
      heading: "Conflict-free by design",
      body: [
        "Every character is its own insert operation, anchored after another one, and deletes are tombstones. Each operation has a globally unique id, so merging two devices is just a set union: it can happen in any order, any number of times, and conflicts can't occur. The same engine is written in Rust for the relay and in TypeScript for the app.",
      ],
      code: {
        file: "engine/src/sync/merge.rs",
        lang: "rust",
        src: `
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
}`,
      },
    },
    {
      heading: "Tested for days offline",
      body: [
        "The engine's tests check that devices converge whatever order they reconnect in, that merging twice changes nothing, and that three days of offline edits come back with zero conflicts.",
      ],
      code: {
        file: "engine/src/sync/merge.rs",
        lang: "rust",
        src: `
#[test]
fn three_days_offline_forty_one_edits_zero_conflicts() {
    let base = note_with("Camp inventory\\n");
    let (mut field, mut camp) = (base.clone(), base.clone());
    // 41 edits made with no signal, while camp keeps editing too.
    for i in 0..41 {
        let at = field.body.chars().count();
        field.insert(A, at, &format!("- day {} fuel check\\n", i / 14 + 1), i);
    }
    camp.insert(B, 15, "Fuel for 4 more days\\n", 0);

    camp.merge(&field);
    field.merge(&camp);

    assert_eq!(field.body, camp.body);
    assert_eq!(camp.body.matches("fuel check").count(), 41);
}`,
      },
    },
    {
      heading: "Built for the field",
      body: [
        "Expedition mode goes offline on purpose and counts queued edits. Chronos scrubs a note through every version it has had, Palimpsest shows every character ever written tinted by device, and one keystroke stamps GPS coordinates, which work without signal. Around them sit the essentials of a full notes app: wikilinks, backlinks, a daily journal, tasks, and a 3D constellation of your notes.",
      ],
    },
  ],
  trawler: [
    {
      heading: "Where it started",
      body: [
        "The inspiration came from how frustrating and boring inventory systems are in restaurants.",
        "Trawler takes the tedious part off your hands: it flags anything below par and drafts the supplier orders, the way stock-takes are run in restaurants, in an app that's actually pleasant to open.",
      ],
    },
    {
      heading: "Par levels, not guesswork",
      body: [
        "Every stock line shows what's on hand against its par, how many units it's short, what's already on order, and how many days of cover are left based on the last 14 days of usage. One endpoint lists everything below par, biggest shortfall first; another raises the order.",
      ],
      code: {
        file: "src/main/java/dev/sayef/trawler/StockController.java",
        lang: "java",
        src: `
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
}`,
      },
    },
    {
      heading: "Ordering that doesn't double up",
      body: [
        "A reorder tops each line back to par, nets off stock already on open orders, rounds up to whole cases, and merges into an open draft for that supplier instead of starting a second one. Concurrent edits get a clear 409 instead of overwriting each other.",
      ],
      code: {
        file: "src/main/java/dev/sayef/trawler/StockService.java",
        lang: "java",
        src: `
/** Adds what each line needs to reach par, net of stock already on the way, in whole cases. */
private static int topUp(PurchaseOrder order, List<StockLevel> due, Map<Long, Integer> onOrder) {
    int added = 0;
    for (StockLevel level : due) {
        Product product = level.getProduct();
        int needed = level.getPar() - level.getOnHand() - onOrder.getOrDefault(product.getId(), 0);
        int quantity = product.roundUpToPack(needed);
        if (quantity > 0) {
            order.addLine(product, quantity);
            added++;
        }
    }
    return added;
}`,
      },
    },
    {
      heading: "Autopilot",
      body: [
        "For stores that opt in, a scheduled job drafts one order per supplier every morning at 5 am, before anyone's on the floor. Drafts wait for a person to check and send them.",
      ],
      code: {
        file: "src/main/java/dev/sayef/trawler/ReorderAutopilot.java",
        lang: "java",
        src: `
/** Drafts supplier orders every morning for stores that opted in, before anyone's on the floor. */
@Scheduled(cron = "\${trawler.reorder.cron:0 0 5 * * *}", zone = "\${trawler.timezone:Australia/Sydney}")
void run() {
    for (Store store : stores.findByAutoReorderTrue()) {
        List<PurchaseOrder> raised = stock.raiseOrders(store.getId(), OrderSource.AUTO);
        if (!raised.isEmpty()) {
            log.info("Autopilot drafted {} order(s) for {}", raised.size(), store.getName());
        }
    }
}`,
      },
    },
    {
      heading: "Tested against a real database",
      body: [
        "Alongside 18 unit tests, 38 integration tests spin up a real PostgreSQL 17 in Testcontainers and call the API over HTTP, behind an 85% line-coverage gate.",
      ],
      code: {
        file: "src/test/java/dev/sayef/trawler/StockControllerIT.java",
        lang: "java",
        src: `
@Test
void reorderRaisesADraftThatBringsTheSupplierLinesBackToPar() {
    ResponseEntity<String> res = post("/api/stock/orders", """
            {"storeId": %d, "supplierId": %d}""".formatted(bondi, molino));

    assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    assertThat(JsonPath.<String>read(res.getBody(), "$.status")).isEqualTo("DRAFT");
    assertThat(JsonPath.<List<String>>read(res.getBody(), "$.lines[*].sku")).containsExactly("CHIP-1KG", "TORT-12");
    assertThat(JsonPath.<List<Integer>>read(res.getBody(), "$.lines[*].quantity")).containsExactly(12, 50);
}`,
      },
    },
    {
      heading: "A whirlpool of stock",
      body: [
        "To make stock less boring to look at, every line is drawn as a fish made of stars. Lines at or above par circle the rim, and the further below par a line runs, the deeper and faster it's pulled toward the centre. Hover to read a fish, click to open it, or drag to spin the whole shoal.",
      ],
    },
  ],
  terra: [
    {
      heading: "Where it started",
      body: [
        "I love Civilization and The Sims: planning a city, laying the roads, and watching everything come to life on top of them.",
        "My dad’s Tesla drives itself with AI, and I wanted to learn the logic behind it. What does the car actually see, and how does it decide when to steer, brake or keep going? Terra puts the two together: a city builder where you build the roads and the cars teach themselves to drive them.",
      ],
    },
    {
      heading: "Build the roads",
      body: [
        "Roads are a graph you draw over real Brisbane streets from OpenStreetMap. A Web Worker turns that graph into rounded road envelopes, lane guides, buildings and trees in about 150 ms for the CBD, and Stop, Give Way, traffic light and crossing markings snap to the left-hand lanes.",
      ],
    },
    {
      heading: "What the car sees",
      body: [
        "Each car casts seven rays and reads how close the nearest kerb or car is along each one, from 0 (nothing in range) to 1 (touching). Those readings, plus its bearing to the route, its speed and its offset from the lane centre, go into a small neural network whose four outputs press the pedals and turn the wheel.",
      ],
      code: {
        file: "web/src/engine/ai/car.js",
        lang: "js",
        src: `
update(env) {
  if (!this.done) {
    this.#move();
    this.polygon = this.#createPolygon();
    this.damaged = this.#assessDamage(env);
    this.age++;
  }
  if (this.sensor) {
    this.sensor.update(this, {
      grid: env.grid,
      segments: env.segments,
      polygons: env.traffic?.map((c) => c.polygon),
    });
    if (this.useBrain && !this.done) {
      const inputs = this.sensor.values().concat(this.extras);
      const out = NeuralNetwork.feedForward(inputs, this.brain);
      this.controls.forward = out[0] === 1;
      this.controls.left = out[1] === 1;
      this.controls.right = out[2] === 1;
      this.controls.reverse = out[3] === 1;
    }
  }
}`,
      },
    },
    {
      heading: "Learning by survival",
      body: [
        "There’s no training data. A generation of cars sets off with random brains, and the one that gets furthest along the route without crashing is kept. The next generation is that brain mutated by anything from small tweaks to bold leaps, with some crossover from the runner-up. When a generation stalls on the same corner, the trainer widens the search and mixes in fresh random brains.",
      ],
      code: {
        file: "web/src/engine/ai/trainer.js",
        lang: "js",
        src: `
nextBrains() {
  const n = this.populationSize;
  if (!this.best) return new Array(n).fill(null);
  const brains = [NeuralNetwork.clone(this.best)];
  // Stuck on the same corner? Widen the search, and add some fresh random brains.
  const boost = Math.min(4, 1 + this.stagnant * 0.35);
  const fresh = Math.floor(n * (this.stagnant > 3 ? 0.15 : 0.05));
  for (let i = 1; i < n; i++) {
    if (i >= n - fresh) {
      brains.push(null);
      continue;
    }
    const spread = (0.25 + 1.5 * (i / n)) * boost;
    let child;
    if (this.runnerUp && NeuralNetwork.sameShape(this.best, this.runnerUp) && this.random() < 0.2) {
      child = NeuralNetwork.crossover(this.best, this.runnerUp, this.random);
    } else {
      child = NeuralNetwork.clone(this.best);
    }
    NeuralNetwork.mutate(child, Math.min(1, this.mutation * spread), this.random);
    brains.push(child);
  }
  return brains;
}`,
      },
    },
    {
      heading: "Ships, planes and an ops floor",
      body: [
        "The same sensors and trainer teach ships to thread the North-West Channel out of Moreton Bay and planes to fly around a drifting cyclone. Every delivery pays coins into the Depot, an idle game that keeps earning while you’re away, and a 3D ops floor and a live dashboard run the whole network.",
      ],
    },
    {
      heading: "One simulation, two languages",
      body: [
        "The logistics sim runs in the browser and on the .NET API. The C# version is a line-for-line port of the JavaScript, with the same random number generator, call order and rounding, and parity tests replay fixtures from the real browser engine to prove both produce the same shipments and KPIs from the same seed.",
      ],
      code: {
        file: "api/Terra.Api.Tests/ParityTests.cs",
        lang: "csharp",
        src: `
[Fact]
public void Simulator_ProducesTheSameShipmentsAsTheBrowser()
{
    var sim = Sim();
    var l = Fixture["logistics"]!;
    Assert.Equal(l["time"]!.GetValue<double>(), sim.Time);
    Assert.Equal(l["shipmentCount"]!.GetValue<int>(), sim.Shipments.Count);
    var expected = l["firstShipments"]!.AsArray();
    for (var i = 0; i < expected.Count; i++)
    {
        var e = expected[i]!;
        var s = sim.Shipments[i];
        Assert.Equal(e["id"]!.GetValue<string>(), s.Id);
        Assert.Equal(e["status"]!.GetValue<string>(), s.Status);
        Close(e["costAud"]!.GetValue<double>(), s.CostAud, $"{s.Id} cost");
        Close(e["etaAt"]!.GetValue<double>(), s.EtaAt, $"{s.Id} eta");
    }
}`,
      },
    },
  ],
};
