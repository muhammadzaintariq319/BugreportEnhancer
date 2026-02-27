import Groq from 'groq-sdk';
import fs from 'fs';

export interface GroqAnalysisResult {
    title: string;
    description: string;
    stepsToReproduce: string;
    expectedBehavior: string;
    actualBehavior: string;
}

export async function analyzeScreenshot(
    imagePath: string,
    userNotes: string,
    apiKey: string
): Promise<GroqAnalysisResult> {
    const groq = new Groq({ apiKey });

    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const prompt = `You are an expert QA engineer analyzing a screenshot of a software bug. 
Analyze this screenshot carefully and generate a structured bug report.

${userNotes ? `The user has provided these additional notes: "${userNotes}"` : 'No additional notes were provided.'}

Please respond in the following JSON format ONLY (no markdown, no code blocks, just raw JSON):
{
  "title": "A concise, descriptive bug title",
  "description": "A detailed description of the bug visible in the screenshot",
  "stepsToReproduce": "Numbered steps to reproduce the bug based on what you can see",
  "expectedBehavior": "What the expected behavior should be",
  "actualBehavior": "What the actual (buggy) behavior is as shown in the screenshot"
}`;

    const chatCompletion = await groq.chat.completions.create({
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: prompt,
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: dataUrl,
                        },
                    },
                ],
            },
        ],
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        temperature: 0.3,
        max_tokens: 1500,
    });

    const responseText = chatCompletion.choices[0]?.message?.content || '';

    try {
        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]) as GroqAnalysisResult;
        }
    } catch (e) {
        // If JSON parsing fails, create a structured response from the raw text
    }

    return {
        title: 'Bug Report from Screenshot Analysis',
        description: responseText,
        stepsToReproduce: 'See description above',
        expectedBehavior: 'See description above',
        actualBehavior: 'See description above',
    };
}

export async function testGroqConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
        const groq = new Groq({ apiKey });
        await groq.chat.completions.create({
            messages: [{ role: 'user', content: 'Say "connected" in one word.' }],
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            max_tokens: 10,
        });
        return { success: true, message: 'Groq connection successful!' };
    } catch (error: any) {
        return { success: false, message: `Groq connection failed: ${error.message}` };
    }
}
