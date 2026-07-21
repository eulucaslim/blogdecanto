import { User } from "../../domain/entities/user";
import { Prisma } from "../generated/prisma/client";


export class UserMapper {

    static toDomain(dto: Prisma.UserUncheckedCreateInput) {
        const { username, email } = dto;
        return User.create(username, email)
    }
}