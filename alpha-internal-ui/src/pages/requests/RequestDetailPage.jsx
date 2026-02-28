import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from "@coreui/react"
import api from "../../api/api"
import { useAuth } from "../../contexts/AuthContext"
import {
  addAssignee,
  changeRequestStatus,
  getMessages,
  getRequestById,
  removeAssignee,
  sendMessage,
} from "../../api/requestApi"

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "WAITING", "DONE", "CLOSED", "CANCELLED"]

function formatDateTime(value) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString()
}

function getStatusColor(status) {
  if (status === "OPEN") return "info"
  if (status === "IN_PROGRESS") return "warning"
  if (status === "WAITING") return "secondary"
  if (status === "DONE") return "success"
  if (status === "CLOSED") return "success"
  if (status === "CANCELLED") return "dark"
  return "secondary"
}

function getApiMessage(error, fallback) {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  )
}

export default function RequestDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { me } = useAuth()

  const messagesBottomRef = useRef(null)

  const [detailLoading, setDetailLoading] = useState(true)
  const [detailError, setDetailError] = useState("")
  const [request, setRequest] = useState(null)

  const [statusUpdating, setStatusUpdating] = useState(false)

  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(true)
  const [messagesError, setMessagesError] = useState("")
  const [messageInput, setMessageInput] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)

  const [showAddAssigneeModal, setShowAddAssigneeModal] = useState(false)
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState("")
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [addingAssignee, setAddingAssignee] = useState(false)
  const [removingAssigneeId, setRemovingAssigneeId] = useState(null)

  const assignees = useMemo(() => {
    const rows = Array.isArray(request?.request_assignees) ? request.request_assignees : []
    return rows.filter((item) => item?.isActive !== false)
  }, [request])

  const requesterId = Number(request?.requester?.id)
  const currentUserId = Number(me?.id)

  const isRequester = Boolean(requesterId && currentUserId && requesterId === currentUserId)
  const isCurrentUserAssignee = assignees.some((item) => Number(item?.user?.id) === currentUserId)
  const canChangeStatus = isRequester || isCurrentUserAssignee

  const assigneeUserIds = useMemo(
    () => assignees.map((item) => Number(item?.user?.id)).filter((value) => Number.isInteger(value) && value > 0),
    [assignees]
  )

  const selectableUsers = useMemo(() => {
    return users.filter((user) => !assigneeUserIds.includes(Number(user.id)))
  }, [users, assigneeUserIds])

  const loadDetail = useCallback(async () => {
    setDetailLoading(true)
    setDetailError("")
    try {
      const res = await getRequestById(id)
      const data = res?.data || null
      setRequest(data)

      if (Array.isArray(data?.request_messages) && data.request_messages.length > 0) {
        setMessages(data.request_messages)
      }
    } catch (error) {
      const status = error?.response?.status
      if (status === 403) {
        setDetailError("Bạn không có quyền xem yêu cầu này")
      } else if (status === 404) {
        setDetailError("Không tìm thấy yêu cầu")
      } else {
        setDetailError(getApiMessage(error, "Không tải được chi tiết yêu cầu"))
      }
    } finally {
      setDetailLoading(false)
    }
  }, [id])

  const loadMessages = useCallback(async () => {
    setMessagesLoading(true)
    setMessagesError("")
    try {
      const res = await getMessages(id)
      const rows = Array.isArray(res?.data) ? res.data : []
      setMessages(rows)
    } catch (error) {
      const status = error?.response?.status
      if (status === 403) {
        setMessagesError("Bạn không có quyền xem trao đổi của yêu cầu này")
      } else {
        setMessagesError(getApiMessage(error, "Không tải được danh sách trao đổi"))
      }
    } finally {
      setMessagesLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadDetail()
    loadMessages()
  }, [loadDetail, loadMessages])

  useEffect(() => {
    if (!messagesBottomRef.current) return
    messagesBottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages])

  async function onChangeStatus(event) {
    const nextStatus = event.target.value
    if (!nextStatus || nextStatus === request?.request_status || !canChangeStatus) return

    setStatusUpdating(true)
    setDetailError("")
    try {
      const res = await changeRequestStatus(id, nextStatus)
      const updatedStatus = res?.data?.request_status || nextStatus
      setRequest((prev) => {
        if (!prev) return prev
        return { ...prev, request_status: updatedStatus }
      })
    } catch (error) {
      const status = error?.response?.status
      if (status === 403) {
        setDetailError("Bạn không có quyền cập nhật trạng thái yêu cầu này")
      } else {
        setDetailError(getApiMessage(error, "Cập nhật trạng thái thất bại"))
      }
    } finally {
      setStatusUpdating(false)
    }
  }

  async function openAddAssigneeModal() {
    setShowAddAssigneeModal(true)
    setUsersLoading(true)
    setUsersError("")
    setSelectedUserId("")

    try {
      const res = await api.get("/users", {
        params: {
          pageSize: 200,
          "pagination[pageSize]": 200,
          sort: "username:asc",
        },
      })

      const payload = res?.data
      const rows = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []

      const mapped = rows
        .map((item) => {
          const userId = item?.id
          if (!userId) return null
          return {
            id: userId,
            username: item?.username || "",
            email: item?.email || "",
          }
        })
        .filter(Boolean)

      setUsers(mapped)
    } catch (error) {
      const status = error?.response?.status
      if (status === 403) {
        setUsersError("Bạn không có quyền xem danh sách người dùng")
      } else {
        setUsersError(getApiMessage(error, "Không tải được danh sách người dùng"))
      }
    } finally {
      setUsersLoading(false)
    }
  }

  async function onSubmitAddAssignee(event) {
    event.preventDefault()
    if (!selectedUserId) return

    setAddingAssignee(true)
    setDetailError("")
    try {
      await addAssignee(id, { userId: Number(selectedUserId) })
      setShowAddAssigneeModal(false)
      await loadDetail()
    } catch (error) {
      const status = error?.response?.status
      if (status === 403) {
        setDetailError("Bạn không có quyền cập nhật yêu cầu này")
      } else {
        setDetailError(getApiMessage(error, "Thêm assignee thất bại"))
      }
    } finally {
      setAddingAssignee(false)
    }
  }

  async function onRemoveAssignee(assigneeId) {
    if (!assigneeId) return

    setRemovingAssigneeId(assigneeId)
    setDetailError("")
    try {
      await removeAssignee(id, assigneeId)
      await loadDetail()
    } catch (error) {
      const status = error?.response?.status
      if (status === 403) {
        setDetailError("Bạn không có quyền cập nhật yêu cầu này")
      } else {
        setDetailError(getApiMessage(error, "Xóa assignee thất bại"))
      }
    } finally {
      setRemovingAssigneeId(null)
    }
  }

  async function onSendMessage() {
    const content = messageInput.trim()
    if (!content) return

    setSendingMessage(true)
    setMessagesError("")
    try {
      await sendMessage(id, { content })
      setMessageInput("")
      await loadMessages()
    } catch (error) {
      const status = error?.response?.status
      if (status === 403) {
        setMessagesError("Bạn không có quyền gửi trao đổi cho yêu cầu này")
      } else {
        setMessagesError(getApiMessage(error, "Gửi trao đổi thất bại"))
      }
    } finally {
      setSendingMessage(false)
    }
  }

  return (
    <CContainer className="py-4">
      <CRow className="justify-content-center">
        <CCol md={10} style={{ maxWidth: 1080 }}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Thông tin yêu cầu</strong>
              <div className="d-flex gap-2">
                {id ? (
                  <Link to={`/requests/${id}/edit`} className="btn btn-outline-primary btn-sm">
                    Chỉnh sửa
                  </Link>
                ) : null}
                <CButton color="secondary" variant="outline" size="sm" onClick={() => navigate("/requests")}>
                  Quay lại
                </CButton>
              </div>
            </CCardHeader>

            <CCardBody>
              {detailLoading ? (
                <div className="d-flex align-items-center gap-2">
                  <CSpinner size="sm" />
                  <span>Đang tải dữ liệu...</span>
                </div>
              ) : detailError ? (
                <CAlert color="danger" className="mb-0">
                  {detailError}
                </CAlert>
              ) : (
                <>
                  <CRow className="g-3 mb-3">
                    <CCol md={9}>
                      <CFormLabel>Tiêu đề</CFormLabel>
                      <CFormInput value={request?.title || "-"} readOnly />
                    </CCol>
                    <CCol md={3}>
                      <CFormLabel>Badge trạng thái</CFormLabel>
                      <div>
                        <CBadge color={getStatusColor(request?.request_status)}>
                          {request?.request_status || "-"}
                        </CBadge>
                      </div>
                    </CCol>
                    <CCol md={4}>
                      <CFormLabel>Người tạo</CFormLabel>
                      <CFormInput value={request?.requester?.username || "-"} readOnly />
                    </CCol>
                    <CCol md={4}>
                      <CFormLabel>Loại yêu cầu</CFormLabel>
                      <CFormInput value={request?.category?.name || "-"} readOnly />
                    </CCol>
                    <CCol md={4}>
                      <CFormLabel>Cập nhật lúc</CFormLabel>
                      <CFormInput value={formatDateTime(request?.updatedAt)} readOnly />
                    </CCol>
                    <CCol md={12}>
                      <CFormLabel>Mô tả</CFormLabel>
                      <CFormTextarea value={request?.description || ""} rows={4} readOnly />
                    </CCol>
                    <CCol md={4}>
                      <CFormLabel>Đổi trạng thái</CFormLabel>
                      <CFormSelect
                        value={request?.request_status || ""}
                        onChange={onChangeStatus}
                        disabled={!canChangeStatus || statusUpdating || detailLoading}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </CFormSelect>
                      {!canChangeStatus ? (
                        <small className="text-body-secondary">Chỉ requester hoặc assignee mới được đổi trạng thái</small>
                      ) : null}
                    </CCol>
                  </CRow>
                </>
              )}
            </CCardBody>
          </CCard>

          <CCard className="mb-4">
            <CCardHeader className="d-flex align-items-center justify-content-between">
              <strong>Assignees</strong>
              {isRequester ? (
                <CButton color="primary" size="sm" onClick={openAddAssigneeModal} disabled={detailLoading}>
                  Thêm assignee
                </CButton>
              ) : null}
            </CCardHeader>
            <CCardBody>
              {detailLoading ? (
                <div className="d-flex align-items-center gap-2">
                  <CSpinner size="sm" />
                  <span>Đang tải dữ liệu...</span>
                </div>
              ) : (
                <>
                  {detailError ? <CAlert color="danger">{detailError}</CAlert> : null}

                  <CTable hover responsive className="mb-0">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Tài khoản</CTableHeaderCell>
                        <CTableHeaderCell>Vai trò</CTableHeaderCell>
                        <CTableHeaderCell>Người gán</CTableHeaderCell>
                        <CTableHeaderCell>Thời gian gán</CTableHeaderCell>
                        {isRequester ? <CTableHeaderCell style={{ width: 120 }}></CTableHeaderCell> : null}
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {assignees.length === 0 ? (
                        <CTableRow>
                          <CTableDataCell colSpan={isRequester ? 5 : 4} className="text-center text-body-secondary">
                            Chưa có người phụ trách
                          </CTableDataCell>
                        </CTableRow>
                      ) : (
                        assignees.map((item) => (
                          <CTableRow key={item.id}>
                            <CTableDataCell>{item?.user?.username || "-"}</CTableDataCell>
                            <CTableDataCell>{item?.roleType || "-"}</CTableDataCell>
                            <CTableDataCell>{item?.assignedBy?.username || "-"}</CTableDataCell>
                            <CTableDataCell>{formatDateTime(item?.assignedAt)}</CTableDataCell>
                            {isRequester ? (
                              <CTableDataCell>
                                <CButton
                                  color="danger"
                                  variant="outline"
                                  size="sm"
                                  disabled={removingAssigneeId === item.id}
                                  onClick={() => onRemoveAssignee(item.id)}
                                >
                                  Xóa
                                </CButton>
                              </CTableDataCell>
                            ) : null}
                          </CTableRow>
                        ))
                      )}
                    </CTableBody>
                  </CTable>
                </>
              )}
            </CCardBody>
          </CCard>

          <CCard>
            <CCardHeader>
              <strong>Messages</strong>
            </CCardHeader>
            <CCardBody>
              {messagesLoading ? (
                <div className="d-flex align-items-center gap-2 mb-3">
                  <CSpinner size="sm" />
                  <span>Đang tải trao đổi...</span>
                </div>
              ) : null}

              {messagesError ? <CAlert color="danger">{messagesError}</CAlert> : null}

              <div style={{ maxHeight: 320, overflowY: "auto" }} className="mb-3">
                <CTable hover responsive className="mb-0">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell style={{ width: 220 }}>Thời gian</CTableHeaderCell>
                        <CTableHeaderCell style={{ width: 220 }}>Tác giả</CTableHeaderCell>
                        <CTableHeaderCell>Nội dung</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {!messagesLoading && messages.length === 0 ? (
                        <CTableRow>
                          <CTableDataCell colSpan={3} className="text-center text-body-secondary">
                            Chưa có trao đổi
                          </CTableDataCell>
                        </CTableRow>
                      ) : (
                        messages.map((item) => (
                          <CTableRow key={item.id}>
                            <CTableDataCell>{formatDateTime(item?.createdAt)}</CTableDataCell>
                            <CTableDataCell>{item?.author?.username || "-"}</CTableDataCell>
                            <CTableDataCell>{item?.content || "-"}</CTableDataCell>
                          </CTableRow>
                        ))
                      )}
                    </CTableBody>
                  </CTable>
                <div ref={messagesBottomRef} />
              </div>

              <CForm
                onSubmit={(event) => {
                  event.preventDefault()
                  onSendMessage()
                }}
              >
                <div className="mb-2">
                  <CFormTextarea
                    rows={4}
                    placeholder="Nhập nội dung trao đổi..."
                    value={messageInput}
                    onChange={(event) => setMessageInput(event.target.value)}
                    disabled={sendingMessage}
                  />
                </div>

                <div className="d-flex justify-content-end">
                  <CButton type="submit" color="primary" disabled={sendingMessage || !messageInput.trim()}>
                    {sendingMessage ? "Đang gửi..." : "Gửi"}
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>

          <CModal visible={showAddAssigneeModal} onClose={() => setShowAddAssigneeModal(false)}>
            <CForm onSubmit={onSubmitAddAssignee}>
              <CModalHeader>
                <CModalTitle>Thêm assignee</CModalTitle>
              </CModalHeader>
              <CModalBody>
                {usersError ? <CAlert color="danger">{usersError}</CAlert> : null}
                {usersLoading ? (
                  <div className="d-flex align-items-center gap-2">
                    <CSpinner size="sm" />
                    <span>Đang tải người dùng...</span>
                  </div>
                ) : (
                  <>
                    <CFormLabel>Chọn người dùng</CFormLabel>
                    <CFormSelect
                      value={selectedUserId}
                      onChange={(event) => setSelectedUserId(event.target.value)}
                      required
                    >
                      <option value="">-- Chọn user --</option>
                      {selectableUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.username || user.email || `User #${user.id}`}
                        </option>
                      ))}
                    </CFormSelect>
                  </>
                )}
              </CModalBody>
              <CModalFooter>
                <CButton
                  color="secondary"
                  variant="outline"
                  onClick={() => setShowAddAssigneeModal(false)}
                  disabled={addingAssignee}
                >
                  Hủy
                </CButton>
                <CButton type="submit" color="primary" disabled={addingAssignee || usersLoading || !selectedUserId}>
                  {addingAssignee ? "Đang thêm..." : "Thêm"}
                </CButton>
              </CModalFooter>
            </CForm>
          </CModal>
        </CCol>
      </CRow>
    </CContainer>
  )
}
