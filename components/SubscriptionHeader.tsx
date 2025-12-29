import Image from "next/image"

interface SubscriptionHeaderProps {
  subscription: {
    id: number
    channelId: string
    name: string
    thumbnail: string | null
  }
  videoCount?: number
}

export function SubscriptionHeader({ subscription, videoCount }: SubscriptionHeaderProps) {
  return (
    <div className="flex items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
      {subscription.thumbnail && (
        <Image
          src={subscription.thumbnail}
          alt={subscription.name}
          width={80}
          height={80}
          className="rounded-full"
        />
      )}
      <div className="flex-1">
        <h1 className="text-2xl font-bold">{subscription.name}</h1>
        {videoCount !== undefined && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {videoCount} video{videoCount !== 1 ? "s" : ""} cached
          </p>
        )}
      </div>
    </div>
  )
}
