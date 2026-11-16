"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { SHIPPING_INFO } from "@/lib/constants";
import { OptionButton } from "@/components/storefront/OptionButton";
import { CombinationList, type CombinationRow } from "@/components/storefront/CombinationList";
import {
  HiOutlineCheck,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineMinus,
  HiOutlinePlus,
  HiOutlineShoppingBag,
} from "react-icons/hi";

type ProductImage = { image_url: string; sort_order: number };
type ProductColor = { id: string; color_name: string; image_url: string; sort_order: number };
type ProductSize = {
  id: string;
  size_value: string;
  sort_order: number;
  price?: number | null; // newer products: the size's own price
  price_adjustment?: number | null; // older products: an amount added to the base price
};
type UnavailableCombo = { color_id: string; size_id: string };

type Row = {
  key: string;
  colorId?: string;
  sizeId?: string;
  label: string;
  price: number;
  image: string | null;
};

// One combination in "Your selection"
type Entry = { key: string; colorId?: string; sizeId?: string; qty: number };

const bySort = (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order;
const keyOf = (colorId?: string, sizeId?: string) => `${colorId ?? "none"}::${sizeId ?? "none"}`;

function namesText(names: string[]) {
  if (names.length === 0) return null;
  if (names.length <= 2) return `: ${names.join(", ")}`;
  return ` · ${names.length} selected`;
}

export function ProductDetail({
  product,
}: {
  product: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    price: number;
    moq: number;
    preorder_fulfillment_note: string | null;
    product_images: ProductImage[];
    product_colors: ProductColor[];
    product_sizes: ProductSize[];
    unavailable_combos?: UnavailableCombo[];
  };
  productUrl?: string; // accepted so older pages that still pass it keep compiling
}) {
  const { items, addItems } = useCart();

  const moq = Math.max(1, Number(product.moq) || 1);
  const base = Number(product.price);

  const images = useMemo(() => [...product.product_images].sort(bySort), [product.product_images]);
  const colors = useMemo(() => [...product.product_colors].sort(bySort), [product.product_colors]);
  const sizes = useMemo(() => [...product.product_sizes].sort(bySort), [product.product_sizes]);
  const hasColors = colors.length > 0;
  const hasSizes = sizes.length > 0;
  const hasChoices = hasColors || hasSizes;
  // Both kinds of option: each color keeps its own sizes
  const twoDim = hasColors && hasSizes;

  const unavailable = useMemo(
    () => new Set((product.unavailable_combos ?? []).map((u) => `${u.color_id}::${u.size_id}`)),
    [product.unavailable_combos]
  );

  const sizePrices = useMemo(
    () =>
      new Map(
        sizes.map(
          (s) =>
            [s.id, s.price != null ? Number(s.price) : base + Number(s.price_adjustment ?? 0)] as const
        )
      ),
    [sizes, base]
  );

  // The starting pick: the first option of each specification (the first combination that can be ordered)
  const start = useMemo<{ colorId?: string; sizeId?: string } | null>(() => {
    if (twoDim) {
      for (const color of colors) {
        const size = sizes.find((s) => !unavailable.has(`${color.id}::${s.id}`));
        if (size) return { colorId: color.id, sizeId: size.id };
      }
      return null;
    }
    if (hasColors) return { colorId: colors[0].id };
    if (hasSizes) return { sizeId: sizes[0].id };
    return null;
  }, [twoDim, hasColors, hasSizes, colors, sizes, unavailable]);

  const [selection, setSelection] = useState<Entry[]>(() =>
    start ? [{ key: keyOf(start.colorId, start.sizeId), colorId: start.colorId, sizeId: start.sizeId, qty: moq }] : []
  );
  // The color whose sizes are showing (only used when there are both colors and sizes)
  const [activeColor, setActiveColor] = useState<string | null>(() => (twoDim ? start?.colorId ?? null : null));
  const [focusId, setFocusId] = useState<string | null>(() => (hasColors && !twoDim ? start?.colorId ?? null : null));
  const [plainQty, setPlainQty] = useState(moq);
  const [thumbIndex, setThumbIndex] = useState<number | null>(null);
  const [added, setAdded] = useState(false);
  const [addedCount, setAddedCount] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  function buildRow(colorId?: string, sizeId?: string): Row | null {
    const color = colorId ? colors.find((c) => c.id === colorId) ?? null : null;
    const size = sizeId ? sizes.find((s) => s.id === sizeId) ?? null : null;
    if (colorId && !color) return null;
    if (sizeId && !size) return null;
    if (color && size && unavailable.has(`${color.id}::${size.id}`)) return null;

    return {
      key: keyOf(color?.id, size?.id),
      colorId: color?.id,
      sizeId: size?.id,
      label: [color?.color_name, size?.size_value].filter(Boolean).join(" / "),
      price: size ? sizePrices.get(size.id) ?? base : base,
      image: color?.image_url ?? null,
    };
  }

  // ---- Everything in "Your selection" ----
  const selectionRows = selection.flatMap((entry) => {
    const row = buildRow(entry.colorId, entry.sizeId);
    return row ? [{ entry, row }] : [];
  });
  const lines = selectionRows.map(({ entry, row }) => ({ row, qty: Math.max(entry.qty, moq) }));

  const plainShown = Math.max(plainQty, moq);
  const unitCount = hasChoices ? lines.reduce((n, l) => n + l.qty, 0) : plainShown;
  const total = hasChoices ? lines.reduce((sum, l) => sum + l.row.price * l.qty, 0) : base * plainShown;

  // ---- What is highlighted ----
  const active = twoDim ? colors.find((c) => c.id === activeColor) ?? null : null;
  const chosenColorIds = new Set(selection.map((e) => e.colorId).filter((id): id is string => Boolean(id)));
  // Sizes chosen for the active color (or all chosen sizes when there are no colors)
  const chosenSizeIds = new Set(
    selection
      .filter((e) => (twoDim ? e.colorId === activeColor : true))
      .map((e) => e.sizeId)
      .filter((id): id is string => Boolean(id))
  );

  const colorSelectable = (color: ProductColor) =>
    !hasSizes || sizes.some((s) => !unavailable.has(`${color.id}::${s.id}`));
  const sizeSelectable = (size: ProductSize) =>
    !twoDim || (Boolean(activeColor) && !unavailable.has(`${activeColor}::${size.id}`));

  const noneAvailable =
    twoDim && colors.every((c) => sizes.every((s) => unavailable.has(`${c.id}::${s.id}`)));

  // ---- Price shown under the title ----
  const pricePool = !hasChoices
    ? [base]
    : lines.length > 0
      ? lines.map((l) => l.row.price)
      : hasSizes
        ? sizes.map((s) => sizePrices.get(s.id) ?? base)
        : [base];
  const minPrice = Math.min(...pricePool);
  const maxPrice = Math.max(...pricePool);
  const showFrom = hasSizes && lines.length === 0 && minPrice !== maxPrice;
  const priceText =
    lines.length > 0 && minPrice !== maxPrice
      ? `GH₵${minPrice.toFixed(2)} – GH₵${maxPrice.toFixed(2)}`
      : `GH₵${minPrice.toFixed(2)}`;

  // ---- Image ----
  const focusColor =
    active ??
    colors.find((c) => c.id === focusId && chosenColorIds.has(c.id)) ??
    colors.find((c) => chosenColorIds.has(c.id)) ??
    null;
  const displayedImage =
    thumbIndex !== null
      ? images[thumbIndex]?.image_url ?? null
      : focusColor?.image_url ?? images[0]?.image_url ?? colors[0]?.image_url ?? null;

  // ---- Button ----
  let blockedLabel: string | null = null;
  if (noneAvailable) blockedLabel = "Not available";
  else if (hasChoices && lines.length === 0) {
    if (twoDim) blockedLabel = active ? "Select Size" : "Select Color";
    else blockedLabel = hasColors ? "Select Color" : "Select Size";
  }
  const canAdd = blockedLabel === null;
  const buttonLabel = added ? "Added to cart" : blockedLabel ?? "Preorder now";

  const cartQtyFor = (variantId?: string) =>
    items.find((i) => i.productId === product.id && (i.variantId ?? "") === (variantId ?? ""))?.quantity ?? 0;

  const listRows: CombinationRow[] = selectionRows.map(({ entry, row }) => ({
    key: row.key,
    label: row.label,
    price: row.price,
    image: row.image,
    inCart: cartQtyFor(row.key),
    qty: Math.max(entry.qty, moq),
    min: moq,
  }));

  // ---- Headings ----
  const chosenColorNames = colors.filter((c) => chosenColorIds.has(c.id)).map((c) => c.color_name);
  const chosenSizeNames = sizes.filter((s) => chosenSizeIds.has(s.id)).map((s) => s.size_value);
  const required = <span className="text-red-500"> · required</span>;

  // ---- Actions ----
  function toggleEntry(colorId?: string, sizeId?: string) {
    const row = buildRow(colorId, sizeId);
    if (!row) return;
    setSelection((prev) =>
      prev.some((e) => e.key === row.key)
        ? prev.filter((e) => e.key !== row.key)
        : [...prev, { key: row.key, colorId: row.colorId, sizeId: row.sizeId, qty: moq }]
    );
  }

  function handleColor(color: ProductColor) {
    setAddedCount(0);
    setThumbIndex(null);

    // Only colors: tapping several colors adds each of them
    if (!hasSizes) {
      const wasChosen = chosenColorIds.has(color.id);
      toggleEntry(color.id, undefined);
      setFocusId(wasChosen ? null : color.id);
      return;
    }

    // Colors and sizes: tapping the active color again removes its combinations
    if (activeColor === color.id) {
      setSelection((prev) => prev.filter((e) => e.colorId !== color.id));
      return;
    }

    // Otherwise just switch to it. Nothing is added until a size is tapped.
    setActiveColor(color.id);
  }

  function handleSize(size: ProductSize) {
    setAddedCount(0);

    // Only sizes: tapping several sizes adds each of them
    if (!hasColors) {
      toggleEntry(undefined, size.id);
      return;
    }

    // Colors and sizes: the size is added for the active color only
    if (!activeColor) return;
    toggleEntry(activeColor, size.id);
  }

  function stepEntry(key: string, delta: 1 | -1) {
    setSelection((prev) =>
      prev.map((e) => (e.key === key ? { ...e, qty: Math.max(moq, Math.max(e.qty, moq) + delta) } : e))
    );
    setAddedCount(0);
  }

  function removeEntry(key: string) {
    setSelection((prev) => prev.filter((e) => e.key !== key));
    setAddedCount(0);
  }

  function stepPlain(delta: 1 | -1) {
    setPlainQty(Math.max(moq, plainShown + delta));
    setAddedCount(0);
  }

  function flashAdded(count: number) {
    setAdded(true);
    setAddedCount(count);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 2500);
  }

  function handleAddToCart() {
    if (!canAdd) return;

    if (hasChoices) {
      addItems(
        lines.map(({ row, qty }) => ({
          productId: product.id,
          slug: product.slug,
          variantId: row.key,
          colorId: row.colorId,
          sizeId: row.sizeId,
          name: product.name,
          variantLabel: row.label,
          price: row.price,
          image: row.image ?? displayedImage,
          quantity: qty,
          moq,
          isPreorder: true,
          maxStock: 9999,
        }))
      );
      // Everything that was just added is cleared, with no starting pick
      setSelection([]);
      setActiveColor(null);
      setFocusId(null);
      flashAdded(unitCount);
    } else {
      addItems([
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          price: base,
          image: displayedImage,
          quantity: plainShown,
          moq,
          isPreorder: true,
          maxStock: 9999,
        },
      ]);
      setPlainQty(moq);
      flashAdded(plainShown);
    }
  }

  const Icon = added ? HiOutlineCheck : HiOutlineShoppingBag;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10 grid md:grid-cols-2 gap-6 md:gap-10 pb-28 md:pb-10">
      <div>
        <div className="relative aspect-square bg-white border border-navy-100 mb-3">
          {displayedImage && (
            <Image
              src={displayedImage}
              alt={product.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          )}
        </div>
        {!hasColors && images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={img.image_url}
                onClick={() => setThumbIndex(i)}
                className={`relative w-14 h-14 shrink-0 border ${
                  displayedImage === img.image_url ? "border-navy-800" : "border-navy-100"
                }`}
              >
                <Image src={img.image_url} alt="" fill className="object-cover" sizes="56px" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <span className="inline-flex items-center gap-1 bg-turquoise-dark text-white text-xs px-2 py-1 rounded mb-3">
          <HiOutlineClock className="w-3.5 h-3.5" />
          Preorder{product.preorder_fulfillment_note ? ` — ${product.preorder_fulfillment_note}` : ""}
        </span>

        <h1 className="font-display text-2xl md:text-3xl text-navy-900">{product.name}</h1>
        <p className="text-lg md:text-xl text-navy-700 mt-2">
          {showFrom && <span className="text-xs text-navy-400 font-normal mr-1.5">from</span>}
          {priceText}
        </p>

        <p className="text-xs text-navy-400 mt-2 leading-relaxed">{SHIPPING_INFO.shortNote}</p>

        {moq > 1 && <p className="text-xs text-navy-400 mt-1">Minimum order: {moq}</p>}

        {product.description && (
          <p className="text-navy-600 mt-4 leading-relaxed text-sm md:text-base whitespace-pre-line">
            {product.description}
          </p>
        )}

        {hasChoices && (
          <div id="options" className="scroll-mt-24">
            {twoDim ? (
              <p className="mt-5 text-xs text-navy-400">
                Pick a color, then the sizes you want in it. Tap another color to add more. Tap a selected color
                again to remove it.
              </p>
            ) : (
              (colors.length > 1 || sizes.length > 1) && (
                <p className="mt-5 text-xs text-navy-400">Tap more than one option to order several at once.</p>
              )
            )}

            {hasColors && (
              <div className="mt-4">
                <p className="text-sm text-navy-700 mb-2">
                  Color
                  {twoDim ? (
                    <>
                      {active ? `: ${active.color_name}` : lines.length === 0 ? required : null}
                      {chosenColorIds.size > 1 && (
                        <span className="text-navy-400"> · {chosenColorIds.size} colors in your selection</span>
                      )}
                    </>
                  ) : (
                    (namesText(chosenColorNames) ?? (lines.length === 0 ? required : null))
                  )}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((color) => {
                    const chosen = chosenColorIds.has(color.id);
                    const selectable = colorSelectable(color);
                    return (
                      <OptionButton
                        key={color.id}
                        name={color.color_name}
                        imageUrl={color.image_url}
                        chosen={chosen}
                        active={twoDim && activeColor === color.id}
                        disabled={!selectable && !chosen}
                        title={selectable || chosen ? color.color_name : "Not available in any size"}
                        onClick={() => handleColor(color)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {hasSizes && (
              <div className="mt-4">
                <p className="text-sm text-navy-700 mb-2">
                  Size
                  {twoDim ? (
                    <>
                      {active ? ` for ${active.color_name}` : ""}
                      {!active ? (
                        <span className="text-navy-400"> · choose a color first</span>
                      ) : chosenSizeNames.length > 0 ? (
                        namesText(chosenSizeNames)
                      ) : lines.length === 0 ? (
                        required
                      ) : (
                        <span className="text-navy-400"> · tap a size to add {active.color_name}</span>
                      )}
                    </>
                  ) : (
                    (namesText(chosenSizeNames) ?? (lines.length === 0 ? required : null))
                  )}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {sizes.map((size) => {
                    const chosen = chosenSizeIds.has(size.id);
                    const selectable = sizeSelectable(size);
                    return (
                      <OptionButton
                        key={size.id}
                        name={size.size_value}
                        chosen={chosen}
                        disabled={!selectable && !chosen}
                        title={
                          selectable || chosen
                            ? size.size_value
                            : active
                              ? `Not available in ${active.color_name}`
                              : "Choose a color first"
                        }
                        onClick={() => handleSize(size)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {listRows.length > 0 && (
              <div className="mt-5">
                <p className="text-sm text-navy-700">Your selection</p>
                <p className="text-xs text-navy-400 mb-2">
                  Not in your cart yet. Press the button below when you&apos;re done.
                </p>
                <CombinationList rows={listRows} onStep={stepEntry} onRemove={removeEntry} />
              </div>
            )}
          </div>
        )}

        {!hasChoices && (
          <div className="mt-5 flex items-center gap-3">
            <p className="text-sm text-navy-700">Quantity</p>
            <div className="flex items-center border border-navy-100 rounded">
              <button
                onClick={() => stepPlain(-1)}
                disabled={plainShown <= moq}
                className="px-3 py-1.5 text-navy-600 disabled:opacity-30"
                aria-label="Decrease quantity"
              >
                <HiOutlineMinus className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm">{plainShown}</span>
              <button
                onClick={() => stepPlain(1)}
                className="px-3 py-1.5 text-navy-600"
                aria-label="Increase quantity"
              >
                <HiOutlinePlus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {canAdd && (
          <p className="mt-5 text-sm text-navy-600">
            Total ({unitCount} item{unitCount === 1 ? "" : "s"}):{" "}
            <span className="font-medium text-navy-900">GH₵{total.toFixed(2)}</span>
          </p>
        )}

        <button
          onClick={handleAddToCart}
          disabled={!canAdd && !added}
          className="hidden md:flex mt-4 items-center justify-center gap-2 bg-navy-800 text-white px-8 py-3 rounded text-sm font-medium hover:bg-navy-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Icon className="w-4 h-4" />
          {buttonLabel}
        </button>

        {addedCount > 0 && (
          <p className="mt-3 flex flex-wrap items-center gap-1.5 text-sm text-emerald-700">
            <HiOutlineCheckCircle className="w-4 h-4" />
            {addedCount} item{addedCount === 1 ? "" : "s"} added to your cart.
            <Link href="/cart" className="underline">View cart</Link>
          </p>
        )}
      </div>

      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-navy-100 p-4 z-40">
        <button
          onClick={handleAddToCart}
          disabled={!canAdd && !added}
          className="w-full flex items-center justify-center gap-2 bg-navy-800 text-white py-3 rounded text-sm font-medium disabled:opacity-40"
        >
          <Icon className="w-4 h-4" />
          {canAdd && !added ? `${buttonLabel} · GH₵${total.toFixed(2)}` : buttonLabel}
        </button>
      </div>
    </div>
  );
}
