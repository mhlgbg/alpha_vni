function toSafeNumber(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return numeric
}

function formatDateForFile(date = new Date()) {
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hour = String(date.getHours()).padStart(2, "0")
  const minute = String(date.getMinutes()).padStart(2, "0")
  const second = String(date.getSeconds()).padStart(2, "0")
  return `${year}${month}${day}_${hour}${minute}${second}`
}

function toOrderRows(orders = []) {
  if (!Array.isArray(orders) || orders.length === 0) {
    return [{ ThongBao: "Khong co du lieu don hang" }]
  }

  return orders.map((order, index) => ({
    STT: index + 1,
    MaDon: order?.code || `#${order?.id || ""}`,
    NgayNhan: order?.orderDate || order?.createdAt || "",
    Department: order?.department?.name || "",
    KhachHang: order?.customer?.name || "",
    DienThoaiKhach: order?.customer?.phone || "",
    NhanVienPhuTrach: order?.assignedEmployee?.fullName || "",
    TrangThaiDon: order?.status || "",
    TrangThaiThanhToan: order?.paymentStatus || "",
    TongTien: toSafeNumber(order?.totalAmount),
    DaThu: toSafeNumber(order?.paidAmount),
    ConNo: toSafeNumber(order?.debtAmount),
    MoTa: order?.description || "",
    GhiChu: order?.note || "",
  }))
}

function toOrderDetailRows(orders = []) {
  const detailRows = []

  for (let orderIndex = 0; orderIndex < orders.length; orderIndex += 1) {
    const order = orders[orderIndex]
    const items = Array.isArray(order?.items) ? order.items : []

    if (items.length === 0) {
      detailRows.push({
        STT: detailRows.length + 1,
        MaDon: order?.code || `#${order?.id || ""}`,
        NgayNhan: order?.orderDate || order?.createdAt || "",
        KhachHang: order?.customer?.name || "",
        ServiceItemCode: "",
        ServiceItemName: "",
        MoTaDong: "",
        SoLuong: 0,
        DonGia: 0,
        ThanhTien: 0,
        GhiChuDong: "",
      })
      continue
    }

    for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
      const item = items[itemIndex]
      detailRows.push({
        STT: detailRows.length + 1,
        MaDon: order?.code || `#${order?.id || ""}`,
        NgayNhan: order?.orderDate || order?.createdAt || "",
        KhachHang: order?.customer?.name || "",
        ServiceItemCode: item?.serviceItem?.code || "",
        ServiceItemName: item?.serviceItem?.name || "",
        MoTaDong: item?.description || "",
        SoLuong: toSafeNumber(item?.quantity),
        DonGia: toSafeNumber(item?.unitPrice),
        ThanhTien: toSafeNumber(item?.amount),
        GhiChuDong: item?.note || "",
      })
    }
  }

  if (detailRows.length === 0) {
    return [{ ThongBao: "Khong co du lieu chi tiet don hang" }]
  }

  return detailRows
}

export async function exportServiceOrdersExcel({
  orders = [],
  filePrefix = "service_orders",
  orderSheetName = "DonHang",
  detailSheetName = "ChiTietDonHang",
} = {}) {
  const XLSX = await import("xlsx")

  const workbook = XLSX.utils.book_new()

  const orderRows = toOrderRows(orders)
  const detailRows = toOrderDetailRows(orders)

  const orderSheet = XLSX.utils.json_to_sheet(orderRows)
  const detailSheet = XLSX.utils.json_to_sheet(detailRows)

  XLSX.utils.book_append_sheet(workbook, orderSheet, orderSheetName)
  XLSX.utils.book_append_sheet(workbook, detailSheet, detailSheetName)

  const fileName = `${filePrefix}_${formatDateForFile()}.xlsx`
  XLSX.writeFile(workbook, fileName)
}
