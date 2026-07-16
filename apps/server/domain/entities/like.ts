
export interface LikeProps {
    id: string
    isLiked: boolean
    authorId: string
    postId: string
}

export class Like {

    private constructor(private props: LikeProps) {}

    public static create(isLiked: boolean, authorId: string, postId: string) {

        if (!postId || !authorId){
            throw new Error("This props not can be empty!")
        }
        return new Like({
            id: crypto.randomUUID().toString(),
            isLiked,
            authorId,
            postId
        })
    }

    public get id(){
        return this.props.id;
    }

    public get isLiked(){
        return this.props.isLiked;
    }

    public get authorId(){
        return this.props.authorId;
    }

    public get postId(){
        return this.props.postId;
    }
}