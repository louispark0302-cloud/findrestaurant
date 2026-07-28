const { GoogleGenerativeAI } = require('@google/generative-ai');

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
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 구글 검색 도구(Google Search) 활성화
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      tools: [{ googleSearch: {} }]
    });

    const prompt = `
현재 사용자 위치 정보: 위도 ${latitude || 37.5665}, 경도 ${longitude || 126.9780} (${address || '현재 위치'})
사용자 기분/원하는 분위기: "${mood}"

[요구사항]
1. 위 위도/경도(또는 주소) 기준 반경 2km 이내에서 **현재 정상 영업 중인 실제 음식점 3곳**을 구글 검색을 통해 찾으세요.
2. 폐업했거나 멀리 떨어진 타 지역 식당은 절대로 포함하지 마세요.
3. 다른 서술문이나 마크다운 설명 없이, 오직 아래 **JSON 배열 양식**으로만 응답하세요.

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let rawText = response.text() || '';

    // JSON 배열 부분만 정규식으로 안전하게 추출
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('AI 응답에서 JSON 데이터 형식을 찾을 수 없습니다.');
    }

    const places = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ result: places });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: `추천 생성 중 오류 발생: ${error.message || '서버 오류'}` });
  }
};
