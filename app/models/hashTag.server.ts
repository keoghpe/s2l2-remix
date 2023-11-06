import type { HashTag } from "@prisma/client";

import { prisma } from "~/db.server";

export type { HashTag } from "@prisma/client";

export function getTags({
  spotifyUserId,
  spotifyAlbumId
}: Pick<HashTag, "spotifyUserId" | "spotifyAlbumId">) {
  return prisma.hashTag.findMany({
    select: { id: true, tag: true, },
    where: { spotifyAlbumId, spotifyUserId},
  });
}

// export function getNoteListItems({ userId }: { userId: User["id"] }) {
//   return prisma.note.findMany({
//     where: { userId },
//     select: { id: true, title: true },
//     orderBy: { updatedAt: "desc" },
//   });
// }

export async function updateTags({
  body,
  spotifyUserId,
  spotifyAlbumId
}: Pick<HashTag, "spotifyUserId" | "spotifyAlbumId"> & {body: string}) {

  let tags = Array.from(new Set(body.match(/#[\w-_]+/g)));

  await prisma.hashTag.deleteMany({
    where: {spotifyUserId,spotifyAlbumId,}
  })

  let data = tags.map((tag) => ({
    tag,
    spotifyAlbumId,
    spotifyUserId
  }))

  return prisma.hashTag.createMany({
    data
  });
}
