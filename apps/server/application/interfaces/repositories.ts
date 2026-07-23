
export interface Repository<T> {
    create(entity: T): Promise<T>
    delete(id: string): Promise<void>
    findById(id: string): Promise<T | null>
    update(id: string, entity: T): Promise<T>
    findAll(): Promise<T[] | []>
}