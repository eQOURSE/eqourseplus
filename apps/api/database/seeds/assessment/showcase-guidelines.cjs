const GUIDELINES = {
  "eqourse-ai-data-services-annotation-bounding-box": {
    title: "Bounding Box Annotation client guideline",
    body: [
      "Draw tight boxes around the target object's visible extent unless a question explicitly calls for amodal annotation. Exclude cast shadows, reflections, glare and background margin. Follow any stated minimum-size and visibility thresholds.",
      "For pedestrians wearing backpacks, draw one pedestrian box that includes the worn backpack. Do not add a separate backpack instance label in this assessment. This is the assessment's house convention, not a universal object-detection rule.",
      "When a question gives a project-specific guideline, apply that guideline to the scenario.",
    ].join("\n\n"),
  },
  "eqourse-ai-data-services-image-annotation-quality-assurance": {
    title: "Image Annotation Quality Assurance client guideline",
    body: [
      "Review geometry, class labels and attributes against the project's taxonomy and gold references. A good box follows the specified visible or amodal extent; do not treat background margin, shadows or reflections as target pixels unless the project says otherwise.",
      "Use documented rules for ambiguous instances. Escalate a missing taxonomy priority rule rather than inventing a class decision. Assess systematic defects across annotators and classes with representative sampling.",
    ].join("\n\n"),
  },
  "eqourse-content-services-multilingual-content-quality-review": {
    title: "Multilingual Content Quality Review client guideline",
    body: [
      "Review localized content against the approved client termbase, regional style guide and source intent. Check dates, numbers, placeholders, mixed-direction text and layout in the target locale.",
      "Distinguish errors from valid regional usage or preference. Raise a documented query when source meaning or the client rule is unclear, and apply the project's stated severity and score model.",
    ].join("\n\n"),
  },
};

module.exports = { GUIDELINES };
