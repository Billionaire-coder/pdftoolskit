const fs = require('fs');
const path = require('path');

const languages = [
    'fr', 'de', 'it', 'pt', 'ja', 'ru', 'ko', 'zh-CN', 'zh-TW',
    'ar', 'bg', 'ca', 'nl', 'el', 'hi', 'id', 'ms', 'pl', 'sv', 'th', 'tr',
    'uk', 'vi', 'ur'
];

const sourceDir = path.join(__dirname, '../public/locales/en');
const targetBaseDir = path.join(__dirname, '../public/locales');

const commonJson = fs.readFileSync(path.join(sourceDir, 'common.json'), 'utf8');

languages.forEach(lang => {
    const langDir = path.join(targetBaseDir, lang);
    if (!fs.existsSync(langDir)) {
        fs.mkdirSync(langDir, { recursive: true });
    }
    fs.writeFileSync(path.join(langDir, 'common.json'), commonJson);
    console.log(`Created ${lang}/common.json`);
});
