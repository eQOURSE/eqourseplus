import styles from "./home-redesign.module.css";

const rows = [
  ["Review Process", "Opaque algorithms; silent disqualification", "Documented rubrics, human QA review, clear feedback loops"],
  ["Work Flexibility", "Sudden task droughts without notice", "Transparent task availability matched to verified skill tiers"],
  ["Vendor Agency Model", "Ignored or treated as unauthorized shared accounts", "Formal vendor onboarding, master agreements, team tooling"],
  ["Client Visibility", "Blind aggregate data delivered without provenance", "Full telemetry, transparent contributor credentials, live QA dashboards"],
  ["Payment Integrity", "Delayed, disputed, or arbitrarily docked payouts", "Milestone locked escrow, transparent ledgers, on-time disbursement"],
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
