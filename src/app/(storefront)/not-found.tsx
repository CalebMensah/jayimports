import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <p className="font-display text-4xl text-navy-900 mb-3">Not found</p>
      <p className="text-navy-500 mb-6">
        That page doesn&apos;t exist — it may have been moved, or the product is no longer available.
      </p>
      <Link href="/shop" className="text-ocean hover:underline text-sm">Back to shop</Link>
    </div>
  );
}