// Test basic imports from all APIs
import type { Shop } from '@juanpprieto/shopify-api-types/admin/2025-07';
import type { Product } from '@juanpprieto/shopify-api-types/sfapi/2025-07';
import type { Customer } from '@juanpprieto/shopify-api-types/caapi/2025-07';

const shop: Shop = {} as Shop;
const product: Product = {} as Product;
const customer: Customer = {} as Customer;
function getShopName(s: Shop): string {
  return s.name || 'Unknown';
}

function getProductTitle(p: Product): string {
  return p.title || 'Untitled';
}

function getCustomerEmail(c: Customer): string | undefined | null {
  return c.emailAddress?.emailAddress;
}

export const simpleTestStatus = 'success';

export {
  shop,
  product,
  customer,
  getShopName,
  getProductTitle,
  getCustomerEmail,
};
