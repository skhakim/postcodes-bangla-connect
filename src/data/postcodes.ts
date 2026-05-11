export type Postcode = {
  id: string;
  postcode: string;
  area: string;
  areaBn: string;
  postOffice: string;
  upazila: string;
  district: string;
  division: string;
  lat: number;
  lng: number;
  status: "active" | "inactive" | "pending";
  updatedAt: string;
};

export const postcodes: Postcode[] = [
  { id: "1", postcode: "1205", area: "Dhanmondi", areaBn: "ধানমন্ডি", postOffice: "Dhanmondi PO", upazila: "Dhanmondi", district: "Dhaka", division: "Dhaka", lat: 23.7461, lng: 90.3742, status: "active", updatedAt: "2025-04-12" },
  { id: "2", postcode: "1213", area: "Banani", areaBn: "বনানী", postOffice: "Banani PO", upazila: "Gulshan", district: "Dhaka", division: "Dhaka", lat: 23.7937, lng: 90.4066, status: "active", updatedAt: "2025-04-10" },
  { id: "3", postcode: "1207", area: "Mohammadpur", areaBn: "মোহাম্মদপুর", postOffice: "Mohammadpur PO", upazila: "Mohammadpur", district: "Dhaka", division: "Dhaka", lat: 23.7659, lng: 90.3589, status: "active", updatedAt: "2025-03-28" },
  { id: "4", postcode: "1212", area: "Gulshan", areaBn: "গুলশান", postOffice: "Gulshan Model Town PO", upazila: "Gulshan", district: "Dhaka", division: "Dhaka", lat: 23.7925, lng: 90.4078, status: "active", updatedAt: "2025-04-01" },
  { id: "5", postcode: "1216", area: "Mirpur", areaBn: "মিরপুর", postOffice: "Mirpur PO", upazila: "Mirpur", district: "Dhaka", division: "Dhaka", lat: 23.8223, lng: 90.3654, status: "active", updatedAt: "2025-03-19" },
  { id: "6", postcode: "1751", area: "Mouchak", areaBn: "মৌচাক", postOffice: "Mouchak PO", upazila: "Kaliakair", district: "Gazipur", division: "Dhaka", lat: 24.0833, lng: 90.3167, status: "active", updatedAt: "2025-02-22" },
  { id: "7", postcode: "1750", area: "Kaliakair", areaBn: "কালিয়াকৈর", postOffice: "Kaliakair PO", upazila: "Kaliakair", district: "Gazipur", division: "Dhaka", lat: 24.0833, lng: 90.2167, status: "active", updatedAt: "2025-02-22" },
  { id: "8", postcode: "1700", area: "Gazipur Sadar", areaBn: "গাজীপুর সদর", postOffice: "Gazipur Sadar PO", upazila: "Gazipur Sadar", district: "Gazipur", division: "Dhaka", lat: 23.9999, lng: 90.4203, status: "active", updatedAt: "2025-04-05" },
  { id: "9", postcode: "4100", area: "Agrabad", areaBn: "আগ্রাবাদ", postOffice: "Agrabad CCA PO", upazila: "Double Mooring", district: "Chattogram", division: "Chattogram", lat: 22.3293, lng: 91.8136, status: "active", updatedAt: "2025-04-15" },
  { id: "10", postcode: "4000", area: "Chattogram GPO", areaBn: "চট্টগ্রাম জিপিও", postOffice: "Chattogram GPO", upazila: "Kotwali", district: "Chattogram", division: "Chattogram", lat: 22.3569, lng: 91.7832, status: "active", updatedAt: "2025-04-15" },
  { id: "11", postcode: "4202", area: "Halishahar", areaBn: "হালিশহর", postOffice: "Halishahar PO", upazila: "Halishahar", district: "Chattogram", division: "Chattogram", lat: 22.3320, lng: 91.7850, status: "active", updatedAt: "2025-03-11" },
  { id: "12", postcode: "3100", area: "Sylhet Sadar", areaBn: "সিলেট সদর", postOffice: "Sylhet GPO", upazila: "Sylhet Sadar", district: "Sylhet", division: "Sylhet", lat: 24.8949, lng: 91.8687, status: "active", updatedAt: "2025-04-09" },
  { id: "13", postcode: "3114", area: "Zindabazar", areaBn: "জিন্দাবাজার", postOffice: "Zindabazar PO", upazila: "Sylhet Sadar", district: "Sylhet", division: "Sylhet", lat: 24.8980, lng: 91.8700, status: "active", updatedAt: "2025-03-30" },
  { id: "14", postcode: "6000", area: "Rajshahi GPO", areaBn: "রাজশাহী জিপিও", postOffice: "Rajshahi GPO", upazila: "Boalia", district: "Rajshahi", division: "Rajshahi", lat: 24.3745, lng: 88.6042, status: "active", updatedAt: "2025-04-02" },
  { id: "15", postcode: "6100", area: "Motihar", areaBn: "মতিহার", postOffice: "Motihar PO", upazila: "Motihar", district: "Rajshahi", division: "Rajshahi", lat: 24.3625, lng: 88.6350, status: "active", updatedAt: "2025-03-20" },
  { id: "16", postcode: "9000", area: "Khulna Sadar", areaBn: "খুলনা সদর", postOffice: "Khulna GPO", upazila: "Khulna Sadar", district: "Khulna", division: "Khulna", lat: 22.8456, lng: 89.5403, status: "active", updatedAt: "2025-04-08" },
  { id: "17", postcode: "9100", area: "Daulatpur", areaBn: "দৌলতপুর", postOffice: "Daulatpur PO", upazila: "Daulatpur", district: "Khulna", division: "Khulna", lat: 22.8650, lng: 89.5350, status: "active", updatedAt: "2025-03-15" },
  { id: "18", postcode: "8200", area: "Barishal Sadar", areaBn: "বরিশাল সদর", postOffice: "Barishal GPO", upazila: "Barishal Sadar", district: "Barishal", division: "Barishal", lat: 22.7010, lng: 90.3535, status: "active", updatedAt: "2025-04-04" },
  { id: "19", postcode: "5400", area: "Rangpur Sadar", areaBn: "রংপুর সদর", postOffice: "Rangpur GPO", upazila: "Rangpur Sadar", district: "Rangpur", division: "Rangpur", lat: 25.7439, lng: 89.2752, status: "active", updatedAt: "2025-04-07" },
  { id: "20", postcode: "5200", area: "Dinajpur Sadar", areaBn: "দিনাজপুর সদর", postOffice: "Dinajpur PO", upazila: "Dinajpur Sadar", district: "Dinajpur", division: "Rangpur", lat: 25.6217, lng: 88.6354, status: "active", updatedAt: "2025-03-25" },
  { id: "21", postcode: "2200", area: "Mymensingh Sadar", areaBn: "ময়মনসিংহ সদর", postOffice: "Mymensingh GPO", upazila: "Mymensingh Sadar", district: "Mymensingh", division: "Mymensingh", lat: 24.7471, lng: 90.4203, status: "active", updatedAt: "2025-04-06" },
  { id: "22", postcode: "1100", area: "Dhaka GPO", areaBn: "ঢাকা জিপিও", postOffice: "Dhaka GPO", upazila: "Kotwali", district: "Dhaka", division: "Dhaka", lat: 23.7104, lng: 90.4074, status: "active", updatedAt: "2025-04-16" },
  { id: "23", postcode: "1209", area: "Hazaribagh", areaBn: "হাজারীবাগ", postOffice: "Hazaribagh PO", upazila: "Hazaribagh", district: "Dhaka", division: "Dhaka", lat: 23.7350, lng: 90.3700, status: "pending", updatedAt: "2025-04-14" },
  { id: "24", postcode: "1230", area: "Uttara", areaBn: "উত্তরা", postOffice: "Uttara Model Town PO", upazila: "Uttara", district: "Dhaka", division: "Dhaka", lat: 23.8759, lng: 90.3795, status: "active", updatedAt: "2025-04-11" },
  { id: "25", postcode: "1219", area: "Jatrabari", areaBn: "যাত্রাবাড়ী", postOffice: "Jatrabari PO", upazila: "Demra", district: "Dhaka", division: "Dhaka", lat: 23.7104, lng: 90.4350, status: "active", updatedAt: "2025-03-22" },
  { id: "26", postcode: "4203", area: "Patenga", areaBn: "পতেঙ্গা", postOffice: "Patenga PO", upazila: "Patenga", district: "Chattogram", division: "Chattogram", lat: 22.2400, lng: 91.7900, status: "inactive", updatedAt: "2025-01-30" },
  { id: "27", postcode: "3400", area: "Moulvibazar Sadar", areaBn: "মৌলভীবাজার সদর", postOffice: "Moulvibazar PO", upazila: "Moulvibazar Sadar", district: "Moulvibazar", division: "Sylhet", lat: 24.4825, lng: 91.7771, status: "active", updatedAt: "2025-03-18" },
  { id: "28", postcode: "6200", area: "Natore Sadar", areaBn: "নাটোর সদর", postOffice: "Natore PO", upazila: "Natore Sadar", district: "Natore", division: "Rajshahi", lat: 24.4206, lng: 89.0003, status: "active", updatedAt: "2025-03-12" },
  { id: "29", postcode: "9200", area: "Jessore Sadar", areaBn: "যশোর সদর", postOffice: "Jessore PO", upazila: "Jessore Sadar", district: "Jessore", division: "Khulna", lat: 23.1664, lng: 89.2081, status: "active", updatedAt: "2025-04-03" },
  { id: "30", postcode: "8600", area: "Patuakhali Sadar", areaBn: "পটুয়াখালী সদর", postOffice: "Patuakhali PO", upazila: "Patuakhali Sadar", district: "Patuakhali", division: "Barishal", lat: 22.3596, lng: 90.3296, status: "active", updatedAt: "2025-03-08" },
];

