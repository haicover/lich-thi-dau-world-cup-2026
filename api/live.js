export default async function handler(req, res) {
    // Chỉ cho phép GET request
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const API_KEY = process.env.FOOTBALL_API_KEY;
        
        // Cấu hình CORS (Cho phép frontend gọi)
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

        // Trả về data mock nếu chưa config API key để app không chết
        if (!API_KEY) {
            return res.status(200).json({
                note: "MOCK DATA (Missing FOOTBALL_API_KEY env variable)",
                matches: []
            });
        }

        // Gọi API của Football-Data.org (ID 2000 là World Cup)
        // Chúng ta fetch các trận đấu đang diễn ra hoặc trong ngày hôm nay
        const response = await fetch('https://api.football-data.org/v4/competitions/2000/matches', {
            headers: {
                'X-Auth-Token': API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();

        // CACHING QUAN TRỌNG: (Tránh bị rate limit 10 req/min)
        // s-maxage=60: Cache trên CDN Edge của Vercel trong 60s
        // stale-while-revalidate=30: Trả về data cũ tối đa 30s nữa trong khi ngầm fetch cái mới
        res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
        
        return res.status(200).json(data);
    } catch (error) {
        console.error('API Proxy Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
