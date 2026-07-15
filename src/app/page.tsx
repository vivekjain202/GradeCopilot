export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 font-sans text-slate-950">
      <section className="max-w-xl space-y-5 text-center">
        <p className="text-sm font-semibold tracking-[0.2em] text-indigo-600 uppercase">
          GradeCopilot
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Teacher-reviewed feedback, made simpler.
        </h1>
        <p className="text-lg leading-8 text-slate-600">
          The application foundation is ready. Teacher authentication and the dashboard
          are the next milestones.
        </p>
      </section>
    </main>
  );
}
