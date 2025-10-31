// components/LoadingSkeleton.tsx

export default function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="p-5 border border-gray-200 rounded-lg animate-pulse bg-white"
        >
          {/* Title skeleton */}
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
          
          {/* Brand names skeleton */}
          <div className="flex gap-2 mb-3">
            <div className="h-6 bg-gray-200 rounded w-16"></div>
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-6 bg-gray-200 rounded w-24"></div>
          </div>
          
          {/* Drug class skeleton */}
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          
          {/* ATC code skeleton */}
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );
}