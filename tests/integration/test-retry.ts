import { RadosGWAdminClient, RGWError } from '../../src/index.js';
import { config } from 'dotenv';

config();

async function run() {
  console.log('=== Integration Test: Retry Logic ===\n');

  // 1. Verify retry config is accepted and normal requests succeed without retries
  console.log('1. Normal request with retry config (maxRetries=2, debug=true)...');
  const debugLogs: string[] = [];
  const origDebug = console.debug;
  console.debug = (...args: unknown[]) => {
    debugLogs.push(args.map(String).join(' '));
  };

  const client = new RadosGWAdminClient({
    host: process.env.RGW_HOST!,
    port: Number(process.env.RGW_PORT),
    accessKey: process.env.RGW_ACCESS_KEY!,
    secretKey: process.env.RGW_SECRET_KEY!,
    region: process.env.RGW_REGION,
    maxRetries: 2,
    retryDelay: 100,
    debug: true,
  });

  const users = await client.users.list();
  console.debug = origDebug;

  console.log(`   Listed ${users.length} users successfully.`);

  // Verify debug logs contain request/response but NO retry messages
  const hasRequest = debugLogs.some((l) => l.includes('request'));
  const hasResponse = debugLogs.some((l) => l.includes('response'));
  const hasRetry = debugLogs.some((l) => l.includes('retry'));

  console.log(`   Debug logged request: ${hasRequest}`);
  console.log(`   Debug logged response: ${hasResponse}`);
  console.log(`   Debug logged retry: ${hasRetry} (expected: false)`);

  if (!hasRequest || !hasResponse) {
    throw new Error('Debug logging missing request/response entries');
  }
  if (hasRetry) {
    throw new Error('Unexpected retry on healthy server');
  }

  // 2. Retry against unreachable endpoint — should retry and then fail
  console.log('\n2. Retry against unreachable endpoint (maxRetries=2, retryDelay=50ms)...');
  const unreachableClient = new RadosGWAdminClient({
    host: 'http://127.0.0.1',
    port: 19999, // unlikely to be in use
    accessKey: 'fake',
    secretKey: 'fake',
    maxRetries: 2,
    retryDelay: 50,
  });

  const start = Date.now();
  try {
    await unreachableClient.users.list();
    throw new Error('Expected request to fail against unreachable endpoint');
  } catch (err) {
    const elapsed = Date.now() - start;
    if (err instanceof RGWError) {
      console.log(`   Failed as expected: ${err.message}`);
      console.log(`   Elapsed: ${elapsed}ms (retries should add ~150ms delay)`);

      // With 2 retries and 50ms base delay (50 + 100 = 150ms minimum delay),
      // total elapsed should be more than a single attempt
      if (elapsed < 100) {
        console.log('   WARNING: Elapsed time suspiciously low — retries may not have fired');
      } else {
        console.log('   Timing consistent with retry backoff.');
      }
    } else {
      throw err;
    }
  }

  // 3. No retries when maxRetries=0 against unreachable endpoint
  console.log('\n3. No retries (maxRetries=0) against unreachable endpoint...');
  const noRetryClient = new RadosGWAdminClient({
    host: 'http://127.0.0.1',
    port: 19999,
    accessKey: 'fake',
    secretKey: 'fake',
    maxRetries: 0,
    retryDelay: 50,
  });

  const startNoRetry = Date.now();
  try {
    await noRetryClient.users.list();
    throw new Error('Expected request to fail');
  } catch (err) {
    const elapsedNoRetry = Date.now() - startNoRetry;
    if (err instanceof RGWError) {
      console.log(`   Failed as expected: ${err.message}`);
      console.log(`   Elapsed: ${elapsedNoRetry}ms (should be fast, no retries)`);
    } else {
      throw err;
    }
  }

  // 4. Insecure TLS mode with retry
  console.log('\n4. Insecure TLS mode with retry config...');
  const insecureDebugLogs: string[] = [];
  console.debug = (...args: unknown[]) => {
    insecureDebugLogs.push(args.map(String).join(' '));
  };

  const insecureClient = new RadosGWAdminClient({
    host: process.env.RGW_HOST!,
    port: Number(process.env.RGW_PORT),
    accessKey: process.env.RGW_ACCESS_KEY!,
    secretKey: process.env.RGW_SECRET_KEY!,
    region: process.env.RGW_REGION,
    insecure: true,
    debug: true,
    maxRetries: 1,
  });

  const insecureUsers = await insecureClient.users.list();
  console.debug = origDebug;

  console.log(`   Listed ${insecureUsers.length} users with insecure+retry config.`);
  const hasTlsWarning = insecureDebugLogs.some((l) => l.includes('TLS'));
  console.log(`   TLS warning logged: ${hasTlsWarning}`);

  console.log('\n=== All retry tests passed! ===');
}

run().catch((err) => {
  console.error('\nTest failed:', err);
  process.exit(1);
});
