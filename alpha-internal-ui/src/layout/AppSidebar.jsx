import React from "react"
import {
  CSidebar,
  CSidebarBrand,
  CSidebarNav,
  CNavItem,
  CNavTitle,
} from "@coreui/react"
import { NavLink } from "react-router-dom"

export default function AppSidebar({ visible, onVisibleChange }) {
  const closeOnMobile = () => {
    if (window.matchMedia("(max-width: 768px)").matches) {
      onVisibleChange(false)
    }
  }

  return (
    <CSidebar
      position="fixed"
      visible={visible}
      onVisibleChange={onVisibleChange}
    >
      <CSidebarBrand className="d-none d-md-flex">
        Alpha Internal
      </CSidebarBrand>

      <CSidebarNav>
        <CNavItem>
          <NavLink className="nav-link" to="/" onClick={closeOnMobile}>
            Dashboard
          </NavLink>
        </CNavItem>

        <CNavTitle>Request</CNavTitle>

        <CNavItem>
          <NavLink className="nav-link" to="/requests" onClick={closeOnMobile}>
            Danh sách yêu cầu
          </NavLink>
        </CNavItem>

        <CNavItem>
          <NavLink className="nav-link" to="/request-categories" onClick={closeOnMobile}>
            Loại công việc
          </NavLink>
        </CNavItem>

        <CNavTitle>Hệ thống</CNavTitle>

        <CNavItem>
          <NavLink className="nav-link" to="/users" onClick={closeOnMobile}>
            Người dùng
          </NavLink>
        </CNavItem>
      </CSidebarNav>
    </CSidebar>
  )
}
