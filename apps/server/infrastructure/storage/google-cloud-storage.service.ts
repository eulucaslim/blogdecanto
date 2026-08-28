import { Storage } from "@google-cloud/storage";
import { StorageService } from "../../application/interfaces/storage";

export interface GoogleCloudStorageServiceProps {
    bucketName: string;
    projectId?: string;
    keyFilename?: string;
    signedUrlExpiresInSeconds?: number;
    client?: Storage;
}

export class GoogleCloudStorageService implements StorageService {
    private readonly bucket;
    private readonly signedUrlExpiresInSeconds: number;

    static fromEnv(): GoogleCloudStorageService {
        return new GoogleCloudStorageService({
            bucketName: process.env.GCS_BUCKET_NAME ?? "",
            projectId: process.env.GCS_PROJECT_ID,
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            signedUrlExpiresInSeconds: Number(process.env.GCS_SIGNED_URL_EXPIRES_IN_SECONDS ?? 3600),
        });
    }

    constructor(private readonly props: GoogleCloudStorageServiceProps) {
        if (!props.bucketName) {
            throw new Error("You need add the GCS bucket name to configure storage!");
        }

        this.bucket = (props.client ?? new Storage({
            projectId: props.projectId,
            keyFilename: props.keyFilename,
        })).bucket(props.bucketName);
        this.signedUrlExpiresInSeconds = props.signedUrlExpiresInSeconds ?? 3600;
    }

    async upload(
        key: string,
        data: Buffer | Uint8Array | string,
        contentType?: string
    ): Promise<string> {
        if (!key) {
            throw new Error("A storage object key is required to upload a file!");
        }

        await this.bucket.file(key).save(data, {
            resumable: false,
            metadata: contentType ? { contentType } : undefined,
        });

        return key;
    }

    async delete(key: string): Promise<void> {
        if (!key) {
            throw new Error("A storage object key is required to delete a file!");
        }

        await this.bucket.file(key).delete({ ignoreNotFound: true });
    }

    async getSignedUploadUrl(
        key: string,
        contentType?: string,
        expiresInSeconds = this.signedUrlExpiresInSeconds
    ): Promise<string> {
        if (!key) {
            throw new Error("A storage object key is required to create an upload URL!");
        }
        if (expiresInSeconds <= 0) {
            throw new Error("Signed URL expiration must be greater than zero!");
        }

        const [url] = await this.bucket.file(key).getSignedUrl({
            version: "v4",
            action: "write",
            expires: Date.now() + expiresInSeconds * 1000,
            ...(contentType ? { contentType } : {}),
        });

        return url;
    }

    async getSignedUrl(key: string, expiresInSeconds = this.signedUrlExpiresInSeconds): Promise<string> {
        if (!key) {
            throw new Error("A storage object key is required to create a signed URL!");
        }
        if (expiresInSeconds <= 0) {
            throw new Error("Signed URL expiration must be greater than zero!");
        }

        const [url] = await this.bucket.file(key).getSignedUrl({
            version: "v4",
            action: "read",
            expires: Date.now() + expiresInSeconds * 1000,
        });

        return url;
    }
}
