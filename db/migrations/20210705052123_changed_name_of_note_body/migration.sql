/*
  Warnings:

  - You are about to drop the column `notes` on the `Notes` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Notes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "noteName" TEXT NOT NULL,
    "noteBody" TEXT
);
INSERT INTO "new_Notes" ("id", "noteName") SELECT "id", "noteName" FROM "Notes";
DROP TABLE "Notes";
ALTER TABLE "new_Notes" RENAME TO "Notes";
CREATE UNIQUE INDEX "Notes.noteName_unique" ON "Notes"("noteName");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
