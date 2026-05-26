export type UserRole = 'citizen' | 'officer' | 'supervisor' | 'admin';

export interface UserDepartmentRef {
  id?: string;
  name?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  department?: string | UserDepartmentRef;
  avatarUrl?: string;
  status?: 'active' | 'inactive' | 'suspended';
  lastLoginAt?: string;
  createdAt?: string;
  firstName?: string;
  lastName?: string;
  currentAddress?: string;
  permanentAddress?: string;
  aadhaarNumber?: string;
  occupation?: string;
  age?: number;
  gender?: string;
  ward?: string;
  district?: string;
  profilePhotoUrl?: string;
  trustScore?: number;
  trustLevel?: string;
  employeeId?: string;
}

