import { Like } from "./like"

export type PostStatus = "DRAFT" | "PUBLISHED"

export interface PostProps {
    id: string
    title: string
    slug: string
    content: string
    excerpt: string | null
    coverImageKey: string | null
    status: PostStatus
    publishedAt: Date | null
    authorId: string
    createdAt: Date
    updatedAt: Date
    comments: Comment[]
    likes: Like[]
}

export class Post {

    private constructor(private props: PostProps) {}

    public static create(
        content: string,
        authorId: string,
        id?: string,
        options: Partial<Pick<PostProps, "title" | "slug" | "excerpt" | "coverImageKey" | "status" | "publishedAt">> = {}
    ) {

        if (!content || !authorId){
            throw new Error("This props not can be empty!")
        }

        const postId = id ?? crypto.randomUUID().toString()
        return new Post({
            id: postId,
            title: options.title ?? "",
            slug: options.slug ?? postId,
            content,
            excerpt: options.excerpt ?? null,
            coverImageKey: options.coverImageKey ?? null,
            status: options.status ?? "DRAFT",
            publishedAt: options.publishedAt ?? null,
            authorId,
            createdAt: new Date(),
            updatedAt: new Date(),
            comments: [],
            likes: []
        })
    }

    public get id(){
        return this.props.id;
    }

    public get title(){
        return this.props.title;
    }

    public get slug(){
        return this.props.slug;
    }

    public get content(){
        return this.props.content;
    }

    public get excerpt(){
        return this.props.excerpt;
    }

    public get coverImageKey(){
        return this.props.coverImageKey;
    }

    public get status(){
        return this.props.status;
    }

    public get publishedAt(){
        return this.props.publishedAt;
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