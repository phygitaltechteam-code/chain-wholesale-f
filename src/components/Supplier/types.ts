export interface Supplier {
  id: string;
  fullname: string;
  shopName?: string;
  phoneNumber?: string;
  secondaryPhoneNumber?: string;
  city?: string;
  address?: string;
  birthday?: string;
  anniversary?: string;
  GST?: string;
  PAN?: string;
  due?: number;
  aadhar?: string;
  adminId?: string;
  createdAt?: string;
  updatedAt?: string;
  initials?: string;
  tier?: string;
  balance?: number;
  gold?: string | number;
  silver?: string | number;
}

export interface SupplierFormData {
  fullname: string;
  shopName?: string;
  phoneNumber: string;
  secondaryPhoneNumber?: string;
  city?: string;
  address?: string;
  birthday?: string;
  anniversary?: string;
  GST?: string;
  PAN?: string;
  aadhar?: string;
}
