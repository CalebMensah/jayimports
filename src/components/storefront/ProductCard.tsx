import Link from "next/link";
import Image from "next/image";
import { HiOutlineClock } from "react-icons/hi";

type Product = {
  slug: string;
  name: string;
  price: number;
  product_images: { image_url: string; sort_order: number }[];
  product_colors?: { image_url: string; sort_order: number }[];
};

export function ProductCard({ product }: { product: Product }) {
  const productImage = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order)[0];

  const fallbackColorImage = !productImage
    ? [...(product.product_colors ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]
    : undefined;

  const displayImage = productImage?.image_url ?? fallbackColorImage?.image_url;

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-square bg-white border border-navy-100 overflow-hidden">
        {displayImage ? (
          <Image
            src={displayImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full bg-navy-50" />
        )}
        <span className="absolute top-2 left-2 bg-turquoise-dark text-white text-[11px] px-2 py-1 rounded flex items-center gap-1">
          <HiOutlineClock className="w-3.5 h-3.5" />
          Preorder
        </span>
      </div>
      <div className="mt-2">
        <p className="text-sm text-navy-900 leading-snug">{product.name}</p>
        <p className="text-sm text-navy-500 mt-0.5">GH₵{product.price}</p>
      </div>
    </Link>
  );
}
