import axios from "./api"

// Nếu dùng Strapi local auth:
export async function loginApi(identifier, password) {
  const res = await axios.post("/api/auth/local", { identifier, password })
  return res.data // { jwt, user }
}

export async function meApi() {
  const res = await axios.get("/api/users/me?populate=*")
  return res.data
}
