/*
  Warnings:

  - Added the required column `difficulty` to the `UserOldRating` table without a default value. This is not possible if the table is not empty.
  - Added the required column `difficulty` to the `UserNewRating` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserOldRating" (
    "key" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "songId" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL
);
INSERT INTO "new_UserOldRating" ("key", "rank", "rating", "score", "songId", "userId") SELECT "key", "rank", "rating", "score", "songId", "userId" FROM "UserOldRating";
DROP TABLE "UserOldRating";
ALTER TABLE "new_UserOldRating" RENAME TO "UserOldRating";
CREATE UNIQUE INDEX "UserOldRating_userId_rank_key" ON "UserOldRating"("userId", "rank");
CREATE TABLE "new_UserNewRating" (
    "key" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "songId" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL
);
INSERT INTO "new_UserNewRating" ("key", "rank", "rating", "score", "songId", "userId") SELECT "key", "rank", "rating", "score", "songId", "userId" FROM "UserNewRating";
DROP TABLE "UserNewRating";
ALTER TABLE "new_UserNewRating" RENAME TO "UserNewRating";
CREATE UNIQUE INDEX "UserNewRating_userId_rank_key" ON "UserNewRating"("userId", "rank");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
