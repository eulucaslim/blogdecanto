import { UserDTO } from "../../application/dto/user.dto";
import { User } from "../../domain/entities/user";

export class UserMapper {

    static toDomain(dto: UserDTO) {
        const { username, email, password } = dto;
        return User.create(username, email, password)
    }
}