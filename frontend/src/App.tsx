import { useState, useRef, useEffect } from "react";
import cls from "classnames";
import { productAPI, aiAPI, cartAPI, Product, CartItem } from "./services/api";
import AttractiveHomePage from "./components/AttractiveHomePage";

/**
 * ShopGenius App - AI购物助手
 * 功能：
 * 1. AI购物助手对话
 * 2. 对话式产品搜索
 * 3. 自然语言筛选
 * 4. 产品列表展示
 * 5. 购物车管理
 * 6. 支付集成
 */

// 类型定义
export type Slots = { category: string | null; color: string | null; priceMax: number | null };
export type ChatMsg = { 
  role: "user" | "assistant"; 
  text?: string; 
  persona?: string; 
  chips?: string[]; 
  product?: Product;
  timestamp?: string;
};

const CATEGORIES = ["Beauty", "Shoes", "Bags", "Electronics", "Sports", "Accessories"] as const;
const COLORS = ["Red", "Blue", "Black", "White", "Green", "Brown"] as const;

export default function App() {
  // --- App/UI state ---
  const [persona, setPersona] = useState("friendly");
  const [tab, setTab] = useState<"home" | "assistant" | "shop">("home");
  const [loading, setLoading] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMsg[]>([
    { 
      role: "assistant", 
      text: "Hi, I'm your AI shopping assistant. Tell me what you're looking for!", 
      persona,
      timestamp: new Date().toISOString()
    }
  ]);
  const [typing, setTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement | null>(null);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Filters (NL + explicit slots)
  const [filterPrompt, setFilterPrompt] = useState("");
  const [slotsPrompt, setSlotsPrompt] = useState<Slots>(makeClearedSlots());
  const parsedFromPrompt = parseFilterPrompt(filterPrompt);
  const mergedSlots: Slots = {
    category: slotsPrompt.category ?? parsedFromPrompt.category ?? null,
    color: slotsPrompt.color ?? parsedFromPrompt.color ?? null,
    priceMax: slotsPrompt.priceMax ?? parsedFromPrompt.priceMax ?? null,
  };

  // Cart state
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const cartCount = cart.reduce((s, it) => s + it.quantity, 0);
  const cartTotal = cart.reduce((s, it) => s + it.quantity * it.price, 0);

  // 加载产品数据
  useEffect(() => {
    loadProducts();
    loadCart();
  }, []);

  // 加载产品列表
  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await productAPI.getProducts({
        category: mergedSlots.category || undefined,
        color: mergedSlots.color || undefined,
        maxPrice: mergedSlots.priceMax || undefined,
        limit: 20
      });
      setProducts(response.products);
    } catch (error) {
      console.error('加载产品失败:', error);
      setToast('加载产品失败，请重试');
    } finally {
      setProductsLoading(false);
    }
  };

  // 加载购物车
  const loadCart = async () => {
    try {
      const response = await cartAPI.getCart();
      setCart(response.items);
    } catch (error) {
      console.error('加载购物车失败:', error);
    }
  };

  // 添加到购物车
  const addToCart = async (product: Product) => {
    try {
      await cartAPI.addToCart(product.id, 1);
      await loadCart(); // 重新加载购物车
      
      // 点击反馈
      setJustAddedId(product.id);
      setTimeout(() => setJustAddedId(null), 900);
      setToast(`Added "${product.name}" to cart`);
      setTimeout(() => setToast(null), 1200);
    } catch (error) {
      console.error('添加到购物车失败:', error);
      setToast('添加到购物车失败');
      setTimeout(() => setToast(null), 1200);
    }
  };

  // 从购物车移除
  const removeFromCart = async (productId: string) => {
    try {
      await cartAPI.removeFromCart(productId);
      await loadCart();
    } catch (error) {
      console.error('移除商品失败:', error);
    }
  };

  // 更新购物车商品数量
  const updateCartQuantity = async (productId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await cartAPI.removeFromCart(productId);
      } else {
        await cartAPI.updateCartItem(productId, quantity);
      }
      await loadCart();
    } catch (error) {
      console.error('更新购物车失败:', error);
    }
  };

  // 清空购物车
  const clearCart = async () => {
    try {
      await cartAPI.clearCart();
      await loadCart();
    } catch (error) {
      console.error('清空购物车失败:', error);
    }
  };

  // 聊天处理
  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    const userMessage: ChatMsg = {
      role: "user",
      text,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setTyping(true);

    try {
      const response = await aiAPI.chat(text, { slots: mergedSlots }, persona);
      
      const assistantMessage: ChatMsg = {
        role: "assistant",
        text: response.reply,
        product: response.products[0], // 显示第一个推荐产品
        persona,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // 如果有推荐产品，更新产品列表
      if (response.products.length > 0) {
        setProducts(response.products);
      }
    } catch (error) {
      console.error('AI聊天失败:', error);
      const errorMessage: ChatMsg = {
        role: "assistant",
        text: "抱歉，我现在无法回复。请稍后再试。",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setTyping(false);
      requestAnimationFrame(() => 
        chatRef.current?.scrollTo({ 
          top: chatRef.current.scrollHeight, 
          behavior: "smooth" 
        })
      );
    }
  };

  // 智能搜索
  const handleSmartSearch = async () => {
    if (!filterPrompt.trim()) return;
    
    try {
      setLoading(true);
      const response = await aiAPI.search(filterPrompt);
      
      // 更新产品列表
      setProducts(response.products);
      
      // 显示搜索结果
      const searchMessage: ChatMsg = {
        role: "assistant",
        text: response.interpretation,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, searchMessage]);
      
    } catch (error) {
      console.error('智能搜索失败:', error);
      setToast('搜索失败，请重试');
      setTimeout(() => setToast(null), 1200);
    } finally {
      setLoading(false);
    }
  };

  // 筛选器处理
  const clearAllFilters = () => {
    setFilterPrompt("");
    setSlotsPrompt(makeClearedSlots());
  };

  const applyNaturalLanguage = () => {
    setSlotsPrompt(prev => ({ ...prev, ...parsedFromPrompt }));
  };

  // 当筛选条件变化时重新加载产品
  useEffect(() => {
    loadProducts();
  }, [mergedSlots.category, mergedSlots.color, mergedSlots.priceMax]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-900">
      <div className="relative w-full min-h-screen bg-white flex flex-col">
        <header className="p-3 border-b flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="font-semibold text-lg">ShopGenius</div>
            <div className="ml-1 flex gap-1 rounded-full bg-gray-100 p-1">
              <button 
                onClick={() => setTab("home")} 
                className={cls("px-3 py-1.5 text-sm rounded-full", 
                  tab === "home" ? "bg-white shadow border" : "text-gray-600"
                )}
              >
                首页
              </button>
              <button 
                onClick={() => setTab("assistant")} 
                className={cls("px-3 py-1.5 text-sm rounded-full", 
                  tab === "assistant" ? "bg-white shadow border" : "text-gray-600"
                )}
              >
                导购
              </button>
              <button 
                onClick={() => setTab("shop")} 
                className={cls("px-3 py-1.5 text-sm rounded-full", 
                  tab === "shop" ? "bg-white shadow border" : "text-gray-600"
                )}
              >
                逛逛
              </button>
            </div>
          </div>
          <button 
            onClick={() => setCartOpen(true)} 
            className="relative rounded-full border px-3 py-1.5 text-sm bg-white flex items-center justify-center w-10 h-10"
          >
            <CartIcon />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </header>

        <main className="flex-1 overflow-auto px-4 py-4">
          {tab === "home" ? (
            <AttractiveHomePage 
              onStartChat={() => setTab("assistant")}
              onSwitchToShop={() => setTab("shop")}
            />
          ) : tab === "assistant" ? (
            <section className="bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden" style={{ minHeight: "600px" }}>
              <div className="p-4 border-b">
                <div className="font-medium">AI Shopping Assistant</div>
                <div className="mt-1 text-xs text-gray-500">AI Persona</div>
                <div className="mt-2">
                  <PersonaSwitcher 
                    value={persona} 
                    onChange={(v) => { 
                      setPersona(v); 
                      setMessages(prev => [...prev, { 
                        role: "assistant", 
                        persona: v, 
                        text: `Switched to: ${PERSONAS.find(p=>p.id===v)?.label}. ${toneLine(v)}`,
                        timestamp: new Date().toISOString()
                      }]); 
                    }} 
                  />
                </div>
              </div>
              <div ref={chatRef} className="flex-1 overflow-auto p-4 space-y-4">
                {messages.map((m, idx) => (
                  <div key={idx} className={cls("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    {m.product ? (
                      <div className="max-w-[90%] rounded-2xl border overflow-hidden bg-white">
                        <div className="grid grid-cols-5 gap-0">
                          <img 
                            src={m.product.image} 
                            alt={m.product.name} 
                            className="col-span-2 w-full h-full object-cover" 
                          />
                          <div className="col-span-3 p-3">
                            <div className="font-medium">{m.product.name}</div>
                            <div className="text-sm text-gray-600">{m.product.category} · {m.product.color}</div>
                            <div className="text-sm mt-1 line-clamp-2">{m.product.description}</div>
                            <div className="mt-2 font-semibold">{currency(m.product.price)}</div>
                            <div className="mt-3 flex gap-2 items-center">
                              <IconButton
                                label="Add to cart"
                                active={justAddedId === m.product.id}
                                onClick={() => addToCart(m.product!)}
                              />
                              <button 
                                className="rounded-xl border px-3 py-1.5 text-sm" 
                                onClick={() => alert("Compare flow TBD")}
                              >
                                + Compare
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={cls("max-w-[85%] rounded-2xl px-4 py-2", 
                        m.role === "user" ? "bg-black text-white" : "bg-gray-100"
                      )}>
                        <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                        {m.chips?.length && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {m.chips.map((c,i) => (
                              <span key={i} className="text-xs bg-white border rounded-full px-2 py-0.5">
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                        {m.persona && (
                          <div className="mt-1 text-[11px] text-gray-500">
                            Persona: {m.persona}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {typing && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl px-4 py-2 text-sm">Thinking…</div>
                  </div>
                )}
              </div>
              <ChatInput onSend={handleSend} />
            </section>
          ) : (
            <section className="space-y-4">
              {/* 智能搜索 */}
              <div className="bg-white rounded-2xl border shadow-sm p-4">
                <div className="font-medium mb-2">Smart Search</div>
                <div className="flex gap-2">
                  <input 
                    value={filterPrompt} 
                    onChange={(e) => setFilterPrompt(e.target.value)} 
                    placeholder="Describe what you want…" 
                    className="flex-1 rounded-2xl border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black/10" 
                  />
                  <button 
                    onClick={handleSmartSearch} 
                    disabled={loading}
                    className="rounded-2xl bg-black text-white px-3 py-2 disabled:opacity-50"
                  >
                    {loading ? '...' : 'Search'}
                  </button>
                  <button 
                    onClick={() => setFilterPrompt("")} 
                    className="rounded-2xl border px-3 py-2 bg-white hover:bg-gray-50"
                  >
                    Clear
                  </button>
                </div>
                {filterPrompt && (
                  <div className="mt-2 text-[11px] text-gray-600">
                    Parsed → {JSON.stringify(parsedFromPrompt)}
                  </div>
                )}
              </div>

              {/* 筛选器 */}
              <div className="bg-white rounded-2xl border shadow-sm p-4">
                <div className="font-medium mb-2">Filters</div>
                <div className="mt-1">
                  <SlotChips 
                    slots={mergedSlots} 
                    onRemove={(k) => setSlotsPrompt((s) => ({...s, [k]: null}))} 
                    onQuickSet={(k,v) => setSlotsPrompt((s) => ({...s, [k]: v}))} 
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <QuickSelect 
                    label="Category" 
                    value={slotsPrompt.category} 
                    onChange={(v) => setSlotsPrompt((s) => ({...s, category: v}))} 
                    options={[
                      {label:"All", value:null}, 
                      ...CATEGORIES.map((c) => ({label:c, value:c}))
                    ]} 
                  />
                  <QuickSelect 
                    label="Color" 
                    value={slotsPrompt.color} 
                    onChange={(v) => setSlotsPrompt((s) => ({...s, color: v}))} 
                    options={[
                      {label:"All", value:null}, 
                      ...COLORS.map((c) => ({label:c, value:c}))
                    ]} 
                  />
                  <QuickSelect 
                    label="Price ≤" 
                    value={slotsPrompt.priceMax} 
                    onChange={(v) => setSlotsPrompt((s) => ({...s, priceMax: v}))} 
                    options={[
                      {label:"Any", value:null},
                      {label:"$25", value:25},
                      {label:"$50", value:50},
                      {label:"$100", value:100},
                      {label:"$150", value:150}
                    ]} 
                  />
                  <button 
                    onClick={clearAllFilters} 
                    className="ml-auto rounded-xl border px-3 py-2 bg-white hover:bg-gray-50"
                  >
                    Reset all
                  </button>
                </div>
              </div>

              {/* 产品网格 */}
              <div id="grid" className="grid grid-cols-2 gap-3 pb-16">
                {productsLoading ? (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    Loading products...
                  </div>
                ) : products.length > 0 ? (
                  products.map((p) => (
                    <article key={p.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col">
                      <img src={p.image} alt={p.name} className="w-full h-36 object-cover" />
                      <div className="p-3 flex-1 flex flex-col">
                        <h3 className="font-medium leading-tight text-sm">{p.name}</h3>
                        <p className="text-xs text-gray-600">{p.category} · {p.color}</p>
                        <p className="text-xs mt-1 line-clamp-2">{p.description}</p>
                        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                          <div className="font-semibold">{currency(p.price)}</div>
                          <div className="flex items-center gap-2">
                            <button 
                              className="rounded-xl border px-2 py-1 text-xs" 
                              onClick={() => alert("Compare flow TBD")}
                            >
                              + Compare
                            </button>
                            <IconButton 
                              label="Add to cart" 
                              active={justAddedId === p.id} 
                              onClick={() => addToCart(p)} 
                            />
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="col-span-full bg-white rounded-2xl border p-8 text-center text-gray-600">
                    No products found. Try adjusting your filters.
                  </div>
                )}
              </div>
            </section>
          )}
        </main>


        {/* Toast提示 */}
        {toast && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-20 z-30 bg-black text-white text-xs px-3 py-2 rounded-full shadow">
            {toast}
          </div>
        )}

        {/* 购物车抽屉 */}
        {cartOpen && (
          <div className="absolute inset-0 z-40 pointer-events-none">
            <div 
              className="absolute inset-0 bg-black/25 pointer-events-auto" 
              onClick={() => setCartOpen(false)} 
            />
            <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl border-t shadow-2xl p-4 pointer-events-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">Cart ({cartCount})</div>
                <button 
                  className="text-sm text-gray-600 underline" 
                  onClick={clearCart}
                >
                  Clear
                </button>
              </div>
              <div className="max-h-60 overflow-auto divide-y">
                {cart.length === 0 ? (
                  <div className="text-sm text-gray-500 py-6 text-center">
                    Your cart is empty.
                  </div>
                ) : (
                  cart.map((it) => (
                    <div key={it.productId} className="py-2 flex items-center gap-3">
                      <img 
                        src={it.image} 
                        alt={it.name} 
                        className="w-12 h-12 rounded object-cover border" 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{it.name}</div>
                        <div className="text-xs text-gray-600">
                          {currency(it.price)} · {it.quantity} pcs
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          className="rounded-full w-7 h-7 border" 
                          onClick={() => updateCartQuantity(it.productId, it.quantity - 1)}
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-sm">{it.quantity}</span>
                        <button 
                          className="rounded-full w-7 h-7 border" 
                          onClick={() => updateCartQuantity(it.productId, it.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button 
                        className="ml-2 text-xs text-gray-500 underline" 
                        onClick={() => removeFromCart(it.productId)}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="font-semibold">Total: {currency(cartTotal)}</div>
                <button 
                  className="rounded-xl bg-black text-white px-4 py-2 text-sm" 
                  onClick={() => alert("Checkout flow TBD")}
                >
                  Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== 辅助函数和组件 =====
export function currency(n: number) { 
  return `$${n.toFixed(2)}`; 
}

export function makeClearedSlots(): Slots { 
  return { category: null, color: null, priceMax: null }; 
}

export function parseFilterPrompt(s: string): Slots { 
  const lower = s.toLowerCase(); 
  const color = COLORS.find((c) => lower.includes(c.toLowerCase())) ?? null; 
  const category = CATEGORIES.find((c) => lower.includes(c.toLowerCase())) ?? null; 
  let priceMax: number | null = null; 
  const m = lower.match(/(?:under|<=|≤)\s*(\d+)/) || lower.match(/(\d+)\s*(?:元|rmb|usd|\$)/); 
  if (m) priceMax = Number(m[1]); 
  return { category, color, priceMax }; 
}

export const PERSONAS = [
  { id: "friendly", label: "亲和" }, 
  { id: "rational", label: "理性" }, 
  { id: "luxury", label: "奢华" }
];

export function toneLine(persona: string) { 
  switch(persona) { 
    case "friendly": return "I've got your back—let's find a great pick together!"; 
    case "luxury": return "Curating refined pieces just for you."; 
    default: return "Let's optimize for quality and value."; 
  } 
}

function PersonaSwitcher({ value, onChange }: { value: string; onChange: (v: string) => void }) { 
  return (
    <div className="inline-flex gap-2">
      {PERSONAS.map((p) => (
        <button 
          key={p.id} 
          onClick={() => onChange(p.id)} 
          className={cls("px-3 py-1.5 text-xs rounded-full border", 
            value === p.id ? "bg-black text-white" : "bg-white"
          )} 
          title={p.label}
        >
          {p.label}
        </button>
      ))}
    </div>
  ); 
}

function SlotChips({ slots, onRemove, onQuickSet }: { 
  slots: Slots; 
  onRemove: (k: keyof Slots) => void; 
  onQuickSet: (k: keyof Slots, v: any) => void; 
}) { 
  const chips: Array<{k: keyof Slots; label: string; v: any}> = []; 
  if(slots.category) chips.push({k:"category", label:`Category: ${slots.category}`, v:slots.category}); 
  if(slots.color) chips.push({k:"color", label:`Color: ${slots.color}`, v:slots.color}); 
  if(slots.priceMax != null) chips.push({k:"priceMax", label:`≤ $${slots.priceMax}`, v:slots.priceMax}); 
  
  return (
    <div className="flex flex-wrap gap-2">
      {!chips.length && (
        <span className="text-xs text-gray-500">No active filters. Use the controls below.</span>
      )}
      {chips.map((c,i) => (
        <span key={i} className="text-xs bg-white border rounded-full pl-3 pr-1 py-1 flex items-center gap-2">
          {c.label}
          <button 
            className="rounded-full w-5 h-5 border text-[11px]" 
            onClick={() => onRemove(c.k)}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  ); 
}

function QuickSelect({ label, value, options, onChange }: { 
  label: string; 
  value: any; 
  options: Array<{label: string; value: any}>; 
  onChange: (v: any) => void; 
}) { 
  return (
    <label className="text-xs flex items-center gap-2 border rounded-xl px-2 py-1 bg-white">
      <span className="text-gray-600">{label}</span>
      <select 
        className="text-xs outline-none" 
        value={value === null ? "__ANY__" : String(value)} 
        onChange={(e) => {
          const v = e.target.value; 
          onChange(v === "__ANY__" ? null : (isNaN(Number(v)) ? v : Number(v))); 
        }}
      >
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value === null ? "__ANY__" : String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  ); 
}

function IconButton({ label, active, onClick }: { 
  label: string; 
  active?: boolean; 
  onClick: () => void; 
}) {
  return (
    <button 
      aria-label={label} 
      title={label} 
      onClick={onClick}
      className={cls("relative w-9 h-9 rounded-full border flex items-center justify-center transition-transform", 
        active ? "bg-black text-white scale-95" : "bg-white hover:scale-105"
      )}
    >
      {active ? <CheckIcon /> : <CartIcon />}
    </button>
  );
}

function CartIcon() { 
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7.16 14h9.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 21 5H6.21l-.94-2H1v2h3l3.6 7.59-1.35 2.44A2 2 0 0 0 8 18h12v-2H8l1.16-2z"/>
    </svg>
  ); 
}

function CheckIcon() { 
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>
    </svg>
  ); 
}

function ChatInput({ onSend }: { onSend: (t: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <div className="p-3 border-t bg-white flex items-center gap-2">
      <input 
        value={val} 
        onChange={(e) => setVal(e.target.value)} 
        onKeyDown={(e) => { 
          if(e.key === "Enter") { 
            onSend(val); 
            setVal(""); 
          } 
        }} 
        placeholder="Type a message…" 
        className="flex-1 rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
      />
      <button 
        onClick={() => { 
          onSend(val); 
          setVal(""); 
        }} 
        className="rounded-xl bg-black text-white px-4 py-2 text-sm"
      >
        Send
      </button>
    </div>
  );
}