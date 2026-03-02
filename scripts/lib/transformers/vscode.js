import path from 'path';
import { cleanDir, ensureDir, writeFile, replacePlaceholders } from '../utils.js';

/**
 * VS Code Transformer
 * 
 * Creates a VS Code extension for Copilot Chat.
 *
 * @param {Array} commands - List of commands
 * @param {Array} skills - List of skills
 * @param {string} distDir - Output directory
 * @param {Object} patterns - Patterns data
 * @param {Object} options - Optional settings
 */
export function transformVSCode(commands, skills, distDir, patterns = null, options = {}) {
    const { prefix = '', outputSuffix = '' } = options;
    const vscodeDir = path.join(distDir, `vscode${outputSuffix}`);
    const srcDir = path.join(vscodeDir, 'src');

    cleanDir(vscodeDir);
    ensureDir(srcDir);

    // 1. Create package.json
    const pkg = {
        name: "impeccable-vscode",
        displayName: "Impeccable Frontend Design",
        description: "Frontend design expertise for GitHub Copilot Chat",
        version: "1.0.0",
        publisher: "impeccable",
        engines: {
            vscode: "^1.80.0"
        },
        categories: ["AI", "Programming Languages"],
        activationEvents: [],
        main: "./dist/extension.js",
        contributes: {
            commands: [
                {
                    command: "impeccable.showCommands",
                    title: "Impeccable: Show Design Commands",
                    category: "Impeccable"
                }
            ],
            chatParticipants: [
                {
                    id: "impeccable",
                    name: "impeccable",
                    description: "Impeccable Frontend Design Expert",
                    isDefault: false,
                    commands: commands.map(c => ({
                        name: `${prefix}${c.name}`,
                        description: c.description
                    }))
                }
            ]
        }
    };

    writeFile(path.join(vscodeDir, 'package.json'), JSON.stringify(pkg, null, 2));

    // 2. Create extension.ts
    const commandItems = commands.map(c => ({
        label: `/${prefix}${c.name}`,
        description: c.description,
        detail: "Click to see details in chat"
    }));

    let extensionTs = `import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // 1. Register Chat Participant
    const handler: vscode.ChatRequestHandler = async (request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream, token: vscode.CancellationToken) => {
        if (request.command) {
            switch (request.command) {
`;

    for (const command of commands) {
        const commandName = `${prefix}${command.name}`;
        const body = replacePlaceholders(command.body, 'vscode').replace(/`/g, '\\`').replace(/\$/g, '\\$');
        extensionTs += `                case '${commandName}':
                    stream.markdown(\`${body}\`);
                    return;
`;
    }

    extensionTs += `            }
        }

        stream.markdown("I am your Impeccable Frontend Design Expert. Ask me to /audit, /polish, or /simplify your UI.");
    };

    const impeccable = vscode.chat.createChatParticipant('impeccable', handler);
    impeccable.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.png');

    // 2. Status Bar Item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'impeccable.showCommands';
    statusBarItem.text = '$(sparkle) Impeccable';
    statusBarItem.tooltip = 'Show Impeccable Design Commands';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // 3. Command Palette / Status Bar Command
    const disposable = vscode.commands.registerCommand('impeccable.showCommands', async () => {
        const items = ${JSON.stringify(commandItems, null, 12)};
        
        const selection = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select an Impeccable command to learn more'
        });

        if (selection) {
            vscode.commands.executeCommand('workbench.action.chat.open', {
                query: \`@impeccable \${selection.label}\`
            });
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
`;

    writeFile(path.join(srcDir, 'extension.ts'), extensionTs);

    const prefixInfo = prefix ? ` [${prefix}prefixed]` : '';
    console.log(`✓ VS Code${prefixInfo}: ${commands.length} commands registered in chat participant`);
}
