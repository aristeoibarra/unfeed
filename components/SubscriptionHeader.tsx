interface SubscriptionHeaderProps {
  subscription: {
    id: number
    channelId: string
    name: string
    thumbnail: string | null
  }
}

export function SubscriptionHeader({ subscription }: SubscriptionHeaderProps) {
  return (
    <div className="flex items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
      {subscription.thumbnail && (
        <img
          src={subscription.thumbnail}
          alt={subscription.name}
          className="w-20 h-20 rounded-full"
        />
      )}
      <div className="flex-1">
        <h1 className="text-2xl font-bold">{subscription.name}</h1>
      </div>
    </div>
  )
}
