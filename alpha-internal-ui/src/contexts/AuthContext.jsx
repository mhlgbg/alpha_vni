import React, { createContext, useContext, useEffect, useState } from "react"
import { getMyPermissionsApi, meApi } from "../api/authApi"

const AuthContext = createContext(null)

function extractRoleTextFromPermissions(payload) {
  if (!payload) return ""

  if (payload?.role?.name) return payload.role.name
  if (payload?.role?.type) return payload.role.type

  if (payload?.roles?.[0]?.name) return payload.roles[0].name
  if (payload?.roles?.[0]?.type) return payload.roles[0].type

  if (payload?.user?.role?.name) return payload.user.role.name
  if (payload?.user?.role?.type) return payload.user.role.type

  return ""
}

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
      const [baseUser, permissionsPayload] = await Promise.all([meApi(), getMyPermissionsApi()])

      const roleText =
        extractRoleTextFromPermissions(permissionsPayload) ||
        baseUser?.role?.name ||
        baseUser?.role?.type ||
        "-"

      const data = {
        ...baseUser,
        roleText,
      }

      setMe(data)
      localStorage.setItem("me", JSON.stringify(data))
    } catch {
      setMe(null)
      localStorage.removeItem("token")
      localStorage.removeItem("me")
      localStorage.removeItem("permissionKeys")
      localStorage.removeItem("iamRole")
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
    localStorage.removeItem("permissionKeys")
    localStorage.removeItem("iamRole")
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
