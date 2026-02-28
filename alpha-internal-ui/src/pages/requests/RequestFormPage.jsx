import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CForm,
  CFormFeedback,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CRow,
  CSpinner,
} from "@coreui/react"
import { createRequest, getRequestById, getRequestCategories, updateRequest } from "../../api/requestApi"

function mapCategories(payload) {
  const rows = Array.isArray(payload?.data) ? payload.data : []

  return rows
    .map((item) => {
      const id = item?.id
      const name = item?.name || item?.attributes?.name || `Category #${id}`
      if (!id) return null
      return { id, name }
    })
    .filter(Boolean)
}

function getApiMessage(error, fallback) {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  )
}

export default function RequestFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()

  const isEditMode = useMemo(() => Boolean(id), [id])

  const [title, setTitle] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [description, setDescription] = useState("")

  const [categories, setCategories] = useState([])
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [validated, setValidated] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let isCancelled = false

    async function loadInitialData() {
      setLoadingInitial(true)
      setErrorMessage("")

      try {
        const categoryPromise = getRequestCategories()
        const requestPromise = isEditMode ? getRequestById(id) : Promise.resolve(null)

        const [categoryRes, requestRes] = await Promise.all([categoryPromise, requestPromise])

        if (isCancelled) return

        setCategories(mapCategories(categoryRes))

        if (isEditMode) {
          const requestData = requestRes?.data || {}
          const selectedCategoryId =
            requestData?.category?.id || requestData?.request_category?.id || requestData?.request_category || ""

          setTitle(requestData?.title || "")
          setDescription(requestData?.description || "")
          setCategoryId(selectedCategoryId ? String(selectedCategoryId) : "")
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(getApiMessage(error, "Không tải được dữ liệu biểu mẫu"))
        }
      } finally {
        if (!isCancelled) {
          setLoadingInitial(false)
        }
      }
    }

    loadInitialData()

    return () => {
      isCancelled = true
    }
  }, [id, isEditMode])

  async function onSubmit(event) {
    event.preventDefault()
    setValidated(true)
    setErrorMessage("")

    if (!title.trim() || !categoryId) {
      return
    }

    const payload = {
      title: title.trim(),
      categoryId: Number(categoryId),
      description: description.trim() || "",
      tagIds: [],
    }

    setSubmitting(true)
    try {
      if (isEditMode) {
        await updateRequest(id, payload)
        navigate(`/requests/${id}`)
      } else {
        const created = await createRequest(payload)
        const newId = created?.data?.id
        if (newId) {
          navigate(`/requests/${newId}`)
        } else {
          navigate("/requests")
        }
      }
    } catch (error) {
      const status = error?.response?.status
      if (isEditMode && status === 403) {
        setErrorMessage("Bạn không có quyền cập nhật yêu cầu này")
      } else {
        setErrorMessage(getApiMessage(error, "Không thể lưu yêu cầu"))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CContainer className="py-4">
      <CRow className="justify-content-center">
        <CCol md={10} style={{ maxWidth: 920 }}>
          <CCard>
            <CCardHeader>
              <strong>{isEditMode ? "Cập nhật yêu cầu" : "Tạo yêu cầu"}</strong>
            </CCardHeader>
            <CCardBody>
              {loadingInitial ? (
                <div className="d-flex align-items-center gap-2">
                  <CSpinner size="sm" />
                  <span>Đang tải dữ liệu...</span>
                </div>
              ) : (
                <>
                  {errorMessage ? <CAlert color="danger">{errorMessage}</CAlert> : null}

                  <CForm noValidate validated={validated} onSubmit={onSubmit}>
                    <div className="mb-3">
                      <CFormLabel>Tiêu đề</CFormLabel>
                      <CFormInput
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Nhập tiêu đề yêu cầu"
                      />
                      <CFormFeedback invalid>Vui lòng nhập tiêu đề</CFormFeedback>
                    </div>

                    <div className="mb-3">
                      <CFormLabel>Loại yêu cầu</CFormLabel>
                      <CFormSelect required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                        <option value="">-- Chọn loại yêu cầu --</option>
                        {categories.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </CFormSelect>
                      <CFormFeedback invalid>Vui lòng chọn loại yêu cầu</CFormFeedback>
                    </div>

                    <div className="mb-3">
                      <CFormLabel>Mô tả</CFormLabel>
                      <CFormTextarea
                        rows={6}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Nhập mô tả (không bắt buộc)"
                      />
                    </div>

                    <div className="mb-4">
                      <CFormLabel>Tags</CFormLabel>
                      <CFormInput value="Sẽ bổ sung sau" disabled readOnly />
                    </div>

                    <div className="d-flex gap-2">
                      <CButton type="submit" color="primary" disabled={submitting}>
                        {submitting ? "Đang lưu..." : "Lưu"}
                      </CButton>
                      <CButton type="button" color="secondary" variant="outline" onClick={() => navigate("/requests")}>
                        Hủy
                      </CButton>
                    </div>
                  </CForm>
                </>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  )
}
