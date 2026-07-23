import { Like } from "../../domain/entities/like";
import { LikePrisma } from "../../application/repositories/like.repository";

export class LikeMapper {

    static toDomain(prismaLike: LikePrisma) {
        
        const { id, isLiked, authorId, postId } = prismaLike;
        
        return Like.create(
            isLiked, 
            postId, 
            authorId,
            id
        )
    }

    static toPrisma(entity: Like) {
        return {
            id: entity.id,
            isLiked: entity.isLiked,
            postId: entity.postId,
            authorId: entity.authorId
        }
    }
}