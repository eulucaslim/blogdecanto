export interface GoogleIdentity {
    subject: string
    email: string
    emailVerified: boolean
    name?: string
    picture?: string
}

export interface GoogleOAuthService {
    getAuthorizationUrl(state?: string): string
    verifyIdToken(idToken: string): Promise<GoogleIdentity>
}
