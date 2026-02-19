import React, { createContext, useContext, useEffect, useState } from "react"
import { meApi } from "../api/authApi"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [me, setMe] = useState(() => {
    const cached = localStorage.getItem("me")
    return cached ? JSON.parse(cached) : null
  })
  const [loading, setLoading] = useState(true)

  async function reloadMe() {
    const token = localStorage.getItem("token")
    if (!token) {
      setMe(null)
      setLoading(false)
      return
    }
    try {
      const data = await meApi()
      setMe(data)
      localStorage.setItem("me", JSON.stringify(data))
    } catch {
      setMe(null)
      localStorage.removeItem("token")
      localStorage.removeItem("me")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reloadMe()
  }, [])

  function logout() {
    setMe(null)
    localStorage.removeItem("token")
    localStorage.removeItem("me")
    window.location.href = "/login"
  }

  return (
    <AuthContext.Provider value={{ me, loading, reloadMe, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
