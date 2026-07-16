import { DatabaseConnection } from "../../application/interfaces/database";
import { PrismaClient } from "../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg";

export interface DatabaseConnectionPrismaProps {
    connectionString: string
    instance: PrismaClient | null
}


export class DatabaseConnectionPrisma implements DatabaseConnection {
    
    private constructor(private props: DatabaseConnectionPrismaProps) { }

    public static create(connectionString: string, instance: PrismaClient | null){

        if (!connectionString) {
            throw new Error("You need add the connection string to connect with database!");
        }
        
        return new DatabaseConnectionPrisma({
            connectionString,
            instance
    })

        
    }
    
    public connect(): PrismaClient {
        if (!this.instance) {
            const adapter = new PrismaPg({
                connectionString: this.connectionString
            });
            DatabaseConnection.instance = new PrismaClient({ adapter });
        }
        return DatabaseConnection.instance;
    }
    
    disconnect(): void {
        throw new Error("Method not implemented.");
    }
    public getInstance() {
        return DatabaseConnection.instance
    }
}