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
1. 위 위치 근처에서 현재 정상 영업 중인 실제 음식점 3곳을 추천하세요.
2. 마크다운이나 다른 설명 문구 없이, 오직 아래 JSON 배열 양식으로만 응답하세요.

[응답 JSON 양식]
[
  {
    "name": "식당 이름",
    "category": "음식 카테고리 (예: 한식, 이탈리안)",
    "menu": "대표 메뉴명",
    "reason": "추천 이유 (2~3문장)"
  }
]
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let rawText = response.text || '';
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('JSON 구조 생성 실패');
    }

    const places = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ result: places });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
