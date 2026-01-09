import { useRef, useEffect, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import confetti from 'canvas-confetti'
import './PassCard.css'

function PassCard({ student }) {
  const passRef = useRef(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Preload the image to ensure it's ready
  useEffect(() => {
    const img = new Image()
    img.src = 'https://res.cloudinary.com/ds3egsoa3/image/upload/v1767944535/Gemini_Generated_Image_cso36ucso36ucso3_1_zeejgw.png'
    img.crossOrigin = 'anonymous'
    img.onload = () => setImageLoaded(true)
    img.onerror = () => {
      // Fallback if image doesn't exist
      console.warn('Workshop image not found, using fallback')
      setImageLoaded(true)
    }
  }, [])

  // Trigger confetti on load
  useEffect(() => {
    const duration = 2000;
    const end = Date.now() + duration;

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
        ticks: 100
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  // Convert slug to proper name (capitalize first letters)
  const slugToName = (slug) => {
    if (!slug) return ''
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  // Get student name - use provided name or convert from slug
  const studentName = student.name || slugToName(student.slug || '')

  const downloadAsPDF = async () => {
    if (!passRef.current) return

    try {
      // Wait for all images to load properly
      const images = passRef.current.querySelectorAll('img')
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise((resolve) => {
              // Check if image is already loaded
              if (img.complete && img.naturalHeight !== 0) {
                resolve()
              } else {
                // Wait for image to load
                const onLoad = () => {
                  img.removeEventListener('load', onLoad)
                  img.removeEventListener('error', onError)
                  resolve()
                }
                const onError = () => {
                  img.removeEventListener('load', onLoad)
                  img.removeEventListener('error', onError)
                  console.warn('Image failed to load:', img.src)
                  resolve() // Continue even if image fails
                }
                img.addEventListener('load', onLoad)
                img.addEventListener('error', onError)
                // Timeout after 10 seconds
                setTimeout(() => {
                  img.removeEventListener('load', onLoad)
                  img.removeEventListener('error', onError)
                  resolve()
                }, 10000)
              }
            })
        )
      )

      // Additional delay to ensure all rendering is complete
      await new Promise(resolve => setTimeout(resolve, 500))

      // Convert images to data URLs to avoid CORS issues with html2canvas
      const imageElements = Array.from(passRef.current.querySelectorAll('img'))
      const originalSrcs = []
      
      for (let i = 0; i < imageElements.length; i++) {
        const img = imageElements[i]
        try {
          // Store original src
          originalSrcs[i] = img.src
          
          // Create a canvas to convert image to data URL
          const imgCanvas = document.createElement('canvas')
          const imgContext = imgCanvas.getContext('2d')
          imgCanvas.width = img.naturalWidth || img.width || 1
          imgCanvas.height = img.naturalHeight || img.height || 1
          
          if (imgCanvas.width > 0 && imgCanvas.height > 0) {
            imgContext.drawImage(img, 0, 0)
            const dataUrl = imgCanvas.toDataURL('image/png')
            // Temporarily replace src with data URL
            img.src = dataUrl
          }
        } catch (e) {
          console.warn('Could not convert image to data URL:', e)
          // Keep original src if conversion fails
        }
      }

      // Wait a bit after converting images
      await new Promise(resolve => setTimeout(resolve, 300))

      const canvas = await html2canvas(passRef.current, {
        scale: 4, // High quality for print
        backgroundColor: '#ffffff',
        useCORS: false, // Not needed since we're using data URLs
        logging: false,
        allowTaint: true, // Allow taint since we're using data URLs
        imageTimeout: 20000,
        removeContainer: false,
        onclone: (clonedDoc) => {
          // Ensure images are visible in cloned document
          const clonedImages = clonedDoc.querySelectorAll('img')
          clonedImages.forEach((img) => {
            img.style.display = 'block'
            img.style.visibility = 'visible'
            img.style.opacity = '1'
          })
        }
      })

      // Restore original image sources
      for (let i = 0; i < imageElements.length; i++) {
        if (originalSrcs[i]) {
          imageElements[i].src = originalSrcs[i]
        }
      }

      const imgData = canvas.toDataURL('image/png', 1.0)

      // Calculate dimensions to maintain aspect ratio
      const imgWidth = 85.6 // Standard ID-1 width in mm
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

  const sharePass = async () => {
    if (!passRef.current) return

    try {
      // Wait for all images to load
      const images = passRef.current.querySelectorAll('img')
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise((resolve, reject) => {
              if (img.complete) {
                resolve()
              } else {
                img.onload = resolve
                img.onerror = resolve // Continue even if image fails
                setTimeout(() => resolve(), 5000)
              }
            })
        )
      )

      await new Promise(resolve => setTimeout(resolve, 300))

      // 1. Capture the pass card as a canvas
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
          })
        }
      })

      // 2. Convert canvas to Blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0))
      if (!blob) throw new Error('Failed to create image blob')

      // 3. Create a File object
      const file = new File([blob], `${studentName}-ai-bootcamp-pass.png`, {
        type: 'image/png',
        lastModified: Date.now(),
      })

      // 4. Generate engaging captions
      const captions = [
        `🎵 Just secured my spot at the AI BOOTCAMP! Ready to create music with AI and unlock the future of music production. Who's joining me on this incredible journey? 🚀 #AIBootcamp #AIMusic #MusicCreation #FutureOfMusic`,
        `🎶 Excited to be part of the AI-Powered Music Creation Workshop! Can't wait to explore how artificial intelligence is revolutionizing music production. Let's make some magic! ✨ #AIBootcamp #MusicTech #Innovation`,
        `🎼 Got my pass for the AI BOOTCAMP! Time to dive deep into AI-powered music creation and discover the endless possibilities. This is going to be epic! 🎹 #AIMusic #MusicGeneration #TechInnovation`,
        `🎵 Thrilled to join the AI BOOTCAMP! Ready to learn how AI is transforming music creation and unleash my creativity with cutting-edge technology. Let's create something amazing together! 🚀 #AIBootcamp #MusicTech #CreativeAI`
      ]
      
      // Select a random engaging caption
      const randomCaption = captions[Math.floor(Math.random() * captions.length)]
      
      // 4. Check if the device supports file sharing
      const shareData = {
        files: [file],
        title: 'AI BOOTCAMP - AI-Powered Music Creation Workshop',
        text: randomCaption,
      }

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        // Fallback: Download the image
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${studentName}-ai-bootcamp-pass.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.warn('Share failed, falling back to URL copy:', error)
      // Gentle fallback: Just copy the URL if image sharing fails
      const url = window.location.href
      navigator.clipboard.writeText(url)
        .then(() => alert('Pass URL copied to clipboard!'))
        .catch(() => alert('Failed to share pass.'))
    }
  }

  return (
    <div className="pass-container">

      {/* Success Message Header */}
      <div className="success-header">
        <div className="success-icon">🎵</div>
        <h1>Registration Successful!</h1>
        <p>Thank you for registering for AI BOOTCAMP.</p>
      </div>

      <div className="pass-card" ref={passRef}>

        {/* Left Side - Details */}
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
            {/* No Profile Photo as requested */}
            <div className="info-group">
              <span className="label">ATTENDEE</span>
              <h2 className="student-name">{studentName}</h2>
            </div>
          </div>


        </div>

        {/* Right Side - Visual */}
        <div className="pass-right">
          <img 
            src="https://res.cloudinary.com/ds3egsoa3/image/upload/v1767944535/Gemini_Generated_Image_cso36ucso36ucso3_1_zeejgw.png" 
            alt="Music Generation with AI Workshop" 
            className="pass-visual"
            crossOrigin="anonymous"
            onLoad={() => setImageLoaded(true)}
            style={{ display: imageLoaded ? 'block' : 'none' }}
          />
          {!imageLoaded && (
            <div className="image-placeholder">
              <div className="placeholder-content">
                <div className="ai-icon">🤖</div>
                <div className="placeholder-text">AI BOOTCAMP</div>
              </div>
            </div>
          )}
          <div className="overlay-gradient"></div>

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

