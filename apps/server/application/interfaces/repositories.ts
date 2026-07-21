
export interface Repository<T> {
    create(entity: T): T
    delete(id: string): Promise<void>
    findById(id: string): Promise<T | null>
    update(id: string, entity: T): T
}