export const divisions: Record<string, Record<string, string[]>> = {
  Dhaka: {
    Dhaka: ["Dhanmondi", "Gulshan", "Mohammadpur", "Mirpur", "Uttara", "Kotwali", "Demra", "Hazaribagh"],
    Gazipur: ["Gazipur Sadar", "Kaliakair", "Sreepur", "Kapasia"],
    Mymensingh: ["Mymensingh Sadar", "Trishal", "Bhaluka"],
  },
  Chattogram: {
    Chattogram: ["Kotwali", "Double Mooring", "Halishahar", "Patenga"],
    "Cox's Bazar": ["Cox's Bazar Sadar", "Teknaf", "Ukhia"],
  },
  Sylhet: {
    Sylhet: ["Sylhet Sadar", "Beanibazar", "Golapganj"],
    Moulvibazar: ["Moulvibazar Sadar", "Sreemangal"],
  },
  Rajshahi: {
    Rajshahi: ["Boalia", "Motihar", "Paba"],
    Natore: ["Natore Sadar", "Singra"],
  },
  Khulna: {
    Khulna: ["Khulna Sadar", "Daulatpur", "Khalishpur"],
    Jessore: ["Jessore Sadar", "Abhaynagar"],
  },
  Barishal: {
    Barishal: ["Barishal Sadar", "Bakerganj"],
    Patuakhali: ["Patuakhali Sadar", "Kalapara"],
  },
  Rangpur: {
    Rangpur: ["Rangpur Sadar", "Pirgachha"],
    Dinajpur: ["Dinajpur Sadar", "Birganj"],
  },
  Mymensingh: {
    Mymensingh: ["Mymensingh Sadar", "Trishal"],
  },
};
