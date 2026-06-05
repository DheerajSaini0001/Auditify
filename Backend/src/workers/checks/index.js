import seo from "./seo.js";
import performance from "./performance.js";
import accessibility from "./accessibility.js";
import security from "./security.js";

export const ALL_CHECKS = [seo, performance, accessibility, security];

export function getChecks(options = {}) {
  const wanted = Array.isArray(options.checks) && options.checks.length ? options.checks : null;
  return wanted ? ALL_CHECKS.filter((c) => wanted.includes(c.key)) : ALL_CHECKS;
}

export default { ALL_CHECKS, getChecks };
