import { GoogleGenAI, Type } from "@google/genai";
import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client Lazily/Safely
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not defined.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY", // fallback to avoid immediate crash
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. Psychological consequence query endpoint
app.post("/api/tasks/analyze", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Task title is required" });
    }

    const ai = getAIClient();
    if (!process.env.GEMINI_API_KEY) {
      // Return a simulated, realistic response to keep the app working even if key is missing
      return res.json({
        intelligent_question: `What is the immediate, cascading cost of ignoring "${title}" for another 24 hours?`,
        thought_provoking_context: "Postponing core responsibilities creates a psychological debt that compounding anxiety will extract with interest."
      });
    }

    const prompt = `Analyze the task title: "${title}". Generate ONE highly specific, unexpected, and thoughtful question that forces the user to think about the real-world consequence of ignoring or deleting this specific task.
    
CRITICAL RULES:
1. NEVER use generic phrases like "Are you sure?" or "Is this important?".
2. Do NOT repeat previous scenarios. Every question must be completely tailored to the specific nouns and context in "${title}".
3. Emphasize the negative consequence of procrastination or dismissal.
4. Return your output strictly in the JSON format specified in the responseSchema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intelligent_question: {
              type: Type.STRING,
              description: "ONE highly specific, unexpected, and thoughtful question tailored to the nouns and context in the task title. Prohibits generic questions."
            },
            thought_provoking_context: {
              type: Type.STRING,
              description: "A brief, powerful explanation of why missing this matters, highlighting real-world negative cascading consequences."
            }
          },
          required: ["intelligent_question", "thought_provoking_context"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.log("Gemini Guardian Engine: Running in adaptive fallback mode.");
    const { title } = req.body;
    res.json({
      intelligent_question: `What is the immediate, cascading cost of ignoring "${title || 'this task'}" for another 24 hours?`,
      thought_provoking_context: "Postponing core responsibilities creates a psychological debt that compounding anxiety will extract with interest."
    });
  }
});

// 2. Auto-schedule / Break down endpoint
app.post("/api/tasks/auto-plan", async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Task title is required" });
    }

    const ai = getAIClient();
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        suggested_timeline_summary: "A streamlined path to tackle this task efficiently.",
        subtasks: [
          { title: "Define immediate starting steps & isolate resources", estimated_duration: "30 mins", consequence_if_skipped: "Starting delay increases overall task friction." },
          { title: "Execute primary work phase", estimated_duration: "1.5 hours", consequence_if_skipped: "Incomplete execution prevents completion before deadline." },
          { title: "Review, refine, and finalize", estimated_duration: "30 mins", consequence_if_skipped: "Unchecked details could lead to errors or missed specifications." }
        ]
      });
    }

    const prompt = `Create a step-by-step chronological action plan to successfully complete the following task before its deadline.
Task Title: "${title}"
Description: "${description || 'None'}"
Due Date: "${dueDate || 'Soon'}"

Break this task down into a sequence of exactly 3-4 manageable, highly actionable subtasks. Ensure each subtask has a realistic estimated duration and states the consequence if skipped. Write a brief high-level summary.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggested_timeline_summary: {
              type: Type.STRING,
              description: "A quick tactical summary of how to execute this task successfully."
            },
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Actionable, concrete step title." },
                  estimated_duration: { type: Type.STRING, description: "Estimated time, e.g. '45 mins' or '2 hours'." },
                  consequence_if_skipped: { type: Type.STRING, description: "The direct negative outcome on the final task if this step is bypassed." }
                },
                required: ["title", "estimated_duration", "consequence_if_skipped"]
              }
            }
          },
          required: ["suggested_timeline_summary", "subtasks"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.log("Gemini Guardian Engine: Running in adaptive fallback mode.");
    res.json({
      suggested_timeline_summary: "A streamlined path to tackle this task efficiently.",
      subtasks: [
        { title: "Define immediate starting steps & isolate resources", estimated_duration: "30 mins", consequence_if_skipped: "Starting delay increases overall task friction." },
        { title: "Execute primary work phase", estimated_duration: "1.5 hours", consequence_if_skipped: "Incomplete execution prevents completion before deadline." },
        { title: "Review, refine, and finalize", estimated_duration: "30 mins", consequence_if_skipped: "Unchecked details could lead to errors or missed specifications." }
      ]
    });
  }
});

