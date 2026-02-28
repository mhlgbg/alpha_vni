import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormSelect,
  CLink,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CPagination,
  CPaginationItem,
} from "@coreui/react"
import { getRequests } from "../../api/requestApi"

function formatDate(value) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleString()
}

function getStatusColor(status) {
  if (status === "OPEN") return "info"
  if (status === "IN_PROGRESS") return "warning"
  if (status === "CLOSED") return "success"
  return "secondary"
}

export default function RequestListPage() {
  const navigate = useNavigate()

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
  })

  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [keyword, setKeyword] = useState("")
  const [requester, setRequester] = useState("")

  const [appliedFilters, setAppliedFilters] = useState({
    fromDate: "",
    toDate: "",
    keyword: "",
    requester: "",
  })

  const pageCount = useMemo(() => {
    if (!pagination.total || !pagination.pageSize) return 1
    return Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
  }, [pagination.total, pagination.pageSize])

  async function loadData({ page = pagination.page, pageSize = pagination.pageSize, filters = appliedFilters } = {}) {
    setLoading(true)
    try {
      const requesterId = Number(filters.requester)

      const params = {
        sort: "createdAt:desc",
        "pagination[page]": page,
        "pagination[pageSize]": pageSize,
        "filters[from]": filters.fromDate || undefined,
        "filters[to]": filters.toDate || undefined,
        "filters[keyword]": filters.keyword || undefined,
        "filters[requester]": filters.requester || undefined,
        page,
        pageSize,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
        keyword: filters.keyword || undefined,
        requesterId: Number.isInteger(requesterId) && requesterId > 0 ? requesterId : undefined,
      }

      const res = await getRequests(params)
      const rows = Array.isArray(res?.data) ? res.data : []
      const p = res?.meta?.pagination || {}

      setRequests(rows)
      setPagination({
        page: p.page ?? page,
        pageSize: p.pageSize ?? pageSize,
        total: p.total ?? 0,
      })
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSearch = () => {
    const nextFilters = {
      fromDate,
      toDate,
      keyword: keyword.trim(),
      requester: requester.trim(),
    }

    setAppliedFilters(nextFilters)
    setPagination((prev) => ({ ...prev, page: 1 }))
    loadData({ page: 1, pageSize: pagination.pageSize, filters: nextFilters })
  }

  const onReset = () => {
    const empty = { fromDate: "", toDate: "", keyword: "", requester: "" }
    setFromDate("")
    setToDate("")
    setKeyword("")
    setRequester("")
    setAppliedFilters(empty)
    setPagination((prev) => ({ ...prev, page: 1 }))
    loadData({ page: 1, pageSize: pagination.pageSize, filters: empty })
  }

  const onChangePage = (nextPage) => {
    if (nextPage < 1 || nextPage > pageCount || nextPage === pagination.page) return
    loadData({ page: nextPage, pageSize: pagination.pageSize, filters: appliedFilters })
  }

  const onChangePageSize = (event) => {
    const nextSize = Number(event.target.value)
    if (!Number.isInteger(nextSize) || nextSize <= 0) return

    loadData({ page: 1, pageSize: nextSize, filters: appliedFilters })
  }

  const pageItems = useMemo(() => {
    const pages = []
    for (let index = 1; index <= pageCount; index += 1) {
      pages.push(index)
    }
    return pages
  }, [pageCount])

  const goToDetail = (requestId) => {
    const parsedId = Number(requestId)
    if (!Number.isInteger(parsedId) || parsedId <= 0) return
    navigate(`/requests/${parsedId}`)
  }

  return (
    <CRow className="justify-content-center">
      <CCol xs={12} style={{ maxWidth: 1200 }}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Request List</strong>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3 mb-3">
              <CCol md={2}>
                <CFormInput type="date" label="From date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </CCol>
              <CCol md={2}>
                <CFormInput type="date" label="To date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </CCol>
              <CCol md={3}>
                <CFormInput label="Keyword" placeholder="Search title..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
              </CCol>
              <CCol md={2}>
                <CFormInput label="Requester" placeholder="Requester ID" value={requester} onChange={(e) => setRequester(e.target.value)} />
              </CCol>
              <CCol md={3} className="d-flex align-items-end gap-2">
                <CButton color="primary" onClick={onSearch} disabled={loading}>Search</CButton>
                <CButton color="secondary" variant="outline" onClick={onReset} disabled={loading}>Reset</CButton>
              </CCol>
            </CRow>

            {loading ? (
              <div className="d-flex align-items-center gap-2">
                <CSpinner size="sm" />
                <span>Loading...</span>
              </div>
            ) : (
              <>
                <CTable hover responsive className="mb-3">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Title</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: 150 }}>Status</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: 200 }}>Requester</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: 220 }}>Category</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: 220 }}>UpdatedAt</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: 120 }}></CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {requests.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={6} className="text-center text-body-secondary">
                          No data
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      requests.map((item) => (
                        <CTableRow
                          key={item.id}
                          style={{ cursor: "pointer" }}
                          onClick={() => goToDetail(item.id)}
                        >
                          <CTableDataCell>
                            {item?.id ? (
                              <CLink
                                as={Link}
                                to={`/requests/${item.id}`}
                                onClick={(event) => event.stopPropagation()}
                              >
                                {item?.title || "-"}
                              </CLink>
                            ) : (
                              item?.title || "-"
                            )}
                          </CTableDataCell>
                          <CTableDataCell>
                            <CBadge color={getStatusColor(item?.request_status)}>{item?.request_status || "-"}</CBadge>
                          </CTableDataCell>
                          <CTableDataCell>{item?.requester?.username || "-"}</CTableDataCell>
                          <CTableDataCell>{item?.category?.name || "-"}</CTableDataCell>
                          <CTableDataCell>{formatDate(item?.updatedAt)}</CTableDataCell>
                          <CTableDataCell>
                            <CButton
                              color="primary"
                              size="sm"
                              variant="outline"
                              onClick={(event) => {
                                event.stopPropagation()
                                goToDetail(item.id)
                              }}
                            >
                              Xem
                            </CButton>
                          </CTableDataCell>
                        </CTableRow>
                      ))
                    )}
                  </CTableBody>
                </CTable>

                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span>Page size</span>
                    <CFormSelect
                      value={pagination.pageSize}
                      onChange={onChangePageSize}
                      style={{ width: 100 }}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </CFormSelect>
                  </div>

                  <CPagination align="end" className="mb-0">
                    <CPaginationItem
                      disabled={pagination.page <= 1 || loading}
                      onClick={() => onChangePage(pagination.page - 1)}
                    >
                      Prev
                    </CPaginationItem>
                    {pageItems.map((p) => (
                      <CPaginationItem
                        key={p}
                        active={p === pagination.page}
                        disabled={loading}
                        onClick={() => onChangePage(p)}
                      >
                        {p}
                      </CPaginationItem>
                    ))}
                    <CPaginationItem
                      disabled={pagination.page >= pageCount || loading}
                      onClick={() => onChangePage(pagination.page + 1)}
                    >
                      Next
                    </CPaginationItem>
                  </CPagination>
                </div>
              </>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}
