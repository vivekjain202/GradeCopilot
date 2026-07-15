import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedTeacher } from "@/lib/authorization";
import { listSubmissions } from "@/lib/submissions/repository";
export const dynamic = "force-dynamic";
export default async function SubmissionsPage() { const teacher = await getAuthenticatedTeacher(); if (!teacher) redirect("/login"); const submissions = await listSubmissions(teacher.id); return <main className="mx-auto max-w-6xl px-6 py-12"><div className="flex justify-between"><div><p className="text-sm font-semibold text-indigo-700">Submissions</p><h1 className="text-3xl font-bold">Test copies</h1></div><Link className="rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white" href="/submissions/new">Upload test copy</Link></div><ul className="mt-8 space-y-3">{submissions.map((submission) => <li className="rounded-xl border bg-white p-5" key={submission.id}><p className="font-semibold">{submission.student.name} · {submission.test.title}</p><p className="text-sm text-slate-600">{submission.fileName} · {submission.processingStatus}</p></li>)}</ul></main>; }
