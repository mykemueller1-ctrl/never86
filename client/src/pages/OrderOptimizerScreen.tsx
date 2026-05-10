import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Zap, DollarSign, TrendingDown, TrendingUp, Package, Plus, ShoppingCart, Filter } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface Props {
  onBack: () => void;
}

type Tab = "products" | "new-order" | "history";

export default function OrderOptimizerScreen({ onBack }: Props) {
  const [tab, setTab] = useState<Tab>("products");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [budget, setBudget] = useState("500");
  const [orderType, setOrderType] = useState<"liquor" | "beer" | "combined">("combined");

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Order Optimizer</h1>
          <p className="text-xs text-zinc-400">Budget-smart ordering with par intelligence</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <TabButton active={tab === "products"} onClick={() => setTab("products")} icon={<Package className="w-4 h-4" />} label="Products" />
        <TabButton active={tab === "new-order"} onClick={() => setTab("new-order")} icon={<ShoppingCart className="w-4 h-4" />} label="New Order" />
        <TabButton active={tab === "history"} onClick={() => setTab("history")} icon={<DollarSign className="w-4 h-4" />} label="History" />
      </div>

      {/* Tab Content */}
      {tab === "products" && <ProductsTab categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} />}
      {tab === "new-order" && <NewOrderTab budget={budget} setBudget={setBudget} orderType={orderType} setOrderType={setOrderType} />}
      {tab === "history" && <HistoryTab />}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ━━━ PRODUCTS TAB ━━━
function ProductsTab({ categoryFilter, setCategoryFilter }: { categoryFilter: string; setCategoryFilter: (v: string) => void }) {
  const { data: products, isLoading } = trpc.orderOptimizer.listProducts.useQuery({ active: true });

  const categories = ["all", "liquor", "beer", "wine", "mixer", "soda", "other"];

  const filtered = useMemo(() => {
    if (!products) return [];
    if (categoryFilter === "all") return products;
    return products.filter((p: any) => p.category === categoryFilter);
  }, [products, categoryFilter]);

  const stats = useMemo(() => {
    if (!products) return { total: 0, totalValue: 0, belowPar: 0 };
    const total = products.length;
    const totalValue = products.reduce((sum: number, p: any) => sum + parseFloat(p.costPerUnit || "0") * parseFloat(p.parLevel || "0"), 0);
    const belowPar = products.filter((p: any) => parseFloat(p.currentStock || "0") < parseFloat(p.parLevel || "0")).length;
    return { total, totalValue, belowPar };
  }, [products]);

  if (isLoading) {
    return <div className="text-center text-zinc-400 py-8">Loading products...</div>;
  }

  return (
    <div>
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatCard label="Products" value={stats.total.toString()} icon={<Package className="w-4 h-4 text-amber-400" />} />
        <StatCard label="Full Par Value" value={`$${stats.totalValue.toFixed(0)}`} icon={<DollarSign className="w-4 h-4 text-green-400" />} />
        <StatCard label="Below Par" value={stats.belowPar.toString()} icon={<TrendingDown className="w-4 h-4 text-red-400" />} />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              categoryFilter === cat ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)} ({cat === "all" ? products?.length || 0 : products?.filter((p: any) => p.category === cat).length || 0})
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className="space-y-2">
        {filtered.map((product: any) => (
          <ProductRow key={product.id} product={product} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-zinc-500 py-8">No products in this category</div>
        )}
      </div>
    </div>
  );
}

