import { OAuth2Client } from "google-auth-library";
import { GoogleIdentity, GoogleOAuthService } from "../../application/interfaces/auth";

export interface GoogleOAuthAdapterProps {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes?: string[];
    client?: OAuth2Client;
}

export class GoogleOAuthAdapter implements GoogleOAuthService {
    private readonly client: OAuth2Client;
    private readonly scopes: string[];

    static fromEnv(): GoogleOAuthAdapter {
        const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
        const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? "";

        return new GoogleOAuthAdapter({ clientId, clientSecret, redirectUri });
    }

    constructor(private readonly props: GoogleOAuthAdapterProps) {
        if (!props.clientId || !props.clientSecret || !props.redirectUri) {
            throw new Error("Google OAuth client ID, secret, and redirect URI are required!");
        }

        this.client = props.client ?? new OAuth2Client(
            props.clientId,
            props.clientSecret,
            props.redirectUri
        );
        this.scopes = props.scopes ?? ["openid", "email", "profile"];
    }

    getAuthorizationUrl(state?: string): string {
        return this.client.generateAuthUrl({
            access_type: "offline",
            include_granted_scopes: true,
            response_type: "code",
            scope: this.scopes,
            ...(state ? { state } : {}),
        });
    }

    async verifyIdToken(idToken: string): Promise<GoogleIdentity> {
        if (!idToken) {
            throw new Error("A Google ID token is required!");
        }

        const ticket = await this.client.verifyIdToken({
            idToken,
            audience: this.props.clientId,
        });
        const payload = ticket.getPayload();

        if (!payload?.sub || !payload.email) {
            throw new Error("Google ID token does not contain the required identity claims!");
        }

        return {
            subject: payload.sub,
            email: payload.email,
            emailVerified: payload.email_verified === true,
            ...(payload.name ? { name: payload.name } : {}),
            ...(payload.picture ? { picture: payload.picture } : {}),
        };
    }
}
