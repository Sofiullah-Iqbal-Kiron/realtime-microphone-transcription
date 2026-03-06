// Backend API endpoints.
// All endpoints use relative paths. The apiClient automatically prepends the baseURL
// from config, and the request interceptor handles token injection.

export const endpoints = {
    // auth
    signup: "/auth/signup",
    signin: "/auth/signin",
    verify_email: "/auth/verify-email",
    resend_verification: "/auth/resend-verification",
    password_reset: "/auth/password-reset",
    password_reset_confirm: "/auth/password-reset/confirm",
    refresh: "/auth/refresh",
    me: "/auth/me",

    // transcription sessions
    sessions: "/sessions",
    session_detail: (id: string) => `/sessions/${id}`,
}
