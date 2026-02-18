# Deep Analysis: 30 Add Page Numbers

## 📊 Current State: "The Document Indexer"
The **Add Page Numbers** tool is a semi-automated layout utility that adds persistent pagination markers to every page of a PDF.

### 🔬 Technical Architecture Audit
- **Inference Engine**: Uses the `addPageNumbers` utility in `lib/pdf-utils`.
- **Layout Model**:
    - **Step 1**: Iterates through the document's total page count.
    - **Step 2 (Coordinate Selection)**: Based on the `position` prop (`top-left`, `bottom-center`, etc.), it calculates the (x, y) target using the current page's `MediaBox` width and height.
    - **Step 3 (String Generation)**: Generates a label string (e.g., `"1"`) starting from the `startFrom` offset.
    - **Step 4 (Injection)**: Uses `pdf-lib`'s `drawText` to overlay the number at the calculated location.
- **Visual Feedback**: The current UI uses a simplified grid of "Position Buttons" to let users preview the placement logic.

### 📉 Critical Bottlenecks
1. **The "Collision" Problem**: The tool blindly overlays numbers. If the PDF has a footer logo or a page number already in the source file, the new number will overlap it, creating a messy visual conflict.
2. **Missing Format Logic**: Only supports simple numbering (`1, 2, 3`). It lacks professional formats like `Page 1 of 10`, `1 / 10`, or Roman numerals (`i, ii, iii`) for prefaces.
3. **Inconsistent Page Sizes**: If the PDF is a mix of A4 and US Letter, fixed-margin offsets might place numbers slightly unevenly across the document.

---

## 🚀 The "Adaptive Librarian" Roadmap: Contextual Pagination

To move from **Overlaying** to **Professional Typesetting.**

### 1. The Collision-Aware Placer (The "Deepening")
- **Semantic Whitespace Detection**: Before placing a number, analyze the page's ink-density in the target region. If text or an image exists there, automatically shift the number to the nearest "Safe" whitespace or provide a "Halo" (white glow around the number) to ensure legibility.
- **Native Masking**: Offer to "Redact" the existing footer before placing a new number to prevent ghosting of original pagination.

### 2. Radical Robustness: Advanced Formatting
- **Rich Format Strings**: Allow users to use placeholders like `{n}` (Current Page) and `{tot}` (Total Pages). E.g., `Document Draft - Page {n} of {tot}`.
- **Bates Numbering**: Introduce specialized "Bates Stamping" for legal workflows, including alphanumeric prefixes and zero-padding (e.g., `DEP_EXH_000001`).
- **Section-Based Numbering**: Allow different numbering schemes for different "Sections" (e.g., Roman numerals for the TOC, then Arabic starting from Page 5).

### 3. "No One Ever Made Before" Features
- **The "Book Fold" Mirroring**: Automatically alternate positions for "Odd" and "Even" pages (e.g., Bottom-Outer corner), making the document ready for physical double-sided printing.
- **Hyperlinked Page Numbers**: Automatically add invisible internal links to the page numbers that jump the user back to the Table of Contents (if detected).
- **OCR Syncing**: If the document has a TOC, automatically detect if the page numbers *on the pages* match the TOC and offer to "Re-sync" the entire document.

### 4. Implementation Priority (Immediate Next Steps)
1. **Template Support**: Implement `{n} of {tot}` logic.
2. **Mirror Mode**: Add a "Mirror for Print" toggle (Alternating left/right).
3. **Margins & Padding**: Add a slider to adjust how far from the edge the number is placed.

---

## 🛠️ Verification Metrics
- **Center Alignment Accuracy**: Verify in an automated test that "Bottom Center" is within 1px of the true horizontal midpoint.
- **Large Document Stress-Test**: Performance check for adding numbers to a 5,000-page file (Goal: < 10s).
- **Readability Pass**: Visual check on "Dark Mode" pages to ensure numbers remain visible.
