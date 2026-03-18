/**
 * Integration Test Runner
 *
 * Runs all integration tests in sequence against a live RGW server.
 * Starts with a health check — if RGW is unreachable, skips all tests.
 *
 * Usage:
 *   npx tsx tests/integration/run-all.ts
 *   npm run test:integration
 */

import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const tests = [
  'test-healthcheck.ts',
  'test-info.ts',
  'test-users.ts',
  'test-keys.ts',
  'test-subusers.ts',
  'test-buckets.ts',
  'test-quota.ts',
  'test-ratelimit.ts',
  'test-usage.ts',
  'test-client.ts',
];

let passed = 0;
let failed = 0;
const failures: string[] = [];

console.log('╔══════════════════════════════════════════════════╗');
console.log('║       radosgw-admin Integration Tests           ║');
console.log('╚══════════════════════════════════════════════════╝\n');

for (const test of tests) {
  const testPath = resolve(__dirname, test);
  const label = test.replace('.ts', '').replace('test-', '');

  process.stdout.write(`Running ${label}... `);

  try {
    execFileSync('npx', ['tsx', testPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
      timeout: 120_000,
    });
    passed++;
    console.log('✅');
  } catch (err) {
    failed++;
    failures.push(label);
    console.log('❌');

    // Print stderr/stdout from the failed test
    if (err && typeof err === 'object' && 'stderr' in err) {
      const stderr = (err as { stderr: Buffer }).stderr.toString().trim();
      if (stderr) console.log(`   ${stderr.split('\n').join('\n   ')}`);
    }
    if (err && typeof err === 'object' && 'stdout' in err) {
      const stdout = (err as { stdout: Buffer }).stdout.toString().trim();
      if (stdout) {
        // Only show last 10 lines to keep output manageable
        const lines = stdout.split('\n');
        const tail = lines.slice(-10).join('\n   ');
        console.log(`   ${tail}`);
      }
    }

    // If health check fails, skip the rest
    if (test === 'test-healthcheck.ts') {
      console.log('\n⚠️  Health check failed — skipping remaining tests.');
      console.log('   Check RGW_HOST, RGW_ACCESS_KEY, RGW_SECRET_KEY in .env\n');
      break;
    }
  }
}

console.log('\n══════════════════════════════════════════════════');
console.log(`Results: ${passed} passed, ${failed} failed, ${tests.length} total`);
if (failures.length > 0) {
  console.log(`Failed: ${failures.join(', ')}`);
}
console.log('══════════════════════════════════════════════════');

process.exit(failed > 0 ? 1 : 0);
