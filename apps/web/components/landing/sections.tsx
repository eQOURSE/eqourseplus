import { GlassBox } from "./glass-box";
import { SpecializationTracks } from "./tracks";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="lx-section lx-how" data-home-region aria-labelledby="workflow-title">
      <div className="lx-container">
        <header className="lx-head lx-reveal">
          <p className="lx-eyebrow">Specialization tracks</p>
          <h2 id="workflow-title" className="lx-display lx-h2">
            Find the Projects That Match Your <span className="lx-serif lx-ink-grad">Specialized Domain</span>
          </h2>
          <p className="lx-lede">Connect your capabilities to projects that need specialist depth.</p>
        </header>
        <SpecializationTracks />
      </div>
    </section>
  );
}

export function GlassBoxSection() {
  return (
    <section id="glass-box" className="lx-section lx-glassbox" data-home-region aria-labelledby="glass-box-title">
      <div className="lx-glassbox__bg" aria-hidden="true" />
      <div className="lx-container">
        <header className="lx-head lx-head--center lx-reveal">
          <p className="lx-eyebrow">The glass box advantage</p>
          <h2 id="glass-box-title" className="lx-display lx-h2">
            The Antidote to the <span className="lx-serif lx-ink-grad">&quot;Black-Box&quot;</span> Industry
          </h2>
          <p className="lx-lede">Operational clarity replaces opaque crowdsourcing.</p>
        </header>
        <GlassBox />
      </div>
    </section>
  );
}
