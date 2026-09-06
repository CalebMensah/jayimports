export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 bg-navy-50 rounded w-40 mb-2" />
      <div className="h-4 bg-navy-50 rounded w-64 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-navy-100 rounded p-5 h-24" />
        ))}
      </div>
    </div>
  );
}