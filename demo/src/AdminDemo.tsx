import * as React from 'react';
const { useState } = React;
import { createAdminApiClient } from '@shopify/admin-api-client';

// Import types from our package - demonstrating Admin API patterns
import type {
  QueryRoot,
  Mutation,
  Product,
  Customer,
  Order,
  ProductInput,
  CustomerInput,
} from '@juanpprieto/shopify-api-types/admin/current';

// Type definitions using built-in Shopify Admin types
type ProductsQueryResponse = Pick<QueryRoot, 'products'>;
type CustomersQueryResponse = Pick<QueryRoot, 'customers'>;
type OrdersQueryResponse = Pick<QueryRoot, 'orders'>;
type ProductCreateMutationResponse = Pick<Mutation, 'productCreate'>;
type CustomerCreateMutationResponse = Pick<Mutation, 'customerCreate'>;

// Example Admin API GraphQL operations
const GET_PRODUCTS_QUERY = `
  query getProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
          status
          vendor
          productType
          tags
          totalInventory
          createdAt
          updatedAt
          priceRangeV2 {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 3) {
            edges {
              node {
                id
                title
                price
                compareAtPrice
                inventoryQuantity
                sku
              }
            }
          }
        }
      }
    }
  }
`;

const GET_CUSTOMERS_QUERY = `
  query getCustomers($first: Int!) {
    customers(first: $first) {
      edges {
        node {
          id
          firstName
          lastName
          email
          phone
          amountSpent {
            amount
            currencyCode
          }
          orders(first: 0) {
            edges {
              node {
                id
              }
            }
            totalCount
          }
          createdAt
          updatedAt
          addresses {
            address1
            city
            country
            province
          }
        }
      }
    }
  }
`;

const GET_ORDERS_QUERY = `
  query getOrders($first: Int!) {
    orders(first: $first) {
      edges {
        node {
          id
          name
          email
          phone
          displayFinancialStatus
          displayFulfillmentStatus
          totalPrice
          createdAt
          customer {
            firstName
            lastName
            email
          }
          lineItems(first: 5) {
            edges {
              node {
                id
                title
                quantity
                originalUnitPrice
              }
            }
          }
        }
      }
    }
  }
`;

const CREATE_PRODUCT_MUTATION = `
  mutation productCreate($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
        title
        handle
        status
        vendor
        productType
        tags
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CREATE_CUSTOMER_MUTATION = `
  mutation customerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer {
        id
        firstName
        lastName
        email
        phone
        createdAt
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const AdminDemo: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'products' | 'customers' | 'orders'
  >('products');

  // Example Admin API client setup
  const adminClient = createAdminApiClient({
    storeDomain: 'your-store.myshopify.com',
    apiVersion: __SHOPIFY_API_VERSION__,
    accessToken: 'your-admin-access-token-here',
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Strongly typed Admin API query
      const response = await adminClient.request<ProductsQueryResponse>(
        GET_PRODUCTS_QUERY,
        {
          variables: {
            first: 10,
          },
        },
      );

      if (response.data?.products) {
        const productNodes = response.data.products.edges.map(
          (edge) => edge.node,
        );
        setProducts(productNodes);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await adminClient.request<CustomersQueryResponse>(
        GET_CUSTOMERS_QUERY,
        {
          variables: {
            first: 10,
          },
        },
      );

      if (response.data?.customers) {
        const customerNodes = response.data.customers.edges.map(
          (edge) => edge.node,
        );
        setCustomers(customerNodes);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await adminClient.request<OrdersQueryResponse>(
        GET_ORDERS_QUERY,
        {
          variables: {
            first: 10,
          },
        },
      );

      if (response.data?.orders) {
        const orderNodes = response.data.orders.edges.map((edge) => edge.node);
        setOrders(orderNodes);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async () => {
    setMutationLoading(true);
    try {
      const productInput: ProductInput = {
        title: 'Demo Product from Types',
        vendor: 'TypeScript Demo',
        productType: 'Demo',
        tags: ['demo', 'typescript', 'shopify-api-types'],
        status: 'DRAFT',
      };

      const response = await adminClient.request<ProductCreateMutationResponse>(
        CREATE_PRODUCT_MUTATION,
        {
          variables: {
            input: productInput,
          },
        },
      );

      if (response.data?.productCreate?.product) {
        console.log('Product created:', response.data.productCreate.product);
        // Refresh products list
        fetchProducts();
      } else if (response.data?.productCreate?.userErrors?.length) {
        console.error(
          'Product creation errors:',
          response.data.productCreate.userErrors,
        );
      }
    } catch (error) {
      console.error('Error creating product:', error);
    } finally {
      setMutationLoading(false);
    }
  };

  const createCustomer = async () => {
    setMutationLoading(true);
    try {
      const customerInput: CustomerInput = {
        firstName: 'TypeScript',
        lastName: 'Demo',
        email: 'demo@shopify-api-types.com',
        phone: '+1234567890',
      };

      const response =
        await adminClient.request<CustomerCreateMutationResponse>(
          CREATE_CUSTOMER_MUTATION,
          {
            variables: {
              input: customerInput,
            },
          },
        );

      if (response.data?.customerCreate?.customer) {
        console.log('Customer created:', response.data.customerCreate.customer);
        // Refresh customers list
        fetchCustomers();
      } else if (response.data?.customerCreate?.userErrors?.length) {
        console.error(
          'Customer creation errors:',
          response.data.customerCreate.userErrors,
        );
      }
    } catch (error) {
      console.error('Error creating customer:', error);
    } finally {
      setMutationLoading(false);
    }
  };

  const handleTabClick = (tab: 'products' | 'customers' | 'orders') => {
    setActiveTab(tab);
    if (tab === 'products' && products.length === 0) {
      fetchProducts();
    } else if (tab === 'customers' && customers.length === 0) {
      fetchCustomers();
    } else if (tab === 'orders' && orders.length === 0) {
      fetchOrders();
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2>Admin API Demo</h2>

      <div style={{ marginBottom: '20px' }}>
        <h3>Type Import Examples</h3>
        <code
          style={{ background: '#f5f5f5', padding: '10px', display: 'block' }}
        >
          {`// Admin API types with full type safety
import type { QueryRoot, Mutation, ProductInput } from '@juanpprieto/shopify-api-types/admin/current';

// Alternative import pattern - previous stable version
import type { Product } from '@juanpprieto/shopify-api-types/admin/previous';

// Storefront API types
import type { Cart } from '@juanpprieto/shopify-api-types/sfapi/previous';

// Customer Account API types  
import type { Customer } from '@juanpprieto/shopify-api-types/caapi/previous';

// Use Pick<> for targeted Admin operations
type ProductsQuery = Pick<QueryRoot, 'products'>;
type ProductMutation = Pick<Mutation, 'productCreate'>;

// Full type safety for Admin API operations
const response = await adminClient.request<ProductsQuery>(query);`}
        </code>
      </div>

      {/* Tab Navigation */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        {(['products', 'customers', 'orders'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === tab ? '#007cba' : '#f0f0f0',
              color: activeTab === tab ? 'white' : 'black',
              cursor: 'pointer',
              marginRight: '5px',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={
            activeTab === 'products'
              ? fetchProducts
              : activeTab === 'customers'
                ? fetchCustomers
                : fetchOrders
          }
          disabled={loading}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          {loading
            ? 'Loading...'
            : `Fetch ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
        </button>

        {activeTab === 'products' && (
          <button
            onClick={createProduct}
            disabled={mutationLoading}
            style={{
              marginRight: '10px',
              padding: '8px 16px',
              background: '#28a745',
              color: 'white',
              border: 'none',
            }}
          >
            {mutationLoading ? 'Creating...' : 'Create Demo Product'}
          </button>
        )}

        {activeTab === 'customers' && (
          <button
            onClick={createCustomer}
            disabled={mutationLoading}
            style={{
              marginRight: '10px',
              padding: '8px 16px',
              background: '#28a745',
              color: 'white',
              border: 'none',
            }}
          >
            {mutationLoading ? 'Creating...' : 'Create Demo Customer'}
          </button>
        )}
      </div>

      {/* Products Tab Content */}
      {activeTab === 'products' && products.length > 0 && (
        <div>
          <h3>Products ({products.length})</h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            {products.map((product) => (
              <div
                key={product.id}
                style={{
                  padding: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                }}
              >
                <h4>{product.title}</h4>
                <p>
                  <strong>Handle:</strong> {product.handle}
                </p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span
                    style={{
                      color: product.status === 'ACTIVE' ? 'green' : 'orange',
                    }}
                  >
                    {product.status}
                  </span>
                </p>
                <p>
                  <strong>Vendor:</strong> {product.vendor}
                </p>
                <p>
                  <strong>Type:</strong> {product.productType}
                </p>
                <p>
                  <strong>Tags:</strong> {product.tags.join(', ')}
                </p>
                <p>
                  <strong>Total Inventory:</strong> {product.totalInventory}
                </p>
                <p>
                  <strong>Price Range:</strong>$
                  {product.priceRangeV2?.minVariantPrice?.amount} - $
                  {product.priceRangeV2?.maxVariantPrice?.amount}
                  {product.priceRangeV2?.minVariantPrice?.currencyCode}
                </p>
                {product.variants?.edges &&
                  product.variants.edges.length > 0 && (
                    <div>
                      <strong>Variants:</strong>
                      {product.variants.edges.map((variant) => (
                        <div
                          key={variant.node.id}
                          style={{ marginLeft: '20px', fontSize: '0.9em' }}
                        >
                          • {variant.node.title} - ${variant.node.price} (SKU:{' '}
                          {variant.node.sku})
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customers Tab Content */}
      {activeTab === 'customers' && customers.length > 0 && (
        <div>
          <h3>Customers ({customers.length})</h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            {customers.map((customer) => (
              <div
                key={customer.id}
                style={{
                  padding: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#f8f9fa',
                }}
              >
                <h4>
                  {customer.firstName} {customer.lastName}
                </h4>
                <p>
                  <strong>Email:</strong> {customer.email}
                </p>
                <p>
                  <strong>Phone:</strong> {customer.phone}
                </p>
                <p>
                  <strong>Orders Count:</strong>{' '}
                  {customer.orders?.edges?.length || 0}
                </p>
                <p>
                  <strong>Total Spent:</strong> ${customer.amountSpent.amount}{' '}
                  {customer.amountSpent.currencyCode}
                </p>
                <p>
                  <strong>Created:</strong>{' '}
                  {new Date(customer.createdAt).toLocaleDateString()}
                </p>
                {customer.addresses && customer.addresses.length > 0 && (
                  <div>
                    <strong>Address:</strong>
                    <div style={{ marginLeft: '20px', fontSize: '0.9em' }}>
                      {customer.addresses[0].address1},{' '}
                      {customer.addresses[0].city},{' '}
                      {customer.addresses[0].province},{' '}
                      {customer.addresses[0].country}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders Tab Content */}
      {activeTab === 'orders' && orders.length > 0 && (
        <div>
          <h3>Orders ({orders.length})</h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            {orders.map((order) => (
              <div
                key={order.id}
                style={{
                  padding: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#fff5f5',
                }}
              >
                <h4>Order {order.name}</h4>
                <p>
                  <strong>Customer:</strong> {order.customer?.firstName}{' '}
                  {order.customer?.lastName} ({order.customer?.email})
                </p>
                <p>
                  <strong>Total:</strong> ${order.totalPrice}
                </p>
                <p>
                  <strong>Financial Status:</strong>{' '}
                  <span
                    style={{
                      color:
                        order.displayFinancialStatus === 'PAID'
                          ? 'green'
                          : 'orange',
                    }}
                  >
                    {order.displayFinancialStatus}
                  </span>
                </p>
                <p>
                  <strong>Fulfillment Status:</strong>{' '}
                  {order.displayFulfillmentStatus}
                </p>
                <p>
                  <strong>Created:</strong>{' '}
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
                {order.lineItems?.edges && order.lineItems.edges.length > 0 && (
                  <div>
                    <strong>Line Items:</strong>
                    {order.lineItems.edges.map((item) => (
                      <div
                        key={item.node.id}
                        style={{ marginLeft: '20px', fontSize: '0.9em' }}
                      >
                        • {item.node.title} x{item.node.quantity} - $
                        {item.node.originalUnitPrice}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{ marginTop: '30px', padding: '15px', background: '#f9f9f9' }}
      >
        <h3>Admin API Type Safety Benefits</h3>
        <ul>
          <li>
            <strong>Complete Admin Coverage:</strong> Products, Customers,
            Orders, Inventory, and more
          </li>
          <li>
            <strong>Built-in Admin Types:</strong> Use QueryRoot, Mutation,
            ProductInput, CustomerInput directly
          </li>
          <li>
            <strong>Dedicated Client:</strong> @shopify/admin-api-client with
            proper authentication
          </li>
          <li>
            <strong>Full CRUD Operations:</strong> Create, Read, Update, Delete
            with type safety
          </li>
          <li>
            <strong>Error Handling:</strong> Typed userErrors for mutation
            failures
          </li>
          <li>
            <strong>Version Management:</strong> Switch between API versions
            with confidence
          </li>
        </ul>
      </div>
    </div>
  );
};
