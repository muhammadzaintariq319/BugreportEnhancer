import { Router, Request, Response } from 'express';
import { testJiraConnection } from '../services/jiraService';
import { testGroqConnection } from '../services/groqService';

const router = Router();

// POST /api/test/jira
router.post('/jira', async (req: Request, res: Response) => {
    try {
        const { jiraEmail, jiraApiKey, jiraUrl } = req.body;

        if (!jiraEmail || !jiraApiKey || !jiraUrl) {
            res.status(400).json({
                success: false,
                message: 'Please provide Jira Email, API Key, and Connection URL.',
            });
            return;
        }

        const result = await testJiraConnection(jiraEmail, jiraApiKey, jiraUrl);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, message: `Test failed: ${error.message}` });
    }
});

// POST /api/test/groq
router.post('/groq', async (req: Request, res: Response) => {
    try {
        const { groqApiKey } = req.body;

        if (!groqApiKey) {
            res.status(400).json({
                success: false,
                message: 'Please provide a Groq API Key.',
            });
            return;
        }

        const result = await testGroqConnection(groqApiKey);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, message: `Test failed: ${error.message}` });
    }
});

export { router as testConnectionRouter };
