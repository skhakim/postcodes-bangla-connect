export const apiKeys = [
  { id: "k1", partner: "Pathao Couriers", key: "ipms_live_••••••••a8f2", limit: 10000, status: "active", lastUsed: "2025-05-10 14:22" },
  { id: "k2", partner: "Daraz Bangladesh", key: "ipms_live_••••••••3c91", limit: 50000, status: "active", lastUsed: "2025-05-11 09:01" },
  { id: "k3", partner: "Sundarban Courier", key: "ipms_live_••••••••7b04", limit: 5000, status: "active", lastUsed: "2025-05-09 18:45" },
  { id: "k4", partner: "Chaldal", key: "ipms_test_••••••••dd12", limit: 1000, status: "suspended", lastUsed: "2025-05-04 11:11" },
  { id: "k5", partner: "RedX Logistics", key: "ipms_live_••••••••0a55", limit: 20000, status: "active", lastUsed: "2025-05-11 07:33" },
];

export const auditLogs = [
  { id: 1, ts: "2025-05-11 09:14", user: "admin@bdpost.gov.bd", role: "Super Admin", ip: "103.4.145.22", action: "UPDATE_RECORD", prev: "1209 (pending)", next: "1209 (active)" },
  { id: 2, ts: "2025-05-11 08:51", user: "gis.team@bdpost.gov.bd", role: "Data Manager", ip: "103.4.145.30", action: "EDIT_BOUNDARY", prev: "Zone-1207 v3", next: "Zone-1207 v4" },
  { id: 3, ts: "2025-05-11 08:30", user: "ops.dhaka@bdpost.gov.bd", role: "Ops Staff", ip: "103.4.145.55", action: "EXPORT_REPORT", prev: "-", next: "monthly-usage.pdf" },
  { id: 4, ts: "2025-05-10 22:10", user: "admin@bdpost.gov.bd", role: "Super Admin", ip: "103.4.145.22", action: "GENERATE_API_KEY", prev: "-", next: "ipms_live_••••a8f2" },
  { id: 5, ts: "2025-05-10 17:42", user: "gis.team@bdpost.gov.bd", role: "Data Manager", ip: "103.4.145.30", action: "BULK_UPLOAD", prev: "-", next: "180 records imported, 12 errors" },
  { id: 6, ts: "2025-05-10 14:01", user: "admin@bdpost.gov.bd", role: "Super Admin", ip: "103.4.145.22", action: "DEACTIVATE_USER", prev: "user42 (active)", next: "user42 (inactive)" },
];

export const pilotDistricts = [
  { id: "p1", district: "Dhaka", division: "Dhaka", active: true, gpsAccuracy: 92, feedback: 184, uptime: 99.8, failureReduction: 47 },
  { id: "p2", district: "Gazipur", division: "Dhaka", active: true, gpsAccuracy: 88, feedback: 96, uptime: 99.5, failureReduction: 38 },
  { id: "p3", district: "Chattogram", division: "Chattogram", active: true, gpsAccuracy: 90, feedback: 142, uptime: 99.7, failureReduction: 42 },
  { id: "p4", district: "Sylhet", division: "Sylhet", active: true, gpsAccuracy: 86, feedback: 78, uptime: 99.4, failureReduction: 33 },
  { id: "p5", district: "Rajshahi", division: "Rajshahi", active: true, gpsAccuracy: 87, feedback: 64, uptime: 99.5, failureReduction: 35 },
  { id: "p6", district: "Khulna", division: "Khulna", active: true, gpsAccuracy: 85, feedback: 55, uptime: 99.2, failureReduction: 31 },
  { id: "p7", district: "Barishal", division: "Barishal", active: false, gpsAccuracy: 0, feedback: 0, uptime: 0, failureReduction: 0 },
  { id: "p8", district: "Rangpur", division: "Rangpur", active: true, gpsAccuracy: 84, feedback: 41, uptime: 99.1, failureReduction: 28 },
  { id: "p9", district: "Mymensingh", division: "Mymensingh", active: false, gpsAccuracy: 0, feedback: 0, uptime: 0, failureReduction: 0 },
  { id: "p10", district: "Cox's Bazar", division: "Chattogram", active: true, gpsAccuracy: 82, feedback: 33, uptime: 98.9, failureReduction: 25 },
  { id: "p11", district: "Jessore", division: "Khulna", active: false, gpsAccuracy: 0, feedback: 0, uptime: 0, failureReduction: 0 },
  { id: "p12", district: "Dinajpur", division: "Rangpur", active: false, gpsAccuracy: 0, feedback: 0, uptime: 0, failureReduction: 0 },
];

export const users = [
  { id: "u1", name: "Md. Rahman", email: "admin@bdpost.gov.bd", role: "Super Admin", status: "active", lastLogin: "2025-05-11 09:00" },
  { id: "u2", name: "Fatima Akter", email: "gis.team@bdpost.gov.bd", role: "Data Manager", status: "active", lastLogin: "2025-05-11 08:50" },
  { id: "u3", name: "Karim Hossain", email: "ops.dhaka@bdpost.gov.bd", role: "Ops Staff", status: "active", lastLogin: "2025-05-11 08:30" },
  { id: "u4", name: "Nusrat Jahan", email: "ops.ctg@bdpost.gov.bd", role: "Ops Staff", status: "active", lastLogin: "2025-05-10 17:12" },
  { id: "u5", name: "Tanvir Ahmed", email: "ops.syl@bdpost.gov.bd", role: "Ops Staff", status: "inactive", lastLogin: "2025-04-28 13:00" },
];

export const searchTrend = [
  { day: "Mon", gps: 1240, manual: 980 },
  { day: "Tue", gps: 1380, manual: 1020 },
  { day: "Wed", gps: 1520, manual: 1100 },
  { day: "Thu", gps: 1410, manual: 1240 },
  { day: "Fri", gps: 980, manual: 760 },
  { day: "Sat", gps: 1620, manual: 1340 },
  { day: "Sun", gps: 1740, manual: 1420 },
];

export const platformSplit = [
  { name: "Web", value: 58 },
  { name: "Mobile", value: 42 },
];

export const lookupSplit = [
  { name: "GPS", value: 64 },
  { name: "Manual", value: 36 },
];

export const topDistricts = [
  { district: "Dhaka", searches: 4820 },
  { district: "Chattogram", searches: 2410 },
  { district: "Gazipur", searches: 1840 },
  { district: "Sylhet", searches: 1320 },
  { district: "Khulna", searches: 1080 },
  { district: "Rajshahi", searches: 940 },
];

export const uploadValidation = [
  { row: 1, status: "ok", message: "Imported successfully" },
  { row: 2, status: "ok", message: "Imported successfully" },
  { row: 3, status: "error", message: "Duplicate postcode: 1205" },
  { row: 4, status: "ok", message: "Imported successfully" },
  { row: 5, status: "warning", message: "Missing latitude/longitude" },
  { row: 6, status: "error", message: "Invalid district: 'Dhakaa'" },
  { row: 7, status: "ok", message: "Imported successfully" },
  { row: 8, status: "error", message: "Boundary overlap detected with Zone-1207" },
  { row: 9, status: "ok", message: "Imported successfully" },
  { row: 10, status: "warning", message: "Bangla name missing" },
];
