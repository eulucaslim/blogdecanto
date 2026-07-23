
export interface LikeProps {
    id: string
    isLiked: boolean
    authorId: string
    postId: string
    createdAt: Date
}

export class Like {

    private constructor(private props: LikeProps) {}

    public static create(isLiked: boolean, authorId: string, postId: string, id?: string) {

        if (!postId || !authorId){
            throw new Error("This props not can be empty!")
        }
        return new Like({
            id: id ?? crypto.randomUUID().toString(),
            isLiked,
            authorId,
            postId,
            createdAt: new Date()
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