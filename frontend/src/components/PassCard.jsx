import { useRef, useEffect, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import confetti from 'canvas-confetti'
import './PassCard.css'

function PassCard({ student }) {
  const passRef = useRef(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

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

  const downloadAsPDF = async () => {
    if (!passRef.current) return

    try {
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
                  console.warn('Image failed to load:', img.src)
                  resolve()
                }
                img.addEventListener('load', onLoad)
                img.addEventListener('error', onError)
                setTimeout(() => {
                  img.removeEventListener('load', onLoad)
                  img.removeEventListener('error', onError)
                  resolve()
                }, 10000)
              }
            })
        )
      )

      await new Promise((r) => setTimeout(r, 500))

      const imageElements = Array.from(passRef.current.querySelectorAll('img'))
      const originalSrcs = []

      for (let i = 0; i < imageElements.length; i++) {
        const img = imageElements[i]
        try {
          originalSrcs[i] = img.src

          const imgCanvas = document.createElement('canvas')
          const imgContext = imgCanvas.getContext('2d')
          imgCanvas.width = img.naturalWidth || img.width || 1
          imgCanvas.height = img.naturalHeight || img.height || 1

          if (imgCanvas.width > 0 && imgCanvas.height > 0) {
            imgContext.drawImage(img, 0, 0)
            const dataUrl = imgCanvas.toDataURL('image/png')
            img.src = dataUrl
          }
        } catch (e) {
          console.warn('Could not convert image to data URL:', e)
        }
      }

      await new Promise((r) => setTimeout(r, 300))

      const canvas = await html2canvas(passRef.current, {
        scale: 4,
        backgroundColor: '#ffffff',
        useCORS: false,
        logging: false,
        allowTaint: true,
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

      for (let i = 0; i < imageElements.length; i++) {
        if (originalSrcs[i]) imageElements[i].src = originalSrcs[i]
      }

      const imgData = canvas.toDataURL('image/png', 1.0)

      const imgWidth = 85.6
      const pageHeight = (canvas.height * imgWidth) / canvas.width

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [imgWidth, pageHeight],
      })

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, pageHeight)
      pdf.save(`${studentName}-ai-bootcamp-pass.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to download PDF. Please try again.')
    }
  }

  // ✅ UPDATED: share image + caption together (when supported)
  const sharePass = async () => {
    if (!passRef.current) return

    const captions = [
      `🎵 Just secured my spot at the AI BOOTCAMP! Ready to create music with AI and unlock the future of music production. Who's joining me on this incredible journey? 🚀 #AIBootcamp #AIMusic #MusicCreation #FutureOfMusic`,
      `🎶 Excited to be part of the AI-Powered Music Creation Workshop! Can't wait to explore how artificial intelligence is revolutionizing music production. Let's make some magic! ✨ #AIBootcamp #MusicTech #Innovation`,
      `🎼 Got my pass for the AI BOOTCAMP! Time to dive deep into AI-powered music creation and discover the endless possibilities. This is going to be epic! 🎹 #AIMusic #MusicGeneration #TechInnovation`,
      `🎵 Thrilled to join the AI BOOTCAMP! Ready to learn how AI is transforming music creation and unleash my creativity with cutting-edge technology. Let's create something amazing together! 🚀 #AIBootcamp #MusicTech #CreativeAI`,
    ]
    const randomCaption = captions[Math.floor(Math.random() * captions.length)]
    const pageUrl = window.location.href
    const fullCaption = `${randomCaption}\n\n${pageUrl}`

    try {
      // Wait for images to load
      const images = passRef.current.querySelectorAll('img')
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete && img.naturalHeight !== 0) resolve()
              else {
                const done = () => resolve()
                img.addEventListener('load', done, { once: true })
                img.addEventListener('error', done, { once: true })
                setTimeout(resolve, 8000)
              }
            })
        )
      )

      await new Promise((r) => setTimeout(r, 250))

      // Capture the pass as a canvas
      const canvas = await html2canvas(passRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        allowTaint: false,
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

      // Convert canvas to Blob
      const blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png', 1.0)
      )
      if (!blob) throw new Error('Failed to create image blob')

      // Create file
      const file = new File([blob], `${studentName}-ai-bootcamp-pass.png`, {
        type: 'image/png',
        lastModified: Date.now(),
      })

      // ✅ Primary attempt: image + caption together
      const shareDataWithFile = {
        title: 'AI BOOTCAMP - AI-Powered Music Creation Workshop',
        text: fullCaption,
        files: [file],
      }

      // Some browsers throw if canShare is missing; guard it
      const canShareFiles =
        !!navigator.share &&
        (!navigator.canShare || navigator.canShare(shareDataWithFile))

      if (canShareFiles) {
        await navigator.share(shareDataWithFile)
        return
      }

      // Fallback: copy caption + download image
      try {
        await navigator.clipboard.writeText(fullCaption)
        alert('Caption copied to clipboard! Downloading pass image...')
      } catch (e) {
        console.warn('Clipboard write failed:', e)
        alert('Downloading pass image...')
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${studentName}-ai-bootcamp-pass.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      // If user cancels share, don't show scary alerts
      if (error?.name === 'AbortError') return

      console.warn('Share failed, falling back to URL copy:', error)

      try {
        await navigator.clipboard.writeText(fullCaption)
        alert('Caption copied to clipboard!')
      } catch {
        alert('Failed to share pass.')
      }
    }
  }

  return (
    <div className="pass-container">
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
              console.warn('Image load error, retrying without crossOrigin')
              const img = e.target

              if (img.crossOrigin) {
                img.removeAttribute('crossorigin')
                img.crossOrigin = null
                const currentSrc = img.src
                img.src = ''
                setTimeout(() => {
                  img.src = currentSrc
                }, 50)
              } else {
                setImageError(true)
                setImageLoaded(true)
              }
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
        <button onClick={downloadAsPDF} className="action-btn download">
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
