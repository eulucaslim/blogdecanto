import { createHmac, timingSafeEqual } from "node:crypto";
import { Session, SessionService } from "../../application/interfaces/session";

function encode(value: string): string {
    return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string): string {
    return Buffer.from(value, "base64url").toString("utf8");
}

export class SignedSessionService implements SessionService {
    constructor(private readonly secret: string) {
        if (!secret) {
            throw new Error("A session secret is required!");
        }
    }

    sign(session: Session): string {
        const payload = encode(JSON.stringify(session));
        return `${payload}.${this.signature(payload)}`;
    }

    verify(value: string): Session | null {
        const parts = value.split(".");
        if (parts.length !== 2) {
            return null;
        }
        const [payload, signature] = parts;
        if (!payload || !signature || !this.isValidSignature(payload, signature)) {
            return null;
        }

        try {
            const session = JSON.parse(decode(payload)) as Partial<Session>;
            if (
                typeof session.userId !== "string" ||
                (session.role !== "USER" && session.role !== "ADMIN") ||
                typeof session.expiresAt !== "number" ||
                session.expiresAt <= Date.now()
            ) {
                return null;
            }
            return session as Session;
        } catch {
            return null;
        }
    }

    private signature(payload: string): string {
        return createHmac("sha256", this.secret).update(payload).digest("base64url");
    }

    private isValidSignature(payload: string, signature: string): boolean {
        const expected = Buffer.from(this.signature(payload));
        const received = Buffer.from(signature);
        return expected.length === received.length && timingSafeEqual(expected, received);
    }
}
