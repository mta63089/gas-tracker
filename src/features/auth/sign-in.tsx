/* eslint-disable react-hooks/incompatible-library */
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "#components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#components/ui/card";
import { Field, FieldError, FieldLabel } from "#components/ui/field";
import { Input } from "#components/ui/input";
import { supabase } from "../../lib/supabase";

const schema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type Values = z.infer<typeof schema>;

export function SignIn() {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function submit(values: Values) {
    setSubmitting(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword(values);
      if (error) throw error;
      // AuthGate will react to the signed-in session.
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <img src="/logo.png" alt="" className="size-16 object-contain" />
          <CardTitle className="font-title text-4xl">Gas Tracker</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in to your shared vehicle log.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <Controller name="email" control={form.control} render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="sign-in-email">Email</FieldLabel>
                <Input {...field} id="sign-in-email" type="email" autoComplete="email" />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )} />
            <Controller name="password" control={form.control} render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="sign-in-password">Password</FieldLabel>
                <Input {...field} id="sign-in-password" type="password" autoComplete="current-password" />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )} />
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
