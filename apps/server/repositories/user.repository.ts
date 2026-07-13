import { DatabaseConnection } from "../infra/db/database";
import { Repository } from "../interfaces/repositories";
import { User as UserDomain } from "../domain/entities/user";
import { v7 as uuidv7 } from 'uuid';


class UserRepository implements Repository {

    constructor(private db : DatabaseConnection) {
    }

    create<UserDomain>(entity: UserDomain): UserDomain {
        if (!this.findByEmail(entity.email)) {
            const newUser = this.db.getInstance().user.create({
                data: {
                    id: uuidv7(),
                    email: entity.email
                }

            })
        }
    }
    delete(id: string): void {
        throw new Error("Method not implemented.");
    }
    public findByEmail<User>(email: string): User {
        const entity: any = this.db.getInstance().user.findUnique({
            where: { email: email }
        })
        return entity;
    }
    update<T>(entity: T, id: string): T {
        throw new Error("Method not implemented.");
    }
}