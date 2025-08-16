// Test tree-shaking - each import should be independent
import type { Product } from '@juanpprieto/shopify-api-types/sfapi/2025-07';

import type { Shop } from '@juanpprieto/shopify-api-types/admin/2025-07';

import type { Customer } from '@juanpprieto/shopify-api-types/caapi/2025-07';

const product: Product = {} as Product;
const shop: Shop = {} as Shop;
const customer: Customer = {} as Customer;

export const treeShakingStatus = 'success';

export { product, shop, customer };
