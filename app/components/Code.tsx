import type { ReactNode } from "react";
import type { Snippet } from "../caseStudies";

// Syntax-highlighted file excerpt for the case studies.

type Lang = Snippet["lang"];

const KEYWORDS: Record<Lang, string[]> = {
  go: ["func", "for", "if", "return", "continue", "nil", "var", "range", "select", "case", "default"],
  ts: ["export", "const", "let", "return", "import", "from", "async", "await", "for", "of", "if", "new", "function"],
  js: ["export", "const", "let", "return", "import", "from", "for", "of", "in", "if", "else", "new", "class", "this", "null", "continue"],
  rust: ["impl", "pub", "fn", "for", "in", "let", "mut", "self", "Self", "if", "return"],
  python: ["def", "async", "await", "return", "if", "not", "for", "in", "with", "as", "yield", "None"],
  csharp: ["public", "private", "static", "void", "async", "await", "return", "if", "for", "var", "new", "null", "class", "record", "this", "throw"],
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

export default function Code({ file, lang, src }: Snippet) {
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
