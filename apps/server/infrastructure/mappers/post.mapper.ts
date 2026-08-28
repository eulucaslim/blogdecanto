import { Post } from "../../domain/entities/post";
import { PostPrisma } from "../../application/repositories/post.repository";

export class PostMapper {

    static toDomain(prismaPost: PostPrisma) {
        return Post.create(
            prismaPost.content,
            prismaPost.authorId,
            prismaPost.id,
            {
                title: prismaPost.title,
                slug: prismaPost.slug,
                excerpt: prismaPost.excerpt,
                coverImageKey: prismaPost.coverImageKey,
                status: prismaPost.status,
                publishedAt: prismaPost.publishedAt,
            }
        )
    }

    static toPrisma(entity: Post) {
        return {
            id: entity.id,
            title: entity.title,
            slug: entity.slug,
            content: entity.content,
            excerpt: entity.excerpt,
            coverImageKey: entity.coverImageKey,
            status: entity.status,
            publishedAt: entity.publishedAt,
            authorId: entity.authorId
        }
    }
}