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
import { SignupSchema, type SignupSchemaType } from "@/lib/schemas";
import { endpoints } from "@/lib/api/endpoints";
import { postSignup } from "@/lib/api/calls";
import { getErrorMessage, type APIErrorResponse } from "@/lib/api/errors";
import type { MessageResponse } from "@/lib/types";

export default function SignupPage() {
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupSchemaType>({
    resolver: zodResolver(SignupSchema),
  });

  const { trigger, isMutating } = useSWRMutation(endpoints.signup, postSignup);

  const onSubmit = async (data: SignupSchemaType) => {
    setApiError("");
    setSuccessMessage("");

    try {
      const { confirm_password: _, ...payload } = data;
      const response = (await trigger(payload)) as MessageResponse;
      setSuccessMessage(response.message);
    } catch (err) {
      const message = getErrorMessage(err as AxiosError<APIErrorResponse>);
      setApiError(message);
    }
  };

  return (
    <>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
        <p className="text-muted-foreground text-sm">
          Sign up to start transcribing.
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
                Go to Sign In
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

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  placeholder="John"
                  {...register("first_name")}
                />
                {errors.first_name && (
                  <p className="text-sm text-destructive">
                    {errors.first_name.message}
                  </p>
                )}
              </Field>

              <Field>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  placeholder="Doe"
                  {...register("last_name")}
                />
                {errors.last_name && (
                  <p className="text-sm text-destructive">
                    {errors.last_name.message}
                  </p>
                )}
              </Field>
            </div>

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

            <Field>
              <Label htmlFor="confirm_password">Confirm Password</Label>
              <Input
                id="confirm_password"
                type="password"
                placeholder="••••••••"
                {...register("confirm_password")}
              />
              {errors.confirm_password && (
                <p className="text-sm text-destructive">
                  {errors.confirm_password.message}
                </p>
              )}
            </Field>

            <Button type="submit" className="w-full" disabled={isMutating}>
              {isMutating ? "Creating account…" : "Sign Up"}
            </Button>
          </form>
        )}
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/signin" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
