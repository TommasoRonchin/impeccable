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
        activationEvents: ["*"],
        main: "./dist/extension.js",
        scripts: {
            "compile": "tsc -p ./",
            "watch": "tsc -watch -p ./",
            "package": "npm run compile && npx @vscode/vsce package --allow-star-activation --allow-missing-repository"
        },
        devDependencies: {
            "@types/vscode": "^1.80.0",
            "@vscode/vsce": "^3.0.0",
            "typescript": "^5.1.3"
        },
        contributes: {
            commands: [
                {
                    command: "impeccable.showCommands",
                    title: "Impeccable: Show Design Commands",
                    category: "Impeccable"
                }
            ]
        }
    };

    writeFile(path.join(vscodeDir, 'package.json'), JSON.stringify(pkg, null, 2));

    const tsconfig = {
        compilerOptions: {
            module: "NodeNext",
            target: "ES2022",
            outDir: "dist",
            lib: ["ES2022", "DOM", "DOM.Iterable"],
            sourceMap: true,
            rootDir: "src",
            strict: true,
            skipLibCheck: true
        },
        include: ["src"]
    };

    writeFile(path.join(vscodeDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

    const vscodeConfigDir = path.join(vscodeDir, '.vscode');
    ensureDir(vscodeConfigDir);

    const launchJson = {
        version: "0.2.0",
        configurations: [
            {
                name: "Run Extension",
                type: "extensionHost",
                request: "launch",
                args: [
                    "--extensionDevelopmentPath=${workspaceFolder}"
                ],
                outFiles: [
                    "${workspaceFolder}/dist/**/*.js"
                ],
                preLaunchTask: "${defaultBuildTask}"
            }
        ]
    };

    writeFile(path.join(vscodeConfigDir, 'launch.json'), JSON.stringify(launchJson, null, 2));

    const tasksJson = {
        version: "2.0.0",
        tasks: [
            {
                type: "npm",
                script: "watch",
                problemMatcher: "$tsc-watch",
                isBackground: true,
                presentation: {
                    reveal: "never"
                },
                group: {
                    kind: "build",
                    isDefault: true
                }
            }
        ]
    };

    writeFile(path.join(vscodeConfigDir, 'tasks.json'), JSON.stringify(tasksJson, null, 2));

    // 2. Create extension.ts
    const commandItems = commands.map(c => ({
        label: `/${prefix}${c.name}`,
        description: c.description,
        detail: "Click to see details in chat",
        body: c.body
    }));

    const skillContext = skills.map(s => s.body).join('\n\n--- SKILL CONTEXT ---\n\n');
    const escapedSkillContext = skillContext.replace(/`/g, '\\`').replace(/\$/g, '\\$');

    let extensionTs = `import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const baseContext = \`${escapedSkillContext}\`;

    // 1. Status Bar Item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'impeccable.showCommands';
    statusBarItem.text = '$(sparkle) Impeccable';
    statusBarItem.tooltip = 'Show Impeccable Design Commands';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // 2. Command Palette / Status Bar Command
    const disposable = vscode.commands.registerCommand('impeccable.showCommands', async () => {
        const items = ${JSON.stringify(commandItems, null, 12)};
        
        const selection = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select an Impeccable command to apply to your project'
        });

        if (selection) {
            // First open the chat panel, then send the system prompt + objective + #workspace
            await vscode.commands.executeCommand('workbench.action.chat.open', {
                query: \`#workspace \\n\\nContext Guidelines:\\n\${baseContext}\\n\\nYour Task:\\n\${selection.body}\`
            });

            // Attempt to auto-submit the chat
            setTimeout(() => {
                vscode.commands.executeCommand('workbench.action.chat.acceptInput');
            }, 500);
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
