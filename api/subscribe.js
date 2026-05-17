import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // GET — trả về VAPID public key cho client
    if (req.method === 'GET') {
        const publicKey = process.env.VAPID_PUBLIC_KEY;
        if (!publicKey) {
            return res.status(503).json({ error: 'Push chưa được cấu hình trên server.' });
        }
        return res.status(200).json({ publicKey });
    }

    // POST — lưu subscription mới
    if (req.method === 'POST') {
        try {
            const subscription = req.body;
            if (!subscription || !subscription.endpoint) {
                return res.status(400).json({ error: 'Subscription không hợp lệ.' });
            }

            // Lấy danh sách hiện tại
            let subs = await kv.get('wc2026:subscriptions') || [];

            // Kiểm tra trùng (theo endpoint)
            const exists = subs.some(s => s.endpoint === subscription.endpoint);
            if (!exists) {
                subs.push(subscription);
                await kv.set('wc2026:subscriptions', subs);
            }

            return res.status(201).json({ message: 'Đã đăng ký thông báo!', total: subs.length });
        } catch (error) {
            console.error('Subscribe error:', error);
            return res.status(500).json({ error: 'Lỗi lưu subscription.' });
        }
    }

    // DELETE — huỷ subscription
    if (req.method === 'DELETE') {
        try {
            const { endpoint } = req.body;
            if (!endpoint) {
                return res.status(400).json({ error: 'Thiếu endpoint.' });
            }

            let subs = await kv.get('wc2026:subscriptions') || [];
            subs = subs.filter(s => s.endpoint !== endpoint);
            await kv.set('wc2026:subscriptions', subs);

            return res.status(200).json({ message: 'Đã huỷ thông báo.', total: subs.length });
        } catch (error) {
            console.error('Unsubscribe error:', error);
            return res.status(500).json({ error: 'Lỗi huỷ subscription.' });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
}