// 3. Daily focus recommendations and dynamic threat meter
app.post("/api/tasks/daily-recommendations", async (req, res) => {
  try {
    const { tasks } = req.body;
    
    const ai = getAIClient();
    if (!process.env.GEMINI_API_KEY || !tasks || tasks.length === 0) {
      return res.json({
        risk_score: tasks && tasks.length > 0 ? Math.min(tasks.length * 20, 95) : 15,
        risk_analysis: "Your risk of missing deadlines is moderate. Clearing out immediate action items will restore control over your mental bandwidth.",
        recommendations: [
          "Start with your shortest task to build immediate cognitive momentum.",
          "Establish a distraction-free window of 45 minutes to execute critical objectives.",
          "Review upcoming due dates for the week to prevent sudden surprise loads."
        ]
      });
    }

    const tasksStr = tasks.map((t: any) => `- Title: "${t.title}", Due: "${t.dueDate}", Status: "${t.completed ? 'Completed' : 'Pending'}", Urgency: "${t.urgency || 'medium'}"`).join("\n");

    const prompt = `Analyze the user's current productivity pipeline and upcoming deadlines:
${tasksStr}

1. Calculate an aggregated 'risk_score' (integer 0-100) indicating their overall exposure to missing deadlines, based on task volume, high-urgency counts, and pending deadlines.
2. Provide a candid, psychologically insightful 'risk_analysis' (2-3 sentences) evaluating their current performance and stress-preventing actions.
3. Suggest exactly 3 highly tailored, specific, non-generic, actionable 'recommendations' to help them maximize their impact today. Avoid generic suggestions like "make a list". Focus on sequencing, sifting, or high-consequence prevention.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            risk_score: { type: Type.INTEGER, description: "A calculated risk value between 0 (completely safe/empty) and 100 (extreme danger of immediate missed deadlines)." },
            risk_analysis: { type: Type.STRING, description: "Psychological, insightful appraisal of the user's task pipeline." },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 3 highly tailored, non-generic recommendations."
            }
          },
          required: ["risk_score", "risk_analysis", "recommendations"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.log("Gemini Guardian Engine: Running in adaptive fallback mode.");
    const { tasks } = req.body;
    const totalPending = tasks ? tasks.filter((t: any) => !t.completed).length : 0;
    const criticalCount = tasks ? tasks.filter((t: any) => !t.completed && t.urgency === 'critical').length : 0;
    const highCount = tasks ? tasks.filter((t: any) => !t.completed && t.urgency === 'high').length : 0;
    
    const calculatedScore = totalPending === 0 ? 5 : Math.min((criticalCount * 30) + (highCount * 15) + (totalPending * 5), 98);
    
    let calculatedAnalysis = "All systems clear. You have successfully managed your schedule, preventing sudden stressors. Protect this momentum.";
    if (calculatedScore > 75) {
      calculatedAnalysis = "WARNING: You are operating in high cognitive deficit mode. Compound critical deadlines are clustered together. Postponing work today is a choice to trigger intense stress tomorrow.";
    } else if (calculatedScore > 40) {
      calculatedAnalysis = "Your pipeline has multiple active threats. Although manageable, delayed execution on your high-consequence tasks will rapidly compound your load.";
    }

    res.json({
      risk_score: calculatedScore,
      risk_analysis: calculatedAnalysis,
      recommendations: [
        "Initiate work immediately on your highest-consequence task. Delaying creates a powerful cognitive block.",
        "Schedule a solid, distraction-free 45-minute sprint. Put your communication devices completely offline.",
        "Consolidate similar tasks together (e.g. pay all bills in one 15-minute batch) to conserve mental energy."
      ]
    });
  }
});

// 4. Intelligent, unskippable snooze MCQ questions generator (3 sequential questions)
app.post("/api/alarms/snooze-mcqs", async (req, res) => {
  const { title, urgency, description } = req.body;
  try {
    const ai = getAIClient();
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are the ultimate psychological productivity investigator. 
      The user is attempting to SNOOZE/postpone an active deadline alarm for the task: "${title || 'Untitled task'}" (Urgency: ${urgency || 'High'}, Description: ${description || 'None'}).
      Generate exactly 3 sequential, highly intellectual, confrontational multiple-choice questions (MCQs) designed to generate deep analytical thinking in the user's mind and disrupt cognitive procrastination.
      
      CRITICAL FORMAT RULES:
      - Return a JSON object with this exact schema:
        {
          "questions": [
            {
              "question": "What is the primary cognitive bias or rationalization currently driving your urge to delay this?",
              "options": [
                "Temporal Discounting: Overestimating future-self energy and competence",
                "Productive Procrastination: Rationalizing delay by doing lesser work",
                "The Motivation Illusion: Waiting for ideal emotional states that do not arrive",
                "Avoidance Habituation: Reinforcing negative behavior loops to soothe current stress"
              ]
            },
            ... (Generate exactly 3 questions)
          ]
        }
      - Each question must be deeply relevant to "${title}", incorporating its technical domain, themes, and consequences.
      - Options must be filled with deep-thinking psychological phrases, technical concepts, and actual behavioral drawbacks of delaying this task. Keep them concise (less words, more intellectual impact).
      - Do not include markdown code blocks other than pure json inside your response.`,
      config: {
        responseMimeType: "application/json",
      },
    });

    const data = JSON.parse(response.text || "{}");
    if (data.questions && data.questions.length === 3) {
      return res.json(data);
    }
    throw new Error("Invalid output format from Gemini");
  } catch (error: any) {
    console.log("Gemini Guardian Engine: Running in adaptive fallback mode for snooze MCQs.");
    
    // Outstanding, high-impact fallbacks
    const fallbackMCQs = [
      {
        question: `Which cognitive bias is currently rationalizing your postponement of "${title || 'this task'}"?`,
        options: [
          "Hyperbolic Discounting: Trading long-term peace for immediate transient comfort.",
          "Ideal-State Fallacy: Intending to execute only when 'conditions are perfect'.",
          "Anxiety Avoidance: Rebranding psychological friction as 'strategic delay'.",
          "Temporal Disconnection: Treating your future-self as an anonymous stranger."
        ]
      },
      {
        question: `What is the technical consequence of delaying "${title || 'this deadline'}" for another cycle?`,
        options: [
          "Anxiety Compounding: Stress levels scale exponentially as the deadline compresses.",
          "Willpower Depletion: Your evening executive reserve will be severely degraded.",
          "Parkinson's Law: The task will bloat, consuming twice the required energy later.",
          "Sunk Momentum Loss: Sacrificing any current cognitive alignment built up today."
        ]
      },
      {
        question: `Which existential trade-off are you actively accepting by pressing snooze?`,
        options: [
          "Erosion of self-trust: Teaching your subconscious that your commitments are optional.",
          "The Midnight Tax: Exchanging peaceful sleep for a rushed, panic-fueled sprint.",
          "Degraded Quality: Accepting a sub-optimal outcome over a disciplined, polished craft.",
          "Prolonged Low-Grade Dread: Carrying this mental payload through your entire break."
        ]
      }
    ];
    res.json({ questions: fallbackMCQs });
  }
});

