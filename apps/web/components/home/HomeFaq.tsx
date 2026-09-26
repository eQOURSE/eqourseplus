import styles from "./home-redesign.module.css";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "./motion";

const faqs = [
  [
    "What is eQOURSE+?",
    "eQOURSE+ is a transparent talent and delivery ecosystem connecting verified experts, vendor agencies, and enterprise clients on real projects in AI training, annotation, evaluation, and content creation, all backed by documented standards and on-record payouts."
  ],
  [
    "Who can join as an expert?",
    "Domain specialists, academic fellows, annotators, evaluators, content experts, multilingual specialists, coding experts, and subject-matter authorities across STEM, language, and technical fields are welcome to apply."
  ],
  [
    "What kind of AI work is available?",
    "Experts contribute to AI response evaluation, human feedback and preference ranking, data annotation, multilingual AI datasets, speech and audio projects, reasoning tasks, and technical evaluations across multiple domains."
  ],
  [
    "What kind of projects will I actually work on?",
    "Projects include model evaluation, preference ranking, annotation across text, audio, and other formats, multilingual data creation, speech datasets, reasoning tasks, and structured content development for AI and education use cases."
  ],
  [
    "Can vendors join as partners?",
    "Yes. Vendor agencies complete verification and a capability review before joining the network. Once approved, they receive structured project opportunities delivered through clear work orders and milestone-based settlements."
  ],
  [
    "Does eQOURSE+ support multiple languages?",
    "Yes. Expert opportunities span 30+ languages, supported by verified linguistic and cultural expertise."
  ],
  [
    "Which countries can experts work from?",
    "eQOURSE+ operates under dual governance from Singapore and India and welcomes experts and vendor agencies from multiple countries for global projects."
  ]
] as const;

export function HomeFaq() {
  return (
    <section id="faq" className={`${styles.section} ${styles.faq}`} data-home-region aria-labelledby="faq-title">
      <div className={styles.inner}>
        <FadeIn className={`${styles.sectionHeading} ${styles.centeredHeading}`}>
          <p>Frequently asked questions</p>
          <h2 id="faq-title">Frequently Asked Questions</h2>
        </FadeIn>
        <FadeInStagger className={styles.faqList} staggerDelay={0.08}>
          {faqs.map(([question, answer], index) =>
            <FadeInStaggerItem key={question}>
              <details open={index === 0}>
                <summary>
                  <span>{question}</span>
                  <i aria-hidden="true" />
                </summary>
                <p>{answer}</p>
              </details>
            </FadeInStaggerItem>
          )}
        </FadeInStagger>
      </div>
    </section>
  );
}
