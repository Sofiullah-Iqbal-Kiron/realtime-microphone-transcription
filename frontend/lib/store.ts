// 3'rd party
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

// local
import { NullableString, UserType, TranscriptionStatusType } from "@/lib/types"


// =============================================================================
// AUTH STORE
// =============================================================================

interface AuthStoreState {
    accessToken: NullableString
    refreshToken: NullableString
    currentUser: UserType | null
    setAccessToken: (token: NullableString) => void
    setRefreshToken: (token: NullableString) => void
    setCurrentUser: (user: UserType | null) => void
    clearAuth: () => void
}
export const useAuthStore = create<AuthStoreState>()(
    persist(
        (set) => ({
            accessToken: null,
            refreshToken: null,
            currentUser: null,
            setAccessToken: (token) => set({ accessToken: token }),
            setRefreshToken: (token) => set({ refreshToken: token }),
            setCurrentUser: (user) => set({ currentUser: user }),
            clearAuth: () => set({ accessToken: null, refreshToken: null, currentUser: null }),
        }),
        {
            version: 1,
            name: "user-auth-storage",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                currentUser: state.currentUser
            }),
        }
    )
)


// =============================================================================
// TRANSCRIPTION STORE
// =============================================================================

interface TranscriptionStoreState {
    status: TranscriptionStatusType
    sessionId: NullableString
    partialText: string
    finalText: string
    wordCount: number
    duration: number
    error: NullableString
    setStatus: (status: TranscriptionStatusType) => void
    setSessionId: (id: string) => void
    setPartialText: (text: string) => void
    setFinalResult: (text: string, wordCount: number, duration: number) => void
    setError: (error: string) => void
    reset: () => void
}
export const useTranscriptionStore = create<TranscriptionStoreState>()((set) => ({
    status: "idle",
    sessionId: null,
    partialText: "",
    finalText: "",
    wordCount: 0,
    duration: 0,
    error: null,
    setStatus: (status) => set({ status }),
    setSessionId: (id) => set({ sessionId: id }),
    setPartialText: (text) => set({ partialText: text }),
    setFinalResult: (text, wordCount, duration) =>
        set({ finalText: text, wordCount, duration, status: "completed" }),
    setError: (error) => set({ error, status: "error" }),
    reset: () =>
        set({
            status: "idle",
            sessionId: null,
            partialText: "",
            finalText: "",
            wordCount: 0,
            duration: 0,
            error: null,
        }),
}))


// =============================================================================
// SELECTORS
// =============================================================================

const authSelector = {
    accessToken: (state: AuthStoreState) => state.accessToken,
    refreshToken: (state: AuthStoreState) => state.refreshToken,
    currentUser: (state: AuthStoreState) => state.currentUser,
    setAccessToken: (state: AuthStoreState) => state.setAccessToken,
    setRefreshToken: (state: AuthStoreState) => state.setRefreshToken,
    setCurrentUser: (state: AuthStoreState) => state.setCurrentUser,
    clearAuth: (state: AuthStoreState) => state.clearAuth,
}

export const useAccessToken = () => useAuthStore(authSelector.accessToken)
export const useRefreshToken = () => useAuthStore(authSelector.refreshToken)
export const useCurrentUser = () => useAuthStore(authSelector.currentUser)
export const useSetAccessToken = () => useAuthStore(authSelector.setAccessToken)
export const useSetRefreshToken = () => useAuthStore(authSelector.setRefreshToken)
export const useSetCurrentUser = () => useAuthStore(authSelector.setCurrentUser)
export const useClearAuth = () => useAuthStore(authSelector.clearAuth)