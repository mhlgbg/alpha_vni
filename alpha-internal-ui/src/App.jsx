import React from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import AppLayout from "./layout/AppLayout"
import Login from "./pages/Login"
import Home from "./pages/Home"

import Requests from "./pages/Requests"
import RequestCategories from "./pages/RequestCategories"
import Users from "./pages/Users"

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/requests" element={<Requests />} />
                    <Route path="/request-categories" element={<RequestCategories />} />
                    <Route path="/users" element={<Users />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
