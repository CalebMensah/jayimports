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

// One combination the buyer has deliberately added to "Your selection"
type Entry = { key: string; colorId?: string; sizeId?: string; qty: number };

const bySort = (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order;

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
  // Both kinds of option: the buyer builds one combination at a time
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

  // What the buyer has deliberately added so far
  const [selection, setSelection] = useState<Entry[]>([]);
  // The color and size being picked right now (only used when there are both)
  const [pickColor, setPickColor] = useState<string | null>(null);
  const [pickSize, setPickSize] = useState<string | null>(null);
  const [pendingQty, setPendingQty] = useState(moq);
  const [plainQty, setPlainQty] = useState(moq);
  const [thumbIndex, setThumbIndex] = useState<number | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
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
      key: `${color?.id ?? "none"}::${size?.id ?? "none"}`,
      colorId: color?.id,
      sizeId: size?.id,
      label: [color?.color_name, size?.size_value].filter(Boolean).join(" / "),
      price: size ? sizePrices.get(size.id) ?? base : base,
      image: color?.image_url ?? null,
    };
  }

  // ---- What is in "Your selection" ----
  const selectionRows = selection.flatMap((entry) => {
    const row = buildRow(entry.colorId, entry.sizeId);
    return row ? [{ entry, row }] : [];
  });

  // ---- The combination being picked right now (not added yet) ----
  const pendingRow = twoDim && pickColor && pickSize ? buildRow(pickColor, pickSize) : null;
  const pendingInList = pendingRow ? selection.some((e) => e.key === pendingRow.key) : false;
  const pendingNew = pendingRow && !pendingInList ? pendingRow : null;
  const pendingShown = Math.max(pendingQty, moq);

  // ---- Everything that "Add to cart" will put in the cart ----
  const lines: { row: Row; qty: number }[] = selectionRows.map(({ entry, row }) => ({
    row,
    qty: Math.max(entry.qty, moq),
  }));
  if (pendingNew) lines.push({ row: pendingNew, qty: pendingShown });

  const plainShown = Math.max(plainQty, moq);
  const unitCount = hasChoices ? lines.reduce((n, l) => n + l.qty, 0) : plainShown;
  const total = hasChoices ? lines.reduce((sum, l) => sum + l.row.price * l.qty, 0) : base * plainShown;

  // ---- Which options can be picked ----
  const colorSelectable = (color: ProductColor) =>
    !hasSizes || sizes.some((s) => !unavailable.has(`${color.id}::${s.id}`));
  const sizeSelectable = (size: ProductSize) =>
    !hasColors || colors.some((c) => !unavailable.has(`${c.id}::${size.id}`));

  const noneAvailable =
    twoDim && colors.every((c) => sizes.every((s) => unavailable.has(`${c.id}::${s.id}`)));

  // ---- Price shown under the title ----
  const pricePool = !hasChoices
    ? [base]
    : lines.length > 0
      ? lines.map((l) => l.row.price)
      : hasSizes
        ? pickSize
          ? [sizePrices.get(pickSize) ?? base]
          : sizes.map((s) => sizePrices.get(s.id) ?? base)
        : [base];
  const minPrice = Math.min(...pricePool);
  const maxPrice = Math.max(...pricePool);
  const showFrom = hasSizes && lines.length === 0 && !pickSize && minPrice !== maxPrice;
  const priceText =
    lines.length > 0 && minPrice !== maxPrice
      ? `GH₵${minPrice.toFixed(2)} – GH₵${maxPrice.toFixed(2)}`
      : `GH₵${minPrice.toFixed(2)}`;

  // ---- Image ----
  const focusColor = focusId ? colors.find((c) => c.id === focusId) ?? null : null;
  const displayedImage =
    thumbIndex !== null
      ? images[thumbIndex]?.image_url ?? null
      : focusColor?.image_url ?? images[0]?.image_url ?? colors[0]?.image_url ?? null;

  // ---- Button ----
  let blockedLabel: string | null = null;
  if (noneAvailable) blockedLabel = "Not available";
  else if (hasChoices && lines.length === 0) {
    if (twoDim) blockedLabel = !pickColor ? "Select Color" : !pickSize ? "Select Size" : "Not available";
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

  // ---- Heading text for each group of options ----
  const chosenColorIds = twoDim
    ? pickColor
      ? [pickColor]
      : []
    : selection.map((e) => e.colorId).filter((id): id is string => Boolean(id));
  const chosenSizeIds = twoDim
    ? pickSize
      ? [pickSize]
      : []
    : selection.map((e) => e.sizeId).filter((id): id is string => Boolean(id));
  const chosenColorNames = colors.filter((c) => chosenColorIds.includes(c.id)).map((c) => c.color_name);
  const chosenSizeNames = sizes.filter((s) => chosenSizeIds.includes(s.id)).map((s) => s.size_value);
  const nothingChosen = lines.length === 0 && !pickColor && !pickSize;

  function headingSuffix(names: string[]) {
    if (names.length === 0) return nothingChosen ? <span className="text-red-500"> · required</span> : null;
    if (names.length <= 2) return `: ${names.join(", ")}`;
    return ` · ${names.length} selected`;
  }

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
    setNote(null);
    setAddedCount(0);
    setThumbIndex(null);

    // Only colors: tapping several colors adds each of them
    if (!hasSizes) {
      const wasChosen = selection.some((e) => e.colorId === color.id);
      toggleEntry(color.id, undefined);
      setFocusId(wasChosen ? null : color.id);
      return;
    }

    if (pickColor === color.id) {
      setPickColor(null);
      setFocusId(null);
      setPendingQty(moq);
      return;
    }

    setPickColor(color.id);
    setFocusId(color.id);
    setPendingQty(moq);
    if (pickSize && unavailable.has(`${color.id}::${pickSize}`)) {
      const size = sizes.find((s) => s.id === pickSize);
      setPickSize(null);
      setNote(`${size?.size_value ?? "That size"} isn't available in ${color.color_name}. Please choose another size.`);
    }
  }

  function handleSize(size: ProductSize) {
    setNote(null);
    setAddedCount(0);

    // Only sizes: tapping several sizes adds each of them
    if (!hasColors) {
      toggleEntry(undefined, size.id);
      return;
    }

    if (pickSize === size.id) {
      setPickSize(null);
      setPendingQty(moq);
      return;
    }

    setPickSize(size.id);
    setPendingQty(moq);
    if (pickColor && unavailable.has(`${pickColor}::${size.id}`)) {
      const color = colors.find((c) => c.id === pickColor);
      setPickColor(null);
      setFocusId(null);
      setNote(`${size.size_value} isn't available in ${color?.color_name ?? "that color"}. Please choose another color.`);
    }
  }

  // Keeps the picked combination in "Your selection" and clears the pickers, so nothing gets paired for the buyer
  function addPending() {
    if (!pendingNew) return;
    setSelection((prev) => [
      ...prev,
      { key: pendingNew.key, colorId: pendingNew.colorId, sizeId: pendingNew.sizeId, qty: pendingShown },
    ]);
    setPickColor(null);
    setPickSize(null);
    setPendingQty(moq);
    setNote(null);
    setAddedCount(0);
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
      // Everything that was just added is cleared
      setSelection([]);
      setPickColor(null);
      setPickSize(null);
      setPendingQty(moq);
      setFocusId(null);
      setNote(null);
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
  const pickedColorName = colors.find((c) => c.id === pickColor)?.color_name;
  const pickedSizeName = sizes.find((s) => s.id === pickSize)?.size_value;

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
                Choose a color and a size. To order more than one combination, tap &ldquo;Add &amp; pick
                another&rdquo; after each one.
              </p>
            ) : (
              (colors.length > 1 || sizes.length > 1) && (
                <p className="mt-5 text-xs text-navy-400">Tap more than one option to order several at once.</p>
              )
            )}

            {hasColors && (
              <div className="mt-4">
                <p className="text-sm text-navy-700 mb-2">Color{headingSuffix(chosenColorNames)}</p>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((color) => {
                    const chosen = chosenColorIds.includes(color.id);
                    const selectable = colorSelectable(color);
                    return (
                      <OptionButton
                        key={color.id}
                        name={color.color_name}
                        imageUrl={color.image_url}
                        chosen={chosen}
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
                <p className="text-sm text-navy-700 mb-2">Size{headingSuffix(chosenSizeNames)}</p>
                <div className="flex gap-2 flex-wrap">
                  {sizes.map((size) => {
                    const chosen = chosenSizeIds.includes(size.id);
                    const selectable = sizeSelectable(size);
                    return (
                      <OptionButton
                        key={size.id}
                        name={size.size_value}
                        chosen={chosen}
                        disabled={!selectable && !chosen}
                        title={selectable || chosen ? size.size_value : "Not available in any color"}
                        onClick={() => handleSize(size)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {note && <p className="mt-3 text-xs text-amber-700">{note}</p>}

            {twoDim && pickColor && !pickSize && (
              <p className="mt-3 text-xs text-navy-500">Now choose a size for {pickedColorName}.</p>
            )}
            {twoDim && pickSize && !pickColor && (
              <p className="mt-3 text-xs text-navy-500">Now choose a color for size {pickedSizeName}.</p>
            )}

            {/* The combination being picked: not added to the selection until the buyer says so */}
            {twoDim && pendingRow && pendingInList && (
              <p className="mt-3 rounded bg-navy-50 px-3 py-2 text-xs text-navy-600">
                {pendingRow.label} is already in your selection. Change its quantity below, or pick a different
                option.
              </p>
            )}

            {twoDim && pendingNew && (
              <div className="mt-4 rounded border border-navy-200 bg-white p-3">
                <div className="flex items-center gap-3">
                  {pendingNew.image && (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-navy-50">
                      <Image src={pendingNew.image} alt="" fill className="object-cover" sizes="40px" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-navy-800 break-words">{pendingNew.label}</p>
                    <p className="text-xs text-navy-400">
                      GH₵{pendingNew.price.toFixed(2)}
                      {cartQtyFor(pendingNew.key) > 0 ? ` · ${cartQtyFor(pendingNew.key)} already in cart` : ""}
                    </p>
                  </div>
                  <div className="inline-flex shrink-0 items-center rounded-full border border-navy-100">
                    <button
                      type="button"
                      onClick={() => setPendingQty(Math.max(moq, pendingShown - 1))}
                      disabled={pendingShown <= moq}
                      className="px-2.5 py-1.5 text-navy-600 disabled:opacity-30"
                      aria-label="Decrease quantity"
                    >
                      <HiOutlineMinus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-[1.5rem] text-center text-sm tabular-nums">{pendingShown}</span>
                    <button
                      type="button"
                      onClick={() => setPendingQty(pendingShown + 1)}
                      className="px-2.5 py-1.5 text-navy-600"
                      aria-label="Increase quantity"
                    >
                      <HiOutlinePlus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addPending}
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded border border-navy-800 px-4 py-2 text-sm font-medium text-navy-800 hover:bg-navy-50 transition"
                >
                  <HiOutlinePlus className="h-4 w-4" /> Add &amp; pick another
                </button>
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
