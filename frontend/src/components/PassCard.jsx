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

  const sharePass = async () => {
    if (!passRef.current) return

    const captions = [
      `Excited to master Productive Study Systems & AI Music Creation! 📚🎵`,
      `Boosting my Board Prep & Making AI Music at the AI BOOTCAMP! 🚀✨`,
      `Just registered! Ready for Smart Study Tactics & AI Music Magic. 🎹🤖`,
      `Joining the AI BOOTCAMP for Board Exam Strategy & Music Tech! 🎧🧠`,
    ]
    const randomCaption = captions[Math.floor(Math.random() * captions.length)]
    const fullCaption = `${randomCaption}\n\nInterested in joining? DM me!`

    try {
      showToast('Processing image... ⏳')
      await new Promise((r) => setTimeout(r, 100))

      const images = passRef.current.querySelectorAll('img')
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete && img.naturalHeight !== 0) resolve()
              else {
                img.onload = () => resolve()
                img.onerror = () => resolve()
                setTimeout(() => resolve(), 5000)
              }
            })
        )
      )

      const passCanvas = await html2canvas(passRef.current, {
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

      const blob = await new Promise((resolve) =>
        passCanvas.toBlob((b) => resolve(b), 'image/png', 1.0)
      )

      if (!blob || blob.size < 100) {
        throw new Error('Generated image is empty or invalid.')
      }

      const file = new File([blob], 'ai-bootcamp-pass.png', {
        type: 'image/png',
        lastModified: Date.now(),
      })

      const shareData = {
        title: 'AI BOOTCAMP Pass',
        text: fullCaption,
        files: [file],
      }

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
        showToast('Shared successfully! 🚀')
      } else {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'ai-bootcamp-pass.png'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        showToast('Image downloaded')
      }
    } catch (error) {
      if (error?.name === 'AbortError') return
      console.warn('Share failed:', error)
      showToast('Share failed. Copying caption...')
      try {
        await navigator.clipboard.writeText(fullCaption)
        showToast('Caption copied to clipboard!')
      } catch (e) {
        showToast('Failed to share.')
      }
    }
  }

  return (
    <div className="pass-container">
      {toastMsg && <div className="toast-notification">{toastMsg}</div>}
      <div className="success-header">
        <div className="success-icon"> 🎉 </div>
        <h1>Registration Successful!</h1>
        <p>Thank you for registering for AI BOOTCAMP.</p>
      </div>

      <div className="pass-card" ref={passRef}>
        <div className="pass-left">
          <div className="pass-bg-pattern"></div>

          <div className="branding-header">
            <img src="https://res.cloudinary.com/ds3egsoa3/image/upload/v1767962824/niat_k85nue.png" alt="NIAT Logo" className="brand-logo" />
          </div>

          <div className="header-group">
            <h1 className="main-title">AI BOOTCAMP</h1>
            <div className="sub-header">
              <span>Smart Exam Strategy System for Board Exams 
                &
              AI-Powered PPT Creation</span>
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
            src="https://res.cloudinary.com/ds3egsoa3/image/upload/c_fill,w_992,h_1080/v1770274903/ChatGPT_Image_Feb_5_2026_12_30_24_PM_tduzwj.png"
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
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
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
            <span>PREMIUM BOOTCAMP PASS</span>
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
