import type { Testimonial } from "../../content/testimonials";

export interface TestimonialsProps {
  items: readonly Testimonial[];
}

export function Testimonials({ items }: TestimonialsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section
      id="testimonials"
      className="home-section"
      aria-labelledby="testimonials-title"
    >
      <div className="home-section-inner">
        <p className="home-eyebrow">Shared experience</p>
        <h2 id="testimonials-title" className="home-section-title">
          What project partners say
        </h2>
        <div className="home-testimonial-list">
          {items.map((item) => (
            <figure key={`${item.attribution}-${item.quote}`}>
              <blockquote>{item.quote}</blockquote>
              <figcaption>{item.attribution}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
