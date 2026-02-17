export class Role {
  role_id: string;
  role_code: string;
  role_name: string;
  created_at: Date = new Date();
  created_by: string | null = null;
  updated_at: Date = new Date();
  updated_by: string | null = null;
  is_active = true;
}
