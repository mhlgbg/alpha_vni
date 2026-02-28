import React from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { IamProvider } from "./contexts/IamContext"
import ProtectedRoute from "./components/ProtectedRoute"
import RequirePermission from "./components/RequirePermission"
import AppLayout from "./layout/AppLayout"
import Login from "./pages/Login"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import Activate from "./pages/Activate"
import SetPassword from "./pages/SetPassword"
import Home from "./pages/Home"
import Profile from "./pages/Profile"
import ChangePassword from "./pages/ChangePassword"
import InviteUser from "./pages/InviteUser"
import Forbidden403 from "./pages/Forbidden403"
import RequestListPage from "./pages/requests/RequestListPage.jsx"
import RequestFormPage from "./pages/requests/RequestFormPage.jsx"
import RequestDetailPage from "./pages/requests/RequestDetailPage.jsx"

import RequestCategories from "./pages/RequestCategories"
import Users from "./pages/Users"

export default function App() {
  return (
    <AuthProvider>
      <IamProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/activate" element={<Activate />} />
            <Route path="/set-password" element={<SetPassword />} />

            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/change-password" element={<ChangePassword />} />
                      <Route path="/403" element={<Forbidden403 />} />
                      <Route
                        path="/requests"
                        element={
                          <RequirePermission permissionKey="requests">
                            <RequestListPage />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/requests/new"
                        element={
                          <RequirePermission permissionKey="requests">
                            <RequestFormPage />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/requests/:id"
                        element={
                          <RequirePermission permissionKey="requests">
                            <RequestDetailPage />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/requests/:id/edit"
                        element={
                          <RequirePermission permissionKey="requests">
                            <RequestFormPage />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/request-categories"
                        element={
                          <RequirePermission permissionKey="request-categories">
                            <RequestCategories />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/users"
                        element={
                          <RequirePermission permissionKey="users">
                            <Users />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/invite-user"
                        element={
                          <RequirePermission permissionKey="invite-user">
                            <InviteUser />
                          </RequirePermission>
                        }
                      />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </IamProvider>
    </AuthProvider>
  )
}
