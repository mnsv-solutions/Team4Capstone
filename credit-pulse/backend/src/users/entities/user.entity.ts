import { Role } from './role.entity.js';

export class User {
  user_id: string;
  role_id: string;
  role: Role | null = null;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  phone: string | null = null;
  last_login_at: Date | null = null;
  failed_login_attempts = 0;
  locked_until: Date | null = null;
  password_changed_at: Date | null = null;
  is_email_verified = false;
  is_system_user = false;
  is_active = true;
  created_at: Date = new Date();
  updated_at: Date = new Date();
}
