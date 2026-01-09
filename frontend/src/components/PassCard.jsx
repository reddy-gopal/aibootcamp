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
    img.src = '/workshop-illustration.png'
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
      // Wait for all images to load before capturing
      const images = passRef.current.querySelectorAll('img')
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise((resolve, reject) => {
              if (img.complete) {
                resolve()
              } else {
                img.onload = resolve
                img.onerror = reject
                // Timeout after 5 seconds
                setTimeout(() => resolve(), 5000)
              }
            })
        )
      )

      // Additional delay to ensure rendering
      await new Promise(resolve => setTimeout(resolve, 300))

      const canvas = await html2canvas(passRef.current, {
        scale: 4, // High quality for print
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        allowTaint: false,
        imageTimeout: 15000,
        removeContainer: false,
        onclone: (clonedDoc) => {
          // Ensure images are visible in cloned document
          const clonedImages = clonedDoc.querySelectorAll('img')
          clonedImages.forEach((img) => {
            img.style.display = 'block'
            img.style.visibility = 'visible'
          })
        }
      })

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
      pdf.save(`${studentName}-melody-ai-pass.pdf`)
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
      const file = new File([blob], `${studentName}-melody-ai-pass.png`, {
        type: 'image/png',
        lastModified: Date.now(),
      })

      // 4. Check if the device supports file sharing
      const shareData = {
        files: [file],
        title: 'Music Generation with AI - Registration',
        text: "Just secured my spot at the Music Generation with AI workshop! 🎵 Ready to create melodies with artificial intelligence. Who's joining me? #AIMusic #MusicGeneration #MelodyAI",
      }

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        // Fallback: Download the image
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${studentName}-melody-ai-pass.png`
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
        <p>Thank you for registering for Music Generation with AI.</p>
      </div>

      <div className="pass-card" ref={passRef}>

        {/* Left Side - Details */}
        <div className="pass-left">
          <div className="pass-bg-pattern"></div>

          <div className="branding-header">
            <img src="/niat.png" alt="NIAT Logo" className="brand-logo" />
          </div>

          <div className="header-group">
            <h1 className="main-title">MUSIC × AI</h1>
            <div className="sub-header">
              <span>MUSIC GENERATION WORKSHOP</span>
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
            src="/image.png" 
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
                <div className="placeholder-text">MUSIC × AI</div>
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

