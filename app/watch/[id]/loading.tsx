export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      <div className="space-y-2">
        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-1/4"></div>
      </div>
    </div>
  )
}
