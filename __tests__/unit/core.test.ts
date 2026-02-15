
import { describe, it, expect, vi } from 'vitest';
import { cn, formatFileSize, parsePageRange } from '@/lib/utils';
import { PaymentService } from '@/lib/services/payments';

describe('Core Utilities (lib/utils.ts)', () => {
    describe('cn', () => {
        it('should merge tailwind classes correctly', () => {
            expect(cn('p-4', 'bg-red-500')).toBe('p-4 bg-red-500');
            expect(cn('p-4', { 'bg-red-500': true, 'bg-blue-500': false })).toBe('p-4 bg-red-500');
        });
    });

    describe('formatFileSize', () => {
        it('should format bytes to human readable strings', () => {
            expect(formatFileSize(0)).toBe('0 Bytes');
            expect(formatFileSize(1024)).toBe('1 KB');
            expect(formatFileSize(1024 * 1024)).toBe('1 MB');
        });
    });

    describe('parsePageRange', () => {
        it('should parse complex page ranges correctly', () => {
            expect(parsePageRange('1-3, 5', 10)).toEqual([0, 1, 2, 4]);
            expect(parsePageRange('2, 4-6', 10)).toEqual([1, 3, 4, 5]);
            expect(parsePageRange('', 5)).toEqual([0, 1, 2, 3, 4]);
        });
    });
});

describe('Payment Service (lib/services/payments.ts)', () => {
    it('should create a checkout session URL for Pro plan', async () => {
        const url = await PaymentService.createCheckoutSession({ planId: 'pro', locale: 'en' });
        expect(url).toContain('/en/pricing/success');
    });

    it('should create a checkout session URL for Free plan (cancel)', async () => {
        const url = await PaymentService.createCheckoutSession({ planId: 'free', locale: 'fr' });
        expect(url).toContain('/fr/pricing/cancel');
    });
});
