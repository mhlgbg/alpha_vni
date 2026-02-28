import api from "./api"

export async function getRequests(params = {}) {
  const res = await api.get("/requests", { params })
  return res.data
}

export async function getRequestById(id) {
  const res = await api.get(`/requests/${id}`, {
    params: { populate: "*" },
  })
  return res.data
}

export async function createRequest(payload) {
  const res = await api.post("/requests", payload)
  return res.data
}

export async function updateRequest(id, payload) {
  const res = await api.put(`/requests/${id}`, payload)
  return res.data
}

export async function changeRequestStatus(id, status) {
  const res = await api.post(`/requests/${id}/status`, { status })
  return res.data
}

export async function getRequestCategories() {
  const res = await api.get("/request-categories")
  return res.data
}

export async function addAssignee(requestId, payload) {
  const res = await api.post(`/requests/${requestId}/assignees`, payload)
  return res.data
}

export async function removeAssignee(requestId, assigneeId) {
  const res = await api.delete(`/requests/${requestId}/assignees/${assigneeId}`)
  return res.data
}

export async function getMessages(requestId) {
  const res = await api.get(`/requests/${requestId}/messages`, {
    params: { sort: "createdAt:asc" },
  })
  return res.data
}

export async function sendMessage(requestId, payload) {
  const res = await api.post(`/requests/${requestId}/messages`, payload)
  return res.data
}
