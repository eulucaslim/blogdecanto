export interface GoogleIdentity {
    subject: string
    email: string
    emailVerified: boolean
    name?: string
    picture?: string
}

export interface GoogleOAuthService {
    getAuthorizationUrl(state?: string): string
    exchangeAuthorizationCode(code: string): Promise<GoogleIdentity>
    verifyIdToken(idToken: string): Promise<GoogleIdentity>
}
