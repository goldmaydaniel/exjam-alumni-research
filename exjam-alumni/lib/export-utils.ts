/**
 * Export utilities for converting data to various formats
 */

interface ExportData {
  headers: string[];
  rows: any[][];
}

/**
 * Convert data to CSV format
 */
export function exportToCSV(data: ExportData): string {
  const csvHeaders = data.headers.join(",");
  const csvRows = data.rows.map((row) =>
    row
      .map((cell) => {
        // Escape commas and quotes in cell data
        const cellStr = String(cell ?? "");
        if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      })
      .join(",")
  );

  return [csvHeaders, ...csvRows].join("\n");
}

/**
 * Download data as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string = "text/csv") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export registrations data
 */
export function exportRegistrations(registrations: any[]) {
  const data: ExportData = {
    headers: [
      "Registration ID",
      "Full Name",
      "Email",
      "Phone",
      "Squadron",
      "Service Number",
      "Event",
      "Status",
      "Payment Status",
      "Amount",
      "Ticket Number",
      "Checked In",
      "Registration Date",
    ],
    rows: registrations.map((reg) => [
      reg.id,
      reg.User?.fullName || "",
      reg.User?.email || "",
      reg.User?.phone || "",
      reg.User?.squadron || "",
      reg.User?.serviceNumber || "",
      reg.Event?.title || "",
      reg.status,
      reg.Payment?.status || "PENDING",
      reg.Payment?.amount || reg.Event?.price || 0,
      reg.Ticket?.ticketNumber || "",
      reg.Ticket?.checkedIn ? "Yes" : "No",
      new Date(reg.createdAt).toLocaleDateString(),
    ]),
  };

  const csv = exportToCSV(data);
  const filename = `registrations_${new Date().toISOString().split("T")[0]}.csv`;
  downloadFile(csv, filename);
}

/**
 * Export users data
 */
export function exportUsers(users: any[]) {
  const data: ExportData = {
    headers: [
      "User ID",
      "Full Name",
      "Email",
      "Phone",
      "Squadron",
      "Service Number",
      "Chapter",
      "Current Location",
      "Role",
      "Email Verified",
      "Created Date",
    ],
    rows: users.map((user) => [
      user.id,
      user.fullName || `${user.firstName} ${user.lastName}`,
      user.email,
      user.phone || "",
      user.squadron || "",
      user.serviceNumber || "",
      user.chapter || "",
      user.currentLocation || "",
      user.role,
      user.emailVerified ? "Yes" : "No",
      new Date(user.createdAt).toLocaleDateString(),
    ]),
  };

  const csv = exportToCSV(data);
  const filename = `users_${new Date().toISOString().split("T")[0]}.csv`;
  downloadFile(csv, filename);
}

/**
 * Export check-in data
 */
export function exportCheckIns(checkIns: any[]) {
  const data: ExportData = {
    headers: [
      "Ticket Number",
      "Full Name",
      "Squadron",
      "Check-in Time",
      "Check-in Location",
      "Checked In By",
    ],
    rows: checkIns.map((checkIn) => [
      checkIn.ticketNumber,
      checkIn.attendeeName,
      checkIn.squadron || "",
      new Date(checkIn.checkInTime).toLocaleString(),
      checkIn.location || "Main Entrance",
      checkIn.checkedInBy || "System",
    ]),
  };

  const csv = exportToCSV(data);
  const filename = `checkins_${new Date().toISOString().split("T")[0]}.csv`;
  downloadFile(csv, filename);
}

/**
 * Export analytics data
 */
export function exportAnalytics(analytics: any) {
  const data: ExportData = {
    headers: ["Metric", "Value"],
    rows: [
      ["Total Registrations", analytics.totalRegistrations],
      ["Confirmed Registrations", analytics.confirmedRegistrations],
      ["Pending Registrations", analytics.pendingRegistrations],
      ["Total Revenue", analytics.totalRevenue],
      ["Average Revenue per Registration", analytics.averageRevenue],
      ["Check-in Rate", `${analytics.checkInRate}%`],
      ["Payment Success Rate", `${analytics.paymentSuccessRate}%`],
      ["Most Popular Squadron", analytics.topSquadron],
      ["Total Users", analytics.totalUsers],
      ["Verified Users", analytics.verifiedUsers],
    ],
  };

  const csv = exportToCSV(data);
  const filename = `analytics_${new Date().toISOString().split("T")[0]}.csv`;
  downloadFile(csv, filename);
}
