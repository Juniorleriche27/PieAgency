"use client";

import type { Product } from "@/lib/private-products";
import type { PrivateResource } from "@/lib/private-resources";

const PRODUCTS_KEY = "pie_admin_products";
const RESOURCES_KEY = "pie_admin_resources";

function readKey<T>(key: string): T[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : null;
  } catch {
    return null;
  }
}

function writeKey<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

export function getStoredProducts(): Product[] | null {
  return readKey<Product>(PRODUCTS_KEY);
}

export function setStoredProducts(products: Product[]): void {
  writeKey(PRODUCTS_KEY, products);
}

export function getStoredResources(): PrivateResource[] | null {
  return readKey<PrivateResource>(RESOURCES_KEY);
}

export function setStoredResources(resources: PrivateResource[]): void {
  writeKey(RESOURCES_KEY, resources);
}
