import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

export async function checkSubscription() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return {
            isAuthorized: false,
            error: 'Unauthorized',
            status: 401
        };
    }

    // Real Subscription Check
    // We check if the user object has the pro flag from the database/session
    const isPro = session.user.image === 'pro' || (session.user as any).isPro === true;

    if (!isPro) {
        return {
            isAuthorized: false,
            error: 'Premium subscription required.',
            status: 403
        };
    }

    return {
        isAuthorized: true,
        user: session.user
    };
}
