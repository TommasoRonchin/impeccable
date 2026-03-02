import path from 'path';
import { cleanDir, ensureDir, writeFile, replacePlaceholders } from '../utils.js';

/**
 * VS Code + GitHub Copilot Transformer
 *
 * Commands: GitHub Copilot prompt files → `.github/prompts/{name}.prompt.md`
 *   - YAML frontmatter with mode, description, tools
 *   - Body: The prompt text with {{arg}} preserved (Copilot uses the text as-is)
 *
 * Skills: GitHub Copilot instruction files → `.github/instructions/{name}.instructions.md`
 *   - YAML frontmatter with applyTo glob
 *   - Body: The skill instructions
 *
 * @param {Object} options - Optional settings
 * @param {string} options.prefix - Prefix to add to command names (e.g., 'i-')
 * @param {string} options.outputSuffix - Suffix for output directory (e.g., '-prefixed')
 */
export function transformVSCode(commands, skills, distDir, patterns = null, options = {}) {
  const { prefix = '', outputSuffix = '' } = options;
  const vscodeDir = path.join(distDir, `vscode${outputSuffix}`);
  const promptsDir = path.join(vscodeDir, '.github/prompts');
  const instructionsDir = path.join(vscodeDir, '.github/instructions');

  cleanDir(vscodeDir);
  ensureDir(promptsDir);
  ensureDir(instructionsDir);

  // Commands: GitHub Copilot prompt files
  for (const command of commands) {
    const commandName = `${prefix}${command.name}`;

    // Build argument hint for description if args are present
    let description = command.description;
    if (command.args && command.args.length > 0) {
      const argHints = command.args
        .map(arg => (arg.required ? `<${arg.name}>` : `[${arg.name}]`))
        .join(' ');
      description = `${description} ${argHints}`;
    }

    const frontmatterLines = [
      '---',
      `mode: 'agent'`,
      `description: '${description.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`,
      `tools: ['changes', 'codebase', 'editFiles', 'problems', 'runCommands', 'search', 'searchResults', 'terminalLastCommand']`,
      '---',
    ];

    const body = replacePlaceholders(command.body, 'vscode');
    const content = `${frontmatterLines.join('\n')}\n\n${body}`;
    const outputPath = path.join(promptsDir, `${commandName}.prompt.md`);
    writeFile(outputPath, content);
  }

  // Skills: GitHub Copilot instruction files
  let refCount = 0;
  for (const skill of skills) {
    const frontmatterLines = [
      '---',
      `applyTo: '**'`,
      '---',
    ];

    const skillBody = replacePlaceholders(skill.body, 'vscode');
    const content = `${frontmatterLines.join('\n')}\n\n${skillBody}`;
    const outputPath = path.join(instructionsDir, `${skill.name}.instructions.md`);
    writeFile(outputPath, content);

    // Copy reference files if they exist
    if (skill.references && skill.references.length > 0) {
      const refDir = path.join(instructionsDir, `${skill.name}-reference`);
      ensureDir(refDir);
      for (const ref of skill.references) {
        const refOutputPath = path.join(refDir, `${ref.name}.md`);
        const refContent = replacePlaceholders(ref.content, 'vscode');
        writeFile(refOutputPath, refContent);
        refCount++;
      }
    }
  }

  const refInfo = refCount > 0 ? ` (${refCount} reference files)` : '';
  const prefixInfo = prefix ? ` [${prefix}prefixed]` : '';
  console.log(`✓ VS Code${prefixInfo}: ${commands.length} prompts, ${skills.length} instructions${refInfo}`);
}
