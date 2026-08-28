export interface StorageService {
    upload(
        key: string,
        data: Buffer | Uint8Array | string,
        contentType?: string
    ): Promise<string>
    delete(key: string): Promise<void>
    getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>
    getSignedUploadUrl(key: string, contentType?: string, expiresInSeconds?: number): Promise<string>
}
