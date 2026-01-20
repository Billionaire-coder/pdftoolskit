# PDFToolkit 🚀

A modern, beautiful, and completely free PDF tools website built with Next.js 14, TypeScript, and Tailwind CSS. Process your PDFs directly in your browser - no uploads, no tracking, 100% private.

![PDFToolkit](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### PDF Tools (8 Core Tools)
- ✅ **Merge PDF** - Combine multiple PDF files into one
- ✅ **Split PDF** - Extract individual pages
- ✅ **Compress PDF** - Reduce file size
- ✅ **PDF to JPG** - Convert pages to images
- ✅ **JPG to PDF** - Create PDF from images
- ✅ **Rotate PDF** - Fix page orientation
- ✅ **Remove Pages** - Delete specific pages
- ✅ **Organize PDF** - Reorder pages

### Design & UX
- 🎨 **Glassmorphism** - Modern, premium aesthetic
- 🌈 **Gradient animations** - Smooth, eye-catching effects
- 📱 **Fully responsive** - Perfect on all devices
- ⚡ **Blazing fast** - Client-side processing
- 🔒 **100% Private** - Files never leave your device

### Technical
- 🚀 **Next.js 14** with App Router
- 💎 **TypeScript** for type safety
- 🎭 **Framer Motion** for animations
- 📦 **pdf-lib** for PDF manipulation
- 🎯 **SEO optimized** - Sitemap, metadata, structured data

## 🛠️ Installation

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Quick Start

```bash
# Clone or navigate to the project directory
cd pdf-tools

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

The site will be running at `http://localhost:3000`

## 📁 Project Structure

```
pdf-tools/
├── app/                      # Next.js app directory
│   ├── merge-pdf/           # Merge PDF tool page
│   ├── split-pdf/           # Split PDF tool page
│   ├── compress-pdf/        # Compress PDF tool page
│   ├── pdf-to-jpg/          # PDF to JPG tool page
│   ├── jpg-to-pdf/          # JPG to PDF tool page
│   ├── rotate-pdf/          # Rotate PDF tool page
│   ├── remove-pages/        # Remove pages tool page
│   ├── organize-pdf/        # Organize PDF tool page
│   ├── layout.tsx           # Root layout with SEO
│   ├── page.tsx             # Home page
│   ├── sitemap.ts           # Dynamic sitemap
│   ├── robots.ts            # Robots.txt
│   └── globals.css          # Global styles
├── components/
│   ├── home/               # Home page components
│   │   ├── Hero.tsx        # Animated hero section
│   │   ├── ToolsGrid.tsx   # Tools showcase
│   │   └── Features.tsx    # Features section
│   ├── layout/             # Layout components
│   │   ├── Header.tsx      # Navigation header
│   │   └── Footer.tsx      # Site footer
│   ├── shared/             # Shared components
│   │   ├── FileUpload.tsx  # Drag-drop upload
│   │   └── ProgressBar.tsx # Progress indicator
│   └── ui/                 # UI components
│       ├── GlassCard.tsx   # Glassmorphic card
│       └── Button.tsx      # Button component
├── lib/
│   ├── pdf-utils.ts        # PDF processing utilities
│   └── utils.ts            # Helper functions
├── public/                 # Static files
├── tailwind.config.ts      # Tailwind configuration
├── next.config.js          # Next.js configuration
└── package.json            # Dependencies

```

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/pdf-tools.git
git push -u origin main
```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js
   - Click "Deploy"
   - Done! Your site is live in ~60 seconds

3. **Custom Domain (Optional):**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

### Environment Variables

Create a `.env.local` file for local development:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=PDFToolkit
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX
```

In Vercel, add these in Project Settings → Environment Variables.

## 💰 Monetization (AdSense)

### 1. Apply for Google AdSense
- Go to [google.com/adsense](https://www.google.com/adsense)
- Sign up with your Google account
- Submit your site URL
- Wait for approval (3-7 days)

### 2. Add AdSense Code
Once approved, add the AdSense script to `app/layout.tsx`:

```tsx
<head>
  {/* AdSense */}
  <script
    async
    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
    crossOrigin="anonymous"
  />
</head>
```

### 3. Place Ads
Add ad units in strategic locations:
- Between hero and tools grid
- After tools grid
- In footer
- On tool pages (after upload section)

## 📊 SEO Optimization

### Built-in SEO Features
- ✅ Semantic HTML structure
- ✅ Meta tags (title, description, keywords)
- ✅ Open Graph tags (social media)
- ✅ Twitter Card tags
- ✅ Structured data (JSON-LD)
- ✅ Sitemap (auto-generated)
- ✅ Robots.txt
- ✅ Fast page load (Next.js optimization)

### Submit to Search Engines
1. **Google Search Console:**
   - Go to [search.google.com/search-console](https://search.google.com/search-console)
   - Add your site
   - Verify ownership
   - Submit sitemap: `https://yourdomain.com/sitemap.xml`

2. **Bing Webmaster Tools:**
   - Go to [bing.com/webmasters](https://www.bing.com/webmasters)
   - Add and verify your site
   - Submit sitemap

## 🎨 Customization

### Change Colors
Edit `tailwind.config.ts`:

```ts
colors: {
  primary: {
    DEFAULT: '#8B5CF6',  // Change to your color
    // ...
  },
}
```

### Change Fonts
Edit `app/layout.tsx`:

```ts
const inter = Inter({ /* ... */ });
const jakarta = Plus_Jakarta_Sans({ /* ... */ });
```

### Add New Tools
1. Create new page in `app/your-tool/page.tsx`
2. Add tool to `components/home/ToolsGrid.tsx`
3. Update sitemap in `app/sitemap.ts`

## 📈 Analytics

### Add Google Analytics
1. Create GA4 property
2. Get Measurement ID (G-XXXXXXXXXX)
3. Add to `.env.local`:
```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```
4. Add script to `app/layout.tsx`

## 🔧 Development

```bash
# Development server
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 📝 License

This project is open source and available for personal and commercial use.

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## 🎯 Roadmap

- [ ] Add more PDF tools (watermark, signatures, etc.)
- [ ] Multi-language support (Hindi, Spanish, etc.)
- [ ] Batch processing for multiple files
- [ ] Dark/Light mode toggle
- [ ] User accounts and saved preferences
- [ ] Premium features with subscriptions

## 📧 Contact

For questions or support, contact: [contact@pdftoolkit.com](mailto:contact@pdftoolkit.com)

---

**Built with ❤️ using Next.js 14 | Made to compete with iLovePDF and SmallPDF**
