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
    return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
현재 위치 정보: 위도 ${latitude}, 경도 ${longitude}
사용자 기분/원하는 분위기: "${mood}"

[요청 사항]
1. 위 위도/경도 위치 근처에서 사용자의 기분에 어울리는 대표 맛집 3곳을 추천해 주세요.
2. 각 매장명과 대표 메뉴, 그 이유를 친절하게 설명해 주세요.
`;

    // 💡 tools(구글 검색) 옵션을 제거하면 무료 API 키에서도 429 에러가 사라집니다.
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash', 
      contents: prompt
    });

    return res.status(200).json({ result: response.text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
