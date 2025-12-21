interface ChannelHeaderProps {
  channel: {
    id: number;
    channelId: string;
    name: string;
    thumbnail: string | null;
  };
}

export function ChannelHeader({ channel }: ChannelHeaderProps) {
  return (
    <div className="flex items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
      {channel.thumbnail && (
        <img
          src={channel.thumbnail}
          alt={channel.name}
          className="w-20 h-20 rounded-full"
        />
      )}
      <div className="flex-1">
        <h1 className="text-2xl font-bold">{channel.name}</h1>
      </div>
    </div>
  );
}
