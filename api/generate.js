const { GoogleGenAI } = require('@google/genai');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { latitude, longitude, address, mood } = req.body || {};

  if (!mood) {
    return res.status(400).json({ error: '기분을 입력해주세요.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
[사용자 현재 위치 정보]
- 위도: ${latitude || 37.5665}
- 경도: ${longitude || 126.9780}
- 행정구역/주소: "${address || '위치 정보 기반 동네'}"

[사용자 기분/원하는 분위기]
- "${mood}"

[요구사항]
1. 위 위치(반경 2km 이내)에서 실제 영업 중인 대표 맛집 3곳을 선정해 주세요.
2. 타 지역 식당은 제외해 주세요.
3. 다른 인사말이나 마크다운 설명 없이, 반드시 아래 형식의 Pure JSON Array로만 응답하세요.

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
      model: 'gemini-2.0-flash',
      contents: prompt
    });

    let rawText = response.text || '';
    
    // JSON 문자열만 정교하게 추출 (```json ... ``` 및 앞뒤 서술어 제거)
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('AI 응답에서 JSON 배열을 찾을 수 없습니다.');
    }

    const places = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ result: places });

  } catch (error) {
    console.error('Gemini API Error Detail:', error);
    return res.status(500).json({ error: `추천 생성 실패: ${error.message}` });
  }
};
