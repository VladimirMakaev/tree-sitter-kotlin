'use strict';

const { fork } = require('child_process');
const path = require('path');
const fs = require('fs');
const generators = require('./generators');

// Configuration
const TIMEOUT_MS = parseInt(process.env.FUZZ_TIMEOUT_MS || '5000', 10);
const CRASHES_DIR = path.join(__dirname, 'crashes');

// Ensure crashes directory exists
if (!fs.existsSync(CRASHES_DIR)) {
  fs.mkdirSync(CRASHES_DIR, { recursive: true });
}

// When run as a child process, parse stdin and exit
if (process.env.FUZZ_CHILD === '1') {
  runChild();
} else {
  runMain();
}

function runChild() {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { input += chunk; });
  process.stdin.on('end', () => {
    try {
      const Parser = require('tree-sitter');
      const Kotlin = require(path.join(__dirname, '..', '..'));
      const parser = new Parser();
      parser.setLanguage(Kotlin);
      parser.parse(input);
      process.exit(0);
    } catch (err) {
      process.stderr.write(`Parse error: ${err.message}\n`);
      process.exit(2);
    }
  });
}

function parseWithTimeout(input, name) {
  return new Promise((resolve) => {
    const child = fork(__filename, [], {
      env: { ...process.env, FUZZ_CHILD: '1' },
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      silent: true,
    });

    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk; });

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({ status: 'timeout', name, stderr });
    }, TIMEOUT_MS);

    child.on('exit', (code, signal) => {
      clearTimeout(timer);
      if (signal === 'SIGSEGV' || signal === 'SIGBUS' || signal === 'SIGABRT') {
        resolve({ status: 'crash', signal, name, stderr });
      } else if (signal === 'SIGKILL') {
        // Already handled by timeout
        return;
      } else if (code !== 0 && code !== 2) {
        // code 2 means a JS-level parse error (expected for malformed input)
        resolve({ status: 'crash', code, name, stderr });
      } else {
        resolve({ status: 'ok', name });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ status: 'error', name, message: err.message });
    });

    child.stdin.write(input);
    child.stdin.end();
  });
}

function saveCrash(name, input, result) {
  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const crashFile = path.join(CRASHES_DIR, `${safeName}.kt`);
  fs.writeFileSync(crashFile, input, 'utf8');

  const metaFile = path.join(CRASHES_DIR, `${safeName}.meta.json`);
  fs.writeFileSync(metaFile, JSON.stringify({
    name,
    status: result.status,
    signal: result.signal || null,
    code: result.code || null,
    stderr: result.stderr || '',
    timestamp: new Date().toISOString(),
  }, null, 2), 'utf8');

  return crashFile;
}

async function runMain() {
  console.log('tree-sitter-kotlin targeted scanner fuzzer');
  console.log(`Timeout: ${TIMEOUT_MS}ms per input`);
  console.log(`Crash directory: ${CRASHES_DIR}`);
  console.log('');

  const allGenerators = [
    { name: 'Long whitespace', fn: generators.longWhitespace },
    { name: 'Nested block comments', fn: generators.nestedBlockComments },
    { name: 'NUL bytes', fn: generators.nulBytes },
    { name: 'Unterminated strings', fn: generators.unterminatedStrings },
    { name: 'Deep string interpolation', fn: generators.deepStringInterpolation },
    { name: 'Import edge cases', fn: generators.importEdgeCases },
    { name: 'Long identifiers', fn: generators.longIdentifiers },
    { name: 'Mixed newlines', fn: generators.mixedNewlines },
    { name: 'ASI edge cases', fn: generators.asiEdgeCases },
    { name: 'Rapid context switching', fn: generators.rapidContextSwitching },
    { name: 'Random mutations', fn: generators.randomMutations },
  ];

  let totalTests = 0;
  let crashes = 0;
  let timeouts = 0;
  let errors = 0;

  for (const gen of allGenerators) {
    const inputs = gen.fn();
    console.log(`[${gen.name}] Running ${inputs.length} inputs...`);

    for (const { name, input } of inputs) {
      totalTests++;
      const result = await parseWithTimeout(input, name);

      switch (result.status) {
        case 'ok':
          break;
        case 'timeout': {
          timeouts++;
          const file = saveCrash(name, input, result);
          console.log(`  TIMEOUT: ${name} -> ${file}`);
          break;
        }
        case 'crash': {
          crashes++;
          const file = saveCrash(name, input, result);
          const detail = result.signal ? `signal=${result.signal}` : `code=${result.code}`;
          console.log(`  CRASH: ${name} (${detail}) -> ${file}`);
          break;
        }
        case 'error': {
          errors++;
          console.log(`  ERROR: ${name}: ${result.message}`);
          break;
        }
      }
    }
  }

  console.log('');
  console.log('=== Summary ===');
  console.log(`Total inputs: ${totalTests}`);
  console.log(`Crashes: ${crashes}`);
  console.log(`Timeouts: ${timeouts}`);
  console.log(`Errors: ${errors}`);
  console.log(`OK: ${totalTests - crashes - timeouts - errors}`);

  if (crashes > 0 || timeouts > 0) {
    console.log(`\nCrash files saved to: ${CRASHES_DIR}`);
    process.exit(1);
  }
}
