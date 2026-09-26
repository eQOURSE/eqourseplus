import type { Metadata } from "next";

import { HomeFooter, HomeHeader } from "../../components/home/HomeChrome";
import { FadeIn, FadeInStagger, FadeInStaggerItem, TimelineSlideIn } from "../../components/home/motion";
import { serializeJsonLd } from "../../lib/json-ld";
import { SOCIAL_IMAGE_ALT } from "../home-data";
import {
  clientCapabilities,
  clientDeliveryCases,
  clientDomains,
  clientFaq,
  clientGovernance,
  clientJourney,
  clientQualityControls,
  clientQualityMetrics,
  clientScaleSteps,
  CLIENTS_DESCRIPTION,
  CLIENTS_TITLE,
  clientStructuredData,
} from "./clients-data";
import styles from "./clients-page.module.css";

export const metadata: Metadata = {
  title: CLIENTS_TITLE,
  description: CLIENTS_DESCRIPTION,
  alternates: { canonical: "/clients", languages: { en: "/clients", "x-default": "/clients" } },
  openGraph: {
    type: "website",
    url: "/clients",
    title: CLIENTS_TITLE,
    description: CLIENTS_DESCRIPTION,
    siteName: "eQOURSE+",
    locale: "en",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SOCIAL_IMAGE_ALT }],
  },
  twitter: {
    card: "summary_large_image",
    title: CLIENTS_TITLE,
    description: CLIENTS_DESCRIPTION,
    images: [{ url: "/opengraph-image", alt: SOCIAL_IMAGE_ALT }],
  },
};

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.faqChevron} aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function IconHelper({ name }: { name: string }) {
  switch (name) {
    case "globe":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case "code":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case "finance":
    case "briefcase":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      );
    case "medical":
    case "activity":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case "content":
    case "layers":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      );
    case "check":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.qualityIcon} aria-hidden="true">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case "search":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.qualityIcon} aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case "shield":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.qualityIcon} aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "sliders":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.qualityIcon} aria-hidden="true">
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
      );
    case "lock":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    case "fileCheck":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="m9 15 2 2 4-4" />
        </svg>
      );
    case "userCheck":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <polyline points="17 11 19 13 23 9" />
        </svg>
      );
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
  }
}

