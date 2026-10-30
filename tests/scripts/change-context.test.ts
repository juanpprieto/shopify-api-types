import { describe, it, expect } from 'vitest';
import {
  describeChange,
  parseChangeTarget,
} from '../../scripts/lib/change-context.js';

describe('parseChangeTarget', () => {
  it('finds the type and member in each message form', () => {
    expect(parseChangeTarget("Type 'PriceRule' was removed", 'x')).toEqual({
      type: 'PriceRule',
    });
    expect(
      parseChangeTarget(
        "Field 'marketCurrencySettingsUpdate' (deprecated) was removed from object type 'Mutation'",
        'x',
      ),
    ).toEqual({ type: 'Mutation', member: 'marketCurrencySettingsUpdate' });
    expect(
      parseChangeTarget(
        "Enum value 'PUBLIC_READ' (deprecated) was removed from enum 'MetaobjectAdminAccess'",
        'x',
      ),
    ).toEqual({ type: 'MetaobjectAdminAccess', member: 'PUBLIC_READ' });
    expect(
      parseChangeTarget(
        "Argument 'paymentRequest: ShopPayPaymentRequestInput!' was removed from field 'Mutation.shopPayPaymentRequestSessionCreate'",
        'x',
      ),
    ).toEqual({
      type: 'Mutation',
      member: 'shopPayPaymentRequestSessionCreate',
    });
  });
});

describe('describeChange with the stored schemas', () => {
  it('adds the migration note of a removed field from the old schema', () => {
    const result = describeChange('admin', '2026-10', '2027-01', {
      changeType: 'removed',
      description:
        "Field 'marketCurrencySettingsUpdate' (deprecated) was removed from object type 'Mutation'",
    });
    expect(result.deprecationReason).toMatch(/marketCreate.*marketUpdate/);
  });

  it('adds the migration note of a removed enum value', () => {
    const result = describeChange('admin', '2026-10', '2027-01', {
      changeType: 'modified',
      description:
        "Enum value 'PUBLIC_READ' (deprecated) was removed from enum 'MetaobjectAdminAccess'",
    });
    expect(result.deprecationReason).toMatch(/MERCHANT_READ/);
  });

  it('adds the description of an added type from the new schema', () => {
    const result = describeChange('admin', '2026-10', '2027-01', {
      name: 'AnalyticsSchema',
      changeType: 'added',
      description: "Type 'AnalyticsSchema' was added",
    });
    expect(result.shopifyDescription).toMatch(/analytics/i);
  });
});
