
export interface DatabaseProps {
    connectionString: string;
}

export abstract class DatabaseConnection  {

    private constructor(props: DatabaseProps ) { }

    abstract connect(): void
    abstract disconnect(): void
      
}