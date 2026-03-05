const navigation = [
  { type: "item", name: "Dashboard", to: "/dashboard" },

  { type: "title", name: "Request" },
  {
    type: "item",
    name: "Tạo yêu cầu mới",
    to: "/requests/new",
    permissionKey: "requests/new",              // ✅ đổi
  },
  {
    type: "item",
    name: "Danh sách yêu cầu",
    to: "/requests",
    permissionKey: "requests",              // ✅ đổi
  },
  {
    type: "item",
    name: "Theo dõi Requests",
    to: "/requests/monitor",
    leadershipOnly: true,
  },
  {
    type: "item",
    name: "Loại công việc",
    to: "/request-categories",
    permissionKey: "request-categories",    // ✅ đổi
  },

  { type: "title", name: "Hệ thống" },
  {
    type: "item",
    name: "Người dùng",
    to: "/users",
    permissionKey: "users",                 // ✅ đổi
  },
  {
    type: "item",
    name: "Mời user",
    to: "/invite-user",
    permissionKey: "invite-user",           // ✅ đổi
  },
  {
    type: "item",
    name: "Profile",
    to: "/profile",
    permissionKey: "profile",               // (tuỳ) có thể thêm để đồng bộ
  },
]

export default navigation