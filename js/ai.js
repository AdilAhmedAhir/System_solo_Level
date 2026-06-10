/* ════════════════════════════════════════════════════════════
   AI.JS — "The System" AI Administrator (Gemini API)
   ════════════════════════════════════════════════════════════ */
window.AI = (() => {
  'use strict';

  const STORAGE_KEY = 'sl_system_gemini_key';

  function getKey() {
    return localStorage.getItem(STORAGE_KEY) || '';
  }

  function setKey(key) {
    localStorage.setItem(STORAGE_KEY, key.trim());
  }

  function hasKey() {
    return !!getKey();
  }

  /**
   * Prompts the Gemini API to break down a project/raid into quests.
   * Uses Gemini 1.5 Flash (free tier friendly).
   */
  async function generateQuests(projectGoal, deadline) {
    const key = getKey();
    if (!key) throw new Error("API Key missing. Please set your Gemini API key in the settings.");

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

    const promptText = `
    You are "The System" from Solo Leveling, a gamified AI administrator.
    The Hunter (user) has a new Raid (project goal): "${projectGoal}".
    The deadline is: "${deadline}".
    
    Break this goal down into 3 to 6 actionable daily quests.
    Return ONLY a valid JSON array of objects. Do not include markdown formatting or backticks.
    
    Each object must have exactly these fields:
    - "name": A specific, actionable task description (e.g., "Draft the marketing email").
    - "stat": The most relevant stat code for this task. Must be exactly one of: "str" (physical), "vit" (health/endurance), "int" (learning/creating), "per" (business/money/insight), "cha" (social/networking), "res" (discipline/mindset).
    - "xp": Integer XP reward between 10 and 50 based on difficulty.
    
    JSON Example:
    [
      { "name": "Write 500 words for the landing page", "stat": "int", "xp": 30 },
      { "name": "Email 5 potential clients", "stat": "cha", "xp": 40 }
    ]
    `;

    const requestBody = {
      contents: [{
        parts: [{ text: promptText }]
      }],
      generationConfig: {
        temperature: 0.2, // Low temperature for consistent JSON
        responseMimeType: "application/json"
      }
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to communicate with The System.");
      }

      const data = await response.json();
      const aiResponseText = data.candidates[0].content.parts[0].text;
      
      // Parse the JSON array
      const quests = JSON.parse(aiResponseText);
      
      return quests;
    } catch (error) {
      console.error("[System AI Error]", error);
      throw error;
    }
  }

  return { getKey, setKey, hasKey, generateQuests };
})();
