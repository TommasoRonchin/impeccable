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
    const extensionDir = path.join(antigravityDir, 'vscode-extension');
    const srcDir = path.join(extensionDir, 'src');
    const skillsResDir = path.join(extensionDir, 'skills');

    cleanDir(antigravityDir);
    ensureDir(srcDir);
    ensureDir(skillsResDir);

    const registeredSkills = [];

    // 1. Generate Core Skills
    for (const skill of skills) {
        const skillName = `${prefix}${skill.name}`;
        const skillBody = replacePlaceholders(skill.body, 'antigravity');

        const content = `---\nname: ${skillName}\ndescription: ${skill.description}\n---\n\n${skillBody}`;
        const skillFileName = `${skillName}.md`;
        writeFile(path.join(skillsResDir, skillFileName), content);

        registeredSkills.push({
            name: skill.name,
            path: `./skills/${skillFileName}`
        });

        // Copy reference files if they exist
        if (skill.references && skill.references.length > 0) {
            const refDir = path.join(skillsResDir, 'reference');
            ensureDir(refDir);
            for (const ref of skill.references) {
                const refOutputPath = path.join(refDir, `${ref.name}.md`);
                const refContent = replacePlaceholders(ref.content, 'antigravity');
                writeFile(refOutputPath, refContent);
            }
        }
    }

    // 2. Generate Command Skills (so the agent sees them as slash commands)
    for (const command of commands) {
        const commandName = `${prefix}${command.name}`;
        const commandBody = replacePlaceholders(command.body, 'antigravity');

        const content = `---\nname: ${commandName}\ndescription: ${command.description}\n---\n\n${commandBody}`;
        const cmdFileName = `cmd-${commandName}.md`;
        writeFile(path.join(skillsResDir, cmdFileName), content);

        registeredSkills.push({
            name: `Command: ${commandName}`,
            path: `./skills/${cmdFileName}`
        });
    }

    // 3. Create VS Code Extension for Antigravity IDE
    const commandItems = commands.map(c => ({
        label: `/${prefix}${c.name}`,
        description: c.description,
        body: replacePlaceholders(c.body, 'antigravity'),
        filename: `cmd-${prefix}${c.name}.md`
    }));

    const pkg = {
        name: "impeccable-antigravity",
        displayName: "Impeccable for Antigravity",
        description: "Frontend design expertise for the Antigravity agent",
        version: "1.0.0",
        publisher: "impeccable",
        engines: {
            vscode: "^1.80.0"
        },
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
            commands: [{
                command: "impeccable.antigravity.showCommands",
                title: "Impeccable: Show Antigravity Commands",
                category: "Impeccable"
            }],
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

    writeFile(path.join(extensionDir, 'package.json'), JSON.stringify(pkg, null, 2));

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

    writeFile(path.join(extensionDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

    const vscodeConfigDir = path.join(extensionDir, '.vscode');
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
                ]
            }
        ]
    };

    writeFile(path.join(vscodeConfigDir, 'launch.json'), JSON.stringify(launchJson, null, 2));

    let extensionTs = `import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    // 1. Auto-install Skills & Workflows to Workspace
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

                // Copy from extension to workspace
                const extensionSkillsDir = path.join(context.extensionPath, 'skills');
                if (fs.existsSync(extensionSkillsDir)) {
                    const files = fs.readdirSync(extensionSkillsDir);
                    for (const file of files) {
                        if (file.endsWith('.md')) {
                            const srcPath = path.join(extensionSkillsDir, file);
                            // If it starts with cmd-, it's a workflow (slash command)
                            const destDir = file.startsWith('cmd-') ? workflowsDir : skillsDir;
                            const destName = file.startsWith('cmd-') ? file.replace('cmd-', '') : file;
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

    // 3. Register Chat Participant
    const handler: vscode.ChatRequestHandler = async (request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream, token: vscode.CancellationToken) => {
        if (request.command) {
            switch (request.command) {
${commands.map(c => {
        const name = `${prefix}${c.name}`;
        const escapedBody = replacePlaceholders(c.body, 'antigravity').replace(/`/g, '\\`').replace(/\$/g, '\\$');
        return `                case '${name}':
                    stream.markdown(\`${escapedBody}\`);
                    return;`;
    }).join('\n')}
            }
        }
        stream.markdown("I am your Impeccable Frontend Design Expert. Ask me to /audit, /polish, or /simplify your UI.");
    };

    const impeccableParticipant = vscode.chat.createChatParticipant('impeccable', handler);

    // 4. Status Bar Item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'impeccable.antigravity.showCommands';
    statusBarItem.text = '$(sparkle) Impeccable';
    statusBarItem.tooltip = 'Show Impeccable Design Commands';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // 5. Quick Pick Command
    const disposable = vscode.commands.registerCommand('impeccable.antigravity.showCommands', async () => {
        const items = ${JSON.stringify(commandItems, null, 12)};
        
        const selection = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select an Impeccable command'
        });

        if (selection) {
            vscode.window.showInformationMessage("Impeccable: Activating " + selection.label + "...");
            
            const tryCommands = async () => {
                // Determine absolute path to the workflow file for proper linking
                let fileUri = \`.agent/workflows/\${selection.filename}\`;
                if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
                    const vscodeUri = require('vscode').Uri;
                    const folderUri = vscode.workspace.workspaceFolders[0].uri;
                    fileUri = vscodeUri.joinPath(folderUri, '.agent', 'workflows', selection.filename).toString();
                }

                // Focus/Open Commands
                const setupCommands = [
                    'antigravity.toggleChatFocus',
                    'antigravity.openAgent',
                    'workbench.action.chat.open'
                ];

                // Injection Commands
                const injectCommands: [string, ...any[]][] = [
                    ['antigravity.sendPromptToAgentPanel', selection.body],
                    ['antigravity.sendPromptToAgentPanel', { text: selection.body }],
                    ['antigravity.sendPromptToAgentPanel', { prompt: selection.body }]
                ];

                // Step 1: Open panel
                for (const setup of setupCommands) {
                    try { await vscode.commands.executeCommand(setup); break; } catch (e) {}
                }

                // Step 2: Try specific Antigravity injection (if it throws, it moves to step 3)
                let injected = false;
                for (const [id, ...args] of injectCommands) {
                    try {
                        console.log("Impeccable: Attempting " + id);
                        await vscode.commands.executeCommand(id, ...args);
                        injected = true;
                        break;
                    } catch (e) {}
                }

                // Step 3: The standard VS Code fallback (highly reliable but might open a different panel)
                if (!injected) {
                    try {
                        console.log("Impeccable: Attempting workbench.action.chat.open");
                        await vscode.commands.executeCommand('workbench.action.chat.open', {
                            query: selection.label
                        });
                        injected = true;
                    } catch (e) {}
                }

                return injected;
            };

            const success = await tryCommands();
            if (!success) {
                vscode.window.showWarningMessage('Impeccable: Manual action required. Please type / in chat.');
            }
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
`;

    writeFile(path.join(srcDir, 'extension.ts'), extensionTs);

    const prefixInfo = prefix ? ` [${prefix}prefixed]` : '';
    console.log(`✓ Antigravity${prefixInfo}: Plug & Play Extension created (${commands.length + skills.length} skills/commands registered)`);
}
