import { Link } from 'react-router-dom'
import './PassPage.css'

function HomePage() {
  return (
    <div className="pass-page">
      <div className="registration-required">
        <div className="error-card">
          <h1>Access Denied</h1>
          <p>No valid pass URL provided.</p>
          <p className="instruction">You must be registered for the AI BOOTCAMP to view and download your pass.</p>
          <button className="register-btn" onClick={() => window.location.href = 'https://www.niatindia.com/ai-bootcamp'}>
            Register Now
          </button>
        </div>
      </div>
    </div>
  )
}

export default HomePage
