import { useRef, useEffect, useState } from 'react'
import html2canvas from 'html2canvas'
import confetti from 'canvas-confetti'
import './PassCard.css'

function PassCard({ student }) {
  const passRef = useRef(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3500)
  }

  useEffect(() => {
    const imageUrl =
      'https://res.cloudinary.com/ds3egsoa3/image/upload/f_auto,q_auto/v1767944535/Gemini_Generated_Image_cso36ucso36ucso3_1_zeejgw.png'

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => setImageLoaded(true)

    img.onerror = (error) => {
      console.warn('Image failed with CORS, retrying without crossOrigin:', error)
      const imgRetry = new Image()
      imgRetry.onload = () => {
        setImageLoaded(true)
        setImageError(false)
      }
      imgRetry.onerror = () => {
        console.warn('Image failed to load after retry')
        setImageError(true)
        setImageLoaded(true)
      }
      imgRetry.crossOrigin = null
      imgRetry.src = imageUrl
    }

    img.src = imageUrl
  }, [])

  useEffect(() => {
    const duration = 2000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 270,
        spread: 100,
        origin: { x: Math.random(), y: -0.1 },
        colors: ['#6366f1', '#a855f7', '#ec4899', '#22c55e'],
        gravity: 1.2,
        scalar: 1.0,
        drift: 0,
        ticks: 100,
      })

      if (Date.now() < end) requestAnimationFrame(frame)
    }

    frame()
  }, [])

  const slugToName = (slug) => {
    if (!slug) return ''
    return slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const studentName = student.name || slugToName(student.slug || '')

  /*
     Previous 'downloadAsPDF' replaced with 'downloadPass' to download as PNG image
     per user request ("it is not downloading the image").
  */
  /*
     Updated 'downloadPass' to use Blob + ObjectURL for better mobile stability,
     and strict CORS handling to avoid tainted canvas issues.
  */
  const downloadPass = async () => {
    if (!passRef.current) return

    try {
      // Ensure all images are loaded
      const images = passRef.current.querySelectorAll('img')
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete && img.naturalHeight !== 0) resolve()
              else {
                const onLoad = () => {
                  img.removeEventListener('load', onLoad)
                  img.removeEventListener('error', onError)
                  resolve()
                }
                const onError = () => {
                  img.removeEventListener('load', onLoad)
                  img.removeEventListener('error', onError)
                  // If CORS fails, we can't really do much for html2canvas 
                  // except let it render what it can or show blank.
                  console.warn('Image failed to load:', img.src)
                  resolve()
                }
                img.addEventListener('load', onLoad)
                img.addEventListener('error', onError)
                setTimeout(() => resolve(), 8000) // Timeout safety
              }
            })
        )
      )

      await new Promise((r) => setTimeout(r, 500))

      const canvas = await html2canvas(passRef.current, {
        scale: 2, // Reduced scale for manageable file size
        backgroundColor: '#ffffff',
        useCORS: true,       // CRITICAL: Must be true for external images
        allowTaint: false,   // CRITICAL: Must be false. If true, toBlob/toDataURL throws error.
        logging: false,
        imageTimeout: 20000,
        removeContainer: false,
        onclone: (clonedDoc) => {
          const clonedImages = clonedDoc.querySelectorAll('img')
          clonedImages.forEach((img) => {
            img.style.display = 'block'
            img.style.visibility = 'visible'
            img.style.opacity = '1'
          })
        },
      })

      // Use Blob API for download (more robust on mobile than long Data URLs)
      canvas.toBlob((blob) => {
        if (!blob) {
          alert('Failed to generate image.')
          return
        }
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${studentName}-ai-bootcamp-pass.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 'image/png', 1.0)

    } catch (error) {
      console.error('Error generating Pass Image:', error)
      alert('Failed to download Pass. Please check your internet connection.')
    }
  }

  /* 
     UPDATED: Embeds caption directly into the image for persistent visibility.
     Logic:
     1. Capture PassCard as canvas (html2canvas).
     2. Create a new "Composite Canvas" with extra height for the footer.
     3. Draw the PassCard image onto the Composite Canvas.
     4. Draw a dark footer background.
     5. Draw wrapped text (caption) onto the footer.
     6. Export Composite Canvas as JPEG and Share.
  */
  const sharePass = async () => {
    if (!passRef.current) return

    const captions = [
      `🎵 Just secured my spot at the AI BOOTCAMP! Ready to create music with AI and unlock the future of music production. Who's joining me on this incredible journey? 🚀`,
      `🎶 Excited to be part of the AI-Powered Music Creation Workshop! Can't wait to explore how artificial intelligence is revolutionizing music production. Let's make some magic! ✨`,
      `🎼 Got my pass for the AI BOOTCAMP! Time to dive deep into AI-powered music creation and discover the endless possibilities. This is going to be epic! 🎹`,
      `🎵 Thrilled to join the AI BOOTCAMP! Ready to learn how AI is transforming music creation and unleash my creativity with cutting-edge technology. Let's create something amazing together! 🚀`,
    ]
    const randomCaption = captions[Math.floor(Math.random() * captions.length)]
    const pageUrl = window.location.href
    const fullCaption = `${randomCaption}\n\nCheck it out here: ${pageUrl}\n\n#AIBootcamp #AIMusic #MusicCreation #FutureOfMusic #MusicTech`

    try {
      // 1. Force copy caption to clipboard (still useful as backup)
      try {
        await navigator.clipboard.writeText(fullCaption)
        showToast('Processing image... ⏳')
      } catch (err) {
        console.warn('Clipboard write failed:', err)
      }

      await new Promise((r) => setTimeout(r, 100))

      // 2. Capture the base pass card
      const baseCanvas = await html2canvas(passRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          const clonedImages = clonedDoc.querySelectorAll('img')
          clonedImages.forEach((img) => {
            img.style.display = 'block'
            img.style.visibility = 'visible'
            img.style.opacity = '1'
          })
        },
      })

      // 3. Create Composite Canvas (Pass + Text Footer)
      const footerPadding = 40
      const fontSize = 24 // px
      const lineHeight = 36 // px
      const footerWidth = baseCanvas.width

      // Calculate needed height for text
      const ctxTest = document.createElement('canvas').getContext('2d')
      ctxTest.font = `600 ${fontSize}px 'Outfit', sans-serif`

      // Word wrap logic to estimate height
      const words = randomCaption.split(' ')
      let line = ''
      let lineCount = 1
      const maxWidth = footerWidth - (footerPadding * 2)

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' '
        const metrics = ctxTest.measureText(testLine)
        const testWidth = metrics.width
        if (testWidth > maxWidth && n > 0) {
          line = words[n] + ' '
          lineCount++
        } else {
          line = testLine
        }
      }

      // Extra space for "#Hashtags" and URL if needed, or just keep it simple with the caption
      // Let's add a bit more space for the "Check it out" line
      lineCount += 2

      const footerHeight = (lineCount * lineHeight) + (footerPadding * 2)

      const compositeCanvas = document.createElement('canvas')
      compositeCanvas.width = baseCanvas.width
      compositeCanvas.height = baseCanvas.height + footerHeight

      const ctx = compositeCanvas.getContext('2d')

      // A. Draw Pass
      ctx.drawImage(baseCanvas, 0, 0)

      // B. Draw Footer Background
      ctx.fillStyle = '#1a1a2e' // Dark background matching theme
      ctx.fillRect(0, baseCanvas.height, compositeCanvas.width, footerHeight)

      // C. Draw Text
      ctx.fillStyle = '#ffffff'
      ctx.font = `600 ${fontSize}px 'Outfit', sans-serif`
      ctx.textBaseline = 'top'

      let x = footerPadding
      let y = baseCanvas.height + footerPadding

      // Draw Caption Line by Line
      line = ''
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' '
        const metrics = ctx.measureText(testLine)
        const testWidth = metrics.width
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, x, y)
          line = words[n] + ' '
          y += lineHeight
        } else {
          line = testLine
        }
      }
      ctx.fillText(line, x, y) // Draw last line

      // Draw URL/Hashtag stub below
      y += lineHeight * 1.5
      ctx.fillStyle = '#3b82f6' // Blue accent
      ctx.font = `600 ${fontSize - 4}px 'Outfit', sans-serif`
      ctx.fillText(`Join at: ${window.location.host}`, x, y)

      // 4. Convert Composite to Blob
      const blob = await new Promise((resolve) =>
        compositeCanvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9)
      )

      if (!blob || blob.size < 100) {
        throw new Error('Generated image is empty or invalid.')
      }

      // 5. Share
      const file = new File([blob], 'ai-bootcamp-pass.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now(),
      })

      const shareData = {
        text: fullCaption, // Still provide text for apps that support it
        files: [file],
      }

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
        showToast('Shared successfully! 🚀')
      } else {
        throw new Error('Web Share API not supported.')
      }

    } catch (error) {
      if (error?.name === 'AbortError') return

      console.warn('Share failed:', error)
      showToast('Share failed. Downloading image...')

      // Fallback download if sharing fails
      downloadPass()
    }
  }

  return (
    <div className="pass-container">
      {toastMsg && <div className="toast-notification">{toastMsg}</div>}
      <div className="success-header">
        <div className="success-icon">🎵</div>
        <h1>Registration Successful!</h1>
        <p>Thank you for registering for AI BOOTCAMP.</p>
      </div>

      <div className="pass-card" ref={passRef}>
        <div className="pass-left">
          <div className="pass-bg-pattern"></div>

          <div className="branding-header">
            <img src="/niat.png" alt="NIAT Logo" className="brand-logo" />
          </div>

          <div className="header-group">
            <h1 className="main-title">AI BOOTCAMP</h1>
            <div className="sub-header">
              <span>AI-POWERED MUSIC CREATION WORKSHOP</span>
            </div>
          </div>

          <div className="student-info">
            <div className="info-group">
              <span className="label">ATTENDEE</span>
              <h2 className="student-name">{studentName}</h2>
            </div>
          </div>
        </div>

        <div className="pass-right">
          <img
            src="https://res.cloudinary.com/ds3egsoa3/image/upload/f_auto,q_auto/v1767944535/Gemini_Generated_Image_cso36ucso36ucso3_1_zeejgw.png"
            alt="Music Generation with AI Workshop"
            className="pass-visual"
            crossOrigin="anonymous"
            loading="eager"
            decoding="async"
            onLoad={() => {
              setImageLoaded(true)
              setImageError(false)
            }}
            onError={(e) => {
              console.warn('Image load error:', e)
              setImageError(true)
              setImageLoaded(true)
            }}
            style={{
              display: imageLoaded && !imageError ? 'block' : 'none',
              maxWidth: '100%',
              height: '100%',
              width: '100%',
              objectFit: 'cover',
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease-in',
            }}
          />

          {!imageLoaded && (
            <div className="image-placeholder">
              <div className="placeholder-content">
                <div className="ai-icon">🤖</div>
                <div className="placeholder-text">AI BOOTCAMP</div>
              </div>
            </div>
          )}

          <div className="pass-footer-strip">
            <span>PREMIUM WORKSHOP PASS</span>
          </div>
        </div>
      </div>

      <div className="pass-actions">
        <button onClick={downloadPass} className="action-btn download">
          <span className="icon">↓</span> Download Pass
        </button>
        <button onClick={sharePass} className="action-btn share">
          <span className="icon">➦</span> Share
        </button>
      </div>
    </div>
  )
}

export default PassCard
