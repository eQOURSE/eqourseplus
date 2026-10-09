import type { ComponentType, SVGProps } from "react";

import { GlassBox } from "./glass-box";
import {
  IconAtom,
  IconBook,
  IconCode,
  IconLanguage,
  IconPulse,
  IconRadar,
  IconRank,
  IconScale,
} from "./icons";
import { Marquee } from "./marquee";
import { SpecializationTracks } from "./tracks";

const DOMAINS: ReadonlyArray<readonly [string, ComponentType<SVGProps<SVGSVGElement>>]> = [
  ["Language & dialects", IconLanguage],
  ["STEM reasoning", IconAtom],
  ["Code intelligence", IconCode],
  ["Finance & law", IconScale],
  ["Clinical medicine", IconPulse],
  ["Curriculum design", IconBook],
  ["Physical AI", IconRadar],
  ["RLHF & red-teaming", IconRank],
];

/** Decorative strip of specialist domains; the tracks section lists them for real. */
export function DomainStrip() {
  return (
    <div className="q-domains" aria-hidden="true">
      <Marquee speed="46s" gap="0.75rem">
        {DOMAINS.map(([label, Icon]) => (
          <span key={label} className="q-domains__chip">
            <span><Icon /></span>
            {label}
          </span>
        ))}
      </Marquee>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="q-section q-section--tint q-how" data-home-region aria-labelledby="workflow-title">
      <div className="q-container">
        <header className="q-head q-head--center q-head--tight q-reveal">
          <p className="q-eyebrow"><span className="q-eyebrow__idx">02</span>Specialization tracks</p>
          <h2 id="workflow-title" className="q-display q-h2">
            Find the Projects That Match Your <span className="q-grad">Specialized Domain</span>
          </h2>
        </header>
        <SpecializationTracks />
      </div>
    </section>
  );
}

export function GlassBoxSection() {
  return (
    <section id="glass-box" className="q-section q-glassbox" data-home-region aria-labelledby="glass-box-title">
      <div className="q-container">
        <header className="q-head q-head--center q-reveal">
          <p className="q-eyebrow"><span className="q-eyebrow__idx">03</span>The glass box advantage</p>
          <h2 id="glass-box-title" className="q-display q-h2">
            The Antidote to the <span className="q-blackbox">&quot;Black-Box&quot;</span> Industry
          </h2>
        </header>
        <GlassBox />
      </div>
    </section>
  );
}
