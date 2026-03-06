// 3rd party
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"

// local
import { useAuthStore } from "@/lib/store"
import { NullableString, SigninResponse } from "@/lib/types"
import { API_BASE_URL, REQUEST_TIMEOUT, REFRESH_TIMEOUT, SIGNIN_PATH } from "@/lib/config"


const AUTH_ENDPOINTS = ["/auth/signin", "/auth/refresh", "/auth/signup"] as const


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


export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: REQUEST_TIMEOUT,
    headers: {
        "Content-Type": "application/json",
    },
})


const isOnLoginPage = (): boolean => {
    if (typeof window === "undefined") return false
    return window.location.pathname === SIGNIN_PATH
}

const isAuthEndpoint = (url: string | undefined): boolean => {
    if (!url) return false
    return AUTH_ENDPOINTS.some((endpoint) => url.endsWith(endpoint))
}

const redirectToLogin = () => {
    if (typeof window !== "undefined" && !isOnLoginPage()) {
        window.location.replace(SIGNIN_PATH)
    }
}

const refreshAccessToken = async (): Promise<SigninResponse> => {
    const refreshToken = useAuthStore.getState().refreshToken

    if (!refreshToken) throw new Error("No refresh token available!")

    const endpoint = `${API_BASE_URL}/auth/refresh`
    const data = { refresh_token: refreshToken }
    const headers = { "Content-Type": "application/json" }
    const config = { timeout: REFRESH_TIMEOUT, headers: headers }
    const response = await axios.post(endpoint, data, config)

    return response.data as SigninResponse
}


if (typeof window !== "undefined") {
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

    apiClient.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
            const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

            if (!error.response) {
                return Promise.reject(error)
            }

            const status = error.response.status

            if (status !== 401) {
                return Promise.reject(error)
            }

            if (isAuthEndpoint(originalRequest.url) || originalRequest._retry || isOnLoginPage()) {
                return Promise.reject(error)
            }

            originalRequest._retry = true

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

            isRefreshing = true

            try {
                const signinResponse = await refreshAccessToken()

                const store = useAuthStore.getState()
                store.setAccessToken(signinResponse.access_token)
                store.setRefreshToken(signinResponse.refresh_token)
                store.setCurrentUser(signinResponse.user)

                processQueue(null, signinResponse.access_token)

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${signinResponse.access_token}`
                }

                return apiClient(originalRequest)
            } catch (refreshError) {
                processQueue(refreshError as Error, null)

                useAuthStore.getState().clearAuth()

                redirectToLogin()

                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }
    )
}
