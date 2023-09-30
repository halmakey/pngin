import { User } from "@/types/model";
import Avatar from "../Avatar";
import Link from "next/link";

export default function UserCard({ user }: { user?: User }) {
  const avatarUrl = user?.avatarUrl;
  const userName = user?.name;
  const isDiscord = !!user?.discord;
  const memberNick = (user?.discord && user?.discord.guildMemberNick) || "";
  const discordName = user?.discord
    ? user.discord.userName + "#" + user.discord.discriminator
    : "";

  return (
    <div className="flex min-h-[66px] items-center gap-2 border border-gray-400 p-2 pr-3">
      {user && (
        <>
          <Avatar src={avatarUrl} />
          <div className="flex flex-col gap-1">
            {isDiscord ? (
              <>
                <b>{memberNick}</b>
                <Link
                  href={`https://discordapp.com/users/${user.discord!.id}`}
                  target="_blank"
                >
                  {discordName}
                </Link>
              </>
            ) : (
              userName
            )}
          </div>
        </>
      )}
    </div>
  );
}
