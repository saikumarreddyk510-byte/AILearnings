"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAccountAction } from "@/server/actions/account";

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccountAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        This permanently deletes your account, résumé, applications, and all other data.
        This cannot be undone.
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="delete-password">Confirm your password</Label>
        <Input id="delete-password" name="password" type="password" required />
      </div>
      {state?.message && <p className="text-sm text-destructive">{state.message}</p>}
      <Button type="submit" variant="destructive" disabled={pending} className="self-start">
        {pending ? "Deleting…" : "Delete my account"}
      </Button>
    </form>
  );
}
