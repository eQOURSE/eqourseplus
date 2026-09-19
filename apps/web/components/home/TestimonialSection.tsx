import styles from "./home-redesign.module.css";

export function TestimonialSection() {
  return (
    <section className={styles.testimonial} aria-labelledby="testimonial-title">
      <p className={styles.eyebrow}>REAL SPECIALISTS, REAL RESULTS</p>
      <h2 id="testimonial-title">What Our Specialists Say</h2>
      <blockquote>“eQOURSE+ is fundamentally different from commoditized labeling sites. The Specialist Sandbox respects our academic rigor, and the transparent telemetry ensures that complex linguistic edge cases are credited fairly.”</blockquote>
      <div className={styles.testimonialPerson}>
        <span aria-hidden="true">AV</span>
        <p><strong>Dr. Aris Vatsal, PhD</strong><small>Senior Computational Linguist · Stanford NLP Fellow</small></p>
      </div>
      <div className={styles.testimonialControls} aria-hidden="true"><span>←</span><span>→</span></div>
    </section>
  );
}
