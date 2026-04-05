import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const GENERATED_DIR = 'src/services/generated';

function run(command) {
  try {
    return execSync(command, {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    }).trim();
  } catch (error) {
    return (error.stdout || '').toString().trim();
  }
}

function getChangedFiles() {
  const output = run(`git diff --name-only -- ${GENERATED_DIR}`);
  if (!output) return [];
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((file) => file.endsWith('.ts') && !file.includes('/model/'));
}

function extractApiNames(filePath) {
  try {
    const absPath = path.resolve(process.cwd(), filePath);
    const content = readFileSync(absPath, 'utf8');
    const matches = content.matchAll(/^export const ([A-Za-z0-9_]+)\s*=/gm);
    const names = [];
    for (const match of matches) {
      const name = match[1];
      if (name.startsWith('use')) continue;
      names.push(name);
    }
    return names;
  } catch {
    return [];
  }
}

const changedFiles = getChangedFiles();

if (changedFiles.length === 0) {
  console.log('\n[api-change-report] 本次生成后无接口代码变更。\n');
  process.exit(0);
}

console.log('\n[api-change-report] 本次变更的 API 文件：');
for (const file of changedFiles) {
  console.log(`- ${file}`);
}

console.log('\n[api-change-report] 可能受影响的接口方法：');
for (const file of changedFiles) {
  const names = extractApiNames(file);
  if (names.length === 0) {
    console.log(`- ${file}: (未识别到接口导出函数)`);
    continue;
  }
  console.log(`- ${file}: ${names.join(', ')}`);
}
console.log();
