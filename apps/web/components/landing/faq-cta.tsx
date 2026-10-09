import Link from "next/link";
import type { CSSProperties } from "react";

import { IconArrow, IconPlus, SEGMENT_ICONS } from "./icons";
import { LOGIN, segment, type SegmentId } from "./segments";

const faqs = [
  [
    "What is eQOURSE+?",
    "eQOURSE+ is the transparent talent and delivery ecosystem connecting verified experts, vendor agencies, and enterprise clients on real projects in AI training, annotation, evaluation, and content, all backed by documented standards and on-record payouts.",
  ],
  [
    "Who can join as an expert?",
    "Domain specialists, academic fellows, annotators, evaluators, content experts, multilingual specialists, coding experts, and subject-matter authorities across STEM, language, and technical fields.",
  ],
  [
    "What kind of AI work is available?",
    "Experts work on AI response evaluation, human feedback and preference ranking, data annotation, multilingual AI data, speech and audio datasets, reasoning tasks, and technical evaluation across domains.",
  ],
  [
    "What kind of projects will I actually work on?",
    "Model evaluation, preference ranking, annotation across text, audio, and other formats, multilingual data creation, speech datasets, reasoning tasks, and structured content for AI and education use cases.",
  ],
  [
    "Can vendors join as partners?",
    "Yes. Vendors complete verification and a capability review before joining the network, then receive structured project opportunities and deliver through clear work orders and milestone-based settlements.",
  ],
  [
    "Does eQOURSE+ support multiple languages?",
    "Yes. Expert opportunities span 30+ languages, supported by verified linguistic and cultural expertise.",
  ],
  [
    "Which countries can experts work from?",
    "eQOURSE+ operates under dual governance from Singapore and India and welcomes experts and vendor agencies from multiple countries for global projects.",
  ],
] as const;

export function Faq() {
  return (
    <section id="faq" className="q-section q-faq" data-home-region aria-labelledby="faq-title">
      <div className="q-container q-faq__wrap">
        <header className="q-head q-head--center q-reveal">
          <p className="q-eyebrow"><span className="q-eyebrow__idx">05</span>FAQ</p>
          <h2 id="faq-title" className="q-display q-h2">
            Frequently Asked <span className="q-grad">Questions</span>
          </h2>
        </header>

        <div className="q-faq__list">
          {faqs.map(([question, answer], index) => (
            <details key={question} className="q-qa q-reveal" open={index === 0} style={{ "--d": index } as CSSProperties}>
              <summary>
                <span className="q-qa__num q-mono" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <span className="q-qa__q">{question}</span>
                <span className="q-qa__icon" aria-hidden="true"><IconPlus /></span>
              </summary>
              <div className="q-qa__a">
                <p>{answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

const CONVERSIONS: ReadonlyArray<{ id: SegmentId; label: string; note: string }> = [
  { id: "expert", label: "Apply as a Domain Expert", note: "Flexible, Remote, Verified" },
  { id: "vendor", label: "Register as a Vendor Partner", note: "High-Volume Enterprise Pipelines" },
  { id: "enterprise", label: "Talk to Our Enterprise Solutions Team", note: "Deploy Dedicated Talent" },
];

export function FinalCta() {
  return (
    <section id="final-cta" className="q-final" data-home-region aria-labelledby="final-cta-title">
      <div className="q-container">
        <div className="q-final__panel q-scope-dark">
          <div className="q-final__bg" aria-hidden="true">
            <div className="q-aurora q-final__aurora">
              <span />
              <span />
              <span />
            </div>
            <span className="q-plusgrid" />
            <svg className="q-final__mega" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
              <path d="M36 2h28a2 2 0 0 1 2 2v30h30a2 2 0 0 1 2 2v28a2 2 0 0 1-2 2H66v30a2 2 0 0 1-2 2H36a2 2 0 0 1-2-2V66H4a2 2 0 0 1-2-2V36a2 2 0 0 1 2-2h30V4a2 2 0 0 1 2-2Z" />
            </svg>
          </div>

          <div className="q-final__inner">
            <h2 id="final-cta-title" className="q-display q-final__title q-reveal">
              Ready to Power the <span className="q-grad">Next Frontier</span> of AI and Content?
            </h2>
            <p className="q-final__copy q-reveal" style={{ "--d": 1 } as CSSProperties}>
              Whether you are an expert ready to work on your terms, an agency seeking enterprise-grade pipelines, or a frontier lab building next-generation models, step into an ecosystem designed for clarity, respect, and growth.
            </p>

            <div className="q-portals">
              {CONVERSIONS.map((item, index) => {
                const Icon = SEGMENT_ICONS[item.id];
                return (
                  <Link
                    key={item.id}
                    href={segment(item.id).href}
                    className={`q-portal q-glass q-portal--${item.id} q-reveal`}
                    style={{ "--d": index + 2 } as CSSProperties}
                    data-magnetic
                  >
                    <span className="q-portal__icon"><Icon /></span>
                    <small>{item.note}</small>
                    <strong className="q-display">{item.label}</strong>
                    <span className="q-portal__go" aria-hidden="true"><IconArrow /></span>
                  </Link>
                );
              })}
            </div>

            <p className="q-final__login q-reveal" style={{ "--d": 5 } as CSSProperties}>
              <span>Already part of the network?</span>
              <Link href={LOGIN.href} className="q-btn q-btn--mint">
                {LOGIN.label}
                <span className="q-btn__icon"><IconArrow /><IconArrow /></span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
