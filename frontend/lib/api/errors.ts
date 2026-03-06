import { AxiosError } from "axios"


// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * FastAPI error response shapes:
 *
 * - **HTTPException** (400, 401, 403, 404, 409, 410):
 *   `{ "detail": "Invalid email or password." }`
 *
 * - **Pydantic ValidationError** (422):
 *   `{ "detail": [{ "type": "value_error", "loc": ["body", "email"], "msg": "...", "input": "..." }] }`
 */
export type ValidationErrorItem = {
    type: string
    loc: (string | number)[]
    msg: string
    input?: unknown
}

export type APIErrorResponse = {
    detail?: string | ValidationErrorItem[]
}


// =============================================================================
// ERROR EXTRACTION UTILITIES
// =============================================================================

/**
 * Default user-facing messages for common HTTP status codes.
 */
const HTTP_ERROR_MESSAGES: Record<number, string> = {
    400: "Invalid request. Please check your input.",
    401: "Authentication failed. Please log in again.",
    403: "You don't have permission to perform this action.",
    404: "The requested resource was not found.",
    408: "Request timed out. Please try again.",
    409: "A conflict occurred. Please refresh and try again.",
    422: "Validation failed. Please check your input.",
    429: "Too many requests. Please wait and try again.",
    500: "Server error. Please try again later.",
    502: "Server is temporarily unavailable. Please try again.",
    503: "Service unavailable. Please try again later.",
    504: "Request timed out. Please try again.",
}

/**
 * Extracts a single user-friendly error message from an Axios error
 * containing a FastAPI response.
 *
 * Handles the following scenarios in priority order:
 *
 * 1. **Network errors** — no `error.response` (server unreachable):
 *    - `ECONNABORTED` → timeout message
 *    - Otherwise → generic network error
 *
 * 2. **`detail` string** — FastAPI's HTTPException (auth, permission,
 *    not-found, conflict errors):
 *    - `{ "detail": "Invalid email or password." }` → `"Invalid email or password."`
 *
 * 3. **`detail` array** — Pydantic validation errors (422):
 *    - `{ "detail": [{ "loc": ["body", "email"], "msg": "..." }] }` → first error message
 *
 * 4. **HTTP status code** — mapped via `HTTP_ERROR_MESSAGES`
 *
 * 5. **Fallback** — `fallbackMessage` or generic "An unexpected error occurred"
 *
 * @param error - Axios error object typed as `AxiosError<APIErrorResponse>`.
 * @param fallbackMessage - Optional custom message when no error can be extracted.
 * @returns A single user-facing error message string.
 *
 * @example
 * // HTTPException (401):
 * // Response: { "detail": "Invalid email or password." }
 * // Output:   "Invalid email or password."
 *
 * // Pydantic ValidationError (422):
 * // Response: { "detail": [{ "loc": ["body", "email"], "msg": "value is not a valid email address" }] }
 * // Output:   "Email: value is not a valid email address"
 *
 * // Network timeout:
 * // error.response is undefined, error.code === "ECONNABORTED"
 * // Output: "Request timed out. Please check your connection and try again."
 */
export function getErrorMessage(error: AxiosError<APIErrorResponse>, fallbackMessage?: string): string {
    // 1. Network error (no response from server).
    if (!error.response) {
        if (error.code === "ECONNABORTED") {
            return "Request timed out. Please check your connection and try again."
        }
        return "Network error. Please check your internet connection."
    }

    const { status, data } = error.response

    if (data?.detail) {
        // 2. HTTPException detail string.
        if (typeof data.detail === "string") return data.detail

        // 3. Pydantic validation errors (detail is an array).
        if (Array.isArray(data.detail) && data.detail.length > 0) {
            return formatValidationErrorItem(data.detail[0])
        }
    }

    // 4. HTTP status code fallback.
    if (status && HTTP_ERROR_MESSAGES[status]) {
        return HTTP_ERROR_MESSAGES[status]
    }

    // 5. Generic fallback.
    return fallbackMessage || "An unexpected error occurred. Please try again."
}

/**
 * Extracts all Pydantic validation errors from a FastAPI 422 response
 * as a field-name → error-message record.
 *
 * FastAPI validation errors are shaped as:
 * ```json
 * {
 *   "detail": [
 *     { "type": "value_error", "loc": ["body", "email"], "msg": "value is not a valid email address" },
 *     { "type": "string_too_short", "loc": ["body", "password"], "msg": "String should have at least 8 characters" }
 *   ]
 * }
 * ```
 *
 * This function:
 * 1. Extracts the field name from the last element in `loc` (skips "body" prefix)
 * 2. Formats the field name to human-readable form
 * 3. Maps each field to its first error message
 *
 * Useful for displaying inline validation errors next to form fields.
 *
 * @param error - Axios error object typed as `AxiosError<APIErrorResponse>`.
 * @returns Record mapping formatted field names to their error message.
 *          Returns empty object if no validation errors found.
 *
 * @example
 * // Response data:
 * // {
 * //   "detail": [
 * //     { "loc": ["body", "email"], "msg": "value is not a valid email address" },
 * //     { "loc": ["body", "password"], "msg": "String should have at least 8 characters" }
 * //   ]
 * // }
 * //
 * // Output:
 * // { "Email": "value is not a valid email address", "Password": "String should have at least 8 characters" }
 */
export function getValidationErrors(error: AxiosError<APIErrorResponse>): Record<string, string> {
    const errors: Record<string, string> = {}
    const detail = error.response?.data?.detail

    if (!Array.isArray(detail)) return errors

    for (const item of detail) {
        const fieldName = extractFieldName(item.loc)
        if (!fieldName) continue

        const formatted = formatFieldName(fieldName)
        if (!errors[formatted]) {
            errors[formatted] = item.msg
        }
    }

    return errors
}


// =============================================================================
// INTERNAL HELPERS
// =============================================================================

/**
 * Extracts the field name from a Pydantic `loc` array.
 *
 * The `loc` array typically looks like `["body", "email"]` or `["body", "profile", "age"]`.
 * This returns the last element as the field name, skipping the "body" prefix.
 *
 * @param loc - The location array from a Pydantic validation error.
 * @returns The field name string, or `null` if loc is empty or only contains "body".
 */
function extractFieldName(loc: (string | number)[]): string | null {
    // Filter out "body" prefix — the meaningful field name(s) follow it.
    const parts = loc.filter((p) => p !== "body")
    if (parts.length === 0) return null
    // Use the last element as the most specific field name.
    const last = parts[parts.length - 1]
    return typeof last === "string" ? last : String(last)
}

/**
 * Formats a single Pydantic validation error item into a user-friendly string.
 *
 * @param item - A single validation error from the `detail` array.
 * @returns Formatted string like `"Email: value is not a valid email address"`.
 */
function formatValidationErrorItem(item: ValidationErrorItem): string {
    const fieldName = extractFieldName(item.loc)
    if (fieldName) {
        return `${formatFieldName(fieldName)}: ${item.msg}`
    }
    return item.msg
}

/**
 * Converts a snake_case or camelCase field name into a human-readable format.
 *
 * @param field - Raw field name string (e.g., `"phone_number"`, `"firstName"`).
 * @returns Formatted string suitable for UI display.
 *
 * @example
 * formatFieldName("phone_number")  // → "Phone number"
 * formatFieldName("first_name")    // → "First name"
 * formatFieldName("email")         // → "Email"
 */
function formatFieldName(field: string): string {
    return field
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim()
}