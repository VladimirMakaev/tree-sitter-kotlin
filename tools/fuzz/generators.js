'use strict';

// Input generators targeting known scanner vulnerability classes.
// Each generator returns an array of { name, input } objects.

function longWhitespace() {
  const inputs = [];
  // Long runs of spaces
  inputs.push({ name: 'long-spaces', input: ' '.repeat(100000) + 'val x = 1' });
  // Long runs of tabs
  inputs.push({ name: 'long-tabs', input: '\t'.repeat(100000) + 'val x = 1' });
  // Mixed whitespace
  inputs.push({ name: 'mixed-whitespace', input: ' \t\v'.repeat(30000) + 'val x = 1' });
  // Whitespace between tokens
  inputs.push({ name: 'whitespace-between-tokens', input: 'val' + ' '.repeat(50000) + 'x' + ' '.repeat(50000) + '=' + ' '.repeat(50000) + '1' });
  // Many newlines
  inputs.push({ name: 'many-newlines', input: '\n'.repeat(100000) + 'val x = 1' });
  return inputs;
}

function nestedBlockComments() {
  const inputs = [];
  // Deeply nested block comments
  for (const depth of [10, 100, 1000, 5000]) {
    const open = '/* '.repeat(depth);
    const close = ' */'.repeat(depth);
    inputs.push({ name: `nested-comments-${depth}`, input: open + 'hello' + close });
  }
  // Nested with missing closers
  for (const depth of [10, 100, 1000]) {
    const open = '/* '.repeat(depth);
    const close = ' */'.repeat(Math.floor(depth / 2));
    inputs.push({ name: `nested-comments-unclosed-${depth}`, input: open + 'hello' + close });
  }
  // Alternating open/close patterns
  inputs.push({ name: 'alternating-comment-delimiters', input: '/*/ '.repeat(10000) });
  // Stars without slashes
  inputs.push({ name: 'stars-in-comment', input: '/* ' + '*'.repeat(100000) + ' */' });
  // Slashes without stars
  inputs.push({ name: 'slashes-in-comment', input: '/* ' + '/'.repeat(100000) + ' */' });
  return inputs;
}

function nulBytes() {
  const inputs = [];
  // NUL in identifier position
  inputs.push({ name: 'nul-in-identifier', input: 'val x\0y = 1' });
  // NUL in string
  inputs.push({ name: 'nul-in-string', input: '"hello\0world"' });
  // NUL in triple-quoted string
  inputs.push({ name: 'nul-in-triple-string', input: '"""hello\0world"""' });
  // NUL in comment
  inputs.push({ name: 'nul-in-comment', input: '/* hello\0world */' });
  // NUL at start
  inputs.push({ name: 'nul-at-start', input: '\0val x = 1' });
  // Many NUL bytes
  inputs.push({ name: 'many-nuls', input: '\0'.repeat(10000) });
  // NUL in interpolation
  inputs.push({ name: 'nul-in-interpolation', input: '"${x\0}"' });
  return inputs;
}

function unterminatedStrings() {
  const inputs = [];
  // Unterminated regular string
  inputs.push({ name: 'unterminated-string', input: '"hello' });
  // Unterminated triple-quoted string
  inputs.push({ name: 'unterminated-triple-string', input: '"""hello' });
  // Unterminated string with interpolation
  inputs.push({ name: 'unterminated-string-interpolation', input: '"hello ${world' });
  // Unterminated string with escape at end
  inputs.push({ name: 'unterminated-string-escape-end', input: '"hello\\' });
  // Multiple unterminated strings
  inputs.push({ name: 'multiple-unterminated', input: '"hello\n"world\n"foo' });
  // Unterminated with escaped dollar at end
  inputs.push({ name: 'unterminated-escaped-dollar', input: '"hello\\$' });
  // Unterminated triple string with quotes inside
  inputs.push({ name: 'unterminated-triple-quotes-inside', input: '"""hello "" " world' });
  // Long unterminated string
  inputs.push({ name: 'long-unterminated-string', input: '"' + 'a'.repeat(100000) });
  return inputs;
}

