/**
 * Mock Payment Service for PDFToolskit
 * This service handles checkout session creation and payment state management.
 * In a production environment, this would integrate with Stripe or LemonSqueezy.
 */

export interface CheckoutOptions {
    planId: 'free' | 'pro';
    locale: string;
}

export const PLAN_IDS = {
    FREE: 'free',
    PRO: 'pro',
} as const;

export class PaymentService {
    /**
     * Simulates the creation of a checkout session and returns a redirect URL.
     */
    static async createCheckoutSession(options: CheckoutOptions): Promise<string> {
        console.log(`Creating checkout session for plan: ${options.planId} in locale: ${options.locale}`);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock redirection logic
        // In a real app, this would return the Stripe/LemonSqueezy Checkout URL.
        const baseUrl = window.location.origin;
        const lang = options.locale || 'en';

        if (options.planId === PLAN_IDS.PRO) {
            return `${baseUrl}/${lang}/pricing/success`;
        }

        return `${baseUrl}/${lang}/pricing/cancel`;
    }

    /**
     * Verifies if a payment was successful (Mock).
     */
    static async verifyPayment(sessionId: string): Promise<boolean> {
        console.log(`Verifying payment for session: ${sessionId}`);
        return true;
    }
}
