import { SpecializationTracks } from "./home-interactions";
import styles from "./home-redesign.module.css";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className={`${styles.section} ${styles.workflowSection}`} data-home-region aria-labelledby="workflow-title">
      <div className={styles.inner}>
        <div className={styles.sectionHeading}>
          <p>Specialization tracks</p>
          <h2 id="workflow-title">Find the Projects That Match Your Specialized Domain</h2>
          <span>Connect your capabilities to projects that need specialist depth.</span>
        </div>
        <SpecializationTracks />
      </div>
    </section>
  );
}
