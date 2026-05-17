import webpush from 'web-push';
import { kv } from '@vercel/kv';

// ========== VERCEL CRON: /api/notify ==========
// Chạy mỗi 5 phút, kiểm tra trận đấu & gửi Push Notification
export default async function handler(req, res) {
    // Bảo vệ endpoint — chỉ cho phép Vercel Cron hoặc request có đúng secret
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Cấu hình VAPID
        webpush.setVapidDetails(
            process.env.VAPID_EMAIL || 'mailto:admin@wc2026.app',
            process.env.VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );

        const API_KEY = process.env.FOOTBALL_API_KEY;
        if (!API_KEY) {
            return res.status(200).json({ message: 'Skipped: No API key configured.', sent: 0 });
        }

        // Lấy trận đấu hôm nay từ Football-Data.org
        const today = new Date().toISOString().split('T')[0];
        const apiUrl = `https://api.football-data.org/v4/competitions/2000/matches?dateFrom=${today}&dateTo=${today}`;

        const apiRes = await fetch(apiUrl, {
            headers: { 'X-Auth-Token': API_KEY }
        });

        if (!apiRes.ok) {
            console.error(`Football API error: ${apiRes.status}`);
            return res.status(200).json({ message: `API error ${apiRes.status}`, sent: 0 });
        }

        const apiData = await apiRes.json();
        const matches = apiData.matches || [];

        // Lấy state cũ từ KV
        const oldState = await kv.get('wc2026:match_state') || {};
        const newState = {};
        const events = [];

        for (const match of matches) {
            const mid = match.id;
            const old = oldState[mid] || {};
            const home = match.homeTeam?.shortName || match.homeTeam?.name || '?';
            const away = match.awayTeam?.shortName || match.awayTeam?.name || '?';
            const status = match.status;
            const homeScore = match.score?.fullTime?.home ?? match.score?.halfTime?.home ?? 0;
            const awayScore = match.score?.fullTime?.away ?? match.score?.halfTime?.away ?? 0;
            const totalGoals = homeScore + awayScore;

            // Lưu state mới
            newState[mid] = {
                status,
                homeScore,
                awayScore,
                totalGoals,
                lineupSent: old.lineupSent || false,
                kickoffSent: old.kickoffSent || false,
                finishedSent: old.finishedSent || false
            };

            // --- Phát hiện sự kiện ---

            // 1. Kick-off
            if (status === 'IN_PLAY' && old.status !== 'IN_PLAY' && !old.kickoffSent) {
                events.push({
                    tag: `kickoff-${mid}`,
                    title: '⚽ Trận đấu bắt đầu!',
                    body: `${home} vs ${away} — Bóng đã lăn!`,
                    icon: '/icon-192.png',
                    vibrate: [200, 100, 200],
                    requireInteraction: false
                });
                newState[mid].kickoffSent = true;
            }

            // 2. Bàn thắng
            if (totalGoals > (old.totalGoals || 0) && status === 'IN_PLAY') {
                events.push({
                    tag: `goal-${mid}-${totalGoals}`,
                    title: '🎉 BÀN THẮNG!',
                    body: `${home} ${homeScore} - ${awayScore} ${away}`,
                    icon: '/icon-192.png',
                    vibrate: [200, 100, 200, 100, 200],
                    requireInteraction: true
                });
            }

            // 3. Hiệp phụ
            if (status === 'EXTRA_TIME' && old.status !== 'EXTRA_TIME') {
                events.push({
                    tag: `extra-${mid}`,
                    title: '⏰ Hiệp phụ!',
                    body: `${home} ${homeScore} - ${awayScore} ${away} — Vào hiệp phụ!`,
                    icon: '/icon-192.png',
                    vibrate: [200, 100, 200]
                });
            }

            // 4. Penalty
            if (status === 'PENALTY_SHOOTOUT' && old.status !== 'PENALTY_SHOOTOUT') {
                events.push({
                    tag: `penalty-${mid}`,
                    title: '🎯 Loạt luân lưu!',
                    body: `${home} vs ${away} — Penalty shootout!`,
                    icon: '/icon-192.png',
                    vibrate: [200, 100, 200, 100, 200, 100, 200],
                    requireInteraction: true
                });
            }

            // 5. Kết thúc trận
            if (status === 'FINISHED' && old.status !== 'FINISHED' && !old.finishedSent) {
                events.push({
                    tag: `finished-${mid}`,
                    title: '🏁 Kết thúc trận!',
                    body: `${home} ${homeScore} - ${awayScore} ${away} — Trận đấu kết thúc!`,
                    icon: '/icon-192.png',
                    vibrate: [200, 100, 200]
                });
                newState[mid].finishedSent = true;
            }
        }

        // Lưu state mới vào KV
        await kv.set('wc2026:match_state', { ...oldState, ...newState });

        // Gửi push cho tất cả subscribers
        let sentCount = 0;
        if (events.length > 0) {
            let subs = await kv.get('wc2026:subscriptions') || [];
            const expiredEndpoints = [];

            for (const sub of subs) {
                for (const event of events) {
                    try {
                        await webpush.sendNotification(sub, JSON.stringify(event));
                        sentCount++;
                    } catch (err) {
                        console.error(`Push failed for ${sub.endpoint}:`, err.statusCode);
                        // 410 Gone = subscription hết hạn
                        if (err.statusCode === 410 || err.statusCode === 404) {
                            expiredEndpoints.push(sub.endpoint);
                        }
                    }
                }
            }

            // Dọn dẹp subscription hết hạn
            if (expiredEndpoints.length > 0) {
                subs = subs.filter(s => !expiredEndpoints.includes(s.endpoint));
                await kv.set('wc2026:subscriptions', subs);
                console.log(`Cleaned ${expiredEndpoints.length} expired subscriptions.`);
            }
        }

        return res.status(200).json({
            message: 'OK',
            matchesChecked: matches.length,
            eventsDetected: events.length,
            notificationsSent: sentCount
        });

    } catch (error) {
        console.error('Notify cron error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
