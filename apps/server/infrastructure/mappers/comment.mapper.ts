import { Comment } from "../../domain/entities/comment";
import { CommentPrisma } from "../../application/repositories/comment.repository";

export class CommentMapper {

    static toDomain(prismaComment: CommentPrisma) {
        
        const { id, content, authorId, postId } = prismaComment;
        
        return Comment.create(
            content, 
            postId, 
            authorId,
            id
        )
    }

    static toPrisma(entity: Comment) {
        return {
            id: entity.id,
            content: entity.content,
            postId: entity.postId,
            authorId: entity.authorId
        }
    }
}