import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface AuditRecord {
    documentName: string;
    documentHash: string;
    signerName: string;
    timestamp: string;
    signerId: string;
    signatureHash: string;
    auditTrailId: string;
    cryptographicSignature?: string; // New: Base64 signature
    certificate?: string; // New: PEM certificate
    biometricDynamics?: string; // New: Forensic metadata summary
    securityLevel?: 'hardware' | 'protected' | 'software'; // New: HW security metadata
    zkProof?: string; // New: ZK-ID Proof
    zkProvider?: string; // New: ZK-ID Provider (WorldID, etc.)
    anchoringTx?: string; // New: Blockchain TX Hash
    anchoringNetwork?: string; // New: Blockchain Network (Base, Arbitrum)
    storageCid?: string; // New: IPFS/Filecoin Storage CID
    forensicHumanityScore?: number; // Phase 5: AI Humanity Score
    entropyScore?: number; // Phase 5: Movement Entropy
    velocityStability?: number; // Phase 5: Velocity Consistency
    rhythmScore?: number; // Phase 5: Rhythm Metrics
}

export class AuditService {
    /**
     * Appends a Certificate of Authenticity to a PDF document.
     */
    static async appendCertificate(
        pdfDoc: PDFDocument,
        record: AuditRecord
    ): Promise<void> {
        const page = pdfDoc.addPage([595.28, 841.89]); // A4
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const fontCourier = await pdfDoc.embedFont(StandardFonts.Courier);
        const { width, height } = page.getSize();

        // Header Background
        page.drawRectangle({
            x: 0,
            y: height - 120,
            width: width,
            height: 120,
            color: rgb(0.05, 0.1, 0.2), // Deep Blue
        });

        // Title
        page.drawText('CERTIFICATE OF AUTHENTICITY', {
            x: 50,
            y: height - 60,
            size: 24,
            font: fontBold,
            color: rgb(1, 1, 1),
        });

        page.drawText('Secure Digital Signature Verification (PAdES-Compliant Structure)', {
            x: 50,
            y: height - 85,
            size: 10,
            font: font,
            color: rgb(0.7, 0.8, 1),
        });

        // Audit Details
        let yPos = height - 180;
        const lineSpacing = 35;

        const drawField = (label: string, value: string, isMono = false) => {
            page.drawText(label.toUpperCase(), {
                x: 50,
                y: yPos,
                size: 8,
                font: fontBold,
                color: rgb(0.4, 0.4, 0.4),
            });
            page.drawText(value, {
                x: 50,
                y: yPos - 15,
                size: isMono ? 7 : 11,
                font: isMono ? fontCourier : font,
                color: rgb(0.1, 0.1, 0.1),
            });
            yPos -= lineSpacing + 15;
        };

        drawField('Document Name', record.documentName);
        drawField('Document Hash (SHA-256)', record.documentHash);
        drawField('Execution Timestamp', record.timestamp);
        drawField('Signer ID', record.signerId);
        drawField('Signature Integrity Hash', record.signatureHash);

        if (record.certificate) {
            // Draw certificate PEM block (first and last lines for brevity)
            const lines = record.certificate.split('\n');
            const summary = `${lines[0]} ... ${lines[lines.length - 1]}`;
            drawField('Signer Certificate (Public Key)', summary, true);
        }

        if (record.cryptographicSignature) {
            drawField('Cryptographic Seal (Base64)', record.cryptographicSignature.substring(0, 64) + '...', true);
        }

        if (record.biometricDynamics) {
            drawField('Biometric Dynamics (Forensic Snapshot)', record.biometricDynamics);
        }

        if (record.securityLevel) {
            const levelLabel = record.securityLevel.toUpperCase();
            const levelDesc = record.securityLevel === 'hardware'
                ? 'TPM/Secure Enclave Isolation (Ultra-High)'
                : record.securityLevel === 'protected'
                    ? 'Non-Extractable Software Guard (High)'
                    : 'Software-Only/Legacy (Standard)';

            drawField('Hardware Security Level', `${levelLabel} - ${levelDesc}`);
        }

        if (record.zkProof) {
            drawField('Identity Verification (ZK-ID)', `Verified via ${record.zkProvider?.toUpperCase() || 'ZK-PROVIDER'}`);
            drawField('ZK-Proof (Nullifier/Hash)', record.zkProof.substring(0, 64) + '...', true);
        }

        if (record.anchoringTx) {
            drawField('Blockchain Anchor (L2)', `Indubitable Proof anchored on ${record.anchoringNetwork?.toUpperCase() || 'L2-NETWORK'}`);
            drawField('Transaction Hash', record.anchoringTx, true);
        }

        if (record.storageCid) {
            drawField('Sovereign Storage (IPFS)', `Permanent CID: ${record.storageCid}`);
        }

        if (record.forensicHumanityScore !== undefined) {
            yPos -= 10;
            page.drawText('AI FORENSIC INTEGRITY ANALYSIS', {
                x: 50,
                y: yPos,
                size: 9,
                font: fontBold,
                color: rgb(0.1, 0.4, 0.1),
            });
            yPos -= 20;

            drawField('Humanity Score', `${record.forensicHumanityScore}% - ${record.forensicHumanityScore > 80 ? 'Genuine Human Dynamics' : 'High Variance/Potential Forgery'}`);
            drawField('Signing DNA Metrics', `Entropy: ${record.entropyScore} | Stability: ${record.velocityStability} | Rhythm: ${record.rhythmScore}`);
        }

        // Footer / Seal
        page.drawRectangle({
            x: 50,
            y: 100,
            width: width - 100,
            height: 1,
            color: rgb(0.9, 0.9, 0.9),
        });

        const sealSize = 60;
        page.drawCircle({
            x: width - 100,
            y: 150,
            size: sealSize,
            borderWidth: 2,
            borderColor: rgb(0.1, 0.4, 0.8),
            color: rgb(1, 1, 1),
        });

        page.drawText('SECURE', {
            x: width - 120,
            y: 153,
            size: 8,
            font: fontBold,
            color: rgb(0.1, 0.4, 0.8),
        });

        page.drawText('SEAL', {
            x: width - 115,
            y: 142,
            size: 8,
            font: fontBold,
            color: rgb(0.1, 0.4, 0.8),
        });

        page.drawText('This document has been cryptographically signed and archived via PDF Toolkit Docu-Pro SENTINEL engine.', {
            x: 50,
            y: 80,
            size: 8,
            font: font,
            color: rgb(0.6, 0.6, 0.6),
        });
    }

    /**
     * Helper to generate a unique hash for a signature blob
     */
    static async generateHash(data: Uint8Array): Promise<string> {
        // @ts-expect-error - Fixed potential buffer type mismatch in certain envs
        const hashBuffer = await crypto.subtle.digest('SHA-256', data.buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
}
