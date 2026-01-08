import { useRef, useEffect } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import confetti from 'canvas-confetti'
import passIllustration from '../assets/pass_illustration_v2.png'
import './PassCard.css'

function PassCard({ student }) {
  const passRef = useRef(null)

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
      // Small timeout to ensure image rendering
      await new Promise(resolve => setTimeout(resolve, 100))

      const canvas = await html2canvas(passRef.current, {
        scale: 4, // High quality for print
        backgroundColor: null,
        useCORS: true,
        logging: false,
        allowTaint: true
      })

      const imgData = canvas.toDataURL('image/png')

      // Calculate dimensions to maintain aspect ratio
      const imgWidth = 85.6 // Standard ID-1 width in mm
      const pageHeight = (canvas.height * imgWidth) / canvas.width

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [imgWidth, pageHeight],
      })

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, pageHeight)
      pdf.save(`${studentName}-bootcamp-pass.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to download PDF. Please try again.')
    }
  }

  const sharePass = async () => {
    if (!passRef.current) return

    try {
      // 1. Capture the pass card as a canvas
      const canvas = await html2canvas(passRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false,
        allowTaint: true
      })

      // 2. Convert canvas to Blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('Failed to create image blob')

      // 3. Create a File object
      const file = new File([blob], 'my-bootcamp-pass.png', {
        type: 'image/png',
        lastModified: Date.now(),
      })

      // 4. Check if the device supports file sharing
      const shareData = {
        files: [file],
        title: 'AI BOOTCAMP Registration',
        text: "Just secured my spot at the AI BOOTCAMP! 🚀 Ready to dive into the future of technology. Who's joining me? #AIBootcamp #AI #FutureReady",
      }

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        // Fallback for desktop or unsupported browsers
        throw new Error('Image sharing not supported on this device')
      }
    } catch (error) {
      console.warn('Share failed, falling back to URL copy:', error)
      // Gentle fallback: Just copy the URL if image sharing fails
      const url = window.location.href
      navigator.clipboard.writeText(url)
        .then(() => alert('Image sharing not supported using the browser. Pass URL copied to clipboard instead!'))
        .catch(() => alert('Failed to share pass.'))
    }
  }

  return (
    <div className="pass-container">

      {/* Success Message Header */}
      <div className="success-header">
        <div className="success-icon">🎉</div>
        <h1>Registration Successful!</h1>
        <p>Thank you for registering for the AI BOOTCAMP.</p>
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
              <span>10th DECEMBER</span>
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
          <img src={passIllustration} alt="AI Illustration" className="pass-visual" />
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

