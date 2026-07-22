
import { DatabaseConnectionPrisma } from "../../infrastructure/db/database";
import { Repository } from "../interfaces/repositories";
import { User } from "../../domain/entities/user";
import { UserMapper } from "../../infrastructure/mappers/user.mapper";
import { UserDTO } from "../dto/user.dto";



class UserRepository implements Repository<User> {

    constructor(private db : DatabaseConnectionPrisma) {
    }

    async create(entity: User): User {

        const data = {
            id: entity.id,
            username: entity.username,
            email: entity.email,
            password: entity.password
        }

        const prismaUser = await this.db.instance?.user.create({
            data: data
        })
        
        const dto = {
            username: prismaUser?.username,
            email: prismaUser?.email,
            password: prismaUser?.password,
        } as UserDTO
        // FIXME: Update this method
        const userEntity = UserMapper.toDomain()

        return null;
    }
    
    delete(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async findById(id: string): Promise<User | null>   {
        const entity = await this.db.instance?.user.findUnique({
            where: { id }
        })
        if (!entity) return null;

        return User.create(entity.username, entity.email)
    }
    update<T>(id: string, entity: T,): T {
        throw new Error("Method not implemented.");
    }

    findByEmail<UserDomain>(email: string): UserDomain {
        throw new Error("Method not implemented.");
    }
}