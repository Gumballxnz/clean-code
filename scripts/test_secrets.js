const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  scanAndSanitizeSecretsInContent,
  formatEnvExpression,
  updateEnvFiles,
  ensureGitIgnoreHasEnv
} = require('./secret_scanner');

console.log('--- TEST: Secret Scanner & Sanitizer ---');

{
  const input = `
const supabaseUrl = "https://abcdefghijklmnopqr12.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5eiJ9.abcdefghijklmnopqrstuvwxyz1234567890";
const client = createClient(supabaseUrl, supabaseKey);
`;
  const registry = new Map();
  const res = scanAndSanitizeSecretsInContent(input, 'supabase.js', process.cwd(), registry, { hasVite: false, hasNext: false });

  assert.strictEqual(res.hasChanges, true);
  assert.ok(res.modifiedContent.includes('process.env.SUPABASE_URL'));
  assert.ok(res.modifiedContent.includes('process.env.SUPABASE_ANON_KEY'));
  assert.ok(!res.modifiedContent.includes('https://abcdefghijklmnopqr12.supabase.co'));
  assert.ok(!res.modifiedContent.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'));
  console.log('✓ Supabase URL & Anon Key sanitization passed');
}

{
  const openaiMock = ['sk-proj', '1234567890abcdef1234567890abcdef12345678'].join('-');
  const stripeMock = ['sk', 'live', '1234567890abcdef1234567890'].join('_');
  const input = `
const openaiKey = '${openaiMock}';
const stripeKey = '${stripeMock}';
`;
  const registry = new Map();
  const res = scanAndSanitizeSecretsInContent(input, 'services.ts', process.cwd(), registry, { hasVite: false, hasNext: false });

  assert.strictEqual(res.hasChanges, true);
  assert.ok(res.modifiedContent.includes('process.env.OPENAI_API_KEY'));
  assert.ok(res.modifiedContent.includes('process.env.STRIPE_SECRET_KEY'));
  console.log('✓ OpenAI & Stripe sanitization passed');
}

{
  const input = `const key = "AIzaSyD-1234567890abcdef1234567890abc";`;
  const registry = new Map();
  const res = scanAndSanitizeSecretsInContent(input, 'App.jsx', process.cwd(), registry, { hasVite: true, hasNext: false });

  assert.strictEqual(res.hasChanges, true);
  assert.ok(res.modifiedContent.includes('import.meta.env.VITE_FIREBASE_API_KEY'));
  console.log('✓ Vite import.meta.env prefixing passed');
}

{
  const input = `"use client";
const key = "AIzaSyD-1234567890abcdef1234567890abc";`;
  const registry = new Map();
  const res = scanAndSanitizeSecretsInContent(input, 'page.tsx', process.cwd(), registry, { hasVite: false, hasNext: true });

  assert.strictEqual(res.hasChanges, true);
  assert.ok(res.modifiedContent.includes('process.env.NEXT_PUBLIC_FIREBASE_API_KEY'));
  console.log('✓ Next.js client component NEXT_PUBLIC prefixing passed');
}

{
  const anthropicMock = ['sk', 'ant', 'api03', '1234567890abcdef1234567890abcdef'].join('-');
  const input = `api_key = "${anthropicMock}"`;
  const registry = new Map();
  const res = scanAndSanitizeSecretsInContent(input, 'main.py', process.cwd(), registry, { hasVite: false, hasNext: false });

  assert.strictEqual(res.hasChanges, true);
  assert.ok(res.modifiedContent.includes('os.getenv("ANTHROPIC_API_KEY")'));
  console.log('✓ Python os.getenv format passed');
}

{
  const input = `const key = "your_api_key_here"; const token = "placeholder";`;
  const registry = new Map();
  const res = scanAndSanitizeSecretsInContent(input, 'config.js', process.cwd(), registry, { hasVite: false, hasNext: false });

  assert.strictEqual(res.hasChanges, false);
  assert.strictEqual(res.modifiedContent, input);
  console.log('✓ False positives correctly ignored');
}

{
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clean-code-secrets-test-'));

  const gitIgnored = ensureGitIgnoreHasEnv(tempDir, false);
  assert.strictEqual(gitIgnored, true);
  const gitIgnoreContent = fs.readFileSync(path.join(tempDir, '.gitignore'), 'utf8');
  assert.ok(gitIgnoreContent.includes('.env'));

  const mockSecrets = [
    { varName: 'SUPABASE_URL', secret: 'https://test.supabase.co', placeholder: 'https://your-project.supabase.co' },
    { varName: 'SUPABASE_ANON_KEY', secret: 'eyJtestKey', placeholder: 'your_anon_key' }
  ];

  const updateResult = updateEnvFiles(tempDir, mockSecrets, false);
  assert.strictEqual(updateResult.addedToEnv, 2);
  assert.strictEqual(updateResult.addedToExample, 2);

  const envContent = fs.readFileSync(path.join(tempDir, '.env'), 'utf8');
  const envExampleContent = fs.readFileSync(path.join(tempDir, '.env.example'), 'utf8');

  assert.ok(envContent.includes('SUPABASE_URL="https://test.supabase.co"'));
  assert.ok(envExampleContent.includes('SUPABASE_URL="https://your-project.supabase.co"'));
  assert.ok(!envExampleContent.includes('https://test.supabase.co'));

  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log('✓ .gitignore safety and .env / .env.example synchronization passed');
}

{
  const openaiMock = ['sk-proj', '1234567890abcdef1234567890abcdef12345678'].join('-');
  const mdInput = `# Project Setup
To connect to the database:
Use the Supabase URL: https://abcdefghijklmnopqr12.supabase.co
And Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5eiJ9.abcdefghijklmnopqrstuvwxyz1234567890

OpenAI Token:
${openaiMock}
`;
  const registry = new Map();
  const res = scanAndSanitizeSecretsInContent(mdInput, 'README.md', process.cwd(), registry, { hasVite: false, hasNext: false });

  assert.strictEqual(res.hasChanges, true);
  assert.ok(res.modifiedContent.includes('# Project Setup'));
  assert.ok(res.modifiedContent.includes('process.env.SUPABASE_URL'));
  assert.ok(res.modifiedContent.includes('process.env.SUPABASE_ANON_KEY'));
  assert.ok(res.modifiedContent.includes('process.env.OPENAI_API_KEY'));
  assert.ok(!res.modifiedContent.includes('https://abcdefghijklmnopqr12.supabase.co'));
  console.log('✓ Markdown (.md) secret sanitization passed');
}

{
  const { scanDirectoryForSensitiveFiles, ensureGitIgnoreSafety } = require('./secret_scanner');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clean-code-ssh-test-'));

  const sshKeyPath = path.join(tempDir, 'id_rsa');
  fs.writeFileSync(sshKeyPath, '-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAA...\n-----END OPENSSH PRIVATE KEY-----', 'utf8');

  const pemKeyPath = path.join(tempDir, 'server.pem');
  fs.writeFileSync(pemKeyPath, '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----', 'utf8');

  const sensitive = scanDirectoryForSensitiveFiles(tempDir);
  assert.strictEqual(sensitive.length, 2);

  const gitIgnoreRes = ensureGitIgnoreSafety(tempDir, sensitive, false);
  assert.strictEqual(gitIgnoreRes.updated, true);

  const gitIgnoreContent = fs.readFileSync(path.join(tempDir, '.gitignore'), 'utf8');
  assert.ok(gitIgnoreContent.includes('id_rsa'));
  assert.ok(gitIgnoreContent.includes('*.pem'));

  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log('✓ SSH keys and sensitive file detection & .gitignore blindagem passed');
}

{
  const { syncAiRules } = require('../templates/MULTI_AI_RULES');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clean-code-agents-dir-test-'));

  const result = syncAiRules(tempDir, { allRules: false });
  assert.ok(fs.existsSync(path.join(tempDir, '.agents', 'GEMINI.md')));
  assert.ok(fs.existsSync(path.join(tempDir, '.agents', 'AGENTS.md')));
  assert.ok(!fs.existsSync(path.join(tempDir, 'GEMINI.md')));

  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log('✓ Rules placed inside .agents/ directory passed');
}

{
  const { syncAiRules } = require('../templates/MULTI_AI_RULES');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clean-code-migration-test-'));

  fs.writeFileSync(path.join(tempDir, 'GEMINI.md'), '# Existing Gemini Root\n', 'utf8');
  fs.writeFileSync(path.join(tempDir, 'AGENTS.md'), '# Existing Agents Root\n', 'utf8');

  assert.ok(fs.existsSync(path.join(tempDir, 'GEMINI.md')));
  assert.ok(fs.existsSync(path.join(tempDir, 'AGENTS.md')));

  const result = syncAiRules(tempDir, { allRules: false });

  assert.ok(fs.existsSync(path.join(tempDir, '.agents', 'GEMINI.md')));
  assert.ok(fs.existsSync(path.join(tempDir, '.agents', 'AGENTS.md')));

  assert.ok(!fs.existsSync(path.join(tempDir, 'GEMINI.md')), 'Root GEMINI.md deve ser removido');
  assert.ok(!fs.existsSync(path.join(tempDir, 'AGENTS.md')), 'Root AGENTS.md deve ser removido');

  const content = fs.readFileSync(path.join(tempDir, '.agents', 'GEMINI.md'), 'utf8');
  assert.ok(content.includes('Zero Hardcoded Secrets & Credentials'));

  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log('✓ Automatic migration of root files to .agents/ and secret directive passed');
}

console.log('\nAll Secret Scanner & Sanitizer tests passed!\n');
