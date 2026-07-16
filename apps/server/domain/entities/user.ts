import { Like } from "./like"
import { Post } from "./post"

export interface UserProps {
    id: string
    username: string
    email: string
    posts: Post[]
    comments: Comment[]
    likes: Like[]
}

export class User {

    private constructor(private props: UserProps) {}

    public static create(username: string, email: string) {

        if (!username || !email){
            throw new Error("This props not can be empty!")
        }

        return new User({
            id: crypto.randomUUID().toString(),
            username,
            email,
            posts: [],
            comments: [],
            likes: []
        })
    }

    public get id(): string {
        return this.props.id;
    }

    public get username(): string {
        return this.props.username;
    }

    public get email(): string {
        return this.props.email;
    }

    public get posts(): Post[] {
        return this.props.posts
    }

    public get comments(): Comment[] {
        return this.props.comments
    }

    public get likes(): Like[] {
        return this.props.likes
    }

    add_post(post: Post): void {
        this.posts.push(post)
    }

    add_comment(comment: Comment): void {
        this.comments.push(comment)
    }

    add_like(like: Like): void {
        this.likes.push(like)
    }
    
}