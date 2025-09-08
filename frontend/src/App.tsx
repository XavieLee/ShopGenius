import { useState, useRef, useEffect } from "react";
import cls from "classnames";

/**
 * ShopGenius App-size demo (mobile frame)
 * Updates per request:
 * 1) 搜索框放在最下面（Shop 页底部 sticky 输入条）
 * 2) 添加自然语言 filter（NL 输入一键 Apply 到 slots）
 * 3) Add to cart 按钮改为图标，增加点击后的反馈（✓ 变更 & Toast）
 * 4) 购物车可点开查看（Header 按钮 + 右下角悬浮按钮 + 抽屉）
 */

// ---- Types ----
export type Slots = { category: string | null; color: string | null; priceMax: number | null };
export type Product = { id: string; name: string; category: string; color: string; price: number; description: string; image: string };
export type ChatMsg = { role: "user" | "assistant"; text?: string; persona?: string; chips?: string[]; product?: Product };

const CATEGORIES = ["Beauty", "Shoes", "Bags", "Electronics", "Sports", "Accessories"] as const;
const COLORS = ["Red", "Blue", "Black", "White", "Green", "Brown"] as const;

const PRODUCTS: Product[] = [
  { id: "p1", name: "Velvet Matte Lipstick", category: "Beauty", color: "Red", price: 19, description: "Long-wear matte finish with nourishing oils.", image: "https://images.unsplash.com/photo-1582092728069-1d3d3b5c1a9c?q=80&w=800&auto=format&fit=crop" },
  { id: "p2", name: "AirRun Sneakers", category: "Shoes", color: "Black", price: 79, description: "Breathable mesh with cushioned sole.", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop" },
  { id: "p3", name: "City Tote", category: "Bags", color: "Brown", price: 120, description: "Everyday carry-all with laptop sleeve.", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800&auto=format&fit=crop" },
  { id: "p4", name: "Noise-cancel Headphones", category: "Electronics", color: "White", price: 149, description: "Immersive sound and long battery life.", image: "https://images.unsplash.com/photo-1518443895914-6bf7961a8a6e?q=80&w=800&auto=format&fit=crop" },
  { id: "p5", name: "Trail Running Shoes", category: "Shoes", color: "Blue", price: 95, description: "Grip outsole for off-road runs.", image: "https://images.unsplash.com/photo-1520256862855-398228c41684?q=80&w=800&auto=format&fit=crop" },
  { id: "p6", name: "Stainless Sports Bottle", category: "Sports", color: "Green", price: 25, description: "Insulated bottle keeps drinks cold.", image: "https://images.unsplash.com/photo-1599058917513-2918b9a6228d?q=80&w=800&auto=format&fit=crop" },
  { id: "p7", name: "Classic Leather Belt", category: "Accessories", color: "Black", price: 35, description: "Full-grain leather with metal buckle.", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop" },
  { id: "p8", name: "Mini Crossbody", category: "Bags", color: "Red", price: 59, description: "Compact crossbody with adjustable strap.", image: "https://images.unsplash.com/photo-1591348279358-0b09b5e8b5e7?q=80&w=800&auto=format&fit=crop" },
];

export default function App() {
  // --- App/UI state ---
  const [persona, setPersona] = useState("rational");
  const [tab, setTab] = useState<"assistant" | "shop">("assistant");

  // Chat state
  const [messages, setMessages] = useState<ChatMsg[]>([{ role: "assistant", text: "Hi, I’m your AI shopping assistant. Tell me what you’re looking for!", persona }]);
  const [typing, setTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement | null>(null);

  // Filters (NL + explicit slots)
  const [filterPrompt, setFilterPrompt] = useState("");
  const [slotsPrompt, setSlotsPrompt] = useState<Slots>(makeClearedSlots());
  const parsedFromPrompt = parseFilterPrompt(filterPrompt);
  const mergedSlots: Slots = {
    category: slotsPrompt.category ?? parsedFromPrompt.category ?? null,
    color: slotsPrompt.color ?? parsedFromPrompt.color ?? null,
    priceMax: slotsPrompt.priceMax ?? parsedFromPrompt.priceMax ?? null,
  };

  // Products
  const filteredProducts = applyFilters(PRODUCTS, mergedSlots);

  // Cart state
  type CartItem = { product: Product; qty: number };
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const cartCount = cart.reduce((s, it) => s + it.qty, 0);
  const cartTotal = cart.reduce((s, it) => s + it.qty * it.product.price, 0);

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((it) => it.product.id === p.id);
      if (idx >= 0) { const cp = [...prev]; cp[idx] = { ...cp[idx], qty: cp[idx].qty + 1 }; return cp; }
      return [...prev, { product: p, qty: 1 }];
    });
    // Click feedback
    setJustAddedId(p.id);
    setTimeout(() => setJustAddedId((prev) => (prev === p.id ? null : prev)), 900);
    setToast(`Added “${p.name}” to cart`);
    setTimeout(() => setToast(null), 1200);
  };
  const decFromCart = (pid: string) => setCart((prev) => { const i = prev.findIndex((it) => it.product.id === pid); if (i < 0) return prev; const cp = [...prev]; const q = cp[i].qty - 1; if (q <= 0) cp.splice(i, 1); else cp[i] = { ...cp[i], qty: q }; return cp; });
  const removeFromCart = (pid: string) => setCart((prev) => prev.filter((it) => it.product.id !== pid));
  const clearCart = () => setCart([]);

  // Chat handlers
  const handleSend = (text: string) => {
    if (!text.trim()) return; setMessages((m) => [...m, { role: "user", text }]); setTyping(true);
    const reply = generateAssistantReply(text, persona, mergedSlots);
    setTimeout(() => { setMessages((m) => [...m, reply]); setTyping(false); requestAnimationFrame(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" })); }, 450);
  };

  // Filters helpers
  const clearAllFilters = () => { setFilterPrompt(""); setSlotsPrompt(makeClearedSlots()); };
  const applyNaturalLanguage = () => { setSlotsPrompt((s) => ({ ...s, ...parsedFromPrompt })); };

  useEffect(() => { runInlineTests(); }, []);

  return (
    <div className="min-h-screen bg-neutral-200 text-gray-900">
      <div className="relative mx-auto my-4 w-[380px] sm:w-[420px] h-[820px] bg-white rounded-[28px] shadow-2xl overflow-hidden border flex flex-col">
        <header className="p-3 border-b flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="font-semibold text-lg">ShopGenius</div>
            <div className="ml-1 flex gap-1 rounded-full bg-gray-100 p-1">
              <button onClick={() => setTab("assistant")} className={cls("px-3 py-1.5 text-sm rounded-full", tab === "assistant" ? "bg-white shadow border" : "text-gray-600")}>导购</button>
              <button onClick={() => setTab("shop")} className={cls("px-3 py-1.5 text-sm rounded-full", tab === "shop" ? "bg-white shadow border" : "text-gray-600")}>逛逛</button>
            </div>
          </div>
          <button onClick={() => setCartOpen(true)} className="relative rounded-full border px-3 py-1.5 text-sm bg-white">
            Cart {cartCount > 0 && <span className="ml-1 text-xs">({cartCount})</span>}
            {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">{cartCount}</span>}
          </button>
        </header>

        <main className="flex-1 overflow-auto px-4 py-4 pb-28">
          {tab === "assistant" ? (
            <section className="bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden" style={{ minHeight: "600px" }}>
              <div className="p-4 border-b">
                <div className="font-medium">AI Shopping Assistant</div>
                <div className="mt-1 text-xs text-gray-500">AI Persona</div>
                <div className="mt-2"><PersonaSwitcher value={persona} onChange={(v) => { setPersona(v); setMessages((m) => [...m, { role: "assistant", persona: v, text: `Switched to: ${PERSONAS.find(p=>p.id===v)?.label}. ${toneLine(v)}` }]); }} /></div>
              </div>
              <div ref={chatRef} className="flex-1 overflow-auto p-4 space-y-4">
                {messages.map((m, idx) => (
                  <div key={idx} className={cls("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    {m.product ? (
                      <div className="max-w-[90%] rounded-2xl border overflow-hidden bg-white">
                        <div className="grid grid-cols-5 gap-0">
                          <img src={m.product.image} alt={m.product.name} className="col-span-2 w-full h-full object-cover" />
                          <div className="col-span-3 p-3">
                            <div className="font-medium">{m.product.name}</div>
                            <div className="text-sm text-gray-600">{m.product.category} · {m.product.color}</div>
                            <div className="text-sm mt-1 line-clamp-2">{m.product.description}</div>
                            <div className="mt-2 font-semibold">{currency(m.product.price)}</div>
                            <div className="mt-2 text-xs text-gray-600">Why this: {whyThis(m.product, mergedSlots, persona).join(", ") || "balanced choice"}</div>
                            <div className="mt-3 flex gap-2 items-center">
                              <IconButton
                                label="Add to cart"
                                active={justAddedId === m.product.id}
                                onClick={() => addToCart(m.product!)}
                              />
                              <button className="rounded-xl border px-3 py-1.5 text-sm" onClick={() => alert("Compare flow TBD")}>+ Compare</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={cls("max-w-[85%] rounded-2xl px-4 py-2", m.role === "user" ? "bg-black text-white" : "bg-gray-100")}>
                        <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                        {m.chips?.length ? (<div className="mt-2 flex flex-wrap gap-2">{m.chips!.map((c,i)=>(<span key={i} className="text-xs bg-white border rounded-full px-2 py-0.5">{c}</span>))}</div>) : null}
                        {m.persona && <div className="mt-1 text-[11px] text-gray-500">Persona: {m.persona}</div>}
                      </div>
                    )}
                  </div>
                ))}
                {typing && (<div className="flex justify-start"><div className="bg-gray-100 rounded-2xl px-4 py-2 text-sm">Thinking…</div></div>)}
              </div>
              <ChatInput onSend={handleSend} />
            </section>
          ) : (
            <section className="space-y-4">
              {/* Page-level Natural Language Search (non-sticky) */}
              <div className="bg-white rounded-2xl border shadow-sm p-4">
                <div className="font-medium mb-2">Search</div>
                <div className="flex gap-2">
                  <input value={filterPrompt} onChange={(e)=> setFilterPrompt(e.target.value)} placeholder="Describe what you want…" className="flex-1 rounded-2xl border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black/10" />
                  <button onClick={applyNaturalLanguage} className="rounded-2xl bg-black text-white px-3 py-2">Apply</button>
                  <button onClick={() => setFilterPrompt("")} className="rounded-2xl border px-3 py-2 bg-white hover:bg-gray-50">Clear</button>
                </div>
                {filterPrompt && (<div className="mt-2 text-[11px] text-gray-600">Parsed → {JSON.stringify(parsedFromPrompt)}</div>)}
              </div>

              {/* Filters card */}
              <div className="bg-white rounded-2xl border shadow-sm p-4">
                <div className="font-medium mb-2">Conversational Filters</div>
                {/* Inline NL filter inside the filters card */}
                <div className="flex gap-2 mb-2">
                  <input value={filterPrompt} onChange={(e)=> setFilterPrompt(e.target.value)} placeholder="e.g., red bags under 80 / 100元以内红色鞋子" className="flex-1 rounded-2xl border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black/10" />
                  <button onClick={applyNaturalLanguage} className="rounded-2xl bg-black text-white px-3 py-2">Apply</button>
                </div>
                <div className="mt-1"><SlotChips slots={mergedSlots} onRemove={(k) => setSlotsPrompt((s)=> ({...s, [k]: null}))} onQuickSet={(k,v)=> setSlotsPrompt((s)=> ({...s, [k]: v}))} /></div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <QuickSelect label="Category" value={slotsPrompt.category} onChange={(v)=> setSlotsPrompt((s)=>({...s, category:v}))} options={[{label:"All", value:null}, ...CATEGORIES.map((c)=>({label:c, value:c}))]} />
                  <QuickSelect label="Color" value={slotsPrompt.color} onChange={(v)=> setSlotsPrompt((s)=>({...s, color:v}))} options={[{label:"All", value:null}, ...COLORS.map((c)=>({label:c, value:c}))]} />
                  <QuickSelect label="Price ≤" value={slotsPrompt.priceMax} onChange={(v)=> setSlotsPrompt((s)=>({...s, priceMax:v}))} options={[{label:"Any", value:null},{label:"$25",value:25},{label:"$50",value:50},{label:"$100",value:100},{label:"$150",value:150}]} />
                  <button onClick={clearAllFilters} className="ml-auto rounded-xl border px-3 py-2 bg-white hover:bg-gray-50">Reset all</button>
                </div>
              </div>

              {/* Product grid */}
              <div id="grid" className="grid grid-cols-2 gap-3 pb-16">
                {filteredProducts.map((p) => (
                  <article key={p.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col">
                    <img src={p.image} alt={p.name} className="w-full h-36 object-cover" />
                    <div className="p-3 flex-1 flex flex-col">
                      <h3 className="font-medium leading-tight text-sm">{p.name}</h3>
                      <p className="text-xs text-gray-600">{p.category} · {p.color}</p>
                      <p className="text-xs mt-1 line-clamp-2">{p.description}</p>
                      <div className="mt-1 text-[11px] text-gray-600">Why this: {whyThis(p, mergedSlots, persona).join(", ") || "balanced choice"}</div>
                      <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                        <div className="font-semibold">{currency(p.price)}</div>
                        <div className="flex items-center gap-2">
                          <button className="rounded-xl border px-2 py-1 text-xs" onClick={() => alert("Compare flow TBD")}>+ Compare</button>
                          <IconButton label="Add to cart" active={justAddedId === p.id} onClick={() => addToCart(p)} />
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
                {filteredProducts.length === 0 && (<div className="col-span-full bg-white rounded-2xl border p-8 text-center text-gray-600">No products match these filters. Try adjusting your slots.</div>)}
              </div>

              </section>
          )}
        </main>

        {/* Floating Cart FAB */}
        <button aria-label="Open cart" onClick={() => setCartOpen(true)} className="absolute right-4 bottom-4 z-20 rounded-full shadow-xl border bg-white w-12 h-12 flex items-center justify-center">
          <CartIcon />
          {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">{cartCount}</span>}
        </button>

        {/* Toast */}
        {toast && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-20 z-30 bg-black text-white text-xs px-3 py-2 rounded-full shadow">
            {toast}
          </div>
        )}

        {/* Mini Cart Drawer */}
        {cartOpen && (
          <div className="absolute inset-0 z-40 pointer-events-none">
            <div className="absolute inset-0 bg-black/25 pointer-events-auto" onClick={() => setCartOpen(false)} />
            <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl border-t shadow-2xl p-4 pointer-events-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">Cart ({cartCount})</div>
                <button className="text-sm text-gray-600 underline" onClick={clearCart}>Clear</button>
              </div>
              <div className="max-h-60 overflow-auto divide-y">
                {cart.length === 0 && <div className="text-sm text-gray-500 py-6 text-center">Your cart is empty.</div>}
                {cart.map((it) => (
                  <div key={it.product.id} className="py-2 flex items-center gap-3">
                    <img src={it.product.image} alt={it.product.name} className="w-12 h-12 rounded object-cover border" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{it.product.name}</div>
                      <div className="text-xs text-gray-600">{currency(it.product.price)} · {it.product.color}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="rounded-full w-7 h-7 border" onClick={() => decFromCart(it.product.id)}>-</button>
                      <span className="w-6 text-center text-sm">{it.qty}</span>
                      <button className="rounded-full w-7 h-7 border" onClick={() => addToCart(it.product)}>+</button>
                    </div>
                    <button className="ml-2 text-xs text-gray-500 underline" onClick={() => removeFromCart(it.product.id)}>Remove</button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="font-semibold">Total: {currency(cartTotal)}</div>
                <button className="rounded-xl bg-black text-white px-4 py-2 text-sm" onClick={() => alert("Checkout flow TBD")}>Checkout</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Helpers & UI bits =====
export function currency(n: number) { return `$${n.toFixed(2)}`; }
export function makeClearedSlots(): Slots { return { category: null, color: null, priceMax: null }; }
export function applyFilters(products: Product[], slots: Slots) { return products.filter((p) => { if (slots.category && p.category !== slots.category) return false; if (slots.color && p.color !== slots.color) return false; if (slots.priceMax != null && p.price > slots.priceMax) return false; return true; }); }
export function whyThis(p: Product, slots: Slots, persona: string): string[] { const r:string[]=[]; if (slots.category && p.category===slots.category) r.push("matches category"); if (slots.color && p.color===slots.color) r.push("matches color"); if (slots.priceMax!=null && p.price<=slots.priceMax) r.push("within budget"); if (persona==="rational") r.push("value-focused"); if (persona==="friendly") r.push("popular pick"); if (!r.length) r.push("balanced choice"); return r; }
export function generateAssistantReply(text: string, persona: string, slots: Slots): ChatMsg { const matched = PRODUCTS.find((p)=>p.name.toLowerCase().includes(text.toLowerCase())) || PRODUCTS.find((p)=> (slots.category? p.category===slots.category: true) && (slots.color? p.color===slots.color: true)); if (matched) { return { role: "assistant", product: matched, text: `Here’s something you may like: ${matched.name}.`, persona }; } return { role: "assistant", text: toneLine(persona) + " Tell me your budget or preferred color.", persona }; }
export const PERSONAS = [{ id:"rational", label:"理性" },{ id:"friendly", label:"亲和" },{ id:"luxury", label:"奢华" }];
export function toneLine(persona: string) { switch(persona){ case "friendly": return "I’ve got your back—let’s find a great pick together!"; case "luxury": return "Curating refined pieces just for you."; default: return "Let’s optimize for quality and value."; } }
export function parseFilterPrompt(s: string): Slots { const lower=s.toLowerCase(); const color=COLORS.find((c)=>lower.includes(c.toLowerCase()))??null; const category=CATEGORIES.find((c)=>lower.includes(c.toLowerCase()))??null; let priceMax: number|null = null; const m = lower.match(/(?:under|<=|≤)\s*(\d+)/) || lower.match(/(\d+)\s*(?:元|rmb|usd|\$)/); if (m) priceMax = Number(m[1]); return { category, color, priceMax }; }

function PersonaSwitcher({ value, onChange }: { value: string; onChange: (v: string) => void }) { return (<div className="inline-flex gap-2">{PERSONAS.map((p)=>(<button key={p.id} onClick={()=>onChange(p.id)} className={cls("px-3 py-1.5 text-xs rounded-full border", value===p.id?"bg-black text-white":"bg-white")} title={p.label}>{p.label}</button>))}</div>); }
function SlotChips({ slots, onRemove, onQuickSet }: { slots: Slots; onRemove: (k: keyof Slots)=>void; onQuickSet: (k: keyof Slots, v:any)=>void }) { const chips:Array<{k:keyof Slots; label:string; v:any}>=[]; if(slots.category) chips.push({k:"category",label:`Category: ${slots.category}`,v:slots.category}); if(slots.color) chips.push({k:"color",label:`Color: ${slots.color}`,v:slots.color}); if(slots.priceMax!=null) chips.push({k:"priceMax",label:`≤ $${slots.priceMax}`,v:slots.priceMax}); return (<div className="flex flex-wrap gap-2">{!chips.length && <span className="text-xs text-gray-500">No active slots. Use the controls below.</span>}{chips.map((c,i)=>(<span key={i} className="text-xs bg-white border rounded-full pl-3 pr-1 py-1 flex items-center gap-2">{c.label}<button className="rounded-full w-5 h-5 border text-[11px]" onClick={()=>onRemove(c.k)}>×</button></span>))}</div>); }
function QuickSelect({ label, value, options, onChange }: { label:string; value:any; options:Array<{label:string; value:any}>; onChange:(v:any)=>void }) { return (<label className="text-xs flex items-center gap-2 border rounded-xl px-2 py-1 bg-white"><span className="text-gray-600">{label}</span><select className="text-xs outline-none" value={value===null?"__ANY__":String(value)} onChange={(e)=>{const v=e.target.value; onChange(v==="__ANY__"? null : (isNaN(Number(v))? v : Number(v)));}}>{options.map((opt,idx)=>(<option key={idx} value={opt.value===null?"__ANY__":String(opt.value)}>{opt.label}</option>))}</select></label>); }

function IconButton({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button aria-label={label} title={label} onClick={onClick}
      className={cls("relative w-9 h-9 rounded-full border flex items-center justify-center transition-transform", active ? "bg-black text-white scale-95" : "bg-white hover:scale-105")}
    >
      {active ? <CheckIcon /> : <CartIcon />}
    </button>
  );
}

function CartIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7.16 14h9.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 21 5H6.21l-.94-2H1v2h3l3.6 7.59-1.35 2.44A2 2 0 0 0 8 18h12v-2H8l1.16-2z"/></svg>); }
function CheckIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>); }

function ChatInput({ onSend }: { onSend: (t: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <div className="p-3 border-t bg-white flex items-center gap-2">
      <input value={val} onChange={(e)=>setVal(e.target.value)} onKeyDown={(e)=>{ if(e.key==="Enter"){ onSend(val); setVal(""); } }} placeholder="Type a message…" className="flex-1 rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"/>
      <button onClick={()=>{ onSend(val); setVal(""); }} className="rounded-xl bg-black text-white px-4 py-2 text-sm">Send</button>
    </div>
  );
}

// ===== Minimal inline tests =====
function runInlineTests() {
  // currency
  console.assert(currency(99.5) === "$99.50", "currency formats to 2 decimals");
  // parseFilterPrompt
  const parsed = parseFilterPrompt("red under 50 shoes");
  console.assert(parsed.color === "Red", "parse color from prompt");
  console.assert(parsed.category === "Shoes", "parse category from prompt");
  console.assert(parsed.priceMax === 50, "parse price from prompt");
  // applyFilters
  const onlyRed = applyFilters(PRODUCTS, { category: null, color: "Red", priceMax: null });
  console.assert(onlyRed.every((p) => p.color === "Red"), "filter by color works");
  // whyThis
  const reasons = whyThis(PRODUCTS[0], { category: "Beauty", color: "Red", priceMax: 30 }, "rational");
  console.assert(reasons.includes("matches color") && reasons.includes("within budget"), "whyThis includes matches");
  // mini cart add/increment/decrement
  let cart: { product: Product; qty: number }[] = []; const add=(p:Product)=>{const i=cart.findIndex((it)=>it.product.id===p.id); if(i>=0) cart[i]={...cart[i],qty:cart[i].qty+1}; else cart.push({product:p,qty:1});}; const dec=(pid:string)=>{const i=cart.findIndex((it)=>it.product.id===pid); if(i>=0){const n=cart[i].qty-1; if(n<=0) cart.splice(i,1); else cart[i].qty=n;}}; add(PRODUCTS[0]); add(PRODUCTS[0]); console.assert(cart.length===1 && cart[0].qty===2, "cart increments same product"); dec(PRODUCTS[0].id); console.assert(cart[0].qty===1, "cart decrements product");
  // clear/reset behavior
  const emptyParsed = parseFilterPrompt(""); console.assert(emptyParsed.category===null && emptyParsed.color===null && emptyParsed.priceMax===null, "parse empty prompt to nulls");
  const clearedSlots = makeClearedSlots(); console.assert(clearedSlots.category===null && clearedSlots.color===null && clearedSlots.priceMax===null, "makeClearedSlots returns nulls");
  console.assert(applyFilters(PRODUCTS, clearedSlots).length===PRODUCTS.length, "cleared slots should not filter any product");
  console.log("All inline tests passed ✅");
}
