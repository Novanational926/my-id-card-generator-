/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser limit expanded for custom logo images or data payloads
  app.use(express.json({ limit: '15mb' }));

  // API Route: AI-powered Layout Auto-Fitting Optimizer
  app.post('/api/optimize-layout', async (req, res) => {
    try {
      const { students, config } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(403).json({ 
          error: "Your Gemini API key is currently not configured in Secrets. Please click Settings > Secrets on the top right to populate GEMINI_API_KEY." 
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Analyze dataset parameters
      const studentCount = Array.isArray(students) ? students.length : 0;
      const longestName = studentCount > 0 
        ? students.reduce((max: string, s: any) => ((s.name || '').length > max.length ? s.name : max), "JONATHAN PATTERSON")
        : "JONATHAN PATTERSON";
      const longestAddr = studentCount > 0
        ? students.reduce((max: string, s: any) => ((s.address || '').length > max.length ? s.address : max), "Sardar Gaon, Hojai : Assam : 782440")
        : "Sardar Gaon, Hojai : Assam : 782440";
      
      const schoolNameFull = `${config.schoolNamePre || ''} ${config.schoolNameSuf || ''} ${config.schoolNameLine2Pre || ''} ${config.schoolNameLine2Suf || ''}`.trim();

      const prompt = `
        You are a highly premium professional graphics designer and school credentials card template layout architect.
        Your task is to analyze and return the optimized dimensions/font-sizes (in pixels) for a standard physical CR80 student identity card template (Width is exactly 340px, Height is exactly 540px).
        
        The current active database details are:
        1. Fully Combined School Title: "${schoolNameFull}"
        2. Longest Student Full Name: "${longestName}" (Length: ${longestName.length} characters)
        3. Longest Resident Address text: "${longestAddr}" (Length: ${longestAddr.length} characters)

        Below is the standard Default reference layout parameters list:
        {
          "schoolLogo": 52,
          "schoolNameLine1": 19,
          "schoolNameLine2": 19,
          "studentPhoto": 172,
          "studentName": 26,
          "studentMeta": 14.5,
          "fieldLabels": 14.5,
          "fieldRollVal": 14.5,
          "fieldClassVal": 14.5,
          "fieldPhoneVal": 14.5,
          "fieldAddressVal": 14.5,
          "sideStripeText": 19,
          "backLogo": 72,
          "backTermsTitle": 15.5,
          "backTermsText": 11.2,
          "principalSign": 50,
          "principalName": 11
        }

        Intelligent Optimization Constraint Rules:
        - The goal is to maximize physical layout beauty, density, contrast, and mathematical alignment so that text NEVER overlaps or wraps excessively off-screen.
        - If student names are very long (> 16 characters), scale "studentName" down accordingly (e.g., between 18.0 and 22.0 px) so names fits beautifully in two lines max.
        - If resident addresses are extremely long (> 32 characters), scale "fieldAddressVal" down (e.g. between 11.0 and 13.0 px) and keep "studentMeta" well-adjusted.
        - If primary school titles are lengthy (> 24 characters), scale down "schoolNameLine1" and "schoolNameLine2" (e.g. 14.0 to 17.0 px) for a premium compact header.
        - Ensure "fieldLabels", "fieldRollVal", "fieldClassVal", and "fieldPhoneVal" remain visually synchronized or nicely balanced (usually within 12.0px to 14.5px).
        - Do not exceed these strict allowable absolute ranges for each key:
          * schoolLogo: min 30, max 90
          * schoolNameLine1: min 11, max 28
          * schoolNameLine2: min 11, max 28
          * studentPhoto: min 130, max 200
          * studentName: min 16, max 34
          * studentMeta: min 10, max 18
          * fieldLabels: min 9, max 18
          * fieldRollVal: min 10, max 18
          * fieldClassVal: min 10, max 18
          * fieldPhoneVal: min 10, max 18
          * fieldAddressVal: min 8, max 18
          * sideStripeText: min 12, max 24
          * backLogo: min 40, max 100
          * backTermsTitle: min 11, max 20
          * backTermsText: min 8, max 14
          * principalSign: min 30, max 80
          * principalName: min 8, max 15

        Respond ONLY with a valid, clean JSON object matching the exact Type Schema shape requested. Do not wrap inside any explanation paragraphs or preamble markdown besides JSON.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              schoolLogo: { type: Type.NUMBER },
              schoolNameLine1: { type: Type.NUMBER },
              schoolNameLine2: { type: Type.NUMBER },
              studentPhoto: { type: Type.NUMBER },
              studentName: { type: Type.NUMBER },
              studentMeta: { type: Type.NUMBER },
              fieldLabels: { type: Type.NUMBER },
              fieldRollVal: { type: Type.NUMBER },
              fieldClassVal: { type: Type.NUMBER },
              fieldPhoneVal: { type: Type.NUMBER },
              fieldAddressVal: { type: Type.NUMBER },
              sideStripeText: { type: Type.NUMBER },
              backLogo: { type: Type.NUMBER },
              backTermsTitle: { type: Type.NUMBER },
              backTermsText: { type: Type.NUMBER },
              principalSign: { type: Type.NUMBER },
              principalName: { type: Type.NUMBER },
            },
            required: [
              "schoolLogo", "schoolNameLine1", "schoolNameLine2",
              "studentPhoto", "studentName", "studentMeta",
              "fieldLabels", "fieldRollVal", "fieldClassVal",
              "fieldPhoneVal", "fieldAddressVal", "sideStripeText",
              "backLogo", "backTermsTitle", "backTermsText",
              "principalSign", "principalName"
            ]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response text payload returned from Gemini model.");
      }

      const resultJSON = JSON.parse(text.trim());
      res.json(resultJSON);

    } catch (err: any) {
      console.error("AI Sizing optimization fail:", err);
      res.status(500).json({ error: err.message || "Failed to contact Gemini neural network." });
    }
  });

  // Mount Vite development middlewares or serve static assets in production mode.
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FULLSTACK] Server booted successfully on port ${PORT}`);
  });
}

startServer();
