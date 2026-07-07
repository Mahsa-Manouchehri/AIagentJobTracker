/**
 * Lightweight local text processing for Job Descriptions.
 * Uses Regular Expressions and keyword dictionaries to detect location, salary,
 * and key technical skills/technologies.
 */

export interface ParsedJobInfo {
  salaryRange: string;
  location: string;
  detectedSkills: string[];
  jobTitle: string;
}

// Common cities and regions to check for locations
const COMMON_LOCATIONS = [
  'San Francisco', 'New York', 'NYC', 'London', 'Berlin', 'Paris', 'Tokyo', 'Toronto', 'Vancouver',
  'Austin', 'Seattle', 'Boston', 'Chicago', 'Denver', 'Los Angeles', 'Atlanta', 'Dublin', 'Sydney',
  'Singapore', 'Amsterdam', 'Munich', 'Zurich', 'Salt Lake City', 'Portland', 'San Diego', 'Dallas'
];

// Common programming languages, frameworks, and skills
const SKILL_KEYWORDS = [
  'React', 'TypeScript', 'JavaScript', 'Python', 'Java', 'C++', 'Rust', 'Golang', 'Go', 'Ruby',
  'Node.js', 'Express', 'Next.js', 'Vue', 'Angular', 'Tailwind', 'Sass', 'CSS', 'HTML', 'SQL',
  'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Firebase',
  'Git', 'CI/CD', 'GraphQL', 'REST API', 'Figma', 'Product Management', 'Agile', 'Scrum', 'Drizzle'
];

export function parseJobDescription(text: string): ParsedJobInfo {
  if (!text) {
    return { salaryRange: '', location: '', detectedSkills: [], jobTitle: '' };
  }

  // 1. Detect Salary
  // Match patterns like: $120,000 - $150,000, $120k-$150k, $90k/yr, 100,000 USD, $50-$70/hr
  const salaryRegexes = [
    /\$[0-9]{1,3}(?:,[0-9]{3})*(?:\s*-\s*\$[0-9]{1,3}(?:,[0-9]{3})*)?/gi, // $120,000 - $150,000
    /\$[0-9]+k(?:\s*-\s*\$[0-9]+k)?/gi, // $120k - $150k
    /[0-9]+k\s*-\s*[0-9]+k/gi, // 120k - 150k
    /[0-9]{3},[0-9]{3}\s*(?:-\s*[0-9]{3},[0-9]{3})?\s*(?:USD|GBP|EUR|CAD)/gi, // 100,000 - 120,000 USD
    /\$[0-9]+(?:\s*-\s*\$[0-9]+)?\s*\/hr/gi // $50 - $70/hr
  ];

  let salaryRange = '';
  for (const regex of salaryRegexes) {
    const match = text.match(regex);
    if (match && match.length > 0) {
      salaryRange = match[0].trim();
      break;
    }
  }

  // If no salary found, try looking for text like "salary of" or "compensation is"
  if (!salaryRange) {
    const backupMatch = text.match(/(?:salary|compensation|range|paying)\s*(?:is|of|starts at)?\s*([^.,\n\r]+)/i);
    if (backupMatch && backupMatch[1]) {
      // Clean up string a bit
      const candidate = backupMatch[1].trim();
      if (candidate.match(/[\d$£€]/)) {
        salaryRange = candidate.split('(')[0].trim().substring(0, 30);
      }
    }
  }

  // 2. Detect Location / Work Type
  let location = '';
  const lowerText = text.toLowerCase();

  // Check work arrangements first
  if (lowerText.includes('remote') && (lowerText.includes('fully remote') || !lowerText.includes('no remote'))) {
    location = 'Remote';
  } else if (lowerText.includes('hybrid')) {
    location = 'Hybrid';
  } else if (lowerText.includes('onsite') || lowerText.includes('on-site')) {
    location = 'On-site';
  }

  // Search for specific common cities
  let foundCity = '';
  for (const city of COMMON_LOCATIONS) {
    // Word boundary check
    const cityRegex = new RegExp(`\\b${city}\\b`, 'i');
    if (cityRegex.test(text)) {
      foundCity = city;
      break;
    }
  }

  if (foundCity) {
    if (location) {
      location = `${location} (${foundCity})`;
    } else {
      location = foundCity;
    }
  }

  if (!location) {
    location = 'Remote / Unspecified';
  }

  // 3. Detect Skills
  const detectedSkills: string[] = [];
  for (const skill of SKILL_KEYWORDS) {
    // Safe escaping for special regex characters like C++
    const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const skillRegex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (skillRegex.test(text)) {
      detectedSkills.push(skill);
    }
  }

  // 4. Detect Job Title (Heuristic based on first line or common titles)
  let jobTitle = '';
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
  if (lines.length > 0) {
    // Check if the first line looks like a title (under 80 chars, contains common role keywords)
    const firstLine = lines[0];
    const containsTitleKeyword = /(developer|engineer|manager|lead|analyst|designer|writer|specialist|consultant|architect|intern|director|representative)/i.test(firstLine);
    if (firstLine.length < 80 && containsTitleKeyword) {
      jobTitle = firstLine.replace(/^(job title|position|role|about the role|title)\s*:\s*/i, '');
    }
  }

  return {
    salaryRange,
    location,
    detectedSkills: detectedSkills.slice(0, 8), // Limit to top 8 skills
    jobTitle
  };
}

