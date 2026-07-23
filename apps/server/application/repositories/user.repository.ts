
import { DatabaseConnectionPrisma } from "../../infrastructure/db/database";
import { Repository } from "../interfaces/repositories";
import { User as UserEntity } from "../../domain/entities/user";
import { UserMapper } from "../../infrastructure/mappers/user.mapper";


export type UserPrisma = {
    id: string,
    username: string,
    email: string,
    password: string,
}

class UserRepository implements Repository<UserEntity> {

    constructor(private db : DatabaseConnectionPrisma) { }

    async create(entity: UserEntity): Promise<UserEntity> {

        const data = UserMapper.toPrisma(entity)
        const prismaUser = await this.db.instance?.user.create({ data }) as UserPrisma
        const userEntity = UserMapper.toDomain(prismaUser)

        return userEntity;
    }
    
    async delete(id: string): Promise<void> {
        await this.db.instance?.user.delete({
            where: { id }
        })
    }

    async findById(id: string): Promise<UserEntity> {
        const prismaUser = await this.db.instance?.user.findFirst({
            where: { id }
        })

        if (!prismaUser) {
            throw new Error(`User ${id} not found `)
        }

        const userEntity = UserMapper.toDomain(prismaUser)
        return userEntity;
    }

    async update(id: string, entity: UserEntity): Promise<UserEntity> {

        const prismaUser = await this.db.instance?.user.findFirst({
            where: { id }
        })

         if (!prismaUser) {
            throw new Error(`User ${id} not found `)
        }

        const data = UserMapper.toPrisma(entity)
        
        const updatedPrismaUser = await this.db.instance?.user.update({
            where: { id },
            data: data
        }) as UserPrisma

        return UserMapper.toDomain(updatedPrismaUser)
    }

    async findAll(): Promise<UserEntity[] | []> {
        
        const users = await this.db.instance?.user.findMany()

        return users?.map(u => UserMapper.toDomain(u)) ?? []
    }
}