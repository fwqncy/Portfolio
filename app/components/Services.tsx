"use client";

import { useEffect, useRef } from "react";

// Curved, draggable card slider. Each card sits on a lightly blurred snippet in a different language.

type Service = {
  title: string;
  blurb: string;
  groups: { name?: string; items: string[] }[];
  lang: string;
  code: string;
};

const SERVICES: Service[] = [
  {
    title: "Full-stack development",
    blurb: "End-to-end features, from the screen a user taps to the server and database behind it.",
    groups: [
      { name: "Frontend", items: ["React", "Next.js", "TypeScript", "HTML & CSS", "Tailwind"] },
      { name: "Backend", items: ["Node.js", "Express", "REST APIs", "GraphQL", "Auth"] },
    ],
    lang: "tsx",
    code: `export function useCart(userId: string) {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    fetch(\`/api/cart/\${userId}\`)
      .then((r) => r.json())
      .then(setItems);
  }, [userId]);
  const total = items.reduce((s, i) => s + i.price, 0);
  return { items, total, add: (i: Item) => setItems([...items, i]) };
}

app.post("/api/cart/:id", requireAuth, async (req, res) => {
  const cart = await Cart.findOrCreate(req.params.id);
  cart.add(req.body.item);
  res.status(201).json(await cart.save());
});`,
  },
  {
    title: "Languages",
    blurb: "Comfortable moving between languages and picking the right one for the job.",
    groups: [{ items: ["Python", "JavaScript", "TypeScript", "Java", "C", "C++", "C#", "Go", "SQL", "Bash"] }],
    lang: "c",
    code: `#include <pthread.h>
#include <stdlib.h>

typedef struct node { int val; struct node *next; } node_t;

static pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;

void push(node_t **head, int val) {
    node_t *n = malloc(sizeof(node_t));
    n->val = val;
    pthread_mutex_lock(&lock);
    n->next = *head;
    *head = n;
    pthread_mutex_unlock(&lock);
}

int sum(const node_t *head) {
    int total = 0;
    for (; head; head = head->next) total += head->val;
    return total;
}`,
  },
  {
    title: "Tools & workflow",
    blurb: "The everyday kit teams expect you to know on day one.",
    groups: [
      { items: ["Git & GitHub", "VS Code", "Docker", "Linux", "Postman", "npm", "Jira", "Figma"] },
    ],
    lang: "bash",
    code: `#!/usr/bin/env bash
set -euo pipefail

branch="feature/\${1:?usage: ship <name>}"
git checkout -b "$branch"
npm ci && npm test

docker build -t app:"$(git rev-parse --short HEAD)" .
docker compose up -d db cache

for f in migrations/*.sql; do
  psql "$DATABASE_URL" -f "$f"
done

git push -u origin "$branch"
gh pr create --fill --draft`,
  },
  {
    title: "Cloud & DevOps",
    blurb: "Shipping code safely and keeping it running once it is live.",
    groups: [
      { items: ["Azure", "AWS", "CI/CD", "GitHub Actions", "Kubernetes", "Terraform", "Monitoring"] },
    ],
    lang: "go",
    code: `func healthHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		if err := db.PingContext(ctx); err != nil {
			http.Error(w, "db unavailable", 503)
			return
		}
		w.WriteHeader(http.StatusOK)
	}
}

func main() {
	mux := http.NewServeMux()
	mux.Handle("/healthz", healthHandler(openDB()))
	log.Fatal(http.ListenAndServe(":8080", mux))
}`,
  },
  {
    title: "Databases & data",
    blurb: "Designing how data is stored so it stays correct and fast to query.",
    groups: [{ items: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Prisma", "Data modelling"] }],
    lang: "sql",
    code: `CREATE TABLE orders (
  id          BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  status      TEXT   NOT NULL DEFAULT 'pending',
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX orders_customer_idx ON orders (customer_id, created_at DESC);

SELECT c.name, COUNT(o.id) AS orders, SUM(o.total_cents) / 100.0 AS spend
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.created_at > now() - interval '30 days'
GROUP BY c.name
ORDER BY spend DESC
LIMIT 10;`,
  },
  {
    title: "AI & machine learning",
    blurb: "Building features on top of modern AI models, not just using them.",
    groups: [{ items: ["LLM APIs", "RAG", "Prompt design", "PyTorch", "pandas", "Vector search"] }],
    lang: "python",
    code: `def answer(question: str, k: int = 4) -> str:
    query = embed(question)
    docs = index.search(query, top_k=k)
    context = "\\n\\n".join(d.text for d in docs)
    reply = client.messages.create(
        model=MODEL,
        max_tokens=512,
        messages=[{"role": "user", "content": f"{context}\\n\\nQ: {question}"}],
    )
    return reply.content[0].text


def chunk(text: str, size: int = 800, overlap: int = 100):
    for start in range(0, len(text), size - overlap):
        yield text[start : start + size]`,
  },
  {
    title: "Testing & quality",
    blurb: "Code that is reviewed, tested and safe for the next person to change.",
    groups: [{ items: ["Unit tests", "Jest", "PyTest", "JUnit", "Playwright", "Code review", "TDD"] }],
    lang: "java",
    code: `class InvoiceServiceTest {

    private final Clock clock = Clock.fixed(Instant.parse("2025-01-01T00:00:00Z"), UTC);
    private final InvoiceService service = new InvoiceService(new InMemoryRepo(), clock);

    @Test
    void appliesLateFeeAfterThirtyDays() {
        Invoice inv = service.create(new BigDecimal("100.00"));
        service.advance(Duration.ofDays(31));

        assertEquals(new BigDecimal("105.00"), service.balance(inv.id()));
    }

    @Test
    void rejectsNegativeAmounts() {
        assertThrows(IllegalArgumentException.class,
            () -> service.create(new BigDecimal("-1")));
    }
}`,
  },
  {
    title: "Systems & problem solving",
    blurb: "The fundamentals interviews test and real systems depend on.",
    groups: [
      {
        items: ["Data structures", "Algorithms", "System design", "Multithreading", "Networking", "OOP"],
      },
    ],
    lang: "cpp",
    code: `template <typename T>
class BoundedQueue {
public:
    explicit BoundedQueue(size_t cap) : cap_(cap) {}

    void push(T item) {
        std::unique_lock lock(m_);
        not_full_.wait(lock, [&] { return q_.size() < cap_; });
        q_.push(std::move(item));
        not_empty_.notify_one();
    }

    T pop() {
        std::unique_lock lock(m_);
        not_empty_.wait(lock, [&] { return !q_.empty(); });
        T item = std::move(q_.front());
        q_.pop();
        not_full_.notify_one();
        return item;
    }

private:
    std::queue<T> q_;
    std::mutex m_;
    std::condition_variable not_full_, not_empty_;
    size_t cap_;
};`,
  },
];

export default function Services() {
  const track = useRef<HTMLUListElement>(null);

  // Tilt each card by its distance from the centre of the track, giving the curved "slipstream" wall.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      const box = el.getBoundingClientRect();
      const mid = box.left + box.width / 2;
      for (const card of Array.from(el.children) as HTMLElement[]) {
        const r = card.getBoundingClientRect();
        const d = Math.max(-1.6, Math.min(1.6, (r.left + r.width / 2 - mid) / (box.width / 2)));
        if (reduce.matches) {
          card.style.transform = "";
          card.style.opacity = "";
          continue;
        }
        card.style.transform = `perspective(1200px) translateZ(${-Math.abs(d) * 140}px) rotateY(${-d * 24}deg)`;
        card.style.opacity = String(1 - Math.min(Math.abs(d), 1.4) * 0.35);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    // Open on the second card so the curve has cards on both sides.
    const start = el.children[1] as HTMLElement | undefined;
    if (start) el.scrollLeft = start.offsetLeft - (el.clientWidth - start.offsetWidth) / 2;

    update();
    el.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduce.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduce.removeEventListener("change", schedule);
    };
  }, []);

  // Mouse drag to scroll; touch and trackpads already scroll natively.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let startX = 0;
    let startScroll = 0;
    let dragging = false;

    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      dragging = true;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      el.dataset.dragging = "true";
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (dragging) el.scrollLeft = startScroll - (e.clientX - startX);
    };
    const up = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      delete el.dataset.dragging;
      el.releasePointerCapture(e.pointerId);
    };

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, []);

  const step = (dir: number) => {
    const el = track.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    el.scrollBy({ left: dir * (card.offsetWidth + 24), behavior: "smooth" });
  };

  return (
    <div className="svc">
      <ul ref={track} className="svc-track" tabIndex={0} aria-label="Services, scrollable">
        {SERVICES.map((s, i) => (
          <li key={s.title} className="svc-card">
            <pre className="svc-code mono" aria-hidden="true">
              {s.code}
            </pre>
            <div className="svc-body">
              <p className="mono svc-meta">
                <span>{String(i + 1).padStart(2, "0")}</span>
                <span>.{s.lang}</span>
              </p>
              <h3>{s.title}</h3>
              <p className="svc-blurb">{s.blurb}</p>
              {s.groups.map((g, gi) => (
                <div key={gi} className="svc-group">
                  {g.name && <p className="mono svc-group-name">{g.name}</p>}
                  <ul className="svc-tags">
                    {g.items.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <div className="svc-nav wrap">
        <button type="button" className="btn btn-ghost svc-arrow" onClick={() => step(-1)} aria-label="Previous service">
          ←
        </button>
        <button type="button" className="btn btn-ghost svc-arrow" onClick={() => step(1)} aria-label="Next service">
          →
        </button>
      </div>
    </div>
  );
}
