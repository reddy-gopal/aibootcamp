import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import PassCard from '../components/PassCard'
import './PassPage.css'

function PassPage() {
  const { studentId } = useParams()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    setLoading(true)

    const timer = setTimeout(() => {
      resolveStudentName()
    }, 500)

    return () => clearTimeout(timer)
  }, [studentId]) // Added studentId to dependency array to re-run if it changes

  const resolveStudentName = () => {
    try {
      // 1. Check LocalStorage first
      const storedName = localStorage.getItem('studentPassName')

      let finalName = null

      if (storedName) {
        // Requirement: Always prefer localStorage if it exists (locks the name)
        finalName = storedName
      } else if (studentId) {
        // Helper to format the name from the URL slug/ID
        // Handles "rohit-sharma" -> "Rohit Sharma"
        // Handles "Rohit%20Sharma" -> "Rohit Sharma"
        const raw = decodeURIComponent(studentId)
        const formatted = raw
          .replace(/-/g, ' ') // Replace hyphens with spaces
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')

        finalName = formatted

        // Save to storage for future visits
        localStorage.setItem('studentPassName', finalName)
      }

      if (finalName) {
        setStudent({
          name: finalName,
          workshop: 'Music Generation with AI',
          date: '10th DECEMBER'
        })
        setAccessDenied(false)
      } else {
        setStudent(null)
        setAccessDenied(true)
      }
    } catch (error) {
      console.error("Error resolving pass name:", error)
      setAccessDenied(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="pass-page">
        <div className="loading">Generating Pass...</div>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="pass-page">
        <div className="registration-required">
          <div className="error-card">
            <h1>Access Denied</h1>
            <p>We couldn't generate your pass.</p>
            <p className="instruction">Please ensure you have visited the correct link provided to you.</p>
            <Link to="/" className="back-link">Return to Home</Link>
          </div>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="pass-page">
        <div className="error">
          <h2>Error</h2>
          <p>Something went wrong. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pass-page">
      <PassCard student={student} />
    </div>
  )
}

export default PassPage

