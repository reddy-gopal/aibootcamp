
# 📱 Sharing Functionality (Web Share API)

The sharing feature is designed to allow students to share their generated pass directly to social media (WhatsApp, Instagram, etc.) with a pre-filled caption.

### 🚀 How It Works (Canvas Embedding)

The `sharePass` function now **embeds the caption directly into the image** by overlaying it on the right-hand side (over the visual), ensuring the message is visible without altering the pass's aspect ratio or obscuring the student's personal details.

#### 1. Clipboard Copy (Backup)
We copy the text to the clipboard and show a toast ("Processing image...") as a convenience backup.

#### 2. Base Pass Capture
We use `html2canvas` to render the DOM element `.pass-card` into a canvas.

#### 3. Overlay Generation
Instead of resizing the canvas, we draw directly onto it.

- **Target Area**: The right side of the card (approx. 58% width) where the main visual is, keeping the left side (Name, ID, Logo) clean.
- **Gradient**: A dark semi-transparent gradient is drawn over the mix to ensure text readability against any image background.
- **Text Drawing**:
  - The caption is split into lines to fit the column width.
  - Text is drawn **bottom-up** from the bottom-right corner.
  - We apply a drop shadow to the white text for maximum contrast.

#### 4. Export & Share
- The modified canvas is exported as a high-quality JPEG.
- This file is shared natively.

```javascript
/* Pseudocode */
const canvas = await html2canvas(passRef.current);
const ctx = canvas.getContext('2d');

// Draw Gradient on Right Side
const gradient = ctx.createLinearGradient(...);
ctx.fillStyle = gradient;
ctx.fillRect(rightSideX, 0, width, height);

// Draw Text Bottom-Up
lines.reverse().forEach((line, i) => {
  ctx.fillText(line, x, y - (i * lineHeight));
});

// Export
canvas.toBlob(...);
```

#### 5. Fallback
If sharing fails, it falls back to a standard download.
