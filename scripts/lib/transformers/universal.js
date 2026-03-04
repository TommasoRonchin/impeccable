import path from 'path';
import fs from 'fs';
import { cleanDir, ensureDir, writeFile, replacePlaceholders } from '../utils.js';

/**
 * Universal Transformer
 * 
 * Creates a single VS Code extension that works for both standard VS Code
 * and the Antigravity IDE by detecting the environment at runtime.
 *
 * @param {Array} commands - List of commands
 * @param {Array} skills - List of skills
 * @param {string} distDir - Output directory
 * @param {Object} patterns - Patterns data
 * @param {Object} options - Optional settings
 */
export function transformUniversal(commands, skills, distDir, patterns = null, options = {}) {
    const { prefix = '', outputSuffix = '' } = options;
    const universalDir = path.join(distDir, `universal${outputSuffix}`);
    const srcDir = path.join(universalDir, 'src');
    const skillsResDir = path.join(universalDir, 'skills');

    cleanDir(universalDir);
    ensureDir(srcDir);
    ensureDir(skillsResDir);

    // 0. Copy LICENSE, README from root
    const rootDir = path.resolve(distDir, '..');
    const resourcesDir = path.join(rootDir, 'resources');

    ['LICENSE', 'README.md'].forEach(file => {
        const srcPath = path.join(rootDir, file);
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, path.join(universalDir, file));
        }
    });

    // Copy demo.gif (try root first, then resources)
    const possibleGifPaths = [
        path.join(rootDir, 'demo.gif'),
        path.join(rootDir, 'resources', 'demo.gif')
    ];

    for (const srcPath of possibleGifPaths) {
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, path.join(universalDir, 'demo.gif'));
            break;
        }
    }

    // Handle potential casing issues for vsce
    const readmeDest = path.join(universalDir, 'README.md');
    if (fs.existsSync(readmeDest)) {
        // No action needed for casing on Windows, but this ensures it's found
    }

    const registeredSkills = [];

    // 1. Generate Skills for Antigravity (also used as context for VS Code)
    for (const skill of skills) {
        const skillName = `${prefix}${skill.name}`;
        const skillBody = replacePlaceholders(skill.body, 'antigravity');
        const content = `---\nname: ${skillName}\ndescription: ${skill.description}\n---\n\n${skillBody}`;
        const skillFileName = `${skillName}.md`;
        writeFile(path.join(skillsResDir, skillFileName), content);
        registeredSkills.push({ name: skill.name, path: `./skills/${skillFileName}` });
    }

    // 2. Generate Command Workflows for Antigravity
    for (const command of commands) {
        const commandName = `${prefix}${command.name}`;
        const commandBody = replacePlaceholders(command.body, 'antigravity');
        const content = `---\nname: ${commandName}\ndescription: ${command.description}\n---\n\n${commandBody}`;
        const cmdFileName = `cmd-${commandName}.md`;
        writeFile(path.join(skillsResDir, cmdFileName), content);
        registeredSkills.push({ name: `Command: ${commandName}`, path: `./skills/${cmdFileName}` });
    }

    // 3. Create package.json with BOTH contributions
    const pkg = {
        name: "impeccable-universal",
        displayName: "Impeccable Frontend Design (Universal)",
        description: "Frontend design expertise for VS Code and Antigravity",
        version: "1.0.0",
        publisher: "impeccable",
        repository: {
            type: "git",
            url: "https://github.com/TommasoRonchin/impeccable"
        },
        license: "Apache-2.0",
        engines: { vscode: "^1.80.0" },
        activationEvents: [
            "onCommand:impeccable.showCommands",
            "onStartupFinished"
        ],
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
            ],
            // Antigravity specific contributions
            "antigravity.skills": registeredSkills,
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

    writeFile(path.join(universalDir, 'package.json'), JSON.stringify(pkg, null, 2));

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

    writeFile(path.join(universalDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

    // 3.5 Create .vscodeignore
    const vscodeIgnore = [
        '.vscode/**',
        'src/**',
        'tsconfig.json',
        'package-lock.json',
        '**/*.map',
        'node_modules/**'
    ].join('\n');

    writeFile(path.join(universalDir, '.vscodeignore'), vscodeIgnore);

    // 4. Create extension.ts with Environment Detection Logic
    const commandItems = commands.map(c => ({
        label: `/${prefix}${c.name}`,
        description: c.description,
        body: replacePlaceholders(c.body, 'antigravity'),
        filename: `cmd-${prefix}${c.name}.md`
    }));

    const skillContext = skills.map(s => s.body).join('\n\n--- SKILL CONTEXT ---\n\n');
    const escapedSkillContext = skillContext.replace(/`/g, '\\`').replace(/\$/g, '\\$');

    let extensionTs = `import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export async function activate(context: vscode.ExtensionContext) {
    const isAntigravity = vscode.env.appName.toLowerCase().includes('antigravity');
    const baseContext = \`${escapedSkillContext}\`;

    console.log('Impeccable: Activating Universal Extension...');
    console.log('Impeccable: App Name - ' + vscode.env.appName);
    console.log('Impeccable: Detected environment - ' + (isAntigravity ? 'Antigravity' : 'VS Code'));

    // --- 1. Antigravity Skill Auto-Installer ---
    if (isAntigravity) {
        const installSkills = async () => {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) return;

            for (const folder of workspaceFolders) {
                const agentDir = path.join(folder.uri.fsPath, '.agent');
                const skillsDir = path.join(agentDir, 'skills');
                const workflowsDir = path.join(agentDir, 'workflows');

                try {
                    if (!fs.existsSync(agentDir)) fs.mkdirSync(agentDir, { recursive: true });
                    if (!fs.existsSync(skillsDir)) fs.mkdirSync(skillsDir, { recursive: true });
                    if (!fs.existsSync(workflowsDir)) fs.mkdirSync(workflowsDir, { recursive: true });

                    const extensionSkillsDir = path.join(context.extensionPath, 'skills');
                    if (fs.existsSync(extensionSkillsDir)) {
                        const files = fs.readdirSync(extensionSkillsDir);
                        for (const file of files) {
                            if (file.endsWith('.md')) {
                                const srcPath = path.join(extensionSkillsDir, file);
                                const isWorkflow = file.startsWith('cmd-');
                                const destDir = isWorkflow ? workflowsDir : skillsDir;
                                const destName = isWorkflow ? file.replace('cmd-', '') : file;
                                const destPath = path.join(destDir, destName);
                                fs.copyFileSync(srcPath, destPath);
                            }
                        }
                    }
                } catch (err) {
                    console.error('Failed to auto-install Impeccable skills:', err);
                }
            }
        };
        installSkills();
        
        // Register Chat Participant for Antigravity Agent
        const handler: vscode.ChatRequestHandler = async (request, context, stream, token) => {
            if (request.command) {
                const commandBody = getCommandBody(request.command);
                if (commandBody) {
                    stream.markdown(commandBody);
                    return;
                }
            }
            stream.markdown("I am your Impeccable Frontend Design Expert. Ask me to /audit, /polish, or /simplify your UI.");
        };
        vscode.chat.createChatParticipant('impeccable', handler);
    }

    // Helper to get command body mapping
    function getCommandBody(commandName: string) {
        const mapping: Record<string, string> = {
${commands.map(c => `            '${prefix}${c.name}': \`${replacePlaceholders(c.body, 'antigravity').replace(/`/g, '\\`').replace(/\$/g, '\\$')}\``).join(',\n')}
        };
        return mapping[commandName];
    }

    // --- 2. Shared Status Bar Item ---
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'impeccable.showCommands';
    statusBarItem.text = '$(sparkle) Impeccable';
    statusBarItem.tooltip = 'Show Impeccable Design Commands';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    console.log('Impeccable: Status bar item created and shown');

    // --- 3. Shared Quick Pick Command ---
    const disposable = vscode.commands.registerCommand('impeccable.showCommands', async () => {
        const items = ${JSON.stringify(commandItems, null, 12)};
        
        const selection = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select an Impeccable command to apply'
        });

        if (selection) {
            if (isAntigravity) {
                // TRY ANTIGRAVITY INJECTION
                const setupCommands = ['antigravity.toggleChatFocus', 'antigravity.openAgent', 'workbench.action.chat.open'];
                for (const setup of setupCommands) {
                    try { await vscode.commands.executeCommand(setup); break; } catch (e) {}
                }

                const injectCommands: [string, any][] = [
                    ['antigravity.sendPromptToAgentPanel', selection.body],
                    ['antigravity.sendPromptToAgentPanel', { text: selection.body }]
                ];

                let injected = false;
                for (const [id, args] of injectCommands) {
                    try { await vscode.commands.executeCommand(id, args); injected = true; break; } catch (e) {}
                }

                if (!injected) {
                    await vscode.commands.executeCommand('workbench.action.chat.open', { query: selection.label });
                }
            } else {
                // STANDARD VS CODE (Copilot Chat)
                await vscode.commands.executeCommand('workbench.action.chat.open', {
                    query: \`#workspace \\n\\nContext Guidelines:\\n\${baseContext}\\n\\nYour Task:\\n\${selection.body}\`
                });
                
                setTimeout(() => {
                    vscode.commands.executeCommand('workbench.action.chat.acceptInput');
                }, 500);
            }
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
`;

    writeFile(path.join(srcDir, 'extension.ts'), extensionTs);

    console.log(`✓ Universal Extension: Created for VS Code & Antigravity (${commands.length} commands)`);
}
