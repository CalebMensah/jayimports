export default function ProductLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10 grid md:grid-cols-2 gap-6 md:gap-10 animate-pulse">
      <div className="aspect-square bg-navy-50 rounded" />
      <div className="space-y-3">
        <div className="h-6 bg-navy-50 rounded w-2/3" />
        <div className="h-5 bg-navy-50 rounded w-1/4" />
        <div className="h-3 bg-navy-50 rounded w-full mt-4" />
        <div className="h-3 bg-navy-50 rounded w-5/6" />
        <div className="h-10 bg-navy-50 rounded w-40 mt-6" />
      </div>
    </div>
  );
}