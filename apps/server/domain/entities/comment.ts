import { Like } from "./like"

export interface CommentProps {
    id: string
    content: string
    postId: string
    authorId: string
}

export class Comment {

    private constructor(private props: CommentProps) {}

    public static create(content: string, authorId: string, postId: string, id?: string) {

        if (!content || !authorId || !postId) {
            throw new Error("This props not can be empty!")
        }
        return new Comment({
            id: id ?? crypto.randomUUID().toString(),
            content,
            postId,
            authorId
        })
    }

    public get id(){
        return this.props.id;
    }

    public get content(){
        return this.props.content;
    }

    public get authorId(){
        return this.props.authorId;
    }

    public get postId(){
        return this.props.postId;
    }

}