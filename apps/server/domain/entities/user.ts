
export interface UserProps {
    id: string
    username: string
    email: string
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
            email
        })
    }

    public get id(){
        return this.props.id;
    }
}