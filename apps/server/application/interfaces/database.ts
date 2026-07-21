
export interface DatabaseProps<T> {
    connectionString: string;
    instance: T;
}

export abstract class DatabaseConnection {

    private constructor(props: DatabaseProps<object>) { }

    abstract disconnect(): void
      
}