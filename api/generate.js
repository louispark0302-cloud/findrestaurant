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
    // 최신 GoogleGenAI 클라이언트 생성
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
현재 위치 정보: 위도 ${latitude}, 경도 ${longitude}
사용자 기분/원하는 분위기: "${mood}"

[요청 사항]
1. 구글 검색을 활용하여 위 위도/경도 근처에서 **현재 정상 영업 중인 실제 음식점 3곳**을 찾으세요.
2. **폐업했거나 영업을 중단한 식당은 절대로 포함하지 마세요.**
3. 검증된 실제 매장명과 대표 메뉴, 그리고 사용자의 기분에 왜 어울리는지 이유를 명확하고 친절하게 설명해 주세요.
`;

    // gemini-3.1-flash-lite 모델 호출 및 구글 검색 도구 설정
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    return res.status(200).json({ result: response.text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
