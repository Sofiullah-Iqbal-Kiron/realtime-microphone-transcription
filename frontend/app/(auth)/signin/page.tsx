"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import useSWRMutation from "swr/mutation";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SigninSchema, type SigninSchemaType } from "@/lib/schemas";
import { endpoints } from "@/lib/api/endpoints";
import { postSignin } from "@/lib/api/calls";
import { getErrorMessage, type APIErrorResponse } from "@/lib/api/errors";
import { useAuthStore } from "@/lib/store";
import type { SigninResponse } from "@/lib/types";

export default function SigninPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SigninSchemaType>({
    resolver: zodResolver(SigninSchema),
  });

  const { trigger, isMutating } = useSWRMutation(endpoints.signin, postSignin);

  const onSubmit = async (data: SigninSchemaType) => {
    setApiError("");

    try {
      const response = (await trigger(data)) as SigninResponse;
      const store = useAuthStore.getState();
      store.setAccessToken(response.access_token);
      store.setRefreshToken(response.refresh_token);
      store.setCurrentUser(response.user);
      router.replace("/");
    } catch (err) {
      const message = getErrorMessage(err as AxiosError<APIErrorResponse>);
      setApiError(message);
    }
  };

  return (
    <>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground text-sm">
          Sign in to your account to continue.
        </p>
      </div>

      <Card className="p-6">
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
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </Field>

          <Field>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </Field>

          <div className="flex justify-end">
            <Link
              href="/password-reset"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={isMutating}>
            {isMutating ? "Signing in…" : "Sign In"}
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </>
  );
}
