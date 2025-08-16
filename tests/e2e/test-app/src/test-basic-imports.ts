// Test namespace imports
import type * as Admin from '@juanpprieto/shopify-api-types/admin/2025-07';
import type * as Storefront from '@juanpprieto/shopify-api-types/sfapi/2025-07';
import type * as CustomerAccount from '@juanpprieto/shopify-api-types/caapi/2025-07';

const shop: Admin.Shop = {} as Admin.Shop;
const product: Storefront.Product = {} as Storefront.Product;
const customer: CustomerAccount.Customer = {} as CustomerAccount.Customer;

export const basicImportsStatus = 'success';

export { shop, product, customer };
