import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "bn";

const dict = {
  en: {
    siteName: "Integrated Postcode Management System",
    siteShort: "IPMS",
    bpo: "Bangladesh Post Office",
    govt: "Government of the People's Republic of Bangladesh",
    home: "Home",
    gps: "GPS Lookup",
    search: "Search",
    map: "Map",
    feedback: "Report Issue",
    offline: "Offline Mode",
    adminLogin: "Admin Login",
    findTitle: "Find Your Postcode Instantly",
    findSubtitle: "GPS, manual search, and an interactive map of Bangladesh — in one official place.",
    findGps: "Find My Postcode (GPS)",
    findManual: "Search Manually",
    benefits: "Why IPMS",
    division: "Division",
    district: "District",
    upazila: "Upazila",
    area: "Area / Post Office",
    postcode: "Postcode",
  },
  bn: {
    siteName: "ইন্টিগ্রেটেড পোস্টকোড ম্যানেজমেন্ট সিস্টেম",
    siteShort: "আইপিএমএস",
    bpo: "বাংলাদেশ ডাক বিভাগ",
    govt: "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার",
    home: "হোম",
    gps: "জিপিএস লুকআপ",
    search: "অনুসন্ধান",
    map: "মানচিত্র",
    feedback: "ত্রুটি রিপোর্ট",
    offline: "অফলাইন মোড",
    adminLogin: "অ্যাডমিন লগইন",
    findTitle: "মুহূর্তেই খুঁজুন আপনার পোস্টকোড",
    findSubtitle: "জিপিএস, ম্যানুয়াল সার্চ এবং বাংলাদেশের ইন্টারঅ্যাকটিভ মানচিত্র — একই সরকারি প্ল্যাটফর্মে।",
    findGps: "আমার পোস্টকোড খুঁজুন (জিপিএস)",
    findManual: "ম্যানুয়ালি খুঁজুন",
    benefits: "আইপিএমএস কেন",
    division: "বিভাগ",
    district: "জেলা",
    upazila: "উপজেলা",
    area: "এলাকা / ডাকঘর",
    postcode: "পোস্টকোড",
  },
} as const;

type Key = keyof typeof dict["en"];

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = localStorage.getItem("ipms-lang") as Lang | null;
    if (saved) setLangState(saved);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("ipms-lang", l);
  };
  const t = (k: Key) => dict[lang][k] ?? dict.en[k];
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
