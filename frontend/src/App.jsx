import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import PassPage from './pages/PassPage'
import HomePage from './pages/HomePage'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pass/:studentSlug" element={<PassPage />} />
      </Routes>
    </Router>
  )
}

export default App
