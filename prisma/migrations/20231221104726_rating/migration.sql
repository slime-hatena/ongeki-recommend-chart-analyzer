-- CreateTable
CREATE TABLE "UserNewRating" (
    "key" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "songId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "UserOldRating" (
    "key" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "songId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "UserNewRating_userId_rank_key" ON "UserNewRating"("userId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "UserOldRating_userId_rank_key" ON "UserOldRating"("userId", "rank");
