
# 📱 Sharing Functionality (Web Share API)

The sharing feature is designed to allow students to share their generated pass directly to social media (WhatsApp, Instagram, etc.) with a pre-filled caption.

### 🚀 How It Works (Canvas Embedding)
 
 The `sharePass` function now **embeds the caption directly into the image footer**, ensuring the message is always visible.
 
 #### 1. Clipboard Copy (Backup)
 We copy the text to the clipboard and show a toast ("Processing image...") as a convenience backup.
 
 #### 2. Base Pass Capture
 We use `html2canvas` to render the DOM element `.pass-card` into a base image.
 
 #### 3. Composite Generation
 - We calculate the text height required for the caption.
 - We create a new "Composite Canvas" = (Pass Height + Footer Height).
 - **Drawing**:
   - **Top**: The Pass Card image.
   - **Bottom (Footer)**: A dark background with the wrapped white text caption.
 
 #### 4. Export & Share
 - The combined **Stack** (Pass + Footer) is exported as a high-quality JPEG.
 - This file is shared natively.
 
 ```javascript
 /* Pseudocode */
 const baseCanvas = await html2canvas(passRef.current);
 const composite = document.createElement('canvas');
 composite.height = baseCanvas.height + footerHeight;
 
 // Draw Pass
 ctx.drawImage(baseCanvas, 0, 0);
 
 // Draw Footer
 ctx.fillStyle = '#1a1a2e';
 ctx.fillRect(0, baseCanvas.height, width, footerHeight);
 ctx.fillText(caption, x, baseCanvas.height + padding);
 
 // Export
 composite.toBlob(...);
 ```
 
 #### 5. Fallback
 If sharing fails, it falls back to a standard download.
