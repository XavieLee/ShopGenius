import React from 'react';
import { Product, Slots, CATEGORIES, COLORS } from '../../types';
import { parseFilterPrompt } from '../../utils';
import { SlotChips, QuickSelect, IconButton } from '../ui';

interface ShopPageProps {
  products: Product[];
  productsLoading: boolean;
  filterPrompt: string;
  slotsPrompt: Slots;
  loading: boolean;
  justAddedId: string | null;
  onFilterPromptChange: (value: string) => void;
  onSlotsPromptChange: (slots: Slots) => void;
  onSmartSearch: () => void;
  onClearFilters: () => void;
  onAddToCart: (product: Product) => void;
}

export function ShopPage({
  products,
  productsLoading,
  filterPrompt,
  slotsPrompt,
  loading,
  justAddedId,
  onFilterPromptChange,
  onSlotsPromptChange,
  onSmartSearch,
  onClearFilters,
  onAddToCart
}: ShopPageProps) {
  const parsedFromPrompt = parseFilterPrompt(filterPrompt);
  const mergedSlots: Slots = {
    category: slotsPrompt.category ?? parsedFromPrompt.category ?? null,
    color: slotsPrompt.color ?? parsedFromPrompt.color ?? null,
    priceMax: slotsPrompt.priceMax ?? parsedFromPrompt.priceMax ?? null,
  };

  return (
    <section className="space-y-4">
      {/* 智能搜索 */}
      <div className="bg-white rounded-2xl border shadow-sm p-4">
        <div className="font-medium mb-2">Smart Search</div>
        <div className="flex gap-2">
          <input 
            value={filterPrompt} 
            onChange={(e) => onFilterPromptChange(e.target.value)} 
            placeholder="Describe what you want…" 
            className="flex-1 rounded-2xl border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black/10" 
          />
          <button 
            onClick={onSmartSearch} 
            disabled={loading}
            className="rounded-2xl bg-black text-white px-3 py-2 disabled:opacity-50"
          >
            {loading ? '...' : 'Search'}
          </button>
          <button 
            onClick={() => {
              onFilterPromptChange("");
              // 清除搜索内容后重新加载产品
              onSmartSearch();
            }} 
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
            onRemove={(k) => onSlotsPromptChange({...slotsPrompt, [k]: null})} 
            onQuickSet={(k,v) => onSlotsPromptChange({...slotsPrompt, [k]: v})} 
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <QuickSelect 
            label="Category" 
            value={slotsPrompt.category} 
            onChange={(v) => onSlotsPromptChange({...slotsPrompt, category: v})} 
            options={[
              {label:"All", value:null}, 
              ...CATEGORIES.map((c) => ({label:c, value:c}))
            ]} 
          />
          <QuickSelect 
            label="Color" 
            value={slotsPrompt.color} 
            onChange={(v) => onSlotsPromptChange({...slotsPrompt, color: v})} 
            options={[
              {label:"All", value:null}, 
              ...COLORS.map((c) => ({label:c, value:c}))
            ]} 
          />
          <QuickSelect 
            label="Price ≤" 
            value={slotsPrompt.priceMax} 
            onChange={(v) => onSlotsPromptChange({...slotsPrompt, priceMax: v})} 
            options={[
              {label:"Any", value:null},
              {label:"$25", value:25},
              {label:"$50", value:50},
              {label:"$100", value:100},
              {label:"$150", value:150}
            ]} 
          />
          <button 
            onClick={onClearFilters} 
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
                  <div className="font-semibold">{p.price}</div>
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
                      onClick={() => onAddToCart(p)} 
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
  );
}
