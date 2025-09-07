import * as React from 'react';
const { useState } = React;
import { StorefrontDemo } from './StorefrontDemo';
import { AdminDemo } from './AdminDemo';
import './App.css';

function App() {
  const [activeAPI, setActiveAPI] = useState<'storefront' | 'admin'>(
    'storefront',
  );

  return (
    <>
      <div style={{ padding: '20px' }}>
        <h1>@juanpprieto/shopify-api-types Demo</h1>
        <p>Demonstrating TypeScript integration with Shopify GraphQL APIs</p>

        {/* API Selection Tabs */}
        <div style={{ marginBottom: '30px', borderBottom: '2px solid #ddd' }}>
          <button
            onClick={() => setActiveAPI('storefront')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: activeAPI === 'storefront' ? '#007cba' : '#f0f0f0',
              color: activeAPI === 'storefront' ? 'white' : 'black',
              cursor: 'pointer',
              marginRight: '5px',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            🛍️ Storefront API
          </button>
          <button
            onClick={() => setActiveAPI('admin')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: activeAPI === 'admin' ? '#007cba' : '#f0f0f0',
              color: activeAPI === 'admin' ? 'white' : 'black',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            ⚙️ Admin API
          </button>
        </div>

        {/* API Demo Content */}
        {activeAPI === 'storefront' && <StorefrontDemo />}
        {activeAPI === 'admin' && <AdminDemo />}
      </div>
    </>
  );
}

export default App;
