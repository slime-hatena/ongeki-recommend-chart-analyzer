-- CreateTable
CREATE TABLE "Music" (
    "key" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "level" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Music_id_difficulty_key" ON "Music"("id", "difficulty");
