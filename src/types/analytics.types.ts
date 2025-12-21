export interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    file: File;
    status: 'uploading' | 'processing' | 'completed' | 'error';
    progress: number;
    category?: string;
    recordsCount?: number;
    uploadedAt?: Date;
}

export interface AnalysisResult {
    category: 'duty-schedule' | 'staff' | 'kitchen-crm' | 'analytics' | 'unknown';
    confidence: number;
    recordsFound: number;
    suggestions: string[];
    preview: any[];
}

export interface ActivityItem {
    id: string;
    type: 'duty' | 'staff' | 'kitchen' | 'upload';
    title: string;
    description: string;
    timestamp: Date;
    icon: string;
}

export interface StaffMember {
    id: string;
    name: string;
    position: string;
    department: string;
    email: string;
    phone?: string;
    status: 'active' | 'on-leave' | 'inactive';
    avatar?: string;
    hireDate: Date;
}

export interface ScheduleShift {
    id: string;
    date: Date;
    startTime: string;
    endTime: string;
    staffId: string;
    staffName: string;
    role: string;
    department: string;
    status: 'scheduled' | 'completed' | 'cancelled';
}

export interface KitchenOrder {
    id: string;
    orderId: string;
    customer: string;
    items: OrderItem[];
    totalAmount: number;
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
    orderTime: Date;
    completedTime?: Date;
}

export interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
}

export interface DashboardStats {
    scheduledShifts: number;
    activeStaff: number;
    kitchenOrders: number;
    filesUploaded: number;
    trends: {
        shifts: number;
        staff: number;
        orders: number;
    };
}

export type NavigationSection =
    | 'dashboard'
    | 'duty-schedule'
    | 'off-duty'
    | 'staff'
    | 'kitchen-crm'
    | 'bulk-upload'
    | 'analytics'
    | 'settings'
    | 'kitchen-ai';
