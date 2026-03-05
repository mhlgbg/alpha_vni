import React from "react"
import { NavLink } from "react-router-dom"
import { CButton } from "@coreui/react"
import navigation from "../_nav"
import { useIam } from "../contexts/IamContext"
import { useAuth } from "../contexts/AuthContext"
import { isLeadershipUser } from "../utils/leadership"
import { brandName, logoUrl } from "../theme/brand"

function isVisible(item, can, isLeadership) {
  if (item?.leadershipOnly && !isLeadership) return false
  if (!item?.permissionKey) return true
  return can(item.permissionKey)
}

export default function AppSidebar({ collapsed, mobileOpen, onCloseMobile }) {
  const { permissionKeys, loading, role } = useIam()
  const { me } = useAuth()

  const can = (key) => permissionKeys.includes(key)
  const leadershipAccess = isLeadershipUser({
    iamRole: role,
    meRole: me?.roleText || me?.role,
  })

  const source = loading ? [] : navigation

  const visibleNavItems = source.filter((item, index) => {
    if (item.type === "title") {
      for (let pointer = index + 1; pointer < source.length; pointer += 1) {
        const next = source[pointer]
        if (next.type === "title") break
        if (isVisible(next, can, leadershipAccess)) return true
      }
      return false
    }

    return isVisible(item, can, leadershipAccess)
  })

  const sidebarClassName = [
    "admin-sidebar",
    collapsed ? "is-collapsed" : "",
    mobileOpen ? "is-mobile-open" : "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <aside className={sidebarClassName}>
      <div className="admin-sidebar-header">
        <img src={logoUrl} alt={brandName} className="admin-sidebar-logo" />
        <div className="admin-sidebar-brand-text">
          <div className="admin-sidebar-brand-name">{brandName}</div>
          <div className="admin-sidebar-brand-sub">Enterprise Console</div>
        </div>

        <CButton
          color="light"
          variant="ghost"
          size="sm"
          className="admin-sidebar-mobile-close d-lg-none"
          onClick={onCloseMobile}
        >
          ✕
        </CButton>
      </div>

      <nav className="admin-sidebar-nav">
        {visibleNavItems.map((item, index) => {
          const key = `${item.type}-${item.name}-${index}`

          if (item.type === "title") {
            return (
              <div key={key} className="admin-sidebar-group-title">
                {item.name}
              </div>
            )
          }

          return (
            <NavLink
              key={key}
              to={item.to}
              className={({ isActive }) =>
                ["admin-sidebar-link", isActive ? "active" : ""].filter(Boolean).join(" ")
              }
              onClick={onCloseMobile}
            >
              <span className="admin-sidebar-link-dot" aria-hidden>
                •
              </span>
              <span className="admin-sidebar-link-label">{item.name}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
