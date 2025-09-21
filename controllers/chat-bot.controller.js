const express = require('express');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
require('dotenv').config(); // npm i dotenv (if not already)

// ===== In-memory session memory (optional; resets on restart) =====
const sessions = new Map(); // sessionId -> [{role, content}]
const MAX_TURNS = 10;

// ===== Rate limit (per IP) =====
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 min
  max: 60,                  // 60 msgs / 5 min
  standardHeaders: true,
  legacyHeaders: false,
});

const bodySchema = Joi.object({
  message: Joi.string().min(1).max(2000).required(),
  history: Joi.array().items(Joi.object({ role: Joi.string(), content: Joi.string() })).optional(),
  sessionId: Joi.string().max(100).optional()
});


const chatBot = async (req,res)=>{
   const { value, error } = bodySchema.validate(req.body, { stripUnknown: true });
  if (error) return res.status(400).json({ message: 'Invalid input' });    

  const { message, sessionId } = value;
  const sid = sessionId || req.get('x-chat-session') || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Build conversation (server-side memory)
  const history = sessions.get(sid) || [];
  history.push({ role: 'user', content: message });
  const trimmed = history.slice(-MAX_TURNS * 2); // user+assistant pairs
  sessions.set(sid, trimmed);

  // ---- System prompt tuned for your store ----
  const systemPrompt = `
You are "Mushroom Store Assistant" for an online mushroom shop in Bangalore & Pune.
Rules:
- Be concise and friendly. Use simple English (or Hinglish if the user writes Hindi/Hinglish).
- Business facts to remember:
  • Minimum cart value: ₹300 (order won’t proceed below this).
  • Fresh produce: mainly Oyster; seasonal Shiitake & Button; daily harvest.
  • Contact: support@yourbrand.in, +91 7039683801.
  • If the user wants to place an order, guide them to the Products page and Cart.
- Never invent policies; if unsure, say you'll connect them to support.
- Don’t give medical or legal advice; suggest consulting a professional.
- If asked for personal data handling, refer to the Privacy Policy page.
Provide helpful, short answers and include links like /products, /contact where relevant.
`;

  // Compose messages for OpenAI-compatible API
  const messages = [
    { role: 'system', content: systemPrompt },
    ...trimmed,
  ];
try {
    // ====== Call an OpenAI-compatible chat API ======
    const base = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
    const model = process.env.AI_MODEL || 'gpt-4o-mini';
    const apiKey = process.env.API_KEYs ;
    if (!apiKey) return res.status(500).json({ message: 'AI not configured' });

    const r = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
      })
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error('AI error:', errText);
      return res.status(502).json({ message: 'AI gateway error' });
    }

    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || 'Sorry, I could not respond.';

    // Save assistant turn
    trimmed.push({ role: 'assistant', content: reply });
    sessions.set(sid, trimmed.slice(-MAX_TURNS * 2));

    // Optional quick suggestions
    const suggestions = [
      'What is the minimum order?',
      'Do you deliver to my area?',
      'What mushrooms are available today?',
      'How do I contact support?'
    ];

    res.json({ reply, suggestions, sessionId: sid });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
}   


module.exports = chatBot