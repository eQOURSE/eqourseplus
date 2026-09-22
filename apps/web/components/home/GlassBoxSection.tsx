import styles from "./home-redesign.module.css";

const rows = [
  ["Review process", "Opaque scoring, with little explanation of outcomes", "Documented rubrics, human QA review and clear feedback loops"],
  ["Work flexibility", "Task availability that appears and disappears without notice", "Transparent task availability matched to verified skill tiers"],
  ["Vendor agency model", "No formal route for agencies to participate as teams", "Formal vendor onboarding, master agreements and team tooling"],
  ["Client visibility", "Aggregate output delivered with limited provenance", "Full telemetry, contributor credentials and live QA dashboards"],
  ["Payment integrity", "Payment disputes with unclear resolution", "Milestone-locked terms, transparent ledgers and scheduled disbursement"],
] as const;

export function GlassBoxSection() {
  return (
    <section id="glass-box" className={`${styles.section} ${styles.glassBox}`} data-home-region aria-labelledby="glass-box-title">
      <div className={styles.glassBoxGrid} aria-hidden="true" />
      <div className={styles.glassBoxGlow} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={`${styles.sectionHeading} ${styles.centeredHeading}`}>
          <p>The glass box advantage</p>
          <h2 id="glass-box-title">The Antidote to the &quot;Black-Box&quot; Industry</h2>
          <span>Operational clarity replaces opaque crowdsourcing.</span>
        </div>
        <div className={`${styles["home-comparison-wrap"]} eq-frosted eq-frosted--card`}>
          <table className={styles["home-comparison"]}>
            <thead>
              <tr>
                <th>Operational area</th>
                <th>Legacy crowdsourcing platforms</th>
                <th>The eQOURSE+ glass-box standard</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([area, legacy, standard], index) =>
                 <tr key={area}>
                  <th scope="row">
                    <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{area}
                  </th>
                  <td data-label="Legacy platforms">{legacy}</td>
                  <td data-label="eQOURSE+ standard">{standard}</td>
                </tr>)}
              </tbody>
            </table>
        </div>
      </div>
    </section>
  );
}
