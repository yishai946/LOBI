import { Router } from 'express';
import { subscribeToPush, unsubscribeFromPush, getNotificationSettings, updateNotificationSettings } from '../controllers/push.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/subscribe', authMiddleware, subscribeToPush);
router.post('/unsubscribe', authMiddleware, unsubscribeFromPush);
router.get('/settings', authMiddleware, getNotificationSettings);
router.put('/settings', authMiddleware, updateNotificationSettings);

export default router;
