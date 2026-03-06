import * as z from "zod"


// -----------------------------------------------------------------------------
// Auth Schemas
// -----------------------------------------------------------------------------

export const SigninSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, "Email is required.")
        .email("Enter a valid email address."),
    password: z
        .string()
        .min(1, "Password is required."),
})
export type SigninSchemaType = z.infer<typeof SigninSchema>


export const SignupSchema = z.object({
    first_name: z
        .string()
        .trim()
        .max(150, "First name cannot exceed 150 characters.")
        .optional(),
    last_name: z
        .string()
        .trim()
        .max(150, "Last name cannot exceed 150 characters.")
        .optional(),
    email: z
        .string()
        .trim()
        .min(1, "Email is required.")
        .email("Enter a valid email address."),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters."),
    confirm_password: z
        .string()
        .min(1, "Confirm your password."),
}).refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match.",
    path: ["confirm_password"],
})
export type SignupSchemaType = z.infer<typeof SignupSchema>


export const PasswordResetSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, "Email is required.")
        .email("Enter a valid email address."),
})
export type PasswordResetSchemaType = z.infer<typeof PasswordResetSchema>