// 3'rd party
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// local
import { UserType } from "./types"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getUserFullName(user: UserType): string {
  const firstName = user.first_name || ""
  const lastName = user.last_name || ""

  return `${firstName} ${lastName}`.trim() || user.email
}

export function getUserInitials(user: UserType): string {
  const firstName = user.first_name || ""
  const lastName = user.last_name || ""
  let initial = ""

  switch (true) {
    case Boolean(firstName) && Boolean(lastName):
      initial = `${firstName[0]}${lastName[0]}`
      break
    case Boolean(firstName) && !Boolean(lastName):
      initial = firstName.slice(0, 2)
      break
    case !Boolean(firstName) && Boolean(lastName):
      initial = lastName.slice(0, 2)
      break
    default:
      initial = user.email.slice(0, 2)
  }

  return initial.toUpperCase()
}

export function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—"

  if (seconds < 60) return `${seconds.toFixed(1)}s`

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  return `${mins}m ${secs.toFixed(0)}s`
}