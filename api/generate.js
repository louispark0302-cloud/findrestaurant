const { GoogleGenerativeAI } = require('@google/generative-ai');

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
    return res.status(500).json({ error: 'Vercel 설정에서 GEMINI_API_KEY를 확인해주세요.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // 가장 안정적이고 빠른 1.5-flash 모델 사용
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

    const prompt = `
사용자 위치: 위도 ${latitude}, 경도 ${longitude}
사용자 현재 기분: "${mood}"

당신은 전문 맛집 큐레이터입니다. 
위의 위도/경도 주변 지역에서 사용자의 기분에 딱 맞는 **실제 음식점/상호명 3곳**을 찾아서 추천해주세요.

응답 조건:
1. 사용자의 기분에 대한 공감 한 줄
2. **실제 추천 음식점 3곳 (정확한 매장 이름 포함)**
   - 매장명: [정확한 가게 이름]
   - 대표 메뉴: [추천 메뉴]
   - 추천 이유: [이 기분에 이 매장을 추천하는 이유]
3. 답변은 깔끔한 마크다운 형식으로 작성해주세요.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return res.status(200).json({ result: responseText });
  } catch (error) {
    console.error('Gemini API Error:', error);
    // 자세한 에러 메시지를 응답으로 전달하여 원인 파악을 돕습니다.
    return res.status(500).json({ 
      error: `AI 처리 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}` 
    });
  }
};
