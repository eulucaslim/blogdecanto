import { Like } from "./like"

export interface PostProps {
    id: string
    content: string
    authorId: string
    comments: Comment[]
    likes: Like[]
}

export class Post {

    private constructor(private props: PostProps) {}

    public static create(content: string, authorId: string, id?: string) {

        if (!content || !authorId){
            throw new Error("This props not can be empty!")
        }
        return new Post({
            id: id ?? crypto.randomUUID().toString(),
            content,
            authorId,
            comments: [],
            likes: []
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

    public get comments(): Comment[] {
        return this.props.comments
    }

    public get likes(): Like[] {
        return this.props.likes
    }

    add_comment(comment: Comment): void {
        this.comments.push(comment)
    }

    add_like(like: Like): void {
        this.likes.push(like)
    }
}