function deepStringInterpolation() {
  const inputs = [];
  // Nested interpolation
  for (const depth of [5, 10, 50, 100]) {
    let s = '"';
    for (let i = 0; i < depth; i++) {
      s += '${';
      if (i < depth - 1) s += '"';
    }
    s += 'x';
    for (let i = 0; i < depth; i++) {
      if (i > 0) s += '"';
      s += '}';
    }
    s += '"';
    inputs.push({ name: `nested-interpolation-${depth}`, input: s });
  }
  // Interpolation with complex expressions
  inputs.push({ name: 'interpolation-complex', input: '"${if (true) "${if (false) "${x}" else "${y}"}" else "${z}"}"' });
  // Many sequential interpolations
  inputs.push({ name: 'many-interpolations', input: '"' + '${x}'.repeat(10000) + '"' });
  // Dollar signs without interpolation
  inputs.push({ name: 'many-dollars', input: '"' + '$'.repeat(10000) + '"' });
  // Interpolation with identifiers
  inputs.push({ name: 'many-ident-interpolations', input: '"' + '$x'.repeat(10000) + '"' });
  return inputs;
}

function importEdgeCases() {
  const inputs = [];
  // Very long import chain
  inputs.push({ name: 'long-import-chain', input: 'import ' + 'a.'.repeat(10000) + 'b' });
  // Import with dots followed by newlines
  inputs.push({ name: 'import-dot-newline', input: 'import a.\nimport b.\nimport c.d' });
  // Trailing dot import
  inputs.push({ name: 'import-trailing-dot', input: 'import a.b.' });
  // Many imports in sequence
  const imports = Array.from({ length: 1000 }, (_, i) => `import a.b.c${i}`).join('\n');
  inputs.push({ name: 'many-imports', input: imports });
  // Import with blank line separation
  inputs.push({ name: 'import-blank-lines', input: 'import a.b\n\nimport c.d\n\nimport e.f' });
  // Import with wildcard
  inputs.push({ name: 'import-wildcard', input: 'import a.b.*\nimport c.d.*' });
  return inputs;
}

function longIdentifiers() {
  const inputs = [];
  // Very long identifier
  inputs.push({ name: 'long-identifier', input: 'val ' + 'a'.repeat(100000) + ' = 1' });
  // Long identifier matching modifier prefix
  inputs.push({ name: 'long-public-prefix', input: 'class Foo ' + 'public'.repeat(1000) + ' {}' });
  // Many short identifiers
  const idents = Array.from({ length: 10000 }, (_, i) => `val x${i} = ${i}`).join('\n');
  inputs.push({ name: 'many-identifiers', input: idents });
  // Identifiers that look like modifiers
  for (const mod of ['public', 'private', 'protected', 'internal']) {
    inputs.push({ name: `modifier-not-constructor-${mod}`, input: `class Foo\n${mod} val x = 1` });
    inputs.push({ name: `modifier-then-constructor-${mod}`, input: `class Foo\n${mod} constructor(val x: Int)` });
  }
  return inputs;
}

function mixedNewlines() {
  const inputs = [];
  // CR only
  inputs.push({ name: 'cr-newlines', input: 'val x = 1\rval y = 2\rval z = 3' });
  // LF only
  inputs.push({ name: 'lf-newlines', input: 'val x = 1\nval y = 2\nval z = 3' });
  // CRLF
  inputs.push({ name: 'crlf-newlines', input: 'val x = 1\r\nval y = 2\r\nval z = 3' });
  // Mixed
  inputs.push({ name: 'mixed-newlines', input: 'val x = 1\nval y = 2\rval z = 3\r\nval w = 4' });
  // CR in strings
  inputs.push({ name: 'cr-in-string', input: '"hello\rworld"' });
  // Many CRs without LFs
  inputs.push({ name: 'many-crs', input: '\r'.repeat(100000) + 'val x = 1' });
  // Alternating CR LF (not CRLF pairs)
  inputs.push({ name: 'alternating-cr-lf', input: ('val x = 1\r\n').repeat(10000) });
  return inputs;
}

