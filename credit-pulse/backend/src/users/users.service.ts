import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  // Mock some data here until we get access to the Database
  private users = [
    {
      user_id: '1',
      role_id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'joe@doe.com',
      password_hash: 'hashedpassword',
      phone: '123-456-7890',
      last_login_at: new Date(),
      failed_login_attempts: 0,
      locked_until: null,
      password_changed_at: new Date(),
      is_email_verified: true,
      is_system_user: false,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      user_id: '2',
      role_id: '2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@smith.com',
      password_hash: 'hashedpassword',
      phone: '987-654-3210',
      last_login_at: new Date(),
      failed_login_attempts: 0,
      locked_until: null,
      password_changed_at: new Date(),
      is_email_verified: true,
      is_system_user: false,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  findOne(username: string) {
    return this.users.find((u) => u.email === username || u.phone === username);
  }
}
