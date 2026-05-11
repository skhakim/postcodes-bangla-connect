import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Pencil, Eye, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { postcodes as initialData, divisions, type Postcode } from "@/data/postcodes";
import { useAuth, can } from "@/lib/auth";

export const Route = createFileRoute("/admin/records")({ component: RecordsPage });

function RecordsPage() {
  const { role } = useAuth();
  const [data, setData] = useState<Postcode[]>(initialData);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [editing, setEditing] = useState<Postcode | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    return data.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (!q) return true;
      const s = q.toLowerCase();
      return p.postcode.includes(q) || p.area.toLowerCase().includes(s) || p.district.toLowerCase().includes(s);
    });
  }, [data, q, status]);

  const openNew = () => { setEditing({ id: "", postcode: "", area: "", areaBn: "", postOffice: "", upazila: "", district: "", division: "Dhaka", lat: 0, lng: 0, status: "active", updatedAt: new Date().toISOString().slice(0, 10) }); setOpen(true); };
  const openEdit = (p: Postcode) => { setEditing(p); setOpen(true); };

  const save = () => {
    if (!editing) return;
    if (!editing.postcode || !editing.area) { toast.error("Postcode and area are required"); return; }
    if (editing.id) {
      setData((d) => d.map((x) => (x.id === editing.id ? editing : x)));
      toast.success("Record updated");
    } else {
      setData((d) => [{ ...editing, id: String(Date.now()) }, ...d]);
      toast.success("Record added");
    }
    setOpen(false);
  };

  const softDelete = (p: Postcode) => {
    setData((d) => d.map((x) => (x.id === p.id ? { ...x, status: "inactive" } : x)));
    toast.success(`${p.postcode} marked inactive`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Postcode Records</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} records · search, filter, edit, soft-delete.</p>
        </div>
        {can(role, "records.edit") && <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Add record</Button>}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search postcode, area, district…" className="pl-9" />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Postcode</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Post Office</TableHead>
                  <TableHead>Upazila</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Division</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold text-primary">{p.postcode}</TableCell>
                    <TableCell>
                      <div>{p.area}</div>
                      <div className="font-bangla text-xs text-muted-foreground">{p.areaBn}</div>
                    </TableCell>
                    <TableCell className="text-sm">{p.postOffice}</TableCell>
                    <TableCell className="text-sm">{p.upazila}</TableCell>
                    <TableCell className="text-sm">{p.district}</TableCell>
                    <TableCell className="text-sm">{p.division}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "active" ? "default" : p.status === "pending" ? "secondary" : "outline"}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.updatedAt}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Eye className="h-4 w-4" /></Button>
                        {can(role, "records.edit") && <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>}
                        {can(role, "records.delete") && <Button size="icon" variant="ghost" onClick={() => softDelete(p)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing?.id ? `Edit postcode ${editing.postcode}` : "Add postcode record"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Postcode"><Input value={editing.postcode} onChange={(e) => setEditing({ ...editing, postcode: e.target.value })} /></Field>
              <Field label="Status">
                <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v as Postcode["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Area (English)"><Input value={editing.area} onChange={(e) => setEditing({ ...editing, area: e.target.value })} /></Field>
              <Field label="Area (Bangla)"><Input className="font-bangla" value={editing.areaBn} onChange={(e) => setEditing({ ...editing, areaBn: e.target.value })} /></Field>
              <Field label="Post Office"><Input value={editing.postOffice} onChange={(e) => setEditing({ ...editing, postOffice: e.target.value })} /></Field>
              <Field label="Division">
                <Select value={editing.division} onValueChange={(v) => setEditing({ ...editing, division: v, district: "", upazila: "" })}>
                  <SelectTrigger><SelectValue placeholder="Division" /></SelectTrigger>
                  <SelectContent>{Object.keys(divisions).map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="District">
                <Select value={editing.district} onValueChange={(v) => setEditing({ ...editing, district: v, upazila: "" })} disabled={!editing.division}>
                  <SelectTrigger><SelectValue placeholder="District" /></SelectTrigger>
                  <SelectContent>{Object.keys(divisions[editing.division] ?? {}).map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Upazila / Thana">
                <Select value={editing.upazila} onValueChange={(v) => setEditing({ ...editing, upazila: v })} disabled={!editing.district}>
                  <SelectTrigger><SelectValue placeholder="Upazila / Thana" /></SelectTrigger>
                  <SelectContent>{(divisions[editing.division]?.[editing.district] ?? []).map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Latitude"><Input type="number" value={editing.lat} onChange={(e) => setEditing({ ...editing, lat: +e.target.value })} /></Field>
              <Field label="Longitude"><Input type="number" value={editing.lng} onChange={(e) => setEditing({ ...editing, lng: +e.target.value })} /></Field>
              <div className="sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Boundary GeoJSON</Label>
                <div className="mt-1 rounded-md border bg-muted/30 px-3 py-2 text-xs font-mono text-muted-foreground">{`{ "type":"Polygon", "coordinates":[[…]] }`}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            {can(role, "records.edit") && <Button onClick={save}>Save record</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
