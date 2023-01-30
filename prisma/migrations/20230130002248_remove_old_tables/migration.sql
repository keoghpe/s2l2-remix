/*
  Warnings:

  - You are about to drop the column `title` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the `Password` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[spotifyUserId,spotifyAlbumId]` on the table `Note` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `rating` to the `Note` table without a default value. This is not possible if the table is not empty.
  - Added the required column `spotifyAlbumId` to the `Note` table without a default value. This is not possible if the table is not empty.
  - Added the required column `spotifyUserId` to the `Note` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_userId_fkey";

-- DropForeignKey
ALTER TABLE "Password" DROP CONSTRAINT "Password_userId_fkey";

-- AlterTable
ALTER TABLE "Note" DROP COLUMN "title",
DROP COLUMN "userId",
ADD COLUMN     "rating" INTEGER NOT NULL,
ADD COLUMN     "spotifyAlbumId" TEXT NOT NULL,
ADD COLUMN     "spotifyUserId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Password";

-- DropTable
DROP TABLE "User";

-- CreateIndex
CREATE UNIQUE INDEX "Note_spotifyUserId_spotifyAlbumId_key" ON "Note"("spotifyUserId", "spotifyAlbumId");
