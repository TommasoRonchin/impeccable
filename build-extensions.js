import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { readSourceFiles, readPatterns } from './scripts/lib/utils.js';
import {
    transformAntigravity,
    transformVSCode,
    transformUniversal
} from './scripts/lib/transformers/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname);
const DIST_DIR = path.join(ROOT_DIR, 'dist');

async function main() {
    console.log('🚀 Regenerating Impeccable extensions with Focus & Inject logic...\n');

    if (!fs.existsSync(DIST_DIR)) {
        fs.mkdirSync(DIST_DIR, { recursive: true });
    }

    const { commands, skills } = readSourceFiles(ROOT_DIR);
    const patterns = readPatterns(ROOT_DIR);

    // Transform for Antigravity
    transformAntigravity(commands, skills, DIST_DIR, patterns);

    // Transform for VS Code
    transformVSCode(commands, skills, DIST_DIR, patterns);

    // Transform for Universal (VS Code + Antigravity)
    transformUniversal(commands, skills, DIST_DIR, patterns);

    console.log('\n✅ Extensions regenerated in ./dist/');
}

main();
