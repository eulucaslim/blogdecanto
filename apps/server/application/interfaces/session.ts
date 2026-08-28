export interface Session {
    userId: string
    role: "USER" | "ADMIN"
    expiresAt: number
}

export interface SessionService {
    sign(session: Session): string
    verify(value: string): Session | null
}
