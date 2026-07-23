
import { DatabaseConnectionPrisma } from "../../infrastructure/db/database";
import { Repository } from "../interfaces/repositories";
import { Comment as CommentEntity } from "../../domain/entities/comment";
import { CommentMapper } from "../../infrastructure/mappers/comment.mapper";


export type CommentPrisma = {
    id: string,
    content: string,
    authorId: string,
    postId: string,
}

class CommentRepository implements Repository<CommentEntity> {

    constructor(private db : DatabaseConnectionPrisma) { }

    async create(entity: CommentEntity): Promise<CommentEntity> {

        const data = CommentMapper.toPrisma(entity)
        const prismaComment = await this.db.instance?.comment.create({ data }) as CommentPrisma
        const CommentEntity = CommentMapper.toDomain(prismaComment)

        return CommentEntity;
    }
    
    async delete(id: string): Promise<void> {
        await this.db.instance?.comment.delete({
            where: { id }
        })
    }

    async findById(id: string): Promise<CommentEntity> {
        const prismaComment = await this.db.instance?.comment.findFirst({
            where: { id }
        })

        if (!prismaComment) {
            throw new Error(`Comment ${id} not found `)
        }

        const CommentEntity = CommentMapper.toDomain(prismaComment)
        return CommentEntity;
    }

    async update(id: string, entity: CommentEntity): Promise<CommentEntity> {

        const prismaComment = await this.db.instance?.comment.findFirst({
            where: { id }
        })

         if (!prismaComment) {
            throw new Error(`Comment ${id} not found `)
        }

        const data = CommentMapper.toPrisma(entity)
        
        const updatedPrismaComment = await this.db.instance?.comment.update({
            where: { id },
            data: data
        }) as CommentPrisma

        return CommentMapper.toDomain(updatedPrismaComment)
    }

    async findAll(): Promise<CommentEntity[] | []> {
        
        const Comments = await this.db.instance?.comment.findMany()

        return Comments?.map(c => CommentMapper.toDomain(c)) ?? []
    }
}