/**
 * Validates whether a given salary string is in an acceptable format.
 * Acceptable formats include:
 * - 80000, 80000-100000, $80,000-$100,000, $80k-$100k, 80k-100k, 80,000 - 100,000
 * - Hourly rates, e.g., $80/hr, £80/hr, €40-€60/hr
 * - Annual, monthly rates, etc.
 * 
 * Rejects values that have no numeric component, or contain invalid character groups.
 */
export function isValidSalaryRange(value: string): boolean {
  if (!value) return true; // Optional field
  const trimmed = value.trim();
  if (trimmed === "") return true;

  // Must contain at least one digit
  if (!/\d/.test(trimmed)) {
    return false;
  }

  // Permitted characters: digits, spaces, currency symbols ($, £, €, ¥, kr),
  // separators (, . - + / \ ()), and specific abbreviation letters (k, K, m, M, t, o, h, r, y, e, a, p, n, u, l, d, w, s, S)
  const allowedPattern = /^[0-9\s$,.£€¥\-+/\\()tokKmMhryeaunlpdwsS]+$/;
  if (!allowedPattern.test(trimmed)) {
    return false;
  }

  // Check all contiguous letter blocks to prevent invalid letters or K sequences (e.g. 100KK, 100KA, 100Kabc, K100)
  const letterRunRegex = /[a-zA-Z]+/g;
  let match;
  while ((match = letterRunRegex.exec(trimmed)) !== null) {
    const word = match[0];
    const index = match.index;
    const lowerWord = word.toLowerCase();

    // Must be one of the allowed words/abbreviations in salary ranges
    if (!['k', 'hr', 'annually', 'month', 'to'].includes(lowerWord)) {
      return false;
    }

    // If 'k' or 'K' is used, it must be preceded by a digit
    if (lowerWord === 'k') {
      const before = trimmed.substring(0, index);
      if (!/\d\s*[$,.£€¥\-+/\\()]*\s*$/.test(before)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Formats a salary range to always display with the CAD prefix.
 * Example:
 * - "200K" -> "CAD 200K"
 * - "85,000" -> "CAD 85,000"
 */
export function formatSalaryWithCurrency(salaryRange: string | undefined, _currencyCode?: string): string {
  if (!salaryRange) return 'Unspecified';
  const trimmed = salaryRange.trim();
  if (trimmed === '') return 'Unspecified';

  // If it already starts with 'CAD ' or 'CAD' (case-insensitive), return as-is
  if (/^CAD\b/i.test(trimmed)) {
    return trimmed.replace(/^CAD/i, 'CAD');
  }

  // Remove any leading currency symbols like $, C$, etc. to clean up and prevent "CAD $80,000"
  const cleanSalary = trimmed.replace(/^(C\$|A\$|US\$|[\$£€¥₹])\s*/i, '');

  return `CAD ${cleanSalary}`;
}

