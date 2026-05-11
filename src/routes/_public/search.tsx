import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { divisions, postcodes } from "@/data/postcodes";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PostcodeResultCard } from "@/components/ipms/PostcodeResultCard";
import { Button } from "@/components/ui/button";
import { useOnline } from "@/lib/online";

export const Route = createFileRoute("/_public/search")({
  component: SearchPage,
  head: () => ({ meta: [{ title: "Manual Postcode Search — IPMS" }] }),
});

function SearchPage() {
  const { online } = useOnline();
  const [division, setDivision] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [upazila, setUpazila] = useState<string>("");
  const [q, setQ] = useState("");

  const districtOptions = division ? Object.keys(divisions[division] || {}) : [];
  const upazilaOptions = division && district ? divisions[division]?.[district] || [] : [];

  const results = useMemo(() => {
    let data = postcodes;
    if (!online) data = data.slice(0, 6); // simulate cache
    if (division) data = data.filter((p) => p.division === division);
    if (district) data = data.filter((p) => p.district === district);
    if (upazila) data = data.filter((p) => p.upazila === upazila);
    if (q.length >= 3) {
      const s = q.toLowerCase();
      data = data.filter(
        (p) =>
          p.area.toLowerCase().includes(s) ||
          p.areaBn.includes(q) ||
          p.postcode.includes(q) ||
          p.postOffice.toLowerCase().includes(s) ||
          p.district.toLowerCase().includes(s)
      );
    }
    return data;
  }, [division, district, upazila, q, online]);

  const showSuggestions = q.length >= 3 && q.length < 20;
  const suggestions = showSuggestions ? postcodes.filter((p) => p.area.toLowerCase().startsWith(q.toLowerCase())).slice(0, 5) : [];

  const reset = () => { setDivision(""); setDistrict(""); setUpazila(""); setQ(""); };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold sm:text-4xl">Manual Search</h1>
        <p className="mt-2 text-muted-foreground">Search by division, district, upazila, or keyword in English or Bangla.</p>
      </div>

      <Card className="mb-6">
        <CardContent className="grid gap-3 p-5 lg:grid-cols-5">
          <Select value={division} onValueChange={(v) => { setDivision(v); setDistrict(""); setUpazila(""); }}>
            <SelectTrigger><SelectValue placeholder="Division" /></SelectTrigger>
            <SelectContent>
              {Object.keys(divisions).map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={district} onValueChange={(v) => { setDistrict(v); setUpazila(""); }} disabled={!division}>
            <SelectTrigger><SelectValue placeholder="District" /></SelectTrigger>
            <SelectContent>
              {districtOptions.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={upazila} onValueChange={setUpazila} disabled={!district}>
            <SelectTrigger><SelectValue placeholder="Upazila" /></SelectTrigger>
            <SelectContent>
              {upazilaOptions.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type area, postcode, ধানমন্ডি…" className="pl-9" />
            {suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                {suggestions.map((s) => (
                  <button key={s.id} onClick={() => setQ(s.area)} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted">
                    <span>{s.area} <span className="font-bangla text-muted-foreground">· {s.areaBn}</span></span>
                    <span className="text-xs text-muted-foreground">{s.postcode}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {!online && (
        <p className="mb-4 text-sm text-warning-foreground bg-warning/30 rounded p-3">Offline mode — results limited to cached records.</p>
      )}

      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{results.length} results</p>
        <Button variant="ghost" size="sm" onClick={reset}>Reset</Button>
      </div>

      {results.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">No matching postcodes. Try changing your filters.</CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {results.map((p) => <PostcodeResultCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
