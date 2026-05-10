/**
 * Photo Intelligence Screen — Wave 24
 * AI-powered photo analysis pipeline for restaurant operations.
 * Turns invoice/shelf/prep/delivery/compliance photos into structured actionable data.
 * Night Shift Design System — amber-only, surfaces over borders.
 */
import { useState, useRef, useMemo } from "react";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/lib/trpc";
import type { SafeStaff } from "../../../shared/types";
import {
  Camera, ChevronLeft, Upload, Eye, BarChart3, Filter,
  CheckCircle2, AlertTriangle, Package, Loader2,
  FileText, ShoppingCart, Utensils, Thermometer,
  Truck, Image as ImageIcon, Layers, Activity,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────
type PhotoType = "invoice" | "shelf" | "station" | "equipment" | "plate" | "delivery" | "prep" | "other";
type Tab = "capture" | "feed" | "stats";

const PHOTO_TYPES: { value: PhotoType; label: string; icon: any; desc: string }[] = [
  { value: "invoice", label: "Invoice", icon: FileText, desc: "Receipts, invoices, delivery tickets" },
  { value: "shelf", label: "Shelf/Walk-in", icon: Package, desc: "Storage shelves, walk-in cooler" },
  { value: "station", label: "Station", icon: Utensils, desc: "Workstation setup & cleanliness" },
  { value: "prep", label: "Prep", icon: Thermometer, desc: "Food prep, portioning, safety" },
  { value: "delivery", label: "Delivery", icon: Truck, desc: "Receiving, condition check" },
  { value: "plate", label: "Plate", icon: ImageIcon, desc: "Plated dishes, presentation" },
  { value: "equipment", label: "Equipment", icon: Layers, desc: "Equipment condition, maintenance" },
  { value: "other", label: "Other", icon: Camera, desc: "General restaurant photo" },
];

// ─── Screen Header ─────────────────────────────────────
function ScreenHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack: () => void }) {
  return (
    <div className="px-6 pt-10 pb-4">
      <button onClick={onBack} className="flex items-center gap-1 text-zinc-400 mb-3 hover:text-amber-400 transition-colors">
        <ChevronLeft size={18} /> Back
      </button>
      <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
      {subtitle && <p className="text-zinc-400 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────
export default function PhotoIntelligenceScreen({ staffUser, onBack }: { staffUser: SafeStaff; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("capture");
  const [selectedType, setSelectedType] = useState<PhotoType>("invoice");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [feedFilter, setFeedFilter] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadPhoto = trpc.upload.receiptPhoto.useMutation();
  const analyzeAndProcess = trpc.photos.analyzeAndProcess.useMutation();
  const feedQuery = trpc.photos.feed.useQuery({ limit: 50 });
  const statsQuery = trpc.photos.stats.useQuery();
  const verifyMutation = trpc.photos.verify.useMutation();

  const isManager = ["owner", "key_manager", "kitchen_manager", "bar_manager"].includes(staffUser.jobRole);

  // ─── Upload & Analyze ────────────────────────────────
  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setAnalyzing(false);
    setLastResult(null);
    try {
      // Convert to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      // Upload to storage
      const uploadResult = await uploadPhoto.mutateAsync({
        base64,
        filename: `photo-intel-${selectedType}-${Date.now()}.${file.name.split(".").pop() || "jpg"}`,
        mimeType: file.type || "image/jpeg",
        context: "issue" as const,
      });
      setUploading(false);
      setAnalyzing(true);
      // Analyze with AI + post-processing
      const result = await analyzeAndProcess.mutateAsync({
        photoUrl: uploadResult.url,
        photoType: selectedType,
        staffId: staffUser.id,
      });
      setLastResult(result);
      toast.success(`Photo analyzed! +5 pts${result.postProcessing ? " — Actions processed" : ""}`);
      feedQuery.refetch();
      statsQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Analysis failed. Try again.");
    }
    setAnalyzing(false);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleVerify = async (photoId: number) => {
    try {
      await verifyMutation.mutateAsync({ id: photoId, verifiedByStaffId: staffUser.id });
      toast.success("Photo verified!");
      feedQuery.refetch();
      statsQuery.refetch();
    } catch {
      toast.error("Verification failed");
    }
  };

  // ─── Feed Data ───────────────────────────────────────
  const filteredFeed = useMemo(() => {
    if (!feedQuery.data) return [];
    if (feedFilter === "all") return feedQuery.data;
    return feedQuery.data.filter((p: any) => p.photoType === feedFilter);
  }, [feedQuery.data, feedFilter]);

  // ─── Render ──────────────────────────────────────────
  return (
    <div className="h-screen overflow-y-auto bg-black pb-24 screen-enter">
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      <ScreenHeader title="PHOTO INTELLIGENCE" subtitle="AI-powered photo analysis pipeline" onBack={onBack} />

      {/* Tab Navigation */}
      <div className="px-6 mb-4">
        <div className="flex gap-1 bg-zinc-900 rounded-xl p-1">
          {([
            { id: "capture" as Tab, label: "Capture", icon: Camera },
            { id: "feed" as Tab, label: "Feed", icon: Eye },
            { id: "stats" as Tab, label: "Stats", icon: BarChart3 },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? "bg-amber-500/20 text-amber-400" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── CAPTURE TAB ─── */}
      {tab === "capture" && (
        <div className="px-6 space-y-5">
          {/* Photo Type Selector */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Select Photo Type</h3>
            <div className="grid grid-cols-2 gap-2">
              {PHOTO_TYPES.map(pt => {
                const Icon = pt.icon;
                return (
                  <button
                    key={pt.value}
                    onClick={() => setSelectedType(pt.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      selectedType === pt.value
                        ? "border-amber-500 bg-amber-500/10 text-amber-400"
                        : "border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-600"
                    }`}
                  >
                    <Icon size={18} className={selectedType === pt.value ? "text-amber-400" : "text-zinc-500"} />
                    <div>
                      <div className="text-sm font-medium">{pt.label}</div>
                      <div className="text-[10px] text-zinc-500 leading-tight">{pt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Capture Button */}
          <button
            onClick={handleCapture}
            disabled={uploading || analyzing}
            className="w-full py-4 rounded-xl bg-amber-500 text-black font-bold text-lg flex items-center justify-center gap-3 hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <><Loader2 size={22} className="animate-spin" /> Uploading...</>
            ) : analyzing ? (
              <><Loader2 size={22} className="animate-spin" /> AI Analyzing...</>
            ) : (
              <><Camera size={22} /> Capture & Analyze</>
            )}
          </button>

          {/* Analysis Results */}
          {lastResult && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Summary Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={18} className="text-green-400" />
                  <h4 className="text-sm font-semibold text-white">Analysis Complete</h4>
                  <span className="ml-auto text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">+5 pts</span>
                </div>
                <div className="text-sm text-zinc-300 leading-relaxed">
                  {lastResult.extraction?.raw
                    ? lastResult.extraction.raw.slice(0, 300)
                    : JSON.stringify(lastResult.extraction, null, 2).slice(0, 500)
                  }
                </div>
              </div>

              {/* Post-Processing Results */}
              {lastResult.postProcessing && (
                <div className="bg-zinc-900 border border-amber-500/30 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                    <Activity size={16} /> Action Items
                  </h4>
                  {lastResult.postProcessing.type === "shelf_alerts" && (
                    <div className="space-y-2">
                      {lastResult.postProcessing.alerts?.length > 0 ? (
                        lastResult.postProcessing.alerts.map((a: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <AlertTriangle size={14} className={a.level === "empty" ? "text-red-400" : "text-yellow-400"} />
                            <span className="text-zinc-300">{a.product} — <span className={a.level === "empty" ? "text-red-400 font-medium" : "text-yellow-400 font-medium"}>{a.level}</span></span>
                          </div>
                        ))
                      ) : (
                        <p className="text-zinc-500 text-sm">All items at acceptable levels.</p>
                      )}
                    </div>
                  )}
                  {lastResult.postProcessing.type === "compliance_score" && (
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`text-3xl font-bold ${
                          lastResult.postProcessing.score >= 80 ? "text-green-400" :
                          lastResult.postProcessing.score >= 60 ? "text-yellow-400" : "text-red-400"
                        }`}>
                          {lastResult.postProcessing.score}
                        </div>
                        <div className="text-sm text-zinc-400">/ 100 Compliance Score</div>
                      </div>
                      {lastResult.postProcessing.deductions?.length > 0 && (
                        <div className="space-y-1">
                          {lastResult.postProcessing.deductions.map((d: any, i: number) => (
                            <div key={i} className="text-xs text-red-400">-{d.points} pts: {d.reason}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {lastResult.postProcessing.type === "invoice_actions" && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <div className="text-xl font-bold text-amber-400">{lastResult.postProcessing.pricesUpdated}</div>
                        <div className="text-[10px] text-zinc-500">Prices Updated</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-400">{lastResult.postProcessing.newProducts}</div>
                        <div className="text-[10px] text-zinc-500">New Products</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-red-400">{lastResult.postProcessing.alertsGenerated}</div>
                        <div className="text-[10px] text-zinc-500">Price Alerts</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Extraction Details (collapsible) */}
              <details className="bg-zinc-900/50 border border-zinc-800 rounded-xl">
                <summary className="px-4 py-3 text-sm text-zinc-400 cursor-pointer hover:text-zinc-200">
                  View Raw Extraction Data
                </summary>
                <pre className="px-4 pb-4 text-xs text-zinc-500 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(lastResult.extraction, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}

      {/* ─── FEED TAB ─── */}
      {tab === "feed" && (
        <div className="px-6 space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter size={14} className="text-zinc-500 shrink-0" />
            {["all", ...PHOTO_TYPES.map(t => t.value)].map(f => (
              <button
                key={f}
                onClick={() => setFeedFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  feedFilter === f ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Feed List */}
          {feedQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-amber-400" />
            </div>
          ) : filteredFeed.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Camera size={40} className="mx-auto mb-3 opacity-50" />
              <p>No photos yet. Start capturing!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFeed.map((photo: any) => (
                <div key={photo.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    {/* Photo Thumbnail */}
                    <div className="w-16 h-16 rounded-lg bg-zinc-800 overflow-hidden shrink-0">
                      {photo.photoUrl ? (
                        <img src={photo.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera size={20} className="text-zinc-600" />
                        </div>
                      )}
                    </div>
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium capitalize">{photo.photoType}</span>
                        {photo.verified && <CheckCircle2 size={14} className="text-green-400" />}
                        <span className="ml-auto text-[10px] text-zinc-600">
                          {photo.createdAt ? new Date(photo.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300 line-clamp-2">
                        {photo.aiSummary?.slice(0, 120) || "Processing..."}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-zinc-500">{photo.staffName || `Staff #${photo.staffId}`}</span>
                        {isManager && !photo.verified && (
                          <button
                            onClick={() => handleVerify(photo.id)}
                            className="ml-auto text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── STATS TAB ─── */}
      {tab === "stats" && (
        <div className="px-6 space-y-5">
          {statsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-amber-400" />
            </div>
          ) : statsQuery.data ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Total Photos" value={statsQuery.data.total} color="text-white" />
                <StatCard label="Action Items" value={statsQuery.data.actionItems} color="text-amber-400" />
                <StatCard label="Verified" value={statsQuery.data.verifiedCount} color="text-green-400" />
                <StatCard label="Pending Review" value={statsQuery.data.unverifiedCount} color="text-yellow-400" />
              </div>

              {/* By Type Breakdown */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-white mb-3">Photos by Type</h4>
                <div className="space-y-2">
                  {Object.entries(statsQuery.data.byType || {}).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([type, count]) => {
                    const total = statsQuery.data!.total || 1;
                    const pct = Math.round(((count as number) / total) * 100);
                    return (
                      <div key={type} className="flex items-center gap-3">
                        <span className="text-xs text-zinc-400 w-20 capitalize">{type}</span>
                        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-zinc-300 w-8 text-right">{count as number}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Intelligence Summary */}
              <div className="bg-zinc-900 border border-amber-500/20 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                  <Activity size={16} /> Intelligence Pipeline Status
                </h4>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <div className="text-lg font-bold text-white">{statsQuery.data.total}</div>
                    <div className="text-[10px] text-zinc-500">Photos Processed</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-amber-400">{statsQuery.data.actionItems}</div>
                    <div className="text-[10px] text-zinc-500">Actions Generated</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-400">
                      {statsQuery.data.total > 0 ? Math.round((statsQuery.data.verifiedCount / statsQuery.data.total) * 100) : 0}%
                    </div>
                    <div className="text-[10px] text-zinc-500">Verified Rate</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-zinc-300">
                      {Object.keys(statsQuery.data.byType || {}).length}
                    </div>
                    <div className="text-[10px] text-zinc-500">Active Categories</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-zinc-500">
              <BarChart3 size={40} className="mx-auto mb-3 opacity-50" />
              <p>No stats available yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Stat Card Component ───────────────────────────────
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-zinc-500 mt-1">{label}</div>
    </div>
  );
}
