
# 📱 Sharing Functionality (Web Share API)

The sharing feature is designed to allow students to share their generated pass directly to social media (WhatsApp, Instagram, etc.) with a pre-filled caption.

### 🚀 How It Works (Canvas Embedding)
 
 The `sharePass` function now **embeds the caption above the image** (Header), creating a clean, social-media-style post layout.
 
 #### 1. Clipboard Copy (Backup)
 We copy the text to the clipboard and show a toast ("Processing image...") as a convenience backup.
 
 #### 2. Base Pass Capture
 We use `html2canvas` to render the DOM element `.pass-card` into a base image.
 
 #### 3. Composite Generation
 - We calculate the text height required for the caption.
 - We create a new "Composite Canvas" = (Pass Height + Header Height).
 - **Drawing**:
   - **Background**: Filled with white (Clean look, no dark box).
   - **Header (Top)**: The caption text is drawn in black.
   - **Body (Bottom)**: The Pass Card image is drawn below the text.
 
 #### 4. Export & Share
 - The combined **Stack** (Text + Pass) is exported as a high-quality JPEG.
 - This file is shared natively.
 
 ```javascript
 /* Pseudocode */
 const baseCanvas = await html2canvas(passRef.current);
 const composite = document.createElement('canvas');
 composite.height = baseCanvas.height + headerHeight;
 
 // Fill White
 ctx.fillStyle = '#ffffff';
 ctx.fillRect(0, 0, width, height);
 
 // Draw Text at Top
 ctx.fillStyle = '#000000';
 ctx.fillText(caption, x, padding);
 
 // Draw Pass Below
 ctx.drawImage(baseCanvas, 0, headerHeight);
 
 // Export
 composite.toBlob(...);
 ```
 
 #### 5. Fallback
 If sharing fails, it falls back to a standard download.
