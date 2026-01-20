// Shim crypto for Node.js
if (!global.crypto) {
    global.crypto = require('crypto').webcrypto;
}
global.window = { crypto: global.crypto }; // Shim window for browser-like detection

// Try UMD version
const { PDFDocument } = require('pdf-lib/dist/pdf-lib.js');

async function testEncryption() {
    console.log('--- Starting Encryption Test ---');
    try {
        // 1. Create a simple PDF
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        page.drawText('This is a secret document', { x: 50, y: 500 });

        // 2. Encrypt and Save
        const password = 'testpassword';
        console.log(`Encrypting with password: ${password}`);

        console.log('Has encrypt method?', typeof pdfDoc.encrypt);

        if (typeof pdfDoc.encrypt === 'function') {
            console.log('Using .encrypt() method...');
            await pdfDoc.encrypt({
                userPassword: password,
                ownerPassword: password,
                permissions: {
                    printing: 'highResolution',
                    modifying: false,
                    copying: false,
                    annotating: false,
                    fillingForms: false,
                    contentAccessibility: false,
                    documentAssembly: false,
                }
            });
            // Then save without options (encryption already applied?)
            // Actually, if using encrypt(), you usually just save().
            // But let's see what happens.
        } else {
            console.log('.encrypt() method missing. Relying on save options.');
        }

        const encryptedBytes = await pdfDoc.save({
            userPassword: (typeof pdfDoc.encrypt === 'function') ? undefined : password,
            ownerPassword: (typeof pdfDoc.encrypt === 'function') ? undefined : password,
            permissions: (typeof pdfDoc.encrypt === 'function') ? undefined : {
                printing: 'highResolution',
                modifying: false,
                copying: false,
                annotating: false,
                fillingForms: false,
                contentAccessibility: false,
                documentAssembly: false,
            }
        });

        console.log(`Saved bytes length: ${encryptedBytes.length}`);

        // 3. Try to Load WITHOUT password (should fail)
        console.log('Attempting to load without password (expecting failure)...');
        try {
            await PDFDocument.load(encryptedBytes, { ignoreEncryption: false });
            console.error('FAILED: Loaded successfully without password! Encryption did NOT work.');
        } catch (e) {
            if (e.message.includes('encrypted')) {
                console.log('SUCCESS: Could not load without password. Error matches expected: ' + e.message);
            } else {
                console.log('Partial Success? Error was thrown but unexpected: ' + e.message);
            }
        }

        // 4. Try to Load WITH password (should succeed)
        console.log('Attempting to load WITH password...');
        try {
            const loadedPdf = await PDFDocument.load(encryptedBytes, { password: password });
            console.log('SUCCESS: Loaded successfully with password.');
        } catch (e) {
            console.error('FAILED: Could not load with correct password.', e);
        }

    } catch (error) {
        console.error('Fatal Test Error:', error);
    }
}

testEncryption();
