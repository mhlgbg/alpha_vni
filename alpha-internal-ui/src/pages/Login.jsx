import React, { useState } from "react"
import {
  CButton, CCard, CCardBody, CCardHeader, CCol,
  CContainer, CForm, CFormInput, CFormLabel, CRow
} from "@coreui/react"
import { loginApi } from "../api/authApi"
import { useAuth } from "../contexts/AuthContext"

export default function Login() {
  const { reloadMe } = useAuth()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")

  async function onSubmit(e) {
    e.preventDefault()
    setErr("")
    setBusy(true)
    try {
      const data = await loginApi(identifier, password)
      const token = data?.jwt || data?.token
      if (!token) throw new Error("Missing token in response")
      localStorage.setItem("token", token)
      await reloadMe()
      window.location.href = "/"
    } catch (e2) {
      setErr(e2?.response?.data?.error?.message || e2?.message || "Đăng nhập thất bại")
    } finally {
      setBusy(false)
    }
  }

  return (
    <CContainer className="py-5">
      <CRow className="justify-content-center">
        <CCol md={5}>
          <CCard>
            <CCardHeader><b>Alpha Internal</b> — Đăng nhập</CCardHeader>
            <CCardBody>
              <CForm onSubmit={onSubmit}>
                <div className="mb-3">
                  <CFormLabel>Tài khoản</CFormLabel>
                  <CFormInput value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="email / username" />
                </div>
                <div className="mb-3">
                  <CFormLabel>Mật khẩu</CFormLabel>
                  <CFormInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                {err ? <div className="text-danger mb-3">{err}</div> : null}
                <CButton type="submit" color="primary" disabled={busy}>
                  {busy ? "Đang đăng nhập..." : "Đăng nhập"}
                </CButton>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  )
}
