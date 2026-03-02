import path from 'path';
import { cleanDir, ensureDir, writeFile, replacePlaceholders } from '../utils.js';

/**
 * Antigravity Transformer
 * 
 * Creates a folder structure compatible with Antigravity skills.
 * Structure: dist/antigravity/@impeccable/SKILL.md
 *
 * @param {Array} commands - List of commands
 * @param {Array} skills - List of skills
 * @param {string} distDir - Output directory
 * @param {Object} patterns - Patterns data (not used in current skill format)
 * @param {Object} options - Optional settings
 */
export function transformAntigravity(commands, skills, distDir, patterns = null, options = {}) {
    const { prefix = '', outputSuffix = '' } = options;
    const antigravityDir = path.join(distDir, `antigravity${outputSuffix}`);
    const skillDir = path.join(antigravityDir, '@impeccable');
    const extensionDir = path.join(antigravityDir, 'vscode-extension');
    const srcDir = path.join(extensionDir, 'src');

    cleanDir(antigravityDir);
    ensureDir(skillDir);
    ensureDir(srcDir);

    // 1. Create the @impeccable/SKILL.md
    for (const skill of skills) {
        // Antigravity skills use SKILL.md for the main instruction
        const skillBody = replacePlaceholders(skill.body, 'antigravity');

        // Antigravity also supports commands as part of the skill if we want, 
        // but for now let's just create the main skill file.
        let content = `# ${skill.name}\n\n${skill.description}\n\n${skillBody}\n\n## Available Commands\n\n`;

        for (const command of commands) {
            const commandName = `${prefix}${command.name}`;
            content += `### /${commandName}\n\n${command.description}\n\n${replacePlaceholders(command.body, 'antigravity')}\n\n`;
        }

        const outputPath = path.join(skillDir, 'SKILL.md');
        writeFile(outputPath, content);

        // Copy reference files if they exist
        if (skill.references && skill.references.length > 0) {
            const refDir = path.join(skillDir, 'reference');
            ensureDir(refDir);
            for (const ref of skill.references) {
                const refOutputPath = path.join(refDir, `${ref.name}.md`);
                const refContent = replacePlaceholders(ref.content, 'antigravity');
                writeFile(refOutputPath, refContent);
            }
        }
    }

    // 2. Create VS Code Extension for Antigravity IDE
    const commandItems = commands.map(c => ({
        label: `/${prefix}${c.name}`,
        description: c.description,
        detail: "Click to use this command"
    }));

    const pkg = {
        name: "impeccable-antigravity",
        displayName: "Impeccable for Antigravity",
        description: "Frontend design commands for the Antigravity agent",
        version: "1.0.0",
        publisher: "impeccable",
        engines: {
            vscode: "^1.80.0"
        },
        main: "./dist/extension.js",
        contributes: {
            commands: [{
                command: "impeccable.antigravity.showCommands",
                title: "Impeccable: Show Antigravity Commands",
                category: "Impeccable"
            }]
        }
    };

    writeFile(path.join(extensionDir, 'package.json'), JSON.stringify(pkg, null, 2));

    let extensionTs = `import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // 1. Status Bar Item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'impeccable.antigravity.showCommands';
    statusBarItem.text = '$(rocket) Antigravity';
    statusBarItem.tooltip = 'Show Impeccable Design Commands for Antigravity';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // 2. Quick Pick Command
    const disposable = vscode.commands.registerCommand('impeccable.antigravity.showCommands', async () => {
        const items = ${JSON.stringify(commandItems, null, 12)};
        
        const selection = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select an Impeccable command for Antigravity'
        });

        if (selection) {
            // In Antigravity IDE, we just want to type the command into the chat
            vscode.commands.executeCommand('workbench.action.chat.open');
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
`;

    writeFile(path.join(srcDir, 'extension.ts'), extensionTs);

    const prefixInfo = prefix ? ` [${prefix}prefixed]` : '';
    console.log(`✓ Antigravity${prefixInfo}: Skill bundled + VS Code Extension created (${commands.length} commands)`);
}
