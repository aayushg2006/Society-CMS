export interface Society {
  id: number;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  subscriptionPlan: string;
  latitude: number | null;
  longitude: number | null;
  geoFenceRadius: number;
  createdAt: string;
}

export interface Building {
  id: number;
  name: string;
  code: string;
  totalFloors: number;
  hasLift: boolean;
  society?: Society;
}

export interface Flat {
  id: number;
  floorNumber: number;
  flatNumber: string;
  type: string;
  occupancyStatus: string;
  intercomExtension: string;
  building?: Building;
}

export interface UserInfo {
  id: number;
  fullName: string;
  email: string;
  role: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  staffSpecialization?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  flatId?: number;
  flatNumber?: string;
  buildingName?: string;
  societyId?: number;
  societyName?: string;
}

export interface Complaint {
  id: number;
  title: string;
  description: string;
  category: string;
  scope: string;
  priority: string;
  status: string;
  imageUrl?: string;
  vendorBeforeImageUrl?: string;
  vendorAfterImageUrl?: string;
  upvoteCount: number;
  latitude?: number;
  longitude?: number;
  expectedCompletionDate?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  userName: string;
  userEmail: string;
  flatId?: number;
  flatNumber?: string;
  buildingName?: string;
  commonAreaId?: number;
  commonAreaName?: string;
  assignedStaffId?: number;
  assignedStaffName?: string;
  assignedStaffSpecialization?: string;
  parentComplaintId?: number;
  societyId: number;
  followerCount: number;
  isFollowing: boolean;
}

export interface ActivityLog {
  id: number;
  action: string;
  details: string;
  actorId: number;
  actorName: string;
  actorRole: string;
  createdAt: string;
}

export interface DashboardStats {
  totalComplaints: number;
  openComplaints: number;
  inProgressComplaints: number;
  resolvedComplaints: number;
  closedComplaints: number;
  criticalComplaints: number;
  highPriorityComplaints: number;
  totalUsers: number;
  totalStaff: number;
  overdueComplaints: number;
  complaintsByCategory: Record<string, number>;
  complaintsByStatus: Record<string, number>;
}

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  role: string;
  userId: number;
  societyId: number;
  societyName: string;
  societyCode: string;
  verified: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
