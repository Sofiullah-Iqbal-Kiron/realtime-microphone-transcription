// 3rd party
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"

// local
import { useAuthStore } from "@/lib/store"
import { NullableString, SigninResponse } from "@/lib/types"
import { API_BASE_URL, REQUEST_TIMEOUT, REFRESH_TIMEOUT, SIGNIN_PATH } from "@/lib/config"


// ============================================================================
// CONFIGURATION
// ============================================================================

// Auth endpoints that should skip token refresh logic.
// `as const` assertion ensures the array is treated as a tuple of readonly string literals.
const AUTH_ENDPOINTS = ["/auth/signin", "/auth/refresh", "/auth/signup"] as const


// ============================================================================
// TOKEN REFRESH QUEUE MANAGEMENT
// ============================================================================

interface QueueItem {
    resolve: (token: string) => void
    reject: (err: Error) => void
}

let isRefreshing = false
let failedQueue: QueueItem[] = []

const processQueue = (error: Error | null, token: NullableString = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error)
        } else if (token) {
            prom.resolve(token)
        }
    })
    failedQueue = []
}


// ============================================================================
// AXIOS INSTANCE
// ============================================================================

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: REQUEST_TIMEOUT,
    headers: {
        "Content-Type": "application/json",
    },
})


// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if the current browser location is the login page.
 */
const isOnLoginPage = (): boolean => {
    if (typeof window === "undefined") return false
    return window.location.pathname === SIGNIN_PATH
}

/**
 * Check if the request URL is an auth endpoint that should skip refresh logic.
 */
const isAuthEndpoint = (url: string | undefined): boolean => {
    if (!url) return false
    return AUTH_ENDPOINTS.some((endpoint) => url.endsWith(endpoint))
}

/**
 * Redirect to login page if not already there.
 */
const redirectToLogin = () => {
    if (typeof window !== "undefined" && !isOnLoginPage()) {
        window.location.replace(SIGNIN_PATH)
    }
}

/**
 * Attempt to refresh the access token using the refresh token.
 */
const refreshAccessToken = async (): Promise<SigninResponse> => {
    const refreshToken = useAuthStore.getState().refreshToken

    if (!refreshToken) throw new Error("No refresh token available!")

    // Use a fresh axios instance to avoid interceptor loops.
    const endpoint = `${API_BASE_URL}/auth/refresh`
    const data = { refresh_token: refreshToken }
    const headers = { "Content-Type": "application/json" }
    const config = { timeout: REFRESH_TIMEOUT, headers: headers }
    const response = await axios.post(endpoint, data, config)

    return response.data as SigninResponse
}


// ============================================================================
// CLIENT-SIDE INTERCEPTORS
// ============================================================================

if (typeof window !== "undefined") {
    // -------------------------------------------------------------------------
    // REQUEST INTERCEPTOR
    // Attaches the access token to outgoing requests.
    // -------------------------------------------------------------------------
    apiClient.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            const accessToken = useAuthStore.getState().accessToken

            if (accessToken && config.headers) {
                config.headers.Authorization = `Bearer ${accessToken}`
            }

            return config
        },
        (error) => Promise.reject(error)
    )

    // -------------------------------------------------------------------------
    // RESPONSE INTERCEPTOR
    // Handles 401 errors by attempting token refresh and retrying the request.
    // -------------------------------------------------------------------------
    apiClient.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
            const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

            // Network error (no response from server).
            if (!error.response) {
                return Promise.reject(error)
            }

            const status = error.response.status

            // Only handle 401 Unauthorized errors.
            if (status !== 401) {
                return Promise.reject(error)
            }

            // Skip refresh logic for:
            // 1. Auth endpoints (login, refresh, register).
            // 2. Requests that have already been retried.
            // 3. When user is on the login page.
            if (isAuthEndpoint(originalRequest.url) || originalRequest._retry || isOnLoginPage()) {
                return Promise.reject(error)
            }

            // Mark request as retried to prevent infinite loops.
            originalRequest._retry = true

            // If a refresh is already in progress, queue this request.
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({
                        resolve: (token: string) => {
                            if (originalRequest.headers) {
                                originalRequest.headers.Authorization = `Bearer ${token}`
                            }
                            resolve(apiClient(originalRequest))
                        },
                        reject: (err: Error) => reject(err),
                    })
                })
            }

            // Start token refresh.
            isRefreshing = true

            try {
                const signinResponse = await refreshAccessToken()

                // Update store with new tokens.
                const store = useAuthStore.getState()
                store.setAccessToken(signinResponse.access_token)
                store.setRefreshToken(signinResponse.refresh_token)
                store.setCurrentUser(signinResponse.user)

                // Process queued requests with new token.
                processQueue(null, signinResponse.access_token)

                // Retry the original request with new token.
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${signinResponse.access_token}`
                }

                return apiClient(originalRequest)
            } catch (refreshError) {
                // Process queued requests with error.
                processQueue(refreshError as Error, null)

                // Clear auth state.
                useAuthStore.getState().clearAuth()

                // Redirect to login.
                redirectToLogin()

                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }
    )
}
