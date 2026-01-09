
# 📱 Sharing Functionality (Web Share API)

The sharing feature is designed to allow students to share their generated pass directly to social media (WhatsApp, Instagram, etc.) with a pre-filled caption.

### 🚀 How It Works (Direct Sharing)
 
 The `sharePass` function allows students to share their pass directly as an image.
 
 #### 1. Clipboard Copy (Pre-fill)
 We proactively copy the caption text to the clipboard so the user can easily paste it into their social media post if the app doesn't support automatic text population.
 
 #### 2. Image Capture
 We use `html2canvas` to capture the `.pass-card` element exactly as it appears on screen.
 
 #### 3. Export & Share
 - The captured canvas is converted to a JPEG blob.
 - This image file is shared natively via the Web Share API (`navigator.share`).
 
 ```javascript
 /* Simplified Logic */
 // 1. Copy Text
 navigator.clipboard.writeText(fullCaption);
 
 // 2. Capture Image
 const canvas = await html2canvas(passRef.current);
 
 // 3. Share File
 canvas.toBlob((blob) => {
   const file = new File([blob], 'pass.jpg', { type: 'image/jpeg' });
   navigator.share({ files: [file] });
 });
 ```
 
 #### 4. Fallback
 If sharing fails, it falls back to a standard download.
