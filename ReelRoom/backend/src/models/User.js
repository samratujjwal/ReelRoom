export class User {
    id;
    username;
    email;
    passwordHash;
    createdAt;
    constructor(id, username, email, passwordHash, createdAt) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.createdAt = createdAt || new Date();
    }
    toJSON() {
        return {
            id: this.id,
            username: this.username,
            email: this.email,
            createdAt: this.createdAt.toISOString()
        };
    }
}
