/*
  Warnings:

  - You are about to drop the column `difficulty` on the `Problem` table. All the data in the column will be lost.
  - Added the required column `language` to the `Problem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level` to the `Problem` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Problem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "constraints" TEXT NOT NULL,
    "testCases" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Problem" ("constraints", "createdAt", "description", "id", "testCases", "title") SELECT "constraints", "createdAt", "description", "id", "testCases", "title" FROM "Problem";
DROP TABLE "Problem";
ALTER TABLE "new_Problem" RENAME TO "Problem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