function ProductRow({ product }: { product: any }) {
  const par = parseFloat(product.parLevel || "0");
  const stock = parseFloat(product.currentStock || "0");
  const deficit = par - stock;
  const pctFull = par > 0 ? Math.min(100, (stock / par) * 100) : 100;

  return (
    <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{product.name}</span>
            <Badge variant="outline" className="text-[10px] shrink-0">{product.category}</Badge>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
            <span>${parseFloat(product.costPerUnit).toFixed(2)}/{product.unitSize || "ea"}</span>
            {product.vendor && <span>{product.vendor}</span>}
            {product.subcategory && <span className="text-zinc-500">{product.subcategory}</span>}
          </div>
        </div>
        <div className="text-right shrink-0 ml-2">
          <div className="text-xs text-zinc-400">Par: {par}</div>
          <div className={`text-sm font-bold ${deficit > 0 ? "text-red-400" : "text-green-400"}`}>
            {deficit > 0 ? `Need ${Math.ceil(deficit)}` : "At par"}
          </div>
        </div>
      </div>
      {/* Par fill bar */}
      <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pctFull >= 80 ? "bg-green-500" : pctFull >= 50 ? "bg-amber-500" : "bg-red-500"}`}
          style={{ width: `${pctFull}%` }}
        />
      </div>
    </div>
  );
}

// ━━━ NEW ORDER TAB ━━━
function NewOrderTab({ budget, setBudget, orderType, setOrderType }: {
  budget: string; setBudget: (v: string) => void;
  orderType: "liquor" | "beer" | "combined"; setOrderType: (v: "liquor" | "beer" | "combined") => void;
}) {
  const [orderId, setOrderId] = useState<number | null>(null);
  const [optimizeResult, setOptimizeResult] = useState<any>(null);
  const utils = trpc.useUtils();

  const createFromPar = trpc.orderOptimizer.createFromPar.useMutation({
    onSuccess: (data) => {
      setOrderId(data.id);
      toast.success(`Order created with ${data.itemCount} items from par levels`);
    },
    onError: (err) => toast.error(err.message),
  });

  const optimize = trpc.orderOptimizer.optimize.useMutation({
    onSuccess: (data) => {
      setOptimizeResult(data);
      utils.orderOptimizer.getOrder.invalidate();
      toast.success(`Optimized! Saved $${data.savings.toFixed(2)}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const { data: order } = trpc.orderOptimizer.getOrder.useQuery(
    { id: orderId! },
    { enabled: !!orderId }
  );

  const { data: products } = trpc.orderOptimizer.listProducts.useQuery({ active: true });

  const handleCreateOrder = () => {
    if (!budget || parseFloat(budget) <= 0) {
      toast.error("Enter a valid budget");
      return;
    }
    createFromPar.mutate({ orderType, budget });
  };

  const handleOptimize = () => {
    if (!orderId) return;
    optimize.mutate({ orderId });
  };

  // Build product lookup
  const productMap = useMemo(() => {
    if (!products) return new Map();
    return new Map(products.map((p: any) => [p.id, p]));
  }, [products]);

  return (
    <div>
      {!orderId ? (
        // Order Setup
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Quick Order from Par Levels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-400">
              Auto-populates order items based on what's below par. Then optimize to fit your budget.
            </p>

            {/* Order Type */}
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Order Type</label>
              <div className="flex gap-2">
                {(["liquor", "beer", "combined"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setOrderType(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      orderType === t ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Weekly Budget</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="pl-9 bg-zinc-800 border-zinc-700 text-white"
                  placeholder="500"
                />
              </div>
            </div>

            <Button
              onClick={handleCreateOrder}
              disabled={createFromPar.isPending}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
            >
              {createFromPar.isPending ? "Creating..." : "Generate Order from Par Levels"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        // Order Review & Optimize
        <div className="space-y-4">
          {/* Optimization Result Banner */}
          {optimizeResult && (
            <Card className="bg-green-950/50 border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-green-400" />
                  <span className="font-bold text-green-400">Optimization Complete</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-zinc-400">Original</div>
                    <div className="text-lg font-bold text-red-400">${optimizeResult.originalTotal.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400">Optimized</div>
                    <div className="text-lg font-bold text-green-400">${optimizeResult.optimizedTotal.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400">Saved</div>
                    <div className="text-lg font-bold text-amber-400">${optimizeResult.savings.toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Budget & Optimize Button */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="pl-9 bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <Button
              onClick={handleOptimize}
              disabled={optimize.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-6"
            >
              <Zap className="w-4 h-4 mr-1" />
              {optimize.isPending ? "..." : "Optimize"}
            </Button>
          </div>

          {/* Order Items */}
          <div className="space-y-2">
            {order?.items?.map((item: any) => {
              const product = productMap.get(item.productId);
              if (!product) return null;
              const originalQty = parseFloat(item.originalQty || "0");
              const suggestedQty = parseFloat(item.suggestedQty || "0");
              const diff = suggestedQty - originalQty;
              const hasDiff = item.suggestedQty && diff !== 0;

              return (
                <div key={item.id} className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                  <div className="flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{product.name}</div>
                      <div className="text-xs text-zinc-400">${parseFloat(product.costPerUnit).toFixed(2)} × {originalQty}</div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      {hasDiff ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-zinc-500 line-through">{originalQty}</span>
                          <span className={`text-sm font-bold ${diff < 0 ? "text-red-400" : "text-green-400"}`}>
                            {suggestedQty}
                          </span>
                          <span className={`text-xs ${diff < 0 ? "text-red-400" : "text-green-400"}`}>
                            ({diff > 0 ? "+" : ""}{diff})
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-zinc-300">{originalQty}</span>
                      )}
                      {item.lineCost && (
                        <div className="text-xs text-zinc-500">${parseFloat(item.lineCost).toFixed(2)}</div>
                      )}
                    </div>
                  </div>
                  {/* Priority bar */}
                  {item.priority > 0 && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${Math.min(100, item.priority / 5)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-zinc-500">P{item.priority}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Reset */}
          <Button
            variant="outline"
            onClick={() => { setOrderId(null); setOptimizeResult(null); }}
            className="w-full border-zinc-700 text-zinc-300"
          >
            Start New Order
          </Button>
        </div>
      )}
    </div>
  );
}

// ━━━ HISTORY TAB ━━━
function HistoryTab() {
  const { data: orders, isLoading } = trpc.orderOptimizer.listOrders.useQuery({});

  if (isLoading) return <div className="text-center text-zinc-400 py-8">Loading history...</div>;

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
        <p className="text-zinc-400">No orders yet</p>
        <p className="text-xs text-zinc-500 mt-1">Create your first optimized order above</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order: any) => (
        <Card key={order.id} className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {order.orderType.charAt(0).toUpperCase() + order.orderType.slice(1)} Order
                  </span>
                  <Badge
                    variant={order.status === "optimized" ? "default" : "outline"}
                    className={`text-[10px] ${order.status === "optimized" ? "bg-green-600" : ""}`}
                  >
                    {order.status}
                  </Badge>
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  Week of {new Date(order.weekOf).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-400">Budget: ${parseFloat(order.budget).toFixed(0)}</div>
                {order.savings && parseFloat(order.savings) > 0 && (
                  <div className="text-sm font-bold text-green-400">
                    Saved ${parseFloat(order.savings).toFixed(2)}
                  </div>
                )}
              </div>
            </div>
            {order.optimizedTotal && (
              <div className="mt-2 flex gap-4 text-xs">
                <span className="text-zinc-500">Original: ${parseFloat(order.originalTotal || "0").toFixed(2)}</span>
                <span className="text-green-400">Final: ${parseFloat(order.optimizedTotal).toFixed(2)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ━━━ SHARED COMPONENTS ━━━
function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] text-zinc-400">{label}</div>
    </div>
  );
}
