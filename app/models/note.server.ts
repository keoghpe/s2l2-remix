import type { Note } from "@prisma/client";

import { prisma } from "~/db.server";

export type { Note } from "@prisma/client";

export function getNote({
  spotifyUserId,
  spotifyAlbumId
}: Pick<Note, "spotifyUserId" | "spotifyAlbumId">) {
  return prisma.note.findFirst({
    select: { id: true, body: true, rating: true },
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

export function upsertNote({
  body,
  rating,
  spotifyUserId,
  spotifyAlbumId
}: Pick<Note, "body" | "rating" | "spotifyUserId" | "spotifyAlbumId">) {
  return prisma.note.upsert({
    where: {
      spotifyUserId_spotifyAlbumId: {spotifyUserId,spotifyAlbumId,}
    },
    update: {
      rating,
      body,
    },
    create: {
      spotifyUserId,
      spotifyAlbumId,
      rating,
      body,
    },
  });
}

// export function deleteNote({
//   id,
//   userId,
// }: Pick<Note, "id"> & { userId: User["id"] }) {
//   return prisma.note.deleteMany({
//     where: { id, userId },
//   });
// }
