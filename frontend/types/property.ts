export type PropertyCategory = "Residential" | "Commercial";

export type PropertyStatus = "available" | "pending" | "sold";

export interface Property {
  id: string;
  address: string;
  category: PropertyCategory;
  price: number;
  status: PropertyStatus;
  imageSrc?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet: number;
  description: string;
  addedBy: string;
  listedAt: string;
}

export type PaymentMethod = "token" | "full";

export interface DemoPaymentResult {
  method: PaymentMethod;
  amount: number;
  confirmedAt: string;
}