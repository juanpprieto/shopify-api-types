import * as React from 'react';
const { useState } = React;
import { createGraphQLClient } from '@shopify/graphql-client';

// Import types from our package - demonstrating different import patterns
import type {
  Product,
  QueryRoot,
  Shop,
  Mutation,
  CartInput,
  Cart,
} from '@juanpprieto/shopify-api-types/sfapi/current';

// Use built-in Shopify types directly - no custom types needed!
type ProductsQueryResponse = Pick<QueryRoot, 'products'>;
type ShopQueryResponse = Pick<QueryRoot, 'shop'>;
type CartCreateMutationResponse = Pick<Mutation, 'cartCreate'>;

// Example GraphQL queries with proper typing
const GET_PRODUCTS_QUERY = `
  query getProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
          description
          images(first: 1) {
            edges {
              node {
                id
                url
                altText
              }
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

const GET_SHOP_INFO_QUERY = `
  query getShopInfo {
    shop {
      name
      description
      primaryDomain {
        url
      }
    }
  }
`;

const CREATE_CART_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        lines(first: 10) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  priceV2 {
                    amount
                    currencyCode
                  }
                  product {
                    title
                  }
                }
              }
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
        totalQuantity
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const StorefrontDemo: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  // Example client setup (would normally use real store domain)
  const client = createGraphQLClient({
    url: `https://your-shop.myshopify.com/api/${__SHOPIFY_API_VERSION__}/graphql.json`,
    headers: {
      'X-Shopify-Storefront-Access-Token': 'your-token-here',
    },
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Strongly typed query result using our Shopify types
      const response = await client.request<ProductsQueryResponse>(
        GET_PRODUCTS_QUERY,
        {
          variables: {
            first: 10,
          },
        },
      );

      // TypeScript knows the exact shape thanks to our types
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

  const fetchShopInfo = async () => {
    try {
      const response =
        await client.request<ShopQueryResponse>(GET_SHOP_INFO_QUERY);
      if (response.data?.shop) {
        setShop(response.data.shop);
      }
    } catch (error) {
      console.error('Error fetching shop info:', error);
    }
  };

  // Real cart creation mutation with full type safety
  const createCart = async () => {
    setCartLoading(true);
    try {
      // Example cart input - would normally come from user interaction
      const cartInput: CartInput = {
        lines: [
          {
            quantity: 1,
            merchandiseId: 'gid://shopify/ProductVariant/example-variant-id',
          },
        ],
      };

      // Fully typed mutation using our Shopify types
      const response = await client.request<CartCreateMutationResponse>(
        CREATE_CART_MUTATION,
        {
          variables: {
            input: cartInput,
          },
        },
      );

      // Type-safe access to mutation response
      if (response.data?.cartCreate?.cart) {
        setCart(response.data.cartCreate.cart);
        console.log(
          'Cart created successfully!',
          response.data.cartCreate.cart,
        );
      } else if (response.data?.cartCreate?.userErrors?.length) {
        console.error(
          'Cart creation errors:',
          response.data.cartCreate.userErrors,
        );
      }
    } catch (error) {
      console.error('Error creating cart:', error);
    } finally {
      setCartLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Storefront API Demo</h2>

      <div style={{ marginBottom: '20px' }}>
        <h3>Type Import Examples</h3>
        <code
          style={{ background: '#f5f5f5', padding: '10px', display: 'block' }}
        >
          {`// Built-in Shopify types - no custom types needed!
import type { QueryRoot, Mutation, CartInput } from '@juanpprieto/shopify-api-types/sfapi/current';

// Use Pick<> for targeted operations
type ProductsQuery = Pick<QueryRoot, 'products'>;
type CartMutation = Pick<Mutation, 'cartCreate'>;

// Full type safety for GraphQL operations
const response = await client.request<ProductsQuery>(query);`}
        </code>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={fetchProducts}
          disabled={loading}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          {loading ? 'Loading...' : 'Fetch Products'}
        </button>

        <button
          onClick={fetchShopInfo}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          Fetch Shop Info
        </button>

        <button
          onClick={createCart}
          disabled={cartLoading}
          style={{ padding: '8px 16px' }}
        >
          {cartLoading ? 'Creating Cart...' : 'Create Cart (Mutation)'}
        </button>
      </div>

      {shop && (
        <div
          style={{
            marginBottom: '20px',
            padding: '15px',
            border: '1px solid #ddd',
          }}
        >
          <h3>Shop Information</h3>
          <p>
            <strong>Name:</strong> {shop.name}
          </p>
          <p>
            <strong>Description:</strong> {shop.description}
          </p>
          <p>
            <strong>Domain:</strong> {shop.primaryDomain?.url}
          </p>
        </div>
      )}

      {cart && (
        <div
          style={{
            marginBottom: '20px',
            padding: '15px',
            border: '1px solid #ddd',
            backgroundColor: '#f0f8ff',
          }}
        >
          <h3>Cart Information</h3>
          <p>
            <strong>Cart ID:</strong> {cart.id}
          </p>
          <p>
            <strong>Total Quantity:</strong> {cart.totalQuantity}
          </p>
          <p>
            <strong>Total Cost:</strong> ${cart.cost?.totalAmount?.amount}{' '}
            {cart.cost?.totalAmount?.currencyCode}
          </p>

          {cart.lines?.edges && cart.lines.edges.length > 0 && (
            <div>
              <h4>Cart Lines:</h4>
              {cart.lines.edges.map((edge) => (
                <div
                  key={edge.node.id}
                  style={{
                    marginLeft: '20px',
                    padding: '10px',
                    border: '1px solid #eee',
                  }}
                >
                  <p>
                    <strong>Quantity:</strong> {edge.node.quantity}
                  </p>
                  {'product' in edge.node.merchandise && (
                    <div>
                      <p>
                        <strong>Product:</strong>{' '}
                        {edge.node.merchandise.product.title}
                      </p>
                      <p>
                        <strong>Variant:</strong> {edge.node.merchandise.title}
                      </p>
                      <p>
                        <strong>Price:</strong> $
                        {edge.node.merchandise.priceV2.amount}{' '}
                        {edge.node.merchandise.priceV2.currencyCode}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {products.length > 0 && (
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
                }}
              >
                <h4>{product.title}</h4>
                <p>{product.description}</p>
                <p>
                  <strong>Handle:</strong> {product.handle}
                </p>
                <p>
                  <strong>Price:</strong>{' '}
                  {product.priceRange?.minVariantPrice?.amount}{' '}
                  {product.priceRange?.minVariantPrice?.currencyCode}
                </p>
                {product.images?.edges?.[0] && (
                  <img
                    src={product.images.edges[0].node.url}
                    alt={product.images.edges[0].node.altText || product.title}
                    style={{ maxWidth: '100px', height: 'auto' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{ marginTop: '30px', padding: '15px', background: '#f9f9f9' }}
      >
        <h3>Type Safety Benefits</h3>
        <ul>
          <li>
            <strong>Complete GraphQL Coverage:</strong> Queries, Mutations, and
            Subscriptions fully typed
          </li>
          <li>
            <strong>Built-in Shopify Types:</strong> Use QueryRoot, Mutation,
            CartInput directly
          </li>
          <li>
            <strong>IntelliSense:</strong> Full autocomplete for all Shopify
            operations
          </li>
          <li>
            <strong>Error Prevention:</strong> Catch type mismatches at compile
            time
          </li>
          <li>
            <strong>API Version Management:</strong> Import specific versions as
            needed
          </li>
          <li>
            <strong>Schema Validation:</strong> Types match Shopify's GraphQL
            schema exactly
          </li>
        </ul>
      </div>
    </div>
  );
};
