export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL || "ws://127.0.0.1:8000"

export const REQUEST_TIMEOUT = 30000
export const REFRESH_TIMEOUT = 10000

export const SIGNIN_PATH = "/signin"

if (process.env.NODE_ENV === "development") {
    if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
        console.warn(
            "[Config] NEXT_PUBLIC_API_BASE_URL is not set. Using default: http://127.0.0.1:8000\n" +
            "To set it, create a .env.local file with: NEXT_PUBLIC_API_BASE_URL=your_api_url"
        )
    }
}