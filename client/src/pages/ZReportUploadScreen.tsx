/**
 * Z-Report Upload Screen
 * Manager uploads the daily Z-Report PDF from PDQ POS.
 * LLM parses it automatically and upserts into daily_sales.
 * Night Shift Design System — amber accents, true black.
 */
import { useState, useRef } from "react";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/lib/trpc";
import type { SafeStaff } from "../../../shared/types";
import {
  ChevronLeft, Upload, FileText, CheckCircle2,
  Loader2, AlertTriangle, Calendar, DollarSign,
  TrendingUp, Beer, Utensils, Truck
} from "lucide-react";

interface Props {
  staffUser: SafeStaff;
  onBack: () => void;
}

export default function ZReportUploadScreen({ staffUser, onBack }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateOverride, setDateOverride] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadPhoto = trpc.upload.receiptPhoto.useMutation();
  const parseZReport = trpc.sales.parseZReport.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      toast.error("Only PDF files accepted");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }
    setFile(selected);
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      // Convert file to base64
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      // Upload to S3
      setParsing(false);
      const { url } = await uploadPhoto.mutateAsync({
        base64,
        filename: file.name,
        mimeType: "application/pdf",
        context: "invoice", // reuse invoice context for storage
      });

      setUploading(false);
      setParsing(true);

      // Parse with LLM
      const parseResult = await parseZReport.mutateAsync({
        fileUrl: url,
        businessDate: dateOverride || undefined,
      });

      setResult(parseResult);
      setParsing(false);
      toast.success(`Z-Report for ${parseResult.businessDate} imported!`);
    } catch (err: any) {
      setUploading(false);
      setParsing(false);
      const msg = err?.message || "Upload failed";
      setError(msg);
      toast.error(msg);
    }
  };

  const formatMoney = (val: string | number | null | undefined) => {
    if (!val) return "$0";
    const n = typeof val === "string" ? parseFloat(val) : val;
    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="h-screen flex flex-col bg-black screen-enter">
      {/* Header */}
      <div className="px-6 pt-10 pb-4">
        <button onClick={onBack} className="text-amber-500 text-xs mb-3 flex items-center gap-1 hover:text-amber-400 transition-colors">
          <ChevronLeft size={16} /> Back
        </button>
        <h2 className="text-2xl font-black text-white tracking-tight">Z-REPORT UPLOAD</h2>
        <p className="text-zinc-500 text-xs mt-1">Upload today's Z-Report PDF from PDQ</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-4">
        {/* Upload Area */}
        {!result && (
          <div className="space-y-4">
            {/* Date Override (optional) */}
            <div>
              <label className="text-zinc-400 text-xs block mb-1">Business Date (optional — auto-detected from PDF)</label>
              <input
                type="date"
                value={dateOverride}
                onChange={e => setDateOverride(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* File Drop Zone */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 transition-all ${
                file ? "border-amber-500/50 bg-amber-500/5" : "border-zinc-700 hover:border-zinc-500"
              }`}
            >
              {file ? (
                <>
                  <FileText size={32} className="text-amber-500" />
                  <p className="text-white font-medium text-sm">{file.name}</p>
                  <p className="text-zinc-500 text-xs">{(file.size / 1024).toFixed(0)} KB — tap to change</p>
                </>
              ) : (
                <>
                  <Upload size={32} className="text-zinc-500" />
                  <p className="text-zinc-400 text-sm font-medium">Tap to select Z-Report PDF</p>
                  <p className="text-zinc-600 text-xs">PDQ Signature Systems daily report</p>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Upload Button */}
            {file && (
              <button
                onClick={handleUpload}
                disabled={uploading || parsing}
                className="w-full bg-amber-500 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-400 transition-colors"
              >
                {uploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Uploading...
                  </>
                ) : parsing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    AI Parsing Z-Report...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Upload & Parse Z-Report
                  </>
                )}
              </button>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-400 mt-0.5 shrink-0" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 size={20} className="text-green-400" />
              <div>
                <p className="text-green-300 font-medium text-sm">Z-Report Imported Successfully</p>
                <p className="text-green-400/70 text-xs mt-0.5">{result.businessDate}</p>
              </div>
            </div>

            {/* Parsed Summary */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-3">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <Calendar size={14} className="text-amber-500" />
                {result.businessDate} Summary
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <StatCard icon={DollarSign} label="Grand Total" value={formatMoney(result.parsed?.grandTotal)} />
                <StatCard icon={TrendingUp} label="Orders" value={result.parsed?.totalQty?.toString() || "—"} />
                <StatCard icon={Utensils} label="Food" value={formatMoney(result.parsed?.catFoodAmount)} />
                <StatCard icon={Beer} label="Beer" value={formatMoney(result.parsed?.catBeerAmount)} />
                <StatCard icon={DollarSign} label="Liquor" value={formatMoney(result.parsed?.catLiquorAmount)} />
                <StatCard icon={Truck} label="Delivery" value={formatMoney(result.parsed?.deliveryAmount)} />
              </div>

              {result.parsed?.laborPct && (
                <div className="bg-zinc-800/50 rounded-xl p-3">
                  <p className="text-zinc-500 text-[10px] uppercase">Labor</p>
                  <p className="text-white font-bold">
                    {formatMoney(result.parsed.laborTotal)} ({result.parsed.laborPct}%) — {result.parsed.laborHeadcount} staff
                  </p>
                </div>
              )}

              {(result.parsed?.voidsCount || result.parsed?.lateDeliveriesCount) && (
                <div className="bg-zinc-800/50 rounded-xl p-3 space-y-1">
                  <p className="text-zinc-500 text-[10px] uppercase">Operations</p>
                  {result.parsed.voidsCount > 0 && (
                    <p className="text-red-400 text-sm">Voids: {result.parsed.voidsCount} ({formatMoney(result.parsed.voidsAmount)})</p>
                  )}
                  {result.parsed.lateDeliveriesCount > 0 && (
                    <p className="text-amber-400 text-sm">Late Deliveries: {result.parsed.lateDeliveriesCount} (avg {result.parsed.avgDeliveryTimeMin} min)</p>
                  )}
                  {result.parsed.discountCount > 0 && (
                    <p className="text-zinc-400 text-sm">Discounts: {result.parsed.discountCount} ({formatMoney(result.parsed.discountTotal)})</p>
                  )}
                </div>
              )}
            </div>

            {/* Upload Another */}
            <button
              onClick={() => { setFile(null); setResult(null); setError(null); }}
              className="w-full bg-zinc-900 border border-zinc-800 text-white font-medium py-3 rounded-xl hover:bg-zinc-800 transition-colors"
            >
              Upload Another Z-Report
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
          <p className="text-zinc-500 text-xs leading-relaxed">
            <span className="text-amber-500 font-medium">How it works:</span> Upload the daily Z-Report PDF from PDQ.
            The AI reads every number — sales by channel, menu categories, labor, voids, deliveries, discounts, cash management —
            and saves it all to the sales database automatically. No manual entry needed.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-zinc-800/50 rounded-xl p-2.5">
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon size={10} className="text-amber-500" />
        <p className="text-zinc-500 text-[9px] uppercase">{label}</p>
      </div>
      <p className="text-white font-bold text-sm">{value}</p>
    </div>
  );
}
