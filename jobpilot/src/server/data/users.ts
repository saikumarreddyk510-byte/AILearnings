import "server-only";
import { db } from "@/lib/db";

/**
 * User look-ups used by auth (login/registration). Unlike the other
 * server/data/* modules, these are not user-scoped by definition — you have
 * to find a user by email *before* you know who they are.
 */

export async function findUserByEmail(email: string) {
  return db.user.findUnique({ where: { email } });
}

export async function findUserById(id: string) {
  return db.user.findUnique({ where: { id } });
}

export async function createUser(input: {
  email: string;
  passwordHash: string;
  name?: string;
}) {
  return db.user.create({
    data: {
      email: input.email,
      passwordHash: input.passwordHash,
      name: input.name,
    },
  });
}
