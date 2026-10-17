import Link from "next/link";
import type { CSSProperties } from "react";

import { DeliveryBoard } from "./delivery-board";
import { HeroStage } from "./hero-stage";
import {
  IconArrow,
  IconEnterprise,
  IconGlobe,
  IconLedger,
  IconSeal,
  IconShield,
  SEGMENT_ICONS,
} from "./icons";
import { LiquidGlass } from "./liquid-glass";
import { SEGMENTS } from "./segments";

type Word = { text: string; accent?: boolean };

/* "Partner for World-Class" / "AI and Content" */
const TITLE: ReadonlyArray<readonly Word[]> = [
  [{ text: "Partner" }, { text: "for" }, { text: "World-Class" }],
  [{ text: "AI", accent: true }, { text: "and", accent: true }, { text: "Content", accent: true }],
];

const PROOF = [
  {
    icon: IconGlobe,
    title: "100% Remote Flexibility",
    body: "Work on your terms, from any location, on your schedule.",
  },
  {
    icon: IconLedger,
    title: "Guaranteed Milestone Pay",
    body: "On-record financial clearing with full tax compliance (GST, TDS, cross-border).",
  },
  {
    icon: IconEnterprise,
    title: "Enterprise Work Orders",
    body: "Direct pipelines from frontier AI research labs and global organizations.",
  },
  {
    icon: IconSeal,
    title: "Audited Quality Standards",
    body: "ISO 9001 Quality Management & ISO 27001 Information Security accredited.",
  },
] as const;

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

export function Hero() {
  let wordIndex = 0;

  return (
    <section id="hero" className="q-hero" data-home-region data-pointer-field aria-labelledby="hero-title">
      <div className="q-hero__bg" aria-hidden="true">
        <div className="q-aurora q-hero__aurora">
          <span />
          <span />
          <span />
          <span />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="q-hero__ribbon" src="/home/liquid-ribbon.png" alt="" width={512} height={512} decoding="async" />
        <div className="q-hero__grid"><span className="q-plusgrid" /></div>
        <div className="q-hero__glow"><span className="q-plusgrid" /></div>
      </div>

      <div className="q-container q-hero__inner">
        <LiquidGlass as="p" className="q-hero__badge q-rise" style={delay(0)} tier="clear">
          <span className="q-dot" />
          <span>
            The Transparent Talent &amp; Delivery Ecosystem by eQOURSE · Dual Governance: Singapore &amp; India · ISO 9001 &amp; ISO 27001 Certified
          </span>
        </LiquidGlass>

        <h1 id="hero-title" className="q-display q-hero__title">
          {TITLE.map((line, lineIndex) => (
            <span key={lineIndex} className="q-hero__line">
              {line.map((word, index) => {
                const order = wordIndex++;
                return (
                  <span key={word.text}>
                    <span className={`q-word${word.accent ? " q-grad" : ""}`} style={{ "--i": order } as CSSProperties}>
                      {word.text}
                    </span>
                    {index < line.length - 1 || lineIndex < TITLE.length - 1 ? " " : null}
                  </span>
                );
              })}
            </span>
          ))}
        </h1>

        <p className="q-hero__copy q-rise" style={delay(420)}>
          Join a global network of domain experts training frontier AI models and crafting high-impact content.
        </p>

        {/* Fade-ins sit on the glass itself: an ancestor with opacity or
            filter would cut the glass off from the page behind it. */}
        <div className="q-hero__dock-wrap">
          <LiquidGlass className="q-dock q-rise" style={delay(560)} tier="focal" radius={32} bezel={24} thickness={28} dispersion>
            {SEGMENTS.map((item) => {
              const Icon = SEGMENT_ICONS[item.id];
              return (
                <Link key={item.id} href={item.href} className={`q-dock__item q-dock__item--${item.id}`} data-magnetic>
                  <span className="q-dock__icon"><Icon /></span>
                  <span className="q-dock__text">
                    <small>{item.audience}</small>
                    <strong>{item.cta}</strong>
                  </span>
                  <span className="q-dock__go" aria-hidden="true"><IconArrow /></span>
                  {item.note ? <span className="q-dock__note">{item.note}</span> : null}
                </Link>
              );
            })}
          </LiquidGlass>
        </div>

        <ul className="q-proof q-rise" style={delay(700)} aria-label="Why teams choose eQOURSE+">
          {PROOF.map(({ icon: Icon, title, body }) => (
            <li key={title}>
              <span className="q-proof__icon" aria-hidden="true"><Icon /></span>
              <span className="q-proof__text">
                <strong>{title}</strong>
                <span>{body}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="q-container q-hero__stage q-lift" style={delay(820)}>
        <HeroStage>
          <div className="q-frame">
            <DeliveryBoard />
          </div>
          <LiquidGlass className="q-float q-float--a" tier="focal" radius={22} bezel={16} thickness={18} aria-hidden="true">
            <span className="q-float__icon"><IconShield /></span>
            <span className="q-float__text">
              <strong>KYC verified</strong>
              <small>Proctored assessment passed</small>
            </span>
          </LiquidGlass>
          <LiquidGlass className="q-float q-float--b" aria-hidden="true">
            <span className="q-float__icon q-float__icon--mint"><IconLedger /></span>
            <span className="q-float__text">
              <strong>Milestone approved</strong>
              <small>Logged to the personal ledger</small>
            </span>
          </LiquidGlass>
        </HeroStage>
      </div>
    </section>
  );
}
