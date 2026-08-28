import { Like } from "./like"
import { Post } from "./post"

export type UserRole = "USER" | "ADMIN"

export interface UserProps {
    id: string
    username: string
    email: string
    password: string | null
    googleSubject: string | null
    avatarUrl: string | null
    role: UserRole
    createdAt: Date
    updatedAt: Date
    posts: Post[]
    comments: Comment[]
    likes: Like[]
}

export class User {

    private constructor(private props: UserProps) {}

    public static create(
        username: string,
        email: string,
        password?: string | null,
        id?: string,
        options: Partial<Pick<UserProps, "googleSubject" | "avatarUrl" | "role">> = {}
    ) {

        if (!username || !email){
            throw new Error("This props not can be empty!")
        }

        return new User({
            id: id ?? crypto.randomUUID().toString(),
            username,
            email,
            password: password ?? null,
            googleSubject: options.googleSubject ?? null,
            avatarUrl: options.avatarUrl ?? null,
            role: options.role ?? "USER",
            createdAt: new Date(),
            updatedAt: new Date(),
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
    
    public get password(): string | null {
        return this.props.password
    }

    public get googleSubject(): string | null {
        return this.props.googleSubject
    }

    public get avatarUrl(): string | null {
        return this.props.avatarUrl
    }

    public get role(): UserRole {
        return this.props.role
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