import { Post } from "../../domain/entities/post";
import { PostPrisma } from "../../application/repositories/post.repository";

export class PostMapper {

    static toDomain(prismaPost: PostPrisma) {
        
        const { id, content, authorId } = prismaPost;
        
        return Post.create(
            content, 
            authorId,
            id
        )
    }

    static toPrisma(entity: Post) {
        return {
            id: entity.id,
            content: entity.content,
            authorId: entity.authorId
        }
    }
}