function asiEdgeCases() {
  const inputs = [];
  // Operators after newlines
  for (const op of ['+', '-', '!', '/', '*', '%', '>', '<', '=', '?', '|', '&']) {
    inputs.push({ name: `asi-${op}-after-newline`, input: `val x = 1\n${op} val y = 2` });
    inputs.push({ name: `asi-${op}-in-parens`, input: `val x = (1\n${op} 2)` });
  }
  // else after newline
  inputs.push({ name: 'asi-else', input: 'if (true) 1\nelse 2' });
  // as after newline
  inputs.push({ name: 'asi-as', input: 'val x = foo\nas Int' });
  // where after newline
  inputs.push({ name: 'asi-where', input: 'fun <T> foo()\nwhere T : Any {}' });
  // Semicolons mixed with newlines
  inputs.push({ name: 'asi-semicolons', input: 'val x = 1;\nval y = 2;\nval z = 3;' });
  // Many statements needing ASI
  const stmts = Array.from({ length: 5000 }, (_, i) => `val x${i} = ${i}`).join('\n');
  inputs.push({ name: 'many-asi-statements', input: stmts });
  // != vs ! after newline
  inputs.push({ name: 'asi-not-equals', input: 'val x = a\n!= b' });
  inputs.push({ name: 'asi-not', input: 'val x = a\n!b' });
  // // and /* after newline (should ASI)
  inputs.push({ name: 'asi-line-comment', input: 'val x = 1\n// comment\nval y = 2' });
  inputs.push({ name: 'asi-block-comment', input: 'val x = 1\n/* comment */\nval y = 2' });
  return inputs;
}

function rapidContextSwitching() {
  const inputs = [];
  // Alternating strings and comments
  inputs.push({ name: 'string-comment-alternating', input: ('"hello" /* comment */ ').repeat(5000) });
  // Strings with interpolations containing comments
  inputs.push({ name: 'interpolation-with-comments', input: '"${/* comment */ x}"'.repeat(1000) });
  // Nested contexts
  inputs.push({ name: 'nested-contexts', input: '"${listOf("${mapOf("a" to /* comment */ "b")}")}"' });
  // String immediately after comment
  inputs.push({ name: 'comment-then-string', input: ('/**/"hello"').repeat(5000) });
  // Triple string with embedded regular strings in interpolations
  inputs.push({
    name: 'triple-with-regular-interpolation',
    input: '"""${listOf("a", "b", "c")}${mapOf("d" to "e")}"""'
  });
  // Many small strings
  inputs.push({ name: 'many-small-strings', input: ('"x" + ').repeat(10000) + '"y"' });
  return inputs;
}

function randomMutations() {
  const inputs = [];
  // Random bytes
  const randomBytes = Buffer.alloc(10000);
  for (let i = 0; i < randomBytes.length; i++) {
    randomBytes[i] = Math.floor(Math.random() * 256);
  }
  inputs.push({ name: 'random-bytes', input: randomBytes.toString('utf8') });

  // Valid Kotlin with random byte insertions
  const base = 'fun main() {\n  val x = "hello"\n  println(x)\n}';
  for (let trial = 0; trial < 10; trial++) {
    let mutated = base;
    const pos = Math.floor(Math.random() * mutated.length);
    const byte = Math.floor(Math.random() * 256);
    mutated = mutated.slice(0, pos) + String.fromCharCode(byte) + mutated.slice(pos);
    inputs.push({ name: `random-insertion-${trial}`, input: mutated });
  }

  // Repeated special characters
  for (const ch of ['"', "'", '`', '$', '\\', '/', '*', '{', '}', '(', ')']) {
    inputs.push({ name: `repeated-${ch.charCodeAt(0)}`, input: ch.repeat(10000) });
  }
  return inputs;
}

module.exports = {
  longWhitespace,
  nestedBlockComments,
  nulBytes,
  unterminatedStrings,
  deepStringInterpolation,
  importEdgeCases,
  longIdentifiers,
  mixedNewlines,
  asiEdgeCases,
  rapidContextSwitching,
  randomMutations,
};
