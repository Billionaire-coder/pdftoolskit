const fs = require('fs');
const path = require('path');

const translations = {
    de: {
        nav: { home: "Startseite", tools: "Werkzeuge", blog: "Blog", about: "Über uns", settings: "Einstellungen" },
        hero: { title: "Alle Werkzeuge für Ihre", titleHighlight: "PDF-Produktivität", description: "Konvertieren, zusammenfügen, teilen und bearbeiten Sie PDF-Dateien mühelos. 100% kostenlose und sichere Verarbeitung direkt in Ihrem Browser.", start: "Loslegen", github: "Auf GitHub bewerten" },
        tools: { htmlToPdf: "Webseite zu PDF", htmlToPdfDesc: "Erfassen Sie ganze Webseiten als hochauflösende PDFs." }
    },
    it: {
        nav: { home: "Home", tools: "Strumenti", blog: "Blog", about: "Chi siamo", settings: "Impostazioni" },
        hero: { title: "Tutti gli strumenti per la tua", titleHighlight: "Produttività PDF", description: "Converti, unisci, dividi e modifica file PDF senza sforzo. Elaborazione sicura e gratuita al 100% direttamente nel tuo browser.", start: "Inizia", github: "Stella su GitHub" },
        tools: { htmlToPdf: "Sito web a PDF", htmlToPdfDesc: "Cattura intere pagine web come PDF ad alta fedeltà." }
    },
    pt: {
        nav: { home: "Início", tools: "Ferramentas", blog: "Blog", about: "Sobre", settings: "Configurações" },
        hero: { title: "Todas as ferramentas para sua", titleHighlight: "Produtividade em PDF", description: "Converta, una, divida e edite arquivos PDF sem esforço. Processamento 100% gratuito e seguro diretamente no seu navegador.", start: "Começar", github: "Estrela no GitHub" },
        tools: { htmlToPdf: "Web para PDF", htmlToPdfDesc: "Capture páginas da web completas como PDFs de alta fidelidade." }
    },
    ja: {
        nav: { home: "ホーム", tools: "ツール", blog: "ブログ", about: "概要", settings: "設定" },
        hero: { title: "あなたのためのすべてのツール", titleHighlight: "PDFの生産性", description: "PDFファイルの変換、結合、分割、編集を簡単に行えます。ブラウザで直接、100％無料かつ安全に処理されます。", start: "始める", github: "GitHubでスター" },
        tools: { htmlToPdf: "ウェブサイトからPDF", htmlToPdfDesc: "ウェブページ全体を高忠実度のPDFとしてキャプチャします。" }
    },
    ru: {
        nav: { home: "Главная", tools: "Инструменты", blog: "Блог", about: "О нас", settings: "Настройки" },
        hero: { title: "Все инструменты для вашей", titleHighlight: "PDF Продуктивности", description: "Конвертируйте, объединяйте, разделяйте и редактируйте PDF-файлы без усилий. 100% бесплатная и безопасная обработка прямо в вашем браузере.", start: "Начать", github: "Звезда на GitHub" },
        tools: { htmlToPdf: "Веб-сайт в PDF", htmlToPdfDesc: "Захват полных веб-страниц в виде высококачественных PDF." }
    },
    ko: {
        nav: { home: "홈", tools: "도구", blog: "블로그", about: "소개", settings: "설정" },
        hero: { title: "당신을 위한 모든 도구", titleHighlight: "PDF 생산성", description: "PDF 파일을 손쉽게 변환, 병합, 분할 및 편집하세요. 브라우저에서 직접 100% 무료로 안전하게 처리됩니다.", start: "시작하기", github: "GitHub 별주기" },
        tools: { htmlToPdf: "웹사이트를 PDF로", htmlToPdfDesc: "웹페이지 전체를 고품질 PDF로 캡처하세요." }
    },
    "zh-CN": {
        nav: { home: "首页", tools: "工具", blog: "博客", about: "关于", settings: "设置" },
        hero: { title: "您需要的所有工具", titleHighlight: "PDF 生产力", description: "轻松转换、合并、拆分和编辑 PDF 文件。100% 免费且安全，直接在您的浏览器中处理。", start: "开始使用", github: "GitHub 点赞" },
        tools: { htmlToPdf: "网页转 PDF", htmlToPdfDesc: "将完整网页捕获为高保真 PDF。" }
    },
    "zh-TW": {
        nav: { home: "首頁", tools: "工具", blog: "部落格", about: "關於", settings: "設定" },
        hero: { title: "您需要的所有工具", titleHighlight: "PDF 生產力", description: "輕鬆轉換、合併、拆分和編輯 PDF 文件。100% 免費且安全，直接在您的瀏覽器中處理。", start: "開始使用", github: "GitHub 點讚" },
        tools: { htmlToPdf: "網頁轉 PDF", htmlToPdfDesc: "將完整網頁擷取為高保真 PDF。" }
    },
    ar: {
        nav: { home: "الرئيسية", tools: "الأدوات", blog: "المدونة", about: "حول", settings: "الإعدادات" },
        hero: { title: "كل الأدوات التي تحتاجها لـ", titleHighlight: "إنتاجية PDF", description: "قم بتحويل ودمج وتقسيم وتحرير ملفات PDF بسهولة. معالجة مجانية وآمنة بنسبة 100% مباشرة في متصفحك.", start: "ابدأ الآن", github: "نجمة على GitHub" },
        tools: { htmlToPdf: "موقع ويب إلى PDF", htmlToPdfDesc: "التقاط صفحات الويب الكاملة كملفات PDF عالية الدقة." }
    },
    hi: {
        nav: { home: "होम", tools: "टूल्स", blog: "ब्लॉग", about: "हमारे बारे में", settings: "सेटिंग्स" },
        hero: { title: "आपकी आवश्यकता के सभी उपकरण", titleHighlight: "PDF उत्पादकता", description: "आसानी से पीडीएफ फाइलों को कन्वर्ट, मर्ज, स्प्लिट और एडिट करें। 100% मुफ्त और सुरक्षित प्रोसेसिंग सीधे आपके ब्राउज़र में।", start: "शुरू करें", github: "GitHub पर स्टार दें" },
        tools: { htmlToPdf: "वेबसाइट से PDF", htmlToPdfDesc: "पूर्ण वेब पेजों को हाई-फिडेलिटी पीडीएफ के रूप में कैप्चर करें।" }
    },
    tr: {
        nav: { home: "Ana Sayfa", tools: "Araçlar", blog: "Blog", about: "Hakkında", settings: "Ayarlar" },
        hero: { title: "İhtiyacınız olan tüm araçlar", titleHighlight: "PDF Üretkenliği", description: "PDF dosyalarını zahmetsizce dönüştürün, birleştirin, bölün ve düzenleyin. %100 ücretsiz ve güvenli işlem doğrudan tarayıcınızda.", start: "Başla", github: "GitHub'da Yıldızla" },
        tools: { htmlToPdf: "Web Sitesinden PDF'e", htmlToPdfDesc: "Tam web sayfalarını yüksek kaliteli PDF olarak yakalayın." }
    },
    bg: {
        nav: { home: "Начало", tools: "Инструменти", blog: "Блог", about: "За нас", settings: "Настройки" },
        hero: { title: "Всички инструменти за вашата", titleHighlight: "PDF Продуктивност", description: "Конвертирайте, обединявайте, разделяйте и редактирайте PDF файлове без усилия. 100% безплатна и сигурна обработка директно във вашия браузър.", start: "Започнете", github: "Звезда в GitHub" },
        tools: { htmlToPdf: "Уебсайт към PDF", htmlToPdfDesc: "Заснемане на пълни уеб страници като висококачествени PDF файлове." }
    },
    ca: {
        nav: { home: "Inici", tools: "Eines", blog: "Blog", about: "Sobre", settings: "Configuració" },
        hero: { title: "Totes les eines per a la teva", titleHighlight: "Productivitat PDF", description: "Converteix, uneix, divideix i edita fitxers PDF sense esforç. Processament 100% gratuït i segur directament al teu navegador.", start: "Començar", github: "Estrella a GitHub" },
        tools: { htmlToPdf: "Web a PDF", htmlToPdfDesc: "Captura pàgines web completes com a PDF d'alta fidelitat." }
    },
    nl: {
        nav: { home: "Home", tools: "Tools", blog: "Blog", about: "Over", settings: "Instellingen" },
        hero: { title: "Alle tools voor uw", titleHighlight: "PDF Productiviteit", description: "Converteer, voeg samen, splits en bewerk PDF-bestanden moeiteloos. 100% gratis en veilige verwerking direct in uw browser.", start: "Starten", github: "Ster op GitHub" },
        tools: { htmlToPdf: "Website naar PDF", htmlToPdfDesc: "Leg volledige webpagina's vast als high-fidelity PDF's." }
    },
    el: {
        nav: { home: "Αρχική", tools: "Εργαλεία", blog: "Ιστολόγιο", about: "Σχετικά", settings: "Ρυθμίσεις" },
        hero: { title: "Όλα τα εργαλεία για την", titleHighlight: "Παραγωγικότητα PDF", description: "Μετατρέψτε, συγχωνεύστε, χωρίστε και επεξεργαστείτε αρχεία PDF αβίαστα. 100% δωρεάν και ασφαλής επεξεργασία απευθείας στο πρόγραμμα περιήγησής σας.", start: "Ξεκινήστε", github: "Αστέρι στο GitHub" },
        tools: { htmlToPdf: "Ιστοσελίδα σε PDF", htmlToPdfDesc: "Καταγράψτε πλήρεις ιστοσελίδες ως PDF υψηλής πιστότητας." }
    },
    id: {
        nav: { home: "Beranda", tools: "Alat", blog: "Blog", about: "Tentang", settings: "Pengaturan" },
        hero: { title: "Semua alat untuk", titleHighlight: "Produktivitas PDF", description: "Konversi, gabungkan, pisahkan, dan edit file PDF dengan mudah. 100% pemrosesan gratis dan aman langsung di browser Anda.", start: "Mulai", github: "Bintang di GitHub" },
        tools: { htmlToPdf: "Situs Web ke PDF", htmlToPdfDesc: "Tangkap halaman web lengkap sebagai PDF berkualitas tinggi." }
    },
    ms: {
        nav: { home: "Laman Utama", tools: "Alat", blog: "Blog", about: "Tentang", settings: "Tetapan" },
        hero: { title: "Semua alat untuk", titleHighlight: "Produktiviti PDF", description: "Tukar, gabung, pisah, dan edit fail PDF dengan mudah. 100% pemprosesan percuma dan selamat terus dalam pelayar anda.", start: "Mula", github: "Bintang di GitHub" },
        tools: { htmlToPdf: "Laman Web ke PDF", htmlToPdfDesc: "Tangkap halaman web penuh sebagai PDF berkualiti tinggi." }
    },
    pl: {
        nav: { home: "Strona główna", tools: "Narzędzia", blog: "Blog", about: "O nas", settings: "Ustawienia" },
        hero: { title: "Wszystkie narzędzia dla Twojej", titleHighlight: "Wydajności PDF", description: "Konwertuj, łącz, dziel i edytuj pliki PDF bez wysiłku. 100% darmowe i bezpieczne przetwarzanie bezpośrednio w przeglądarce.", start: "Rozpocznij", github: "Gwiazdka na GitHub" },
        tools: { htmlToPdf: "Strona www do PDF", htmlToPdfDesc: "Zapisuj pełne strony internetowe jako wysokiej jakości pliki PDF." }
    },
    sv: {
        nav: { home: "Hem", tools: "Verktyg", blog: "Blogg", about: "Om", settings: "Inställningar" },
        hero: { title: "Alla verktyg för din", titleHighlight: "PDF-produktivitet", description: "Konvertera, slå samman, dela och redigera PDF-filer utan ansträngning. 100% gratis och säker behandling direkt i din webbläsare.", start: "Kom igång", github: "Stjärnmärk på GitHub" },
        tools: { htmlToPdf: "Webbplats till PDF", htmlToPdfDesc: "Fånga hela webbsidor som hifi-PDF:er." }
    },
    th: {
        nav: { home: "หน้าแรก", tools: "เครื่องมือ", blog: "บล็อก", about: "เกี่ยวกับ", settings: "การตั้งค่า" },
        hero: { title: "เครื่องมือทั้งหมดสำหรับ", titleHighlight: "ประสิทธิภาพ PDF", description: "แปลง ผสาน แยก และแก้ไขไฟล์ PDF ได้อย่างง่ายดาย ประมวลผลฟรีและปลอดภัย 100% โดยตรงในเบราว์เซอร์ของคุณ", start: "เริ่มต้น", github: "ติดดาวบน GitHub" },
        tools: { htmlToPdf: "เว็บไซต์เป็น PDF", htmlToPdfDesc: "จับหน้าเว็บแบบเต็มเป็น PDF ความละเอียดสูง" }
    },
    uk: {
        nav: { home: "Головна", tools: "Інструменти", blog: "Блог", about: "Про нас", settings: "Налаштування" },
        hero: { title: "Усі інструменти для вашої", titleHighlight: "PDF Продуктивності", description: "Конвертуйте, об'єднуйте, розділяйте та редагуйте PDF-файли без зусиль. 100% безкоштовна та безпечна обробка прямо у вашому браузері.", start: "Розпочати", github: "Зірка на GitHub" },
        tools: { htmlToPdf: "Веб-сайт у PDF", htmlToPdfDesc: "Зберігайте повні веб-сторінки як високоякісні PDF-файли." }
    },
    vi: {
        nav: { home: "Trang chủ", tools: "Công cụ", blog: "Blog", about: "Giới thiệu", settings: "Cài đặt" },
        hero: { title: "Tất cả công cụ cho", titleHighlight: "Hiệu suất PDF", description: "Chuyển đổi, hợp nhất, chia nhỏ và chỉnh sửa tệp PDF dễ dàng. Xử lý miễn phí và an toàn 100% ngay trong trình duyệt của bạn.", start: "Bắt đầu", github: "Sao trên GitHub" },
        tools: { htmlToPdf: "Trang web sang PDF", htmlToPdfDesc: "Chụp toàn bộ trang web dưới dạng PDF chất lượng cao." }
    },
    ur: {
        nav: { home: "ہوم", tools: "ٹولز", blog: "بلاگ", about: "ہمارے بارے میں", settings: "ترتیبات" },
        hero: { title: "آپ کی ضرورت کے تمام ٹولز", titleHighlight: "PDF پیداواری صلاحیت", description: "پی ڈی ایف فائلوں کو آسانی سے تبدیل، ضم، تقسیم اور ترمیم کریں۔ 100% مفت اور محفوظ پروسیسنگ براہ راست آپ کے براؤزر میں۔", start: "شروع کریں", github: "GitHub پر سٹار دیں" },
        tools: { htmlToPdf: "ویب سائٹ سے PDF", htmlToPdfDesc: "پوری ویب پیجز کو اعلی کوالٹی کی پی ڈی ایف کے طور پر محفوظ کریں۔" }
    }
};

const targetBaseDir = path.join(__dirname, '../public/locales');

Object.keys(translations).forEach(lang => {
    const langDir = path.join(targetBaseDir, lang);
    if (!fs.existsSync(langDir)) {
        fs.mkdirSync(langDir, { recursive: true });
    }

    const enCommon = JSON.parse(fs.readFileSync(path.join(targetBaseDir, 'en/common.json'), 'utf8'));

    // Merge logic: Use translation if exists, else English
    const finalJson = { ...enCommon };
    if (translations[lang]) {
        if (translations[lang].nav) finalJson.nav = { ...finalJson.nav, ...translations[lang].nav };
        if (translations[lang].hero) finalJson.hero = { ...finalJson.hero, ...translations[lang].hero };
        if (translations[lang].tools) finalJson.tools = { ...finalJson.tools, ...translations[lang].tools };
    }

    fs.writeFileSync(path.join(langDir, 'common.json'), JSON.stringify(finalJson, null, 4));
    console.log(`Generated ${lang}/common.json`);
});
