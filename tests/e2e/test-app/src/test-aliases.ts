// Test version alias imports
import type { Product as ProductCurrent } from '@juanpprieto/shopify-api-types/sfapi/current';
import type { Product as ProductPrevious } from '@juanpprieto/shopify-api-types/sfapi/previous';
import type { Product as ProductNext } from '@juanpprieto/shopify-api-types/sfapi/next';

import type { Shop as ShopCurrent } from '@juanpprieto/shopify-api-types/admin/current';
import type { Shop as ShopPrevious } from '@juanpprieto/shopify-api-types/admin/previous';
import type { Shop as ShopNext } from '@juanpprieto/shopify-api-types/admin/next';

import type { Customer as CustomerCurrent } from '@juanpprieto/shopify-api-types/caapi/current';
import type { Customer as CustomerPrevious } from '@juanpprieto/shopify-api-types/caapi/previous';
import type { Customer as CustomerNext } from '@juanpprieto/shopify-api-types/caapi/next';

const productCurrent: ProductCurrent = {} as ProductCurrent;
const productPrevious: ProductPrevious = {} as ProductPrevious;
const productNext: ProductNext = {} as ProductNext;

const shopCurrent: ShopCurrent = {} as ShopCurrent;
const shopPrevious: ShopPrevious = {} as ShopPrevious;
const shopNext: ShopNext = {} as ShopNext;

const customerCurrent: CustomerCurrent = {} as CustomerCurrent;
const customerPrevious: CustomerPrevious = {} as CustomerPrevious;
const customerNext: CustomerNext = {} as CustomerNext;

export const aliasTestStatus = 'success';

export {
  productCurrent,
  productPrevious,
  productNext,
  shopCurrent,
  shopPrevious,
  shopNext,
  customerCurrent,
  customerPrevious,
  customerNext,
};
