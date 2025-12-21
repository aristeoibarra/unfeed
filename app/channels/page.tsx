import { getChannels } from "@/actions/channels"
import { AddChannel } from "@/components/AddChannel"
import { ChannelList } from "@/components/ChannelList"

export default async function ChannelsPage() {
  const channels = await getChannels()

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Channels</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your subscribed channels
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold">Add Channel</h2>
        <AddChannel />
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold">Your Channels ({channels.length})</h2>
        <ChannelList channels={channels} />
      </div>
    </div>
  )
}
