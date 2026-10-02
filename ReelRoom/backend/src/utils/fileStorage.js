import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';
const DATA_DIR = path.resolve(process.cwd(), 'data');
function ensureDataDirExists() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}
export function readJsonFile(fileName, defaultValue) {
    try {
        ensureDataDirExists();
        const filePath = path.join(DATA_DIR, fileName);
        if (!fs.existsSync(filePath)) {
            return defaultValue;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        if (!content.trim()) {
            return defaultValue;
        }
        return JSON.parse(content);
    }
    catch (err) {
        logger.warn(`Failed to read JSON file ${fileName}: ${err.message}`);
        return defaultValue;
    }
}
export function writeJsonFile(fileName, data) {
    try {
        ensureDataDirExists();
        const filePath = path.join(DATA_DIR, fileName);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    }
    catch (err) {
        logger.warn(`Failed to write JSON file ${fileName}: ${err.message}`);
        return false;
    }
}
