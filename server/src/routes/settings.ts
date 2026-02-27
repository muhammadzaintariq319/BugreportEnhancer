import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const SETTINGS_FILE = path.join(__dirname, '..', '..', 'settings.json');

export interface AppSettings {
    projectName: string;
    jiraEmail: string;
    jiraApiKey: string;
    jiraUrl: string;
    issueType: string;
    groqApiKey: string;
}

const DEFAULT_SETTINGS: AppSettings = {
    projectName: '',
    jiraEmail: '',
    jiraApiKey: '',
    jiraUrl: '',
    issueType: 'Bug',
    groqApiKey: '',
};

function loadSettings(): AppSettings {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
            return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
        }
    } catch (e) {
        console.error('Error loading settings:', e);
    }
    return DEFAULT_SETTINGS;
}

function saveSettings(settings: AppSettings): void {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

// GET /api/settings
router.get('/', (_req: Request, res: Response) => {
    const settings = loadSettings();
    res.json(settings);
});

// POST /api/settings
router.post('/', (req: Request, res: Response) => {
    try {
        const settings: AppSettings = {
            projectName: req.body.projectName || '',
            jiraEmail: req.body.jiraEmail || '',
            jiraApiKey: req.body.jiraApiKey || '',
            jiraUrl: req.body.jiraUrl || '',
            issueType: req.body.issueType || 'Bug',
            groqApiKey: req.body.groqApiKey || '',
        };
        saveSettings(settings);
        res.json({ success: true, message: 'Settings saved successfully!' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: `Failed to save settings: ${error.message}` });
    }
});

export { router as settingsRouter };
export { loadSettings };
