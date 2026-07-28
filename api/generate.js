const { GoogleGenAI } = require('@google/genai');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { latitude, longitude, mood } = req.body || {};

  if (!mood || !latitude || !longitude) {
    return res.status(400).json({ error: '위치 정보와 기분을 모두 입력해주세요.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다. Vercel 환경 변수를 확인해주세요.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
현재 위치 정보: 위도 ${latitude}, 경도 ${longitude}
사용자 기분/원하는 분위기: "${mood}"

[요청 사항]
1. 위 위치 근처에서 현재 정상 영업 중인 실제 음식점 3곳을 추천해주세요.
2. 각 식당의 이름(name), 카테고리(category), 대표 메뉴(menu), 추천 이유(reason)를 작성해주세요.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              name: { type: 'STRING' },
              category: { type: 'STRING' },
              menu: { type: 'STRING' },
              reason: { type: 'STRING' }
            },
            required: ['name', 'category', 'menu', 'reason']
          }
        }
      }
    });

    const rawText = response.text || '[]';
    const places = JSON.parse(rawText);

    return res.status(200).json({ result: places });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ 
      error: error.message.includes('429') 
        ? 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' 
        : '추천 정보를 불러오는 중 오류가 발생했습니다.' 
    });
  }
};
