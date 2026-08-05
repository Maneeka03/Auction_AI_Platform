import { apiClient } from "./client";
import type { AuctionAnalysis, SellerDashboard, SellerEscrow } from "@/types/portal";
import type { Property, CreatePropertyRequest, UpdatePropertyRequest } from "@/types/property";
import type { Auction } from "@/types/auction";

export function getSellerDashboard(token: string): Promise<SellerDashboard> {
  return apiClient.get("/api/v1/seller/dashboard", { accessToken: token });
}

export function createListing(token: string, payload: CreatePropertyRequest): Promise<Property> {
  return apiClient.post("/api/v1/seller/listings", payload, { accessToken: token });
}

export function getMyListings(token: string, status?: string): Promise<Property[]> {
  const q = status ? `?status=${status}` : "";
  return apiClient.get(`/api/v1/seller/listings${q}`, { accessToken: token });
}

export function getMyListing(token: string, propertyId: string): Promise<Property> {
  return apiClient.get(`/api/v1/seller/listings/${propertyId}`, { accessToken: token });
}

export function updateListing(token: string, propertyId: string, payload: UpdatePropertyRequest): Promise<Property> {
  return apiClient.patch(`/api/v1/seller/listings/${propertyId}`, payload, { accessToken: token });
}

export function addListingImage(token: string, propertyId: string, imageUrl: string): Promise<Property> {
  return apiClient.post(`/api/v1/seller/listings/${propertyId}/images`, { image_url: imageUrl }, { accessToken: token });
}

export function getMyAuctions(token: string): Promise<Auction[]> {
  return apiClient.get("/api/v1/seller/auctions", { accessToken: token });
}

export function updateReservePrice(token: string, auctionId: string, reservePrice: string): Promise<Auction> {
  return apiClient.patch(`/api/v1/seller/auctions/${auctionId}/reserve-price`, { reserve_price: reservePrice }, { accessToken: token });
}

export function getAuctionAnalysis(token: string, auctionId: string): Promise<AuctionAnalysis> {
  return apiClient.get(`/api/v1/seller/auctions/${auctionId}/analysis`, { accessToken: token });
}

export function getMySales(token: string): Promise<Property[]> {
  return apiClient.get("/api/v1/seller/sales", { accessToken: token });
}

export function getMyEscrow(token: string): Promise<SellerEscrow[]> {
  return apiClient.get("/api/v1/seller/escrow", { accessToken: token });
}
