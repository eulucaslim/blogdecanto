import { User } from "../../domain/entities/user";
import { UserPrisma } from "../../application/repositories/user.repository";

export class UserMapper {

    static toDomain(prismaUser: UserPrisma) {
        return User.create(
            prismaUser.username,
            prismaUser.email,
            prismaUser.password,
            prismaUser.id,
            {
                googleSubject: prismaUser.googleSubject,
                avatarUrl: prismaUser.avatarUrl,
                role: prismaUser.role,
            }
        )
    }

    static toPrisma(entity: User) {
        return {
            id: entity.id,
            username: entity.username,
            email: entity.email,
            password: entity.password,
            googleSubject: entity.googleSubject,
            avatarUrl: entity.avatarUrl,
            role: entity.role,
        }
    }
}