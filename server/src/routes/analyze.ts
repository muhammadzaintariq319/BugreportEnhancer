import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { analyzeScreenshot } from '../services/groqService';
import { createJiraIssue, attachFileToJiraIssue } from '../services/jiraService';
import { loadSettings } from './settings';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// POST /api/analyze
router.post('/', upload.array('files', 10), async (req: Request, res: Response) => {
    try {
        const settings = loadSettings();
        const userNotes = req.body.notes || '';
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            res.status(400).json({ success: false, message: 'No files uploaded.' });
            return;
        }

        if (!settings.groqApiKey) {
            res.status(400).json({ success: false, message: 'Groq API key not configured. Please update settings.' });
            return;
        }

        if (!settings.jiraApiKey || !settings.jiraUrl || !settings.jiraEmail) {
            res.status(400).json({ success: false, message: 'Jira settings not configured. Please update settings.' });
            return;
        }

        // Analyze the first image with Groq Llama Scout
        const imageFile = files.find(f =>
            ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'].includes(
                path.extname(f.originalname).toLowerCase()
            )
        );

        if (!imageFile) {
            res.status(400).json({ success: false, message: 'No image file found in uploads.' });
            return;
        }

        console.log('🔍 Analyzing screenshot with Groq Llama Scout...');
        const analysis = await analyzeScreenshot(imageFile.path, userNotes, settings.groqApiKey);
        console.log('✅ Analysis complete:', analysis.title);

        // Create Jira issue
        console.log('📝 Creating Jira issue...');
        const jiraResult = await createJiraIssue(
            {
                projectName: settings.projectName,
                jiraEmail: settings.jiraEmail,
                jiraApiKey: settings.jiraApiKey,
                jiraUrl: settings.jiraUrl,
                issueType: settings.issueType,
            },
            analysis,
            userNotes
        );

        if (!jiraResult.success) {
            res.status(500).json(jiraResult);
            return;
        }

        // Attach files to Jira issue
        console.log('📎 Attaching files to Jira issue...');
        const filePaths = files.map(f => f.path);
        const attachResult = await attachFileToJiraIssue(
            {
                projectName: settings.projectName,
                jiraEmail: settings.jiraEmail,
                jiraApiKey: settings.jiraApiKey,
                jiraUrl: settings.jiraUrl,
                issueType: settings.issueType,
            },
            jiraResult.issueKey!,
            filePaths
        );

        // Clean up uploaded files
        files.forEach(f => {
            try {
                fs.unlinkSync(f.path);
            } catch (e) {
                // ignore cleanup errors
            }
        });

        res.json({
            success: true,
            issueKey: jiraResult.issueKey,
            issueUrl: jiraResult.issueUrl,
            analysis,
            attachmentStatus: attachResult.message,
            message: `Bug report ${jiraResult.issueKey} created successfully!`,
        });
    } catch (error: any) {
        console.error('Error in analyze:', error);
        res.status(500).json({ success: false, message: `Analysis failed: ${error.message}` });
    }
});

export { router as analyzeRouter };
