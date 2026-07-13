import { PrismaClient } from "../../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg";

export class DatabaseConnection {
    private connectionString: string;
    private static instance : PrismaClient;

    constructor(connectionString: string) {
        this.connectionString = connectionString;
    }

    public connect(): PrismaClient {
        if (!DatabaseConnection.instance) {
            const adapter = new PrismaPg({
                connectionString: this.connectionString
            });
            DatabaseConnection.instance = new PrismaClient({ adapter });
        }
        return DatabaseConnection.instance;
    }

    public getInstance() {
        return DatabaseConnection.instance
    }
}