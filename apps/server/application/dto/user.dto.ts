export interface UserDTOProps {
    username: string
    email: string
    password: string
}

export class UserDTO {

    private constructor(private props: UserDTOProps) {}

    public static create(username: string, email: string, password: string) {

        return new UserDTO({
            username,
            email,
            password
        })
    }

    public get username(): string {
        return this.props.username;
    }

    public get email(): string {
        return this.props.email;
    }
    
    public get password(): string {
        return this.props.password
    }

}