export const endpoints = {
    signup: "/auth/signup",
    signin: "/auth/signin",
    verify_email: "/auth/verify-email",
    resend_verification: "/auth/resend-verification",
    password_reset: "/auth/password-reset",
    password_reset_confirm: "/auth/password-reset/confirm",
    refresh: "/auth/refresh",
    me: "/auth/me",

    sessions: "/sessions",
    session_detail: (id: string) => `/sessions/${id}`,
}
