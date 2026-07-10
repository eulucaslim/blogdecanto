import { PrismaClient } from "../../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg";

export class DatabaseConnection {
    connectionString: string

    constructor(connectionString: string) {
        this.connectionString = connectionString
    }

    connect(){
        // const adapter = new PrismaPg({ connectionString });
        // const client = new PrismaClient()
    }
}