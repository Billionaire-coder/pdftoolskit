# Deep Analysis: 29 Redact PDF

## 📊 Current State: "The Geometric Censor"
The **Redact PDF** tool is a security utility designed to permanently obscure sensitive information by physically removing or covering content within a defined coordinate space.

### 🔬 Technical Architecture Audit
- **Inference Engine**: Uses the `addRedaction` utility.
- **Visual Model**: Uses the `InteractiveOverlay` to capture a bounding box (x, y, width, height) in normalized page points.
- **Destruction Logic**:
    - **Stage 1 (Coordinate Transformation)**: Converts visual Top-Left (DOM) coordinates to the PDF spec's Bottom-Left coordinates.
    - **Stage 2 (Visual Masking)**: Calls `drawRectangle` with a solid black fill color. This adds a new vector object to the page's `/Contents` stream.
    - **Outcome**: The area is visually blacked out, and in most simple viewers, the content is "gone."

### 📉 Critical Bottlenecks
1. **The "Under-the-Hood" Vulnerability**: Current implementation is **Add-only**. It adds a black box *over* the text but does NOT remove the underlying text operator or image data from the binary. A clever recipient can simply "Extract Text" from the redacted PDF and still retrieve the social security number or private address.
2. **Metadata Redaction**: Redaction is limited to page content. Sensitive info in the metadata (Title, Author, custom fields) is not addressed by this tool.
3. **Multi-Page Redaction (Batch)**: If a "Company Name" appears on 50 pages, the user must manually draw 50 boxes. There is no "Search and Redact" automation in the dedicated Redactor.

---

## 🚀 The "True Eraser" Roadmap: Forensic-Grade Sanitization

To become a trusted tool for legal and government bodies, we must move from **Masking** to **Stream Purging.**

### 1. The Forensic Scrubber (The "Deepening")
- **Content Excision (Native Redaction)**: Implement a scrubber that identifies any text snippets, vector paths, or image scanlines that intersect with the redaction rectangle and **deletes them from the content stream**. This ensures that the data is physically non-existent, not just hidden.
- **Image Patching**: For bitmap images, the tool should actually replace the pixel data in the underlying image object with black pixels to prevent "under-mask" extraction.

### 2. Radical Robustness: Advanced Automation
- **Search-to-Redact Integration**: Combine the "Search" engine from the Edit tool into the Redactor. Allow users to "Redact all instances of 'CONFIDENTIAL'."
- **Pattern Matching (Auto-Censor)**: Use regex patterns to automatically suggest redactions for:
    - Credit Card Numbers.
    - Social Security Numbers.
    - Email Addresses.
    - Specific Date Formats.

### 3. "No One Ever Made Before" Features
- **The "Audit Trail" Generator**: Create a side-car report that lists every redaction made, its timestamp, and the reason (e.g., "PII - Social Security").
- **Exemption Code Overlay**: Allow users to place standard "Exemption Codes" (e.g., `(b)(6)` for FOIA requests) in white text on top of the black redaction boxes automatically.
- **Redaction Verification Pass**: A post-processing step that attempts to "Auto-Extract" text from the redacted regions to prove to the user that the data is truly unrecoverable.

### 4. Implementation Priority (Immediate Next Steps)
1. **Underlying Text Deletion**: Implement a stream parser that filters out text operators within the box.
2. **Bulk Redact (Pattern)**: Add the "Bulk Search & Redact" sidebar.
3. **Exemption Text Input**: Allow typing labels on the redaction boxes.

---

## 🛠️ Verification Metrics
- **Extraction Test**: Verify that selecting text in the redacted area in Chrome/Acrobat yields zero characters.
- **Metadata Silence**: Confirm no forbidden strings remain in any `/Info` or `/XMP` dictionaries.
- **Visual Accuracy**: Ensure no "Hairline Gaps" remain around the edges of the redaction block.
