import { useRef } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import passIllustration from '../assets/pass_illustration_v2.png'
import './PassCard.css'

function PassCard({ student }) {
  const passRef = useRef(null)

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
        scale: 4, // Higher scale for print quality
        backgroundColor: null,
        useCORS: true,
        logging: false,
        allowTaint: true
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 54], // Standard ID card size
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${studentName}-bootcamp-pass.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to download PDF. Please try again.')
    }
  }

  const sharePass = () => {
    const url = window.location.href

    if (navigator.share) {
      navigator.share({
        title: `${studentName} - AI BOOTCAMP Pass`,
        text: `I'm attending the AI BOOTCAMP! Check out my pass.`,
        url: url,
      }).catch(console.error)
    } else {
      navigator.clipboard.writeText(url)
        .then(() => alert('Pass URL copied to clipboard!'))
        .catch(() => alert('Failed to copy URL'))
    }
  }

  return (
    <div className="pass-container">
      <div className="pass-card" ref={passRef}>

        {/* Left Side - Details */}
        <div className="pass-left">
          <div className="pass-bg-pattern"></div>

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

          <div className="pass-footer-left">
            <div className="id-chip">
              <span>ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
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

