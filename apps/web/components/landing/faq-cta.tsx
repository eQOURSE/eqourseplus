import Link from "next/link";

import { IconArrow, IconArrowUpRight, IconPlus, SEGMENT_ICONS } from "./icons";
import { LOGIN, SEGMENTS } from "./segments";

const faqs = [
  [
    "What is eQOURSE+?",
    "eQOURSE+ is a transparent talent and delivery ecosystem connecting verified experts, vendor agencies, and enterprise clients on real projects in AI training, annotation, evaluation, and content creation, all backed by documented standards and on-record payouts.",
  ],
  [
    "Who can join as an expert?",
    "Domain specialists, academic fellows, annotators, evaluators, content experts, multilingual specialists, coding experts, and subject-matter authorities across STEM, language, and technical fields are welcome to apply.",
  ],
  [
    "What kind of AI work is available?",
    "Experts contribute to AI response evaluation, human feedback and preference ranking, data annotation, multilingual AI datasets, speech and audio projects, reasoning tasks, and technical evaluations across multiple domains.",
  ],
  [
    "What kind of projects will I actually work on?",
    "Projects include model evaluation, preference ranking, annotation across text, audio, and other formats, multilingual data creation, speech datasets, reasoning tasks, and structured content development for AI and education use cases.",
  ],
  [
    "Can vendors join as partners?",
    "Yes. Vendor agencies complete verification and a capability review before joining the network. Once approved, they receive structured project opportunities delivered through clear work orders and milestone-based settlements.",
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
    <section id="faq" className="lx-section lx-faq" data-home-region aria-labelledby="faq-title">
      <div className="lx-container lx-faq__grid">
        <div className="lx-faq__side lx-reveal">
          <p className="lx-eyebrow">Frequently asked questions</p>
          <h2 id="faq-title" className="lx-display lx-h2">
            Frequently Asked <span className="lx-serif lx-ink-grad">Questions</span>
          </h2>
          <div className="lx-faq__paths">
            {SEGMENTS.map((item) => (
              <Link key={item.id} href={item.href} className="lx-faq__path">
                <span>
                  <small>{item.audience}</small>
                  {item.cta}
                </span>
                <IconArrowUpRight />
              </Link>
            ))}
          </div>
        </div>

        <div className="lx-faq__list">
          {faqs.map(([question, answer], index) => (
            <details key={question} className="lx-qa lx-glass lx-reveal" open={index === 0} style={{ ["--d" as string]: index }}>
              <summary>
                <span className="lx-qa__num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <span className="lx-qa__q">{question}</span>
                <span className="lx-qa__icon" aria-hidden="true"><IconPlus /></span>
              </summary>
              <div className="lx-qa__a">
                <p>{answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section id="final-cta" className="lx-final" data-home-region aria-labelledby="final-cta-title">
      <div className="lx-final__aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="lx-final__grid" aria-hidden="true" />
      <div className="lx-container lx-final__inner">
        <h2 id="final-cta-title" className="lx-display lx-final__title lx-reveal">
          Ready to Power the <span className="lx-serif lx-ink-grad">Next Frontier</span> of AI and Content?
        </h2>
        <p className="lx-final__copy lx-reveal" style={{ ["--d" as string]: 1 }}>
          Whether you are a specialist ready to work on your terms, an agency seeking enterprise-grade pipelines, or a lab building next-generation models — step into an ecosystem designed for clarity, respect and growth.
        </p>
        <div className="lx-portals">
          {SEGMENTS.map((item, index) => {
            const Icon = SEGMENT_ICONS[item.id];
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`lx-portal lx-reveal lx-portal--${item.id}`}
                style={{ ["--d" as string]: index + 2 }}
              >
                <span className={`lx-portal__icon lx-seg-${item.id}`}><Icon /></span>
                <small>{item.audience}</small>
                <strong className="lx-display">{item.cta}</strong>
                <span className="lx-portal__go" aria-hidden="true"><IconArrow /></span>
              </Link>
            );
          })}
        </div>
        <p className="lx-final__login lx-reveal" style={{ ["--d" as string]: 5 }}>
          <Link href={LOGIN.href} className="lx-btn lx-btn--glass">
            {LOGIN.label}
            <span className="lx-btn__arrow"><IconArrow /></span>
          </Link>
        </p>
      </div>
    </section>
  );
}
