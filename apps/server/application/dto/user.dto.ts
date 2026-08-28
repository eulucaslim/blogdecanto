export interface UserDTOProps {
    username: string
    email: string
    password: string | null
}

export class UserDTO {

    private constructor(private props: UserDTOProps) {}

    public static create(username: string, email: string, password?: string | null) {

        return new UserDTO({
            username,
            email,
            password: password ?? null
        })
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

}