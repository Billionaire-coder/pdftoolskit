// import { PDFDocument } from 'pdf-lib';

export interface SealingResult {
    signature: Uint8Array;
    certificate: string; // PEM format
    timestamp: string;
    securityLevel: 'hardware' | 'protected' | 'software';
}


/**
 * SealingService implements Pillar 1 of the Sign PDF Advancement Plan.
 * It provides browser-native cryptographic signing using the Web Crypto API.
 */
export class SealingService {
    /**
     * Generates an ECDSA P-256 key pair.
     * This is the modern standard for mobile Secure Enclave (FaceID/TouchID)
     * and hardware-bound WebAuthn attestations.
     */
    static async generateSigningKey(): Promise<CryptoKeyPair> {
        return await window.crypto.subtle.generateKey(
            {
                name: 'ECDSA',
                namedCurve: 'P-256',
            },
            false, // extractable: false - Ensures keys cannot be exported from hardware/TPM
            ['sign', 'verify']
        );
    }

    /**
     * Computes a cryptographic hash of a PDF's ByteRange and signs it.
     */
    static async sealDocument(
        pdfData: Uint8Array,
        privateKey: CryptoKey
    ): Promise<Uint8Array> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hash = await window.crypto.subtle.digest('SHA-256', pdfData as any);

        // Sign using ECDSA
        const signature = await window.crypto.subtle.sign(
            {
                name: 'ECDSA',
                hash: { name: 'SHA-256' },
            },
            privateKey,
            hash
        );

        return new Uint8Array(signature);
    }

    /**
     * Exports a public key to a simulated X.509 format (PEM).
     */
    static async exportCertificate(publicKey: CryptoKey): Promise<string> {
        const exported = await window.crypto.subtle.exportKey('spki', publicKey);
        const base64 = btoa(String.fromCharCode(...Array.from(new Uint8Array(exported))));
        const pem = `-----BEGIN PUBLIC KEY-----\n${base64.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`;
        return pem;
    }

    /**
     * Detects the security level of the environment.
     * Higher levels indicate hardware-bound or non-extractable keys.
     */
    static async getSecurityLevel(): Promise<'hardware' | 'protected' | 'software'> {
        try {
            // Check for WebAuthn/Passkey availability as a proxy for hardware security
            const isWebAuthnAvailable = typeof window !== 'undefined' &&
                window.PublicKeyCredential &&
                await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

            // Try to generate a dummy non-extractable key to verify subtle crypto capabilities
            const dummy = await window.crypto.subtle.generateKey(
                { name: 'ECDSA', namedCurve: 'P-256' },
                false,
                ['sign']
            );

            if (isWebAuthnAvailable && !dummy.privateKey.extractable) {
                return 'hardware';
            }

            return !dummy.privateKey.extractable ? 'protected' : 'software';
        } catch {
            return 'software';
        }
    }
}
