import { isValidSalaryRange, formatSalaryWithCurrency } from './src/utils/parser';

console.log('--------------------------------------------------');
console.log('RUNNING TEST PHASE 1: Salary Range Format Validation');
console.log('--------------------------------------------------');

const validationTestCases = [
  // Valid formats
  { input: '80000', expected: true },
  { input: '80000-100000', expected: true },
  { input: '$80,000-$100,000', expected: true },
  { input: '$80k-$100k', expected: true },
  { input: '80k-100k', expected: true },
  { input: '80,000 - 100,000', expected: true },
  { input: '$50-$70/hr', expected: true },
  { input: '£80/hr', expected: true },
  { input: '€40-€60/hr', expected: true },
  { input: '120k annually', expected: true },
  { input: '10k/month', expected: true },
  { input: '80k to 120k', expected: true },
  { input: '', expected: true }, // empty is allowed (optional)
  { input: '   ', expected: true }, // whitespace is allowed (optional)

  // Invalid formats
  { input: 'abcdef', expected: false },
  { input: 'salary', expected: false },
  { input: 'high', expected: false },
  { input: '$$$$', expected: false },
  { input: 'abc123xyz', expected: false },
  { input: 'negotiable', expected: false },
];

let failed = false;

for (const { input, expected } of validationTestCases) {
  const result = isValidSalaryRange(input);
  if (result === expected) {
    console.log(`✅ [PASS] "${input}" -> expected ${expected}, got ${result}`);
  } else {
    console.error(`❌ [FAIL] "${input}" -> expected ${expected}, got ${result}`);
    failed = true;
  }
}

console.log('\n--------------------------------------------------');
console.log('RUNNING TEST PHASE 2: Currency-Specific Formatting');
console.log('--------------------------------------------------');

const formattingTestCases = [
  // Clean numbers or text where CAD must be prepended
  { salary: '200K', expected: 'CAD 200K' },
  { salary: '120k - 150k', expected: 'CAD 120k - 150k' },
  { salary: '85000', expected: 'CAD 85000' },
  { salary: '60/hr', expected: 'CAD 60/hr' },
  { salary: '90000', expected: 'CAD 90000' },
  { salary: '50,000', expected: 'CAD 50,000' },
  { salary: '10M', expected: 'CAD 10M' },

  // Stored values that already contain a currency symbol (should clean symbol and prepend CAD)
  { salary: '$200K', expected: 'CAD 200K' },
  { salary: '£80/hr', expected: 'CAD 80/hr' },
  { salary: '€40-€60/hr', expected: 'CAD 40-€60/hr' },
  { salary: 'C$120k', expected: 'CAD 120k' },
  { salary: 'A$150k', expected: 'CAD 150k' },

  // Already prefixed with CAD (should remain untouched)
  { salary: 'CAD 120k', expected: 'CAD 120k' },
  { salary: 'cad 80,000', expected: 'CAD 80,000' },

  // Empty or undefined values
  { salary: '', expected: 'Unspecified' },
  { salary: undefined, expected: 'Unspecified' },
];

for (const { salary, expected } of formattingTestCases) {
  const result = formatSalaryWithCurrency(salary);
  if (result === expected) {
    console.log(`✅ [PASS] "${salary}" -> got "${result}"`);
  } else {
    console.error(`❌ [FAIL] "${salary}" -> expected "${expected}", got "${result}"`);
    failed = true;
  }
}

if (failed) {
  console.error('\nSome test suites failed!');
  process.exit(1);
} else {
  console.log('\nAll test suites passed successfully!');
  process.exit(0);
}
