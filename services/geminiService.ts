import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Message, Wisdom } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// System instruction for the therapy session in Chinese
const THERAPIST_INSTRUCTION = `
你是“正念转化器”。你的角色是倾听那些感到压力、愤怒或受伤的用户（例如被老板骂了）。
1. 用极具同理心的方式确认他们的感受。
2. 温柔地引导他们转向斯多葛学派、佛教或成长型思维的视角。
3. 帮助他们将消极经历重构为学习机会或性格考验。
4. 回复要温暖、抚慰人心，但要简洁（通常不超过3句）。
5. 不要说教。做一个提供温柔援手的倾听者。
6. **请全程使用简体中文回答。**
`;

// Schema for extracting the "Wisdom/Mindset" after the chat
const WISDOM_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "一个简短、充满诗意的4-6个字的标题，总结学到的教训（例如'风雨中的宁静'）。请用中文。",
    },
    insight: {
      type: Type.STRING,
      description: "提炼出的一段哲学逻辑或'心法'（2-3句），源于这次经历。请用中文。",
    },
    summary: {
      type: Type.STRING,
      description: "一句话总结最初发生的负面情况。请用中文。",
    },
  },
  required: ["title", "insight", "summary"],
};

export const createChatSession = () => {
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: THERAPIST_INSTRUCTION,
      temperature: 0.7,
    },
  });
};

export const extractWisdom = async (messages: Message[]): Promise<Omit<Wisdom, 'id' | 'date'>> => {
  const conversationHistory = messages.map(m => `${m.role}: ${m.text}`).join('\n');
  
  const prompt = `
    以下是一个压力过大的用户与正念向导之间的对话。
    请将这段对话提炼成一个“智慧结晶”。
    提取核心的负面情境，将其转化为一个充满诗意的中文标题，并综合出帮助化解情绪的逻辑/心法。
    
    对话内容:
    ${conversationHistory}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: WISDOM_SCHEMA,
    },
  });

  const data = JSON.parse(response.text || '{}');
  
  return {
    title: data.title || "耐心的种子",
    situation: data.summary || "处理了一次艰难的时刻。",
    insight: data.insight || "通过逆境，我们找到力量，将根深深扎入内心的平静之中。",
  };
};