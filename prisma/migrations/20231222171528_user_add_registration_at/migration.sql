/*
  Warnings:

  - Added the required column `registrationAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "updateAt" DATETIME NOT NULL,
    "registrationAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("id", "name", "rating", "updateAt") SELECT "id", "name", "rating", "updateAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
