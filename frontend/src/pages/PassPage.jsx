import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import PassCard from '../components/PassCard'
import { registeredUsers } from '../data/users'
import './PassPage.css'

function PassPage() {
  const { studentSlug } = useParams()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notRegistered, setNotRegistered] = useState(false)

  useEffect(() => {
    // Simulate API delay
    setLoading(true)
    const timer = setTimeout(() => {
      checkRegistration(studentSlug)
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [studentSlug])

  const checkRegistration = (slug) => {
    // Check if the slug exists in our registered users list
    const foundUser = registeredUsers.find(user => user.slug === slug)

    if (foundUser) {
      setStudent({
        ...foundUser,
        workshop: 'Music Generation with AI Workshop',
        date: '10th DECEMBER',
        passUrl: window.location.href
      })
      setNotRegistered(false)
    } else {
      setStudent(null)
      setNotRegistered(true)
    }
  }

  if (loading) {
    return (
      <div className="pass-page">
        <div className="loading">Checking registration...</div>
      </div>
    )
  }

  if (notRegistered) {
    return (
      <div className="pass-page">
        <div className="registration-required">
          <div className="error-card">
            <h1>Access Denied</h1>
            <p>We couldn't find a registration for <strong>{studentSlug}</strong>.</p>
            <p className="instruction">You must be registered for Music Generation with AI to view and download your pass.</p>
            <button className="register-btn" onClick={() => window.location.href = 'https://www.niatindia.com/ai-bootcamp'}>
              Register Now
            </button>
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

