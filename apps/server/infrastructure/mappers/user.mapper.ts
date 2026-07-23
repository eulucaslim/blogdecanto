import { User } from "../../domain/entities/user";
import { UserPrisma } from "../../application/repositories/user.repository";

export class UserMapper {

    static toDomain(prismaUser: UserPrisma) {
        
        const { id, username, email, password } = prismaUser;
        
        return User.create(
            username, 
            email, 
            password,
            id
        )
    }

    static toPrisma(entity: User) {
        return {
            id: entity.id,
            username: entity.username,
            email: entity.email,
            password: entity.username
        }
    }
}