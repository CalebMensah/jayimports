export default function StorefrontLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-square bg-navy-50 rounded" />
            <div className="h-3 bg-navy-50 rounded mt-2 w-3/4" />
            <div className="h-3 bg-navy-50 rounded mt-1.5 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}