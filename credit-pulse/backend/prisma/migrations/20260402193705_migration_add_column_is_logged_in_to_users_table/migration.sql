/*
  Warnings:

  - You are about to drop the column `is_blocked` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_logged_in" BOOLEAN NOT NULL DEFAULT false;
