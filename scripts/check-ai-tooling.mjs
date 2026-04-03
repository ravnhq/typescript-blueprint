import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';

const requiredFiles = [
  '.ruler/AGENTS.md',
  '.ruler/ruler.toml',
  '.claude/agents/implementer.md',
  '.claude/agents/reviewer.md',
  '.claude/agents/researcher.md',
  '.claude/agents/verifier.md',
  '.claude/settings.json',
];

for (const filePath of requiredFiles) {
  if (!existsSync(filePath)) {
    throw new Error(`Missing AI tooling artifact: ${filePath}`);
  }
}

const agentsInstructions = readFileSync('.ruler/AGENTS.md', 'utf8');
for (const agentName of ['implementer', 'researcher', 'reviewer', 'verifier']) {
  if (!agentsInstructions.includes(`AGENT: ${agentName}`)) {
    throw new Error(`.ruler/AGENTS.md is missing the ${agentName} agent definition`);
  }
}

const claudeSettings = readFileSync('.claude/settings.json', 'utf8');
if (!claudeSettings.includes('.claude/hooks/lint-typecheck.sh')) {
  throw new Error('Claude settings must keep the lint/typecheck hook configured');
}

const rulerConfig = readFileSync('.ruler/ruler.toml', 'utf8');
for (const serverName of ['mcp_servers.exa', 'mcp_servers.context7']) {
  if (!rulerConfig.includes(serverName)) {
    throw new Error(`Ruler configuration is missing ${serverName}`);
  }
}

const requiredSkills = [
  'ai-md',
  'interface-design',
  'ui-ux-pro-max',
  'promptify',
  'grill-me',
  'agent-pr-creator',
  'pr-comments-address',
  'rewrite-commit-history',
  'building-native-ui',
  'native-data-fetching',
  'expo-api-routes',
  'expo-dev-client',
  'expo-module',
  'expo-tailwind-setup',
  'expo-cicd-workflows',
  'expo-deployment',
  'upgrading-expo',
  'use-dom',
  'react-native-best-practices',
  'github',
  'github-actions',
  'upgrading-react-native',
  'react-native-brownfield-migration',
  'validate-skills',
];

for (const skillName of requiredSkills) {
  const skillPath = `.agents/skills/${skillName}/SKILL.md`;
  if (!existsSync(skillPath)) {
    throw new Error(`Missing bundled skill: ${skillPath}`);
  }
}

if (!existsSync('skills-lock.json')) {
  throw new Error('Missing skills-lock.json — run `bunx skills add` to install skills');
}

process.stdout.write('AI tooling configuration looks consistent.\n');
