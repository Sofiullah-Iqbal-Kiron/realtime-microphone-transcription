import { AxiosError } from "axios"


export type ValidationErrorItem = {
    type: string
    loc: (string | number)[]
    msg: string
    input?: unknown
}

export type APIErrorResponse = {
    detail?: string | ValidationErrorItem[]
}


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

export function getErrorMessage(error: AxiosError<APIErrorResponse>, fallbackMessage?: string): string {
    if (!error.response) {
        if (error.code === "ECONNABORTED") {
            return "Request timed out. Please check your connection and try again."
        }
        return "Network error. Please check your internet connection."
    }

    const { status, data } = error.response

    if (data?.detail) {
        if (typeof data.detail === "string") return data.detail

        if (Array.isArray(data.detail) && data.detail.length > 0) {
            return formatValidationErrorItem(data.detail[0])
        }
    }

    if (status && HTTP_ERROR_MESSAGES[status]) {
        return HTTP_ERROR_MESSAGES[status]
    }

    return fallbackMessage || "An unexpected error occurred. Please try again."
}

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


function extractFieldName(loc: (string | number)[]): string | null {
    const parts = loc.filter((p) => p !== "body")
    if (parts.length === 0) return null
    const last = parts[parts.length - 1]
    return typeof last === "string" ? last : String(last)
}

function formatValidationErrorItem(item: ValidationErrorItem): string {
    const fieldName = extractFieldName(item.loc)
    if (fieldName) {
        return `${formatFieldName(fieldName)}: ${item.msg}`
    }
    return item.msg
}

function formatFieldName(field: string): string {
    return field
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim()
}