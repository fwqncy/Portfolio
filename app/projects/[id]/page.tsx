import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectCase from "../../components/ProjectCase";
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

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) notFound();
  return <ProjectCase projects={projects} index={index} />;
}
