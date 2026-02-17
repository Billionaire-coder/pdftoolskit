import fs from 'fs';
import path from 'path';

const REQUIRED_ENV_VARS = [
    // 'NEXTAUTH_SECRET',
    // 'NEXTAUTH_URL',
    // Add other required vars here as the project grows
];

function validateEnv() {
    console.log('🔍 Validating environment variables...');

    // 1. Load .env file manually if it exists
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                const key = match[1];
                let value = (match[2] || '').trim();
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
                process.env[key] = value;
            }
        });
    }

    // 2. Determine mandatory vs optional
    const examplePath = path.resolve(process.cwd(), '.env.example');
    let allExampleVars = [];
    if (fs.existsSync(examplePath)) {
        const content = fs.readFileSync(examplePath, 'utf8');
        const matches = content.match(/^[^#\s][^=]*/gm) || [];
        allExampleVars = Array.from(new Set(matches.map(v => v.trim())));
    }

    const strictlyRequiredMissing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
    const optionalMissing = allExampleVars.filter(v => !process.env[v] && !REQUIRED_ENV_VARS.includes(v));

    if (strictlyRequiredMissing.length > 0) {
        console.error('❌ Missing REQUIRED environment variables:');
        strictlyRequiredMissing.forEach(v => console.error(`   - ${v}`));
        console.error('\nThese variables are mandatory for the application to function.');
        process.exit(1);
    }

    if (optionalMissing.length > 0) {
        if (process.env.NODE_ENV === 'production') {
            console.warn('⚠️  Optional environment variables are missing (Production):');
            optionalMissing.forEach(v => console.warn(`   - ${v}`));
            console.warn('The application will still build, but some features may be disabled.');
        } else {
            console.warn('💡 Some optional environment variables are missing (Local Dev):');
            optionalMissing.forEach(v => console.warn(`   - ${v}`));
        }
    } else {
        console.log('✅ Environment validation passed.');
    }
}

validateEnv();
