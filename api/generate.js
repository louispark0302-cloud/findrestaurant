const { GoogleGenAI } = require('@google/genai');

module.exports = async function handler(req, res) {
  // 항상 JSON 응답 헤더 설정
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { latitude, longitude, address, mood } = req.body || {};

  if (!mood) {
    return res.status(400).json({ error: '기분을 입력해주세요.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
[사용자 위치 정보]
- 위도: ${latitude || 37.5665}
- 경도: ${longitude || 126.9780}
- 위치/주소: "${address || '위치 정보 기반 동네'}"

[사용자 기분/요청]
- "${mood}"

[요구사항]
1. 위 위치 근처에서 실제 영업 중인 대표 맛집 3곳을 추천해주세요.
2. 마크다운 태그나 인사말 없이 오직 pure JSON Array 데이터만 응답하세요.

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

    // gemini-2.0-flash 사용
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt
    });

    let rawText = response.text || '';
    
    // JSON 배열 부분만 정규식으로 안전하게 추출
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('AI 결과에서 JSON 형식을 추출하지 못했습니다.');
    }

    const places = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ result: places });

  } catch (error) {
    console.error('Gemini API Error Detail:', error);
    
    // 429 할당량 초과 에러일 경우 친절한 안내
    if (error.message && error.message.includes('429')) {
      return res.status(429).json({ error: 'Gemini API 호출 한도(Quota)가 초과되었습니다. 잠시 후 다시 시도해 주세요.' });
    }

    return res.status(500).json({ error: `추천 생성 실패: ${error.message || '알 수 없는 오류'}` });
  }
};
