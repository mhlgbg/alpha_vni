import React from "react"
import { Navigate } from "react-router-dom"
import { useIam } from "../contexts/IamContext"

export default function RequirePermission({ children, permissionKey, permissionAny }) {
  const { loading, can, canAny } = useIam()

  if (loading) {
    return <div>Loading permissions...</div>
  }

  if (!permissionKey && (!Array.isArray(permissionAny) || permissionAny.length === 0)) {
    return children
  }

  const hasPermission =
    (permissionKey ? can(permissionKey) : false) ||
    (Array.isArray(permissionAny) && permissionAny.length > 0 ? canAny(permissionAny) : false)

  if (!hasPermission) {
    return <Navigate to="/403" replace />
  }

  return children
}
