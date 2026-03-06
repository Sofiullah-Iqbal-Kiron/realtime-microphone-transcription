// =============================================================================
// ENVIRONMENT CONFIGURATION
// =============================================================================
// Centralized configuration for all environment variables.
// This ensures type safety and provides clear error messages for missing vars.


// -----------------------------------------------------------------------------
// API Configuration
// -----------------------------------------------------------------------------

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL || "ws://127.0.0.1:8000"


// -----------------------------------------------------------------------------
// Timeouts (in milliseconds)
// -----------------------------------------------------------------------------

export const REQUEST_TIMEOUT = 30000      // 30 seconds for regular requests
export const REFRESH_TIMEOUT = 10000      // 10 seconds for token refresh


// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

export const SIGNIN_PATH = "/signin"


// -----------------------------------------------------------------------------
// Validation (Development Only)
// -----------------------------------------------------------------------------

if (process.env.NODE_ENV === "development") {
    if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
        console.warn(
            "[Config] NEXT_PUBLIC_API_BASE_URL is not set. Using default: http://127.0.0.1:8000\n" +
            "To set it, create a .env.local file with: NEXT_PUBLIC_API_BASE_URL=your_api_url"
        )
    }
}