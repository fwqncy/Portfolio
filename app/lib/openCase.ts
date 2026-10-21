// Opens a project's case study from anywhere on the page (the footer's project links). The carousel listens.
export const OPEN_CASE = "case:open";

export const openCaseStudy = (id: string) => window.dispatchEvent(new CustomEvent(OPEN_CASE, { detail: id }));
