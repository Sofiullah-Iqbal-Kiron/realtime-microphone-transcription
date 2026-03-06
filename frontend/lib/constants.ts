import {
    Mic02Icon,
    Clock01Icon,
    UserCircleIcon,
    Login01Icon,
    Logout01Icon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"


type NavItem = {
    label: string,
    href: string,
    icon: IconSvgElement,
}

export const NAV_ITEMS: NavItem[] = [
    { label: "Record", href: "/", icon: Mic02Icon },
    { label: "Sessions", href: "/sessions", icon: Clock01Icon },
]

export const ENTITY_ICONS = {
    "SignIn": Login01Icon,
    "SignOut": Logout01Icon,
    "Record": Mic02Icon,
    "Sessions": Clock01Icon,
    "Profile": UserCircleIcon,
}