// 5. Intelligent, unskippable truth-check MCQ generator (1 question)
app.post("/api/alarms/truth-mcq", async (req, res) => {
  const { title, description } = req.body;
  try {
    const ai = getAIClient();
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are the ultimate psychological productivity investigator. 
      The user claims they have COMPLETED the active deadline alarm: "${title || 'Untitled task'}" (Description: ${description || 'None'}).
      Generate exactly ONE unskippable multiple-choice truth-check question (MCQ) designed to 'evolve out the truth' and prevent superficial completion or false checks.
      
      CRITICAL FORMAT RULES:
      - Return a JSON object with this exact schema:
        {
          "question": "Which statement represents the absolute truth of your execution state?",
          "options": [
            "Complete Discipline: The task is fully compiled, tested, and resolved to standard.",
            "Superficial Compliance: Succeeded in the letter of the task, but bypassed actual quality.",
            "Auditory Suppression: Claiming completion merely to silence this active siren.",
            "Defensive Rationalization: Checked it off but left critical parts unresolved."
          ]
        }
      - The question and options must be deeply intellectual, utilizing high-level psychological terminology, specifically tailored to "${title}".
      - Options must be concise, deep-thinking phrases that trigger deep introspection.
      - Do not include markdown code blocks other than pure json inside your response.`,
      config: {
        responseMimeType: "application/json",
      },
    });

    const data = JSON.parse(response.text || "{}");
    if (data.question && data.options) {
      return res.json(data);
    }
    throw new Error("Invalid output format from Gemini");
  } catch (error: any) {
    console.log("Gemini Guardian Engine: Running in adaptive fallback mode for truth MCQ.");
    
    res.json({
      question: `Which statement represents the absolute truth of your execution for "${title || 'this task'}"?`,
      options: [
        "Uncompromised Quality: Fully completed, validated, and polished to standard.",
        "Superficial Compliance: Checked it off, but bypassed actual cognitive depth.",
        "Auditory Escape: Declaring done primarily to silence this alarming siren.",
        "Deferred Execution: The checkbox is marked, but the heavy lifting is postponed."
      ]
    });
  }
});

// Vite & Static file handling
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
