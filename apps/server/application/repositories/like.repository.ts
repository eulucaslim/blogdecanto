
import { DatabaseConnectionPrisma } from "../../infrastructure/db/database";
import { Repository } from "../interfaces/repositories";
import { Like as LikeEntity } from "../../domain/entities/like";
import { LikeMapper } from "../../infrastructure/mappers/like.mapper";


export type LikePrisma = {
    id: string,
    isLiked: boolean,
    authorId: string,
    postId: string,
}

class LikeRepository implements Repository<LikeEntity> {

    constructor(private db : DatabaseConnectionPrisma) { }

    async create(entity: LikeEntity): Promise<LikeEntity> {

        const data = LikeMapper.toPrisma(entity)
        const prismaLike = await this.db.instance?.like.create({ data }) as LikePrisma
        const LikeEntity = LikeMapper.toDomain(prismaLike)

        return LikeEntity;
    }
    
    async delete(id: string): Promise<void> {
        await this.db.instance?.like.delete({
            where: { id }
        })
    }

    async findById(id: string): Promise<LikeEntity> {
        const prismaLike = await this.db.instance?.like.findFirst({
            where: { id }
        })

        if (!prismaLike) {
            throw new Error(`Like ${id} not found `)
        }

        const LikeEntity = LikeMapper.toDomain(prismaLike)
        return LikeEntity;
    }

    async update(id: string, entity: LikeEntity): Promise<LikeEntity> {

        const prismaLike = await this.db.instance?.like.findFirst({
            where: { id }
        })

         if (!prismaLike) {
            throw new Error(`Like ${id} not found `)
        }

        const data = LikeMapper.toPrisma(entity)
        
        const updatedPrismaLike = await this.db.instance?.like.update({
            where: { id },
            data: data
        }) as LikePrisma

        return LikeMapper.toDomain(updatedPrismaLike)
    }

    async findAll(): Promise<LikeEntity[] | []> {
        
        const Likes = await this.db.instance?.like.findMany()

        return Likes?.map(l => LikeMapper.toDomain(l)) ?? []
    }
}