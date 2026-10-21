import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Home from "../../components/Home";
import { projects } from "../../content";

export function generateStaticParams() {
  return projects.map((p) => ({ id: p.id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = projects.find((x) => x.id === id);
  return p ? { title: `${p.title} · Case study · Sayef Khan`, description: p.summary } : {};
}

// The home page with this project's card flipped open to its case study.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!projects.some((p) => p.id === id)) notFound();
  return <Home openId={id} />;
}
