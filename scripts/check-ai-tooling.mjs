import { existsSync, readFileSync, readlinkSync, readdirSync, lstatSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';

const requiredFiles = [
  '.ruler/AGENTS.md',
  '.ruler/ruler.toml',
  '.claude/agents/implementer.md',
  '.claude/agents/reviewer.md',
  '.claude/agents/researcher.md',
  '.claude/agents/verifier.md',
  '.claude/settings.json',
  '.claude/hooks/lint-typecheck.sh',
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

if (!existsSync('skills-lock.json')) {
  throw new Error('Missing skills-lock.json — run `bunx skills add` to install skills');
}

// === NEW: Dynamic skills reading from .agents/skills/ ===
const agentsSkillsDir = '.agents/skills';
const dynamicSkills = new Set();

const agentSkillEntries = readdirSync(agentsSkillsDir);
for (const skillName of agentSkillEntries) {
  const skillPath = join(agentsSkillsDir, skillName);
  const skillStat = lstatSync(skillPath);

  if (skillStat.isDirectory()) {
    const skillMdPath = join(skillPath, 'SKILL.md');
    if (!existsSync(skillMdPath)) {
      throw new Error(`Skill directory missing SKILL.md: ${skillMdPath}`);
    }
    dynamicSkills.add(skillName);
  }
}

// === NEW: Symlink integrity check ===
const claudeSkillsDir = '.claude/skills';
const claudeSkillEntries = readdirSync(claudeSkillsDir);

for (const linkName of claudeSkillEntries) {
  const linkPath = join(claudeSkillsDir, linkName);
  const linkStat = lstatSync(linkPath);

  if (!linkStat.isSymbolicLink()) {
    throw new Error(`Entry in .claude/skills/ is not a symlink: ${linkPath}`);
  }

  const linkTarget = readlinkSync(linkPath);
  const resolvedTarget = resolve(join(claudeSkillsDir, linkName, '..'), linkTarget);
  const expectedTarget = resolve(join('.agents/skills', linkName));

  if (resolvedTarget !== expectedTarget) {
    throw new Error(
      `Symlink ${linkPath} points to incorrect target. Expected: ../../.agents/skills/${linkName}`,
    );
  }
}

// === NEW: Cross-reference skills count ===
const agentsSkillCount = dynamicSkills.size;
const claudeSkillCount = claudeSkillEntries.length;

if (agentsSkillCount !== claudeSkillCount) {
  throw new Error(
    `Skills count mismatch: .agents/skills/ has ${agentsSkillCount} skills but .claude/skills/ has ${claudeSkillCount} symlinks`,
  );
}

// === NEW: Hook script executable check ===
const hookPath = '.claude/hooks/lint-typecheck.sh';
const hookStat = lstatSync(hookPath);
const isExecutable = (hookStat.mode & parseInt('0111', 8)) !== 0;

if (!isExecutable) {
  throw new Error(`Hook script is not executable: ${hookPath}`);
}

// === NEW: MCP consistency validation ===
const mcpJsonPath = '.mcp.json';
const mcpJsonContent = readFileSync(mcpJsonPath, 'utf8');
let mcpServers;

try {
  mcpServers = JSON.parse(mcpJsonContent).mcpServers;
} catch {
  throw new Error(`.mcp.json is not valid JSON`);
}

const mcpServerNames = new Set(Object.keys(mcpServers));

// Extract server names from ruler.toml using string matching
const rulerMcpServerMatches = rulerConfig.match(/\[mcp_servers\.(\w+)\]/g) || [];
const rulerMcpServers = new Set(
  rulerMcpServerMatches.map((match) => match.replace(/^\[mcp_servers\./, '').replace(/\]$/, '')),
);

// Verify every MCP server in ruler.toml exists in .mcp.json
for (const serverName of rulerMcpServers) {
  if (!mcpServerNames.has(serverName)) {
    throw new Error(`MCP server '${serverName}' found in ruler.toml but not in .mcp.json`);
  }
}

process.stdout.write('AI tooling configuration looks consistent.\n');
