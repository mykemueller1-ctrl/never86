/**
 * Yesterday Sales — Morning Dashboard
 * Auto-shows last Z-Report data when app opens before service.
 * Designed for the morning manager glance: "How did we do yesterday?"
 */
import { trpc } from "@/lib/trpc";
import type { SafeStaff } from "../../../shared/types";
import {
  ChevronLeft, DollarSign, Users, Truck, Coffee,
  TrendingUp, TrendingDown, Utensils, Beer, GlassWater,
  Clock, AlertTriangle, Receipt, Percent,
} from "lucide-react";

interface Props {
  staffUser: SafeStaff;
  onBack: () => void;
}

function formatMoney(val: string | number | null | undefined): string {
  if (!val) return "$0";
  const n = typeof val === "string" ? parseFloat(val) : val;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function StatCard({ label, value, icon: Icon, color = "text-white", sub }: {
  label: string; value: string; icon: any; color?: string; sub?: string;
}) {
  return (
    <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} className="text-zinc-500" />
        <p className="text-zinc-500 text-[10px] uppercase tracking-wide">{label}</p>
      </div>
      <p className={`font-bold text-lg ${color}`}>{value}</p>
      {sub && <p className="text-zinc-500 text-[9px] mt-0.5">{sub}</p>}
    </div>
  );
}

export default function YesterdaySalesScreen({ staffUser, onBack }: Props) {
  const { data: yesterday, isLoading } = trpc.sales.yesterday.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-zinc-500 text-sm">Loading yesterday's numbers...</div>
      </div>
    );
  }

  if (!yesterday) {
    return (
      <div className="min-h-screen bg-black p-4">
        <header className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
            <ChevronLeft size={18} className="text-zinc-400" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg">Yesterday's Sales</h1>
            <p className="text-zinc-500 text-xs">Morning dashboard</p>
          </div>
        </header>
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center">
          <Receipt size={32} className="text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm font-medium">No Z-Report uploaded yet</p>
          <p className="text-zinc-600 text-xs mt-1">Upload yesterday's Z-Report to see the numbers here</p>
        </div>
      </div>
    );
  }

  const grandTotal = parseFloat(yesterday.grandTotal || "0");
  const laborPct = parseFloat(yesterday.laborPct || "0");
  const totalOrders = yesterday.totalQty || 0;
  const food = parseFloat(yesterday.catFoodAmount || "0");
  const beer = parseFloat(yesterday.catBeerAmount || "0");
  const liquor = parseFloat(yesterday.catLiquorAmount || "0");
  const pickup = parseFloat(yesterday.pickupAmount || "0");
  const delivery = parseFloat(yesterday.deliveryAmount || "0");
  const bar = parseFloat(yesterday.barAmount || "0");
  const table = parseFloat(yesterday.tableAmount || "0");
  const voids = yesterday.voidsCount || 0;
  const voidsAmount = parseFloat(yesterday.voidsAmount || "0");
  const discounts = parseFloat(yesterday.discountTotal || "0");
  const lateDeliveries = yesterday.lateDeliveriesCount || 0;

  const dayName = new Date(yesterday.businessDate + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric"
  });

  // Channel breakdown percentages
  const channels = [
    { label: "Pickup", val: pickup, color: "bg-blue-500", icon: Coffee },
    { label: "Delivery", val: delivery, color: "bg-green-500", icon: Truck },
    { label: "Bar", val: bar, color: "bg-purple-500", icon: Beer },
    { label: "Table", val: table, color: "bg-amber-500", icon: Users },
  ].filter(c => c.val > 0);

  return (
    <div className="min-h-screen bg-black p-4 pb-24">
      {/* Header */}
      <header className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
          <ChevronLeft size={18} className="text-zinc-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold text-lg">Yesterday's Sales</h1>
          <p className="text-zinc-500 text-xs">{dayName}</p>
        </div>
      </header>

      {/* Hero — Grand Total */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl p-5 border border-zinc-800 mb-4 text-center">
        <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-1">Total Revenue</p>
        <p className="text-amber-400 font-bold text-4xl tracking-tight">{formatMoney(grandTotal)}</p>
        <p className="text-zinc-500 text-xs mt-1">{totalOrders} orders</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <StatCard label="Labor %" value={`${laborPct.toFixed(1)}%`} icon={Percent}
          color={laborPct > 35 ? "text-red-400" : laborPct > 30 ? "text-amber-400" : "text-green-400"}
          sub={laborPct > 35 ? "Above target" : laborPct > 30 ? "Watch" : "On target"} />
        <StatCard label="Voids" value={`${voids}`} icon={AlertTriangle}
          color={voids > 5 ? "text-red-400" : voids > 2 ? "text-amber-400" : "text-green-400"}
          sub={voidsAmount > 0 ? formatMoney(voidsAmount) : "Clean day"} />
        <StatCard label="Discounts" value={formatMoney(discounts)} icon={Receipt}
          color="text-zinc-300" />
        <StatCard label="Late Deliveries" value={`${lateDeliveries}`} icon={Clock}
          color={lateDeliveries > 3 ? "text-red-400" : lateDeliveries > 0 ? "text-amber-400" : "text-green-400"}
          sub={lateDeliveries === 0 ? "All on time" : undefined} />
      </div>

      {/* Category Breakdown */}
      <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 mb-4">
        <p className="text-zinc-400 text-[10px] uppercase font-semibold mb-3 tracking-wide">Category Breakdown</p>
        <div className="space-y-2.5">
          {[
            { label: "Food", val: food, icon: Utensils, color: "bg-amber-500" },
            { label: "Beer", val: beer, icon: Beer, color: "bg-yellow-500" },
            { label: "Liquor", val: liquor, icon: GlassWater, color: "bg-purple-500" },
          ].map(cat => {
            const pct = grandTotal > 0 ? (cat.val / grandTotal) * 100 : 0;
            return (
              <div key={cat.label}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                    <cat.icon size={12} className="text-zinc-500" />
                    <span className="text-zinc-300 text-xs">{cat.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-xs font-medium">{formatMoney(cat.val)}</span>
                    <span className="text-zinc-500 text-[9px]">{pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full ${cat.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Channel Breakdown */}
      <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
        <p className="text-zinc-400 text-[10px] uppercase font-semibold mb-3 tracking-wide">Channel Breakdown</p>
        <div className="space-y-2.5">
          {channels.map(ch => {
            const pct = grandTotal > 0 ? (ch.val / grandTotal) * 100 : 0;
            return (
              <div key={ch.label}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                    <ch.icon size={12} className="text-zinc-500" />
                    <span className="text-zinc-300 text-xs">{ch.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-xs font-medium">{formatMoney(ch.val)}</span>
                    <span className="text-zinc-500 text-[9px]">{pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full ${ch.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
