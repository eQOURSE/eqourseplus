import Link from "next/link";
import type { CSSProperties } from "react";

import { CockpitPreview, CockpitStage } from "./cockpit";
import { IconArrow, IconSpark, SEGMENT_ICONS } from "./icons";
import { LiquidLens } from "./liquid-lens";
import { SEGMENTS } from "./segments";
import { SilkShader } from "./silk-shader";

type Word = { text: string; accent?: boolean };

const TITLE: Word[] = [
  { text: "Join" },
  { text: "the" },
  { text: "expert" },
  { text: "network" },
  { text: "powering" },
  { text: "AI", accent: true },
  { text: "and" },
  { text: "world-class", accent: true },
  { text: "content.", accent: true },
];

const TRUST = [
  "100% REMOTE FLEXIBILITY",
  "MILESTONE-BASED PAY, ON RECORD",
  "ENTERPRISE WORK ORDERS",
  "AUDITED QUALITY STANDARDS",
] as const;

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

export function Hero() {
  return (
    <section id="hero" className="lx-hero" data-home-region aria-labelledby="hero-title">
      <div className="lx-hero__bg" aria-hidden="true">
        <SilkShader className="lx-hero__silk" />
        <div className="lx-hero__scrim" />
        <div className="lx-hero__lines" />
      </div>

      <div className="lx-container lx-hero__inner">
        <p className="lx-hero__badge lx-glass lx-glass--clear lx-rise" style={delay(0)}>
          <span className="lx-hero__badge-dot" aria-hidden="true" />
          The Transparent Talent &amp; Delivery Ecosystem by eQOURSE · Singapore &amp; India · ISO 9001 and ISO/IEC 27001 certified
        </p>

        <h1 id="hero-title" className="lx-display lx-hero__title">
          {TITLE.map((word, index) => (
            <span key={word.text}>
              <span
                className={`lx-word${word.accent ? " lx-serif lx-ink-grad" : ""}`}
                style={{ ["--i" as string]: index }}
              >
                {word.text}
              </span>
              {index < TITLE.length - 1 ? " " : null}
            </span>
          ))}
        </h1>

        <p className="lx-hero__copy lx-rise" style={delay(650)}>
          Work from anywhere on projects that shape next generation intelligence. Whether you are a specialist, an agency or an enterprise, eQOURSE+ delivers operational clarity.
        </p>

        <div className="lx-rise lx-hero__dock-wrap" style={delay(820)}>
          <LiquidLens className="lx-hero__dock lx-glass" radius={30} bezel={26} strength={52}>
            {SEGMENTS.map((item, index) => {
              const Icon = SEGMENT_ICONS[item.id];
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`lx-dock__item${index === 0 ? " lx-dock__item--primary" : ""}`}
                  data-magnetic
                >
                  <span className={`lx-dock__icon lx-seg-${item.id}`}><Icon /></span>
                  <span className="lx-dock__text">
                    <small>{item.audience}</small>
                    <strong>{item.cta}</strong>
                  </span>
                  <span className="lx-dock__go" aria-hidden="true"><IconArrow /></span>
                </Link>
              );
            })}
          </LiquidLens>
        </div>

        <div className="lx-hero__trust lx-rise" style={delay(1000)}>
          <p className="sr-only">{TRUST.join(" · ")}</p>
          <div className="lx-marquee" aria-hidden="true" style={{ ["--speed" as string]: "34s" }}>
            {[0, 1].map((copy) => (
              <div className="lx-marquee__track" key={copy}>
                {TRUST.map((item) => (
                  <span className="lx-hero__trust-item" key={item}>
                    <IconSpark />
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lx-container lx-hero__stage">
        <CockpitStage>
          <CockpitPreview />
        </CockpitStage>
      </div>
    </section>
  );
}
