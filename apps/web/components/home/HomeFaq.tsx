import styles from "./home-redesign.module.css";

const faqs = [
  ["Can I really work from anywhere and choose my own schedule?", "Yes. eQOURSE+ is fully remote and asynchronous. Once verified, you contribute whenever your schedule allows, from any supported country."],
  ["How does payment work?", "Payment runs on milestone billing. Every approved task is logged to your dashboard ledger and released on a published cycle by global bank transfer or a verified payment partner."],
  ["How do vendor agencies receive work?", "Accredited agencies sign a master services agreement. When enterprise volume requires it, we issue a formal statement of work with defined quotas, agreed rate cards and milestones."],
  ["How do enterprise clients maintain control over quality and timelines?", "Clients use the project telemetry portal to inspect quality metrics, review annotations, communicate with a dedicated project manager and adjust delivery pace."],
  ["How is eQOURSE+ different from anonymous crowdsourcing platforms?", "Most crowdsourcing marketplaces match anonymous contributors to tasks with automated scoring and little recourse. eQOURSE+ is a managed expert network: identities are verified, reviews are human, agencies participate under formal agreements, and every decision leaves an audit trail."],
  ["Does eQOURSE+ support multiple languages?", "Yes. Expert opportunities span multiple languages, supported by verified linguistic and cultural expertise."],
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
