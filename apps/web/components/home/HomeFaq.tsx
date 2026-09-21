import styles from "./home-redesign.module.css";

const faqs = [
  ["What is eQOURSE+?", "eQOURSE+ is the transparent talent and delivery ecosystem connecting verified experts, vendor agencies, and enterprise clients on real projects in AI training, annotation, evaluation, and content, all backed by documented standards and on record payouts."],
  ["Who can join as an expert?", "Domain specialists, academic fellows, annotators, evaluators, content experts, multilingual specialists, coding experts, and subject matter authorities across STEM, language, and technical fields."],
  ["What kind of AI work is available?", "Experts work on AI response evaluation, human feedback and preference ranking, data annotation, multilingual AI data, speech and audio datasets, reasoning tasks, and technical evaluation across domains."],
  ["What kind of projects will I actually work on?", "Model evaluation, preference ranking, annotation across text, audio, and other formats, multilingual data creation, speech datasets, reasoning tasks, and structured content for AI and education use cases."],
  ["Can vendors join as partners?", "Yes. Vendors complete verification and a capability review before joining the network, then receive structured project opportunities and deliver through clear work orders and milestone based settlements."],
  ["Does eQOURSE+ support multiple languages?", "Yes. Expert opportunities span 30+ languages, supported by verified linguistic and cultural expertise."],
  ["Which countries can experts work from?", "eQOURSE+ operates under dual governance from Singapore and India and welcomes experts and vendor agencies from multiple countries for global projects."],
] as const;

export function HomeFaq() {
  return (
    <section id="faq" className={`${styles.section} ${styles.faq}`} data-home-region aria-labelledby="faq-title">
      <div className={styles.inner}>
        <div className={`${styles.sectionHeading} ${styles.centeredHeading}`}>
          <p>Frequently asked questions</p>
          <h2 id="faq-title">Frequently Asked Questions</h2>
        </div>
        <div className={styles.faqList}>{faqs.map(([question, answer], index) => 
          <details key={question} open={index === 0}>
            <summary>
              <span>{question}</span>
              <i aria-hidden="true" />
            </summary>
            <p>{answer}</p>
            </details>)}
            </div>
      </div>
    </section>
  );
}
