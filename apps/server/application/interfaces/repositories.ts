
export interface Repository {
    create<T>(entity: T): T
    delete(id: string): void
    findById<T>(id: string): T
    update<T>(entity: T, id: string): T
    findByEmail<T>(email: string): T
}