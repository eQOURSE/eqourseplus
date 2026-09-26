import { SpecializationTracks } from "./home-interactions";
import styles from "./home-redesign.module.css";
import { FadeIn } from "./motion";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className={`${styles.section} ${styles.workflowSection}`} data-home-region aria-labelledby="workflow-title">
      <div className={styles.inner}>
        <FadeIn className={styles.sectionHeading}>
          <p>Specialization tracks</p>
          <h2 id="workflow-title">Find the Projects That Match Your Specialized Domain</h2>
          <span>Connect your capabilities to projects that need specialist depth.</span>
        </FadeIn>
        <FadeIn delay={0.15}>
          <SpecializationTracks />
        </FadeIn>
      </div>
    </section>
  );
}
