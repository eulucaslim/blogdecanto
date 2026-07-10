import { Repository } from "../interfaces/repositories";


class UserRepository implements Repository{

    // constructor(private dbConnection : DatabaseConnection) {}

    create<User>(entity: User): User {
        throw new Error("Method not implemented.");
    }
    delete(id: string): void {
        throw new Error("Method not implemented.");
    }
    findById<T>(id: string): T {
        throw new Error("Method not implemented.");
    }
    update<T>(entity: T, id: string): T {
        throw new Error("Method not implemented.");
    }
}