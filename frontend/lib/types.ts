export type NullableString = string | null

export type SigninRequest = {
    email: string,
    password: string,
}

export type SignupRequest = {
    email: string,
    password: string,
    first_name?: string,
    last_name?: string,
}

export type UserType = {
    id: number,
    email: string,
    first_name: string | null,
    last_name: string | null,
    profile_picture: string | null,
    is_email_verified: boolean,
    is_active: boolean,
    is_admin: boolean,
    last_login: string | null,
    date_joined: string,
}

export type SigninResponse = {
    access_token: string,
    refresh_token: string,
    token_type: string,
    expires_in: number,
    user: UserType,
}

export type MessageResponse = {
    message: string,
}

export type SessionStatusType = "active" | "completed" | "error"

export type SessionListItem = {
    id: string,
    user_id: number,
    duration: number | null,
    word_count: number | null,
    language: string,
    status: SessionStatusType,
    created_at: string,
}

export type SessionDetail = {
    id: string,
    user_id: number,
    transcript: string | null,
    duration: number | null,
    word_count: number | null,
    language: string,
    status: string,
    created_at: string,
    updated_at: string,
}

export type SessionsListResponse = {
    count: number,
    sessions: SessionListItem[],
}

export type TranscriptionMessage = {
    type: "partial" | "final" | "error" | "session_created",
    text: string,
    session_id: string | null,
    is_final: boolean,
    word_count: number,
    duration: number,
}

export type TranscriptionStatusType = "idle" | "connecting" | "recording" | "stopping" | "completed" | "error"
