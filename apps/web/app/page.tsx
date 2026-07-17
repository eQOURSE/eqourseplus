export default function HomePage() {
  return (
    <main className="relative isolate flex min-h-screen items-center overflow-hidden bg-background px-6 text-foreground sm:px-10">
      <div
        aria-hidden="true"
        className="absolute -right-32 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full bg-gradient-primary opacity-20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.035] [background-image:radial-gradient(circle,hsl(170_82%_32%)_1px,transparent_1px)] [background-size:40px_40px]"
      />

      <section className="foundation-enter relative mx-auto w-full max-w-6xl py-20" aria-labelledby="foundation-title">
        <p className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Phase 0 · Foundation
        </p>
        <h1
          id="foundation-title"
          aria-label="eQOURSE+"
          className="max-w-4xl font-heading text-5xl font-extrabold leading-[0.98] tracking-[-0.04em] text-navy sm:text-7xl lg:text-8xl"
        >
          eQOURSE<span className="text-primary">+</span>
        </h1>
        <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          The foundation is ready for a verified global talent platform.
        </p>

        <div className="mt-12 flex items-center gap-3 border-t border-border pt-6 text-sm font-medium text-navy">
          <span className="status-dot h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
          Web and API scaffold
        </div>
      </section>
    </main>
  );
}
