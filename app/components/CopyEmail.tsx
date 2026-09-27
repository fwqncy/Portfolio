"use client";

import { useEffect, useRef, useState } from "react";

type State = "idle" | "copied" | "failed";

const LABEL: Record<State, string> = {
  idle: "Copy address",
  copied: "Copied",
  failed: "Copy blocked, select the address instead",
};

export default function CopyEmail({ email }: { email: string }) {
  const [state, setState] = useState<State>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setState("copied");
    } catch {
      setState("failed");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2400);
  }

  return (
    <button type="button" className="btn btn-ghost" onClick={copy} data-state={state}>
      <span aria-live="polite">{LABEL[state]}</span>
    </button>
  );
}
