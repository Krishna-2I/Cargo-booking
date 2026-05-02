import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login   from './pages/Login'
import Home    from './pages/Home'
import Track   from './pages/Track'
import Admin   from './pages/Admin'
import Layout  from './components/Layout'

function PrivateRoute({ children }) {
  return localStorage.getItem('haulgo_token') ? children : <Navigate to="/login" replace />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/"      element={<Home />} />
        <Route path="/track" element={<Track />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
)
