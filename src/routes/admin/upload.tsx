import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { uploadValidation } from "@/data/mock";

export const Route = createFileRoute("/admin/upload")({ component: UploadPage });

function UploadPage() {
  const [uploaded, setUploaded] = useState(false);
  const valid = uploadValidation.filter((r) => r.status === "ok").length;
  const errors = uploadValidation.filter((r) => r.status === "error").length;
  const warnings = uploadValidation.filter((r) => r.status === "warning").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bulk Data Upload</h1>
        <p className="text-sm text-muted-foreground">Upload CSV, Excel, GeoJSON, or Shapefile data for batch import.</p>
      </div>

      {!uploaded ? (
        <Card>
          <CardContent className="p-10">
            <button onClick={() => { setUploaded(true); toast.info("Validating file…"); }} className="flex w-full flex-col items-center rounded-lg border-2 border-dashed border-border py-14 text-center hover:bg-muted/30 transition-colors">
              <UploadCloud className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-semibold">Drop your file here</p>
              <p className="mt-1 text-sm text-muted-foreground">or click to browse — CSV, XLSX, GeoJSON, SHP</p>
              <p className="mt-4 text-xs text-muted-foreground">Maximum 10 MB · 50,000 rows</p>
            </button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <SummaryCard icon={FileSpreadsheet} label="Total rows" value={uploadValidation.length} />
            <SummaryCard icon={CheckCircle2} label="Valid" value={valid} color="text-success" />
            <SummaryCard icon={AlertTriangle} label="Warnings" value={warnings} color="text-warning" />
            <SummaryCard icon={AlertCircle} label="Errors" value={errors} color="text-destructive" />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Validation results — postcodes_april.csv</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Row</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadValidation.map((r) => (
                    <TableRow key={r.row}>
                      <TableCell>{r.row}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "ok" ? "default" : r.status === "warning" ? "secondary" : "destructive"}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{r.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setUploaded(false)}>Cancel</Button>
            <Button onClick={() => { toast.success(`Committed ${valid} valid records`); setUploaded(false); }}>Commit Valid Records</Button>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color = "text-foreground" }: { icon: typeof UploadCloud; label: string; value: number; color?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-md bg-muted ${color}`}><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
