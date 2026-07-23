
import { DatabaseConnectionPrisma } from "../../infrastructure/db/database";
import { Repository } from "../interfaces/repositories";
import { Post as PostEntity } from "../../domain/entities/post";
import { PostMapper } from "../../infrastructure/mappers/post.mapper";


export type PostPrisma = {
    id: string,
    content: string,
    authorId: string,
}

class PostRepository implements Repository<PostEntity> {

    constructor(private db : DatabaseConnectionPrisma) { }

    async create(entity: PostEntity): Promise<PostEntity> {

        const data = PostMapper.toPrisma(entity)
        const prismaPost = await this.db.instance?.post.create({ data }) as PostPrisma
        const PostEntity = PostMapper.toDomain(prismaPost)

        return PostEntity;
    }
    
    async delete(id: string): Promise<void> {
        await this.db.instance?.post.delete({
            where: { id }
        })
    }

    async findById(id: string): Promise<PostEntity> {
        const prismaPost = await this.db.instance?.post.findFirst({
            where: { id }
        })

        if (!prismaPost) {
            throw new Error(`Post ${id} not found `)
        }

        const PostEntity = PostMapper.toDomain(prismaPost)
        return PostEntity;
    }

    async update(id: string, entity: PostEntity): Promise<PostEntity> {

        const prismaPost = await this.db.instance?.post.findFirst({
            where: { id }
        })

         if (!prismaPost) {
            throw new Error(`Post ${id} not found `)
        }

        const data = PostMapper.toPrisma(entity)
        
        const updatedPrismaPost = await this.db.instance?.post.update({
            where: { id },
            data: data
        }) as PostPrisma

        return PostMapper.toDomain(updatedPrismaPost)
    }

    async findAll(): Promise<PostEntity[] | []> {
        
        const Posts = await this.db.instance?.post.findMany()

        return Posts?.map(p => PostMapper.toDomain(p)) ?? []
    }
}