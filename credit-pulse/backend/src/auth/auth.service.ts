import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
    login(username: string, password: string): boolean {
        // TODO: Implement your authentication logic here, this is just a mock implementation
        return username === 'admin' && password === 'password';
    }
}
