import { DatabaseConnection } from "../../application/interfaces/database";
import { PrismaClient } from "../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg";

export interface DatabaseConnectionPrismaProps {
    connectionString: string
    instance: PrismaClient | null
}


export class DatabaseConnectionPrisma implements DatabaseConnection {
    
    private constructor(private props: DatabaseConnectionPrismaProps) { }

    static create(connectionString: string, instance: PrismaClient | null){

        if (!connectionString) {
            throw new Error("You need add the connection string to connect with database!");
        }
        if (!instance) {
            const adapter = new PrismaPg({
                connectionString: connectionString
            });

            instance = new PrismaClient({ adapter });
        }
        
        return new DatabaseConnectionPrisma({
            connectionString,
            instance
        })
    }
    
    
    async disconnect(): Promise<void> {
        if (this.props.instance) {
            await this.props.instance.$disconnect()
        }
    }

    get instance(): PrismaClient | null {
        return this.props.instance
    }
}