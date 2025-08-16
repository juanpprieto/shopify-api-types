// Test root-level API exports with version namespaces
import type * as Sfapi from '@juanpprieto/shopify-api-types/sfapi';
import type * as Caapi from '@juanpprieto/shopify-api-types/caapi';
import type * as Admin from '@juanpprieto/shopify-api-types/admin';

const productCurrent: Sfapi.v2025_07.Product = {} as Sfapi.v2025_07.Product;
const productPrevious: Sfapi.v2025_04.Product = {} as Sfapi.v2025_04.Product;
const productNext: Sfapi.v2025_10.Product = {} as Sfapi.v2025_10.Product;
const productUnstable: Sfapi.vunstable.Product = {} as Sfapi.vunstable.Product;

const customerCurrent: Caapi.v2025_07.Customer = {} as Caapi.v2025_07.Customer;
const customerPrevious: Caapi.v2025_04.Customer = {} as Caapi.v2025_04.Customer;
const customerNext: Caapi.v2025_10.Customer = {} as Caapi.v2025_10.Customer;
const customerUnstable: Caapi.vunstable.Customer =
  {} as Caapi.vunstable.Customer;

const shopCurrent: Admin.v2025_07.Shop = {} as Admin.v2025_07.Shop;
const shopPrevious: Admin.v2025_04.Shop = {} as Admin.v2025_04.Shop;
const shopNext: Admin.v2025_10.Shop = {} as Admin.v2025_10.Shop;
const shopUnstable: Admin.vunstable.Shop = {} as Admin.vunstable.Shop;

export const rootExportsStatus = 'success';

export {
  productCurrent,
  productPrevious,
  productNext,
  productUnstable,
  customerCurrent,
  customerPrevious,
  customerNext,
  customerUnstable,
  shopCurrent,
  shopPrevious,
  shopNext,
  shopUnstable,
};
