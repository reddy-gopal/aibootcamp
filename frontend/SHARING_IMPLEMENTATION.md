
# 📱 Sharing Functionality (Web Share API)

The sharing feature is designed to allow students to share their generated pass directly to social media (WhatsApp, Instagram, etc.) with a pre-filled caption.

### 🚀 How It Works (Canvas Embedding)

The `sharePass` function now **embeds the caption directly into the image** to ensuring the message is visible even if the social platform strips the text.

#### 1. Clipboard Copy (Backup)
We still copy the text to the clipboard and show a toast ("Processing image...") as a convenience backup.

#### 2. Base Pass Capture
We use `html2canvas` to render the DOM element `.pass-card` into a base canvas.

#### 3. Composite Canvas Generation
We programmatically create a new, larger canvas to hold both the pass and the caption footer.

- **Dynamic Height Calculation**: We calculate the height needed for the random caption by simulating word-wrapping using `measureText`.
- **Drawing**:
  1.  **Pass**: Drawn at `(0, 0)`.
  2.  **Footer Background**: A dark rectangle (`#1a1a2e`) is drawn below the pass.
  3.  **Text**: The caption is written line-by-line in white ('Outfit' font) onto the footer area.
  4.  **CTA**: A "Join at: [host]" link is added at the bottom.

#### 4. Export & Share
- The final **Composite Canvas** is exported as a high-quality JPEG.
- This file (containing image + text) is shared via the Web Share API.

```javascript
/* Pseudocode */
const baseCanvas = await html2canvas(element);
const compositeCanvas = document.createElement('canvas');
compositeCanvas.height = baseCanvas.height + footerHeight;

// Draw Pass
ctx.drawImage(baseCanvas, 0, 0);

// Draw Footer & Text
ctx.fillStyle = '#1a1a2e';
ctx.fillRect(0, baseCanvas.height, width, footerHeight);
ctx.fillText(caption, x, y);

// Export
compositeCanvas.toBlob(...);
```

#### 5. Fallback
If sharing fails, specific error handling ensures the user can still download the image (via `downloadPass`).
