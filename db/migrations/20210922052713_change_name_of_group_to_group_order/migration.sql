/*
  Warnings:

  - You are about to drop the column `group` on the `Notes` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Notes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "noteName" TEXT NOT NULL,
    "noteBody" TEXT,
    "itemOrder" INTEGER,
    "groupOrder" INTEGER
);
INSERT INTO "new_Notes" ("id", "itemOrder", "noteBody", "noteName") SELECT "id", "itemOrder", "noteBody", "noteName" FROM "Notes";
DROP TABLE "Notes";
ALTER TABLE "new_Notes" RENAME TO "Notes";
CREATE UNIQUE INDEX "Notes.noteName_unique" ON "Notes"("noteName");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
