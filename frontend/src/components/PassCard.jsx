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
     UPDATED: Overlays caption on the right side of the card (over the image)
     to keep the pass dimensions ("on the Pass") without obscuring student details on the left.
  */
  /* 
     UPDATED: Embeds caption at the BOTTOM (Footer) of the image.
     User Request: "caption to be embedded at the end".
     Logic:
     1. Capture PassCard as canvas.
     2. Create Composite Canvas (Pass Height + Footer Height).
     3. Draw Pass at (0,0).
     4. Draw dark footer at bottom.
     5. Draw wrapped text in footer.
  */
  const sharePass = async () => {
    if (!passRef.current) return

    const captions = [
      `I just registered for the AI BOOTCAMP! 🎵 Ready to create music with AI. 🚀`,
      `Going to the AI-Powered Music Creation Workshop! Can't wait! ✨`,
      `Got my pass for the AI BOOTCAMP! Time to dive into music tech. 🎹`,
      `Joined the AI BOOTCAMP! Let's make some amazing music with AI! 🚀`,
    ]
    const randomCaption = captions[Math.floor(Math.random() * captions.length)]
    // Removed hashtags and link, added direct CTA
    const fullCaption = `${randomCaption}\n\nIf anyone interested DM me.`

    try {
      try {
        await navigator.clipboard.writeText(fullCaption)
        showToast('Processing image... ⏳')
      } catch (err) {
        console.warn('Clipboard write failed:', err)
      }

      await new Promise((r) => setTimeout(r, 100))

      // 1. Capture the base pass card
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

      // 2. Create Composite Canvas (Pass + Footer)
      const footerPadding = 40
      const fontSize = 24
      const lineHeight = 36
      const footerWidth = baseCanvas.width

      const paragraphs = fullCaption.split('\n')
      let lines = []

      const ctxTest = document.createElement('canvas').getContext('2d')
      ctxTest.font = `600 ${fontSize}px 'Outfit', sans-serif`

      paragraphs.forEach(paragraph => {
        const words = paragraph.split(' ')
        let line = ''

        // If paragraph is empty (double newline), add an empty line to maintain spacing
        if (paragraph.trim() === '') {
          lines.push('')
          return
        }

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' '
          const metrics = ctxTest.measureText(testLine)
          if (metrics.width > maxWidth && n > 0) {
            lines.push(line)
            line = words[n] + ' '
          } else {
            line = testLine
          }
        }
        lines.push(line)
      })

      const lineCount = lines.length
      // Add a little padding top/bottom
      const headerHeight = (lineCount * lineHeight) + (footerPadding * 2)

      const compositeCanvas = document.createElement('canvas')
      compositeCanvas.width = baseCanvas.width
      compositeCanvas.height = baseCanvas.height + headerHeight

      const ctx = compositeCanvas.getContext('2d')

      // Fill Background White (User requested "no background colour", implying clean/white)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height)

      // A. Draw Text at TOP (Header)
      ctx.fillStyle = '#000000' // Black text
      ctx.font = `600 ${fontSize}px 'Outfit', sans-serif`
      ctx.textBaseline = 'top'

      let x = footerPadding
      let y = footerPadding // Start from top padding

      lines.forEach(lineText => {
        ctx.fillText(lineText, x, y)
        y += lineHeight
      })

      // B. Draw Pass BELOW Text
      ctx.drawImage(baseCanvas, 0, headerHeight)

      // 3. Export
      const blob = await new Promise((resolve) =>
        compositeCanvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9)
      )

      if (!blob || blob.size < 100) {
        throw new Error('Generated image is empty or invalid.')
      }

      const file = new File([blob], 'ai-bootcamp-pass.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now(),
      })

      const shareData = {
        text: fullCaption,
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
