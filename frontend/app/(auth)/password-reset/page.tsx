"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import useSWRMutation from "swr/mutation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordResetSchema, type PasswordResetSchemaType } from "@/lib/schemas";
import { endpoints } from "@/lib/api/endpoints";
import { postEmail } from "@/lib/api/calls";
import { getErrorMessage, type APIErrorResponse } from "@/lib/api/errors";
import type { MessageResponse } from "@/lib/types";

export default function PasswordResetPage() {
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetSchemaType>({
    resolver: zodResolver(PasswordResetSchema),
  });

  const { trigger, isMutating } = useSWRMutation(
    endpoints.password_reset,
    postEmail
  );

  const onSubmit = async (data: PasswordResetSchemaType) => {
    setApiError("");
    setSuccessMessage("");

    try {
      const response = (await trigger(data)) as MessageResponse;
      setSuccessMessage(response.message);
    } catch (err) {
      const message = getErrorMessage(err as AxiosError<APIErrorResponse>);
      setApiError(message);
    }
  };

  return (
    <>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
        <p className="text-muted-foreground text-sm">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <Card className="p-6">
        {successMessage ? (
          <div className="space-y-4 text-center">
            <div className="rounded-md bg-primary/10 border border-primary/20 px-4 py-3 text-sm text-primary">
              {successMessage}
            </div>
            <Link href="/signin">
              <Button variant="outline" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {apiError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {apiError}
              </div>
            )}

            <Field>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </Field>

            <Button type="submit" className="w-full" disabled={isMutating}>
              {isMutating ? "Sending…" : "Send Reset Link"}
            </Button>
          </form>
        )}
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link href="/signin" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