export default function ClientsPage() {
  return (
    <main id="top" className={styles.page}>
      <HomeHeader />
      <div className={styles.body}>
        {/* HERO SECTION */}
        <section className={styles.hero} aria-labelledby="clients-title">
          <FadeInStagger>
            <FadeInStaggerItem>
              <div className={styles.eyebrowPill}>
                <span className={styles.eyebrowDot} />
                FOR ENTERPRISE CLIENTS
              </div>
            </FadeInStaggerItem>
            <FadeInStaggerItem>
              <h1 id="clients-title">
                Verified Expert Teams for Enterprise AI Training &amp; Data Projects
              </h1>
            </FadeInStaggerItem>
            <FadeInStaggerItem>
              <p className={styles.heroLead}>
                Deploy pre-screened specialists and managed teams for training data, human feedback, model evaluation, multilingual data and expert content — with structured QA, defined milestones and clear project visibility.
              </p>
            </FadeInStaggerItem>
            <FadeInStaggerItem className={styles.actions}>
              <a className={styles.primary} href="/register/client">
                Discuss Your Project <ArrowRightIcon />
              </a>
              <a className={styles.secondary} href="#capabilities">
                Explore Capabilities
              </a>
            </FadeInStaggerItem>
            <FadeInStaggerItem className={styles.trust}>
              <span className={styles.trustItem}>
                <span className={styles.trustCheck}>✓</span> ISO 9001:2015
              </span>
              <span className={styles.trustItem}>
                <span className={styles.trustCheck}>✓</span> ISO/IEC 27001
              </span>
              <span className={styles.trustItem}>
                <span className={styles.trustCheck}>✓</span> Confirmed certification standards
              </span>
            </FadeInStaggerItem>
          </FadeInStagger>

          {/* DASHBOARD PREVIEW */}
          <FadeIn delay={0.2}>
            <div className={styles.dashboard} aria-label="Client delivery workspace preview">
              <div className={styles.dashboardCol}>
                <div className={styles.colHeader}>
                  <h4>01 Project Brief</h4>
                  <span className={styles.tagPill}>Audited Scope</span>
                </div>
                <div className={styles.colList}>
                  <div className={styles.colListItem}>
                    <span className={styles.colListKey}>Scope &amp; Milestones</span>
                    <span className={styles.colListVal}>Defined &amp; verified</span>
                  </div>
                  <div className={styles.colListItem}>
                    <span className={styles.colListKey}>QA &amp; Verification Plan</span>
                    <span className={styles.colListVal}>Configured</span>
                  </div>
                  <div className={styles.colListItem}>
                    <span className={styles.colListKey}>Resource Matching</span>
                    <span className={styles.colListVal}>Specialist allocation active</span>
                  </div>
                </div>
                <div className={styles.colFooter}>
                  <div className={styles.progressLabel}>100% Brief Complete</div>
                  <div className={styles.progressBarTrack}>
                    <div className={styles.progressBarFill} style={{ width: "100%" }} />
                  </div>
                </div>
              </div>

              <div className={styles.dashboardCol}>
                <div className={styles.colHeader}>
                  <h4>02 QA &amp; Calibration</h4>
                  <span className={styles.tagPill}>98.5% Pass Rate</span>
                </div>
                <div className={styles.colList}>
                  <div className={styles.colListItem}>
                    <span className={styles.colListKey}>Benchmark calibration</span>
                    <span className={styles.colListVal}>Batch 1 verified</span>
                  </div>
                  <div className={styles.colListItem}>
                    <span className={styles.colListKey}>3-tier validation active</span>
                    <span className={styles.colListVal}>L1 / L2 / L3</span>
                  </div>
                  <div className={styles.colListItem}>
                    <span className={styles.colListKey}>Real-time reporting</span>
                    <span className={styles.colListVal}>Enabled</span>
                  </div>
                </div>
                <div className={styles.colFooter}>
                  <div className={styles.progressLabel}>Quality score: 98.5% (Target ≥98%)</div>
                  <div className={styles.progressBarTrack}>
                    <div className={styles.progressBarFill} style={{ width: "98.5%" }} />
                  </div>
                </div>
              </div>

              <div className={styles.dashboardCol}>
                <div className={styles.colHeader}>
                  <h4>03 Milestone Delivery</h4>
                  <span className={styles.tagPill}>100% On-time</span>
                </div>
                <div className={styles.colList}>
                  <div className={styles.colListItem}>
                    <span className={styles.colListKey}>Production status</span>
                    <span className={styles.colListVal}>Batch 4 in progress</span>
                  </div>
                  <div className={styles.colListItem}>
                    <span className={styles.colListKey}>Handoff package</span>
                    <span className={styles.colListVal}>Scheduled</span>
                  </div>
                  <div className={styles.colListItem}>
                    <span className={styles.colListKey}>Audit trail</span>
                    <span className={styles.colListVal}>Recorded</span>
                  </div>
                </div>
                <div className={styles.colFooter}>
                  <div className={styles.progressLabel}>94% Completed</div>
                  <div className={styles.progressBarTrack}>
                    <div className={styles.progressBarFill} style={{ width: "94%" }} />
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* PROJECT PATH / TIMELINE SECTION WITH LEFT/RIGHT SLIDE IN ANIMATION */}
        <section className={styles.section} aria-labelledby="journey-title">
          <FadeIn>
            <div className={styles.sectionHeaderRow}>
              <div className={styles.sectionHeaderRowLeft}>
                <span className={styles.chip}>PROJECT PATH</span>
                <h2 id="journey-title">From Project Brief to Audited Delivery</h2>
                <p>Eight clear steps, tracked together.</p>
              </div>
              <div className={styles.headerAction}>
                <a className={styles.primary} href="/register/client">
                  Discuss Your Project <ArrowRightIcon />
                </a>
              </div>
            </div>
          </FadeIn>

          <div className={styles.timeline}>
            {clientJourney.map(([title, body], index) => {
              const stepNum = index + 1;
              const isEven = stepNum % 2 === 0;
              const side = isEven ? "right" : "left";
              return (
                <TimelineSlideIn
                  key={title}
                  side={side}
                  className={`${styles.stepWrapper} ${isEven ? styles.stepWrapperRight : styles.stepWrapperLeft}`}
                >
                  <div className={`${styles.stepNode} ${isEven ? styles.stepNodeAlt : ""}`}>{stepNum}</div>
                  <article className={styles.step}>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </article>
                </TimelineSlideIn>
              );
            })}
          </div>
        </section>

        {/* CAPABILITIES SECTION */}
        <section id="capabilities" className={styles.section} aria-labelledby="capabilities-title">
          <FadeIn className={styles.sectionHeader}>
            <span className={styles.chip}>CAPABILITIES</span>
            <h2 id="capabilities-title">Enterprise AI Data &amp; Expert Content Capabilities</h2>
            <p>Choose a focused capability or combine several in one managed delivery plan.</p>
          </FadeIn>

          <FadeInStagger className={styles.grid3}>
            {clientCapabilities.map(([title, body], idx) => {
              const icons = ["globe", "code", "globe", "content", "briefcase"];
              const iconName = icons[idx] || "globe";
              return (
                <FadeInStaggerItem key={title}>
                  <article className={styles.capability}>
                    <div>
                      <div className={styles.iconBox}>
                        <IconHelper name={iconName} />
                      </div>
                      <h3>{title}</h3>
                      <p>{body}</p>
                    </div>
                    <a href="/register/client" className={styles.capabilityLink}>
                      Explore capability <ArrowRightIcon />
                    </a>
                  </article>
                </FadeInStaggerItem>
              );
            })}
          </FadeInStagger>

          <div className={styles.centerCta}>
            <a className={styles.primary} href="/register/client">
              Discuss Your Project <ArrowRightIcon />
            </a>
          </div>
        </section>

        {/* DOMAIN EXPERTISE SECTION */}
        <section className={styles.section} aria-labelledby="domains-title">
          <FadeIn>
            <div className={styles.sectionHeaderRow}>
              <div className={styles.sectionHeaderRowLeft}>
                <span className={styles.chip}>EXPERTISE</span>
                <h2 id="domains-title">Verified Specialists Across High-Value Domains</h2>
                <p>Profiles are reviewed and skills assessed before matching.</p>
              </div>
              <div className={styles.headerAction}>
                <span className={styles.eyebrowPill}>100+ Domains</span>
              </div>
            </div>
          </FadeIn>

          <FadeInStagger className={styles.grid5}>
            {clientDomains.map((domain) => (
              <FadeInStaggerItem key={domain.title}>
                <article className={styles.domain}>
                  <div className={styles.iconBox}>
                    <IconHelper name={domain.icon} />
                  </div>
                  <h3>{domain.title}</h3>
                  <p>{domain.desc}</p>
                </article>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        </section>

        {/* QUALITY CONTROLS SECTION */}
        <section className={styles.section} aria-labelledby="quality-title">
          <FadeIn>
            <div className={styles.sectionHeaderRow}>
              <div className={styles.sectionHeaderRowLeft}>
                <span className={styles.chip}>QUALITY CONTROLS</span>
                <h2 id="quality-title">Quality Controls You Can Inspect, Not Just Trust</h2>
                <p>Systematic measurement across every production batch.</p>
              </div>
              <div className={styles.headerAction}>
                <a className={styles.secondary} href="/register/client">
                  See Quality Manual <ArrowRightIcon />
                </a>
              </div>
            </div>
          </FadeIn>

          <FadeInStagger className={styles.qualityPillsGrid}>
            {clientQualityControls.map((qc) => (
              <FadeInStaggerItem key={qc.title}>
                <article className={styles.qualityPillCard}>
                  <div className={styles.qualityPillHeader}>
                    <IconHelper name={qc.icon} />
                    <h4>{qc.title}</h4>
                  </div>
                  <p>{qc.desc}</p>
                </article>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>

          <FadeIn delay={0.15}>
            <div className={styles.metricsBox}>
              {clientQualityMetrics.map((m) => (
                <div key={m.label} className={styles.metricCard}>
                  <div className={styles.metricHeader}>
                    <span className={styles.metricLabel}>{m.label}</span>
                    <span className={styles.tagPill}>{m.tag}</span>
                  </div>
                  <div className={styles.metricValue}>{m.value}</div>
                  <p className={styles.metricNote}>{m.note}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </section>

        {/* GOVERNANCE SECTION */}
        <section className={styles.section} aria-labelledby="governance-title">
          <FadeIn className={styles.sectionHeader}>
            <span className={styles.chip}>GOVERNANCE</span>
            <h2 id="governance-title">Enterprise-Grade Governance for Sensitive AI Work</h2>
            <p>Controls for access, security, quality and accountable delivery.</p>
          </FadeIn>

          <FadeInStagger className={styles.governanceGrid}>
            {clientGovernance.map((item) => (
              <FadeInStaggerItem key={item.title}>
                <article className={styles.governance}>
                  <div className={styles.iconBox}>
                    <IconHelper name={item.icon} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </article>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>

          <FadeIn delay={0.2}>
            <a href="/register/client" className={styles.whitepaperLink}>
              Read Governance Whitepaper <ArrowRightIcon />
            </a>
          </FadeIn>
        </section>

        {/* SCALE SECTION */}
        <section className={styles.section} aria-labelledby="scale-title">
          <div className={styles.scale}>
            <FadeIn>
              <div className={styles.sectionHeaderRow}>
                <div className={styles.sectionHeaderRowLeft}>
                  <span className={styles.chip}>SCALE</span>
                  <h2 id="scale-title">Scale from Specialist Pilots to Managed Production Teams</h2>
                  <p>Flexible sequencing designed for proof first, then capacity.</p>
                </div>
                <div className={styles.headerAction}>
                  <a className={styles.secondary} href="/register/client">
                    Get an Estimation
                  </a>
                </div>
              </div>
            </FadeIn>

            <FadeInStagger className={styles.scaleGrid}>
              {clientScaleSteps.map((step) => (
                <FadeInStaggerItem key={step.title}>
                  <article className={styles.scaleCard}>
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </article>
                </FadeInStaggerItem>
              ))}
            </FadeInStagger>
          </div>
        </section>

        {/* PROVEN DELIVERY SECTION */}
        <section className={styles.section} aria-labelledby="delivery-title">
          <FadeIn>
            <div className={styles.sectionHeaderRow}>
              <div className={styles.sectionHeaderRowLeft}>
                <span className={styles.chip}>DELIVERY</span>
                <h2 id="delivery-title">Proven AI Data &amp; Content Delivery</h2>
                <p>Real execution frameworks across enterprise challenges.</p>
              </div>
              <div className={styles.headerAction}>
                <a className={styles.secondary} href="/register/client">
                  View Case Studies <ArrowRightIcon />
                </a>
              </div>
            </div>
          </FadeIn>

          <div className={styles.deliveryGrid}>
            {clientDeliveryCases.map((c, i) => (
              <FadeIn key={c.title} delay={i * 0.15}>
                <article className={styles.deliveryCard}>
                  <div>
                    <div className={styles.deliveryHeader}>
                      <h3>{c.title}</h3>
                      <IconHelper name="content" />
                    </div>
                    <div className={styles.deliveryBlocks}>
                      <div className={styles.deliveryBlock}>
                        <div className={styles.deliveryBlockTag}>CHALLENGE</div>
                        <p className={styles.deliveryBlockText}>{c.challenge}</p>
                      </div>
                      <div className={styles.deliveryBlock}>
                        <div className={styles.deliveryBlockTag}>SOLUTION</div>
                        <p className={styles.deliveryBlockText}>{c.solution}</p>
                      </div>
                      <div className={styles.deliveryBlock}>
                        <div className={styles.deliveryBlockTag}>RESULTS</div>
                        <p className={styles.deliveryBlockText}>{c.results}</p>
                      </div>
                    </div>
                  </div>
                  <div className={styles.deliveryTakeaway}>
                    <strong>KEY TAKEAWAY:</strong> {c.takeaway}
                  </div>
                </article>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* CLIENT FAQ SECTION */}
        <section id="faq" className={`${styles.section} ${styles.faq}`} aria-labelledby="faq-title">
          <FadeIn className={styles.sectionHeader}>
            <span className={styles.chip}>CLIENT FAQ</span>
            <h2 id="faq-title">Client FAQ</h2>
            <p>Everything you need to know about engaging specialist teams and managed production.</p>
          </FadeIn>

          <FadeInStagger className={styles.faqList}>
            {clientFaq.map(([question, answer]) => (
              <FadeInStaggerItem key={question}>
                <details>
                  <summary>
                    {question}
                    <ChevronDownIcon />
                  </summary>
                  <p>{answer}</p>
                </details>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        </section>

        {/* CTA BANNER */}
        <FadeIn className={styles.cta} aria-labelledby="cta-title">
          <h2 id="cta-title">Ready to deploy a verified expert team?</h2>
          <p>Accelerate model training with audited talent and guided QA.</p>
          <div className={styles.ctaActions}>
            <a className={styles.ctaPrimary} href="/register/client">
              Discuss Your Project
            </a>
            <a className={styles.ctaSecondary} href="#capabilities">
              Explore Capabilities
            </a>
          </div>
        </FadeIn>
      </div>

      <HomeFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(clientStructuredData) }}
      />
    </main>
  );
}
