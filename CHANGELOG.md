# @juanpprieto/shopify-api-types

## 2026.10.0

Shopify API version `2026-10` is now current. An app that upgrades gets the schema changes below and needs to address breaking changes in each API it calls.

> [!IMPORTANT]
> `2026-10` has 2 Storefront, 28 Admin, and 13 Customer Account breaking changes compared with `2026-07`.

### Breaking changes

#### Storefront API: Shop Pay payment request inputs

Shopify removes the `paymentRequest` argument from `Mutation.shopPayPaymentRequestSessionCreate` and makes `ShopPayPaymentRequestSession.paymentRequest` nullable. Change session creation calls and handle `null` when reading the payment request field. Shopify names no replacement for the argument and will remove the deprecated field in a future version.

<details>
<summary>2 Shop Pay breaking changes</summary>

- `ShopPayPaymentRequestSession.paymentRequest`
- `Mutation.shopPayPaymentRequestSessionCreate(paymentRequest: ShopPayPaymentRequestInput!)`

</details>

#### Admin API: discount price rules

Shopify removes 23 `PriceRule` types and the deprecated `DraftOrderDiscountNotAppliedWarning.priceRule` field. Use the types and queries in Shopify's [discount tutorials](https://shopify.dev/docs/apps/selling-strategies/discounts/getting-started) instead of price rules. Use `discountCode` and `discountTitle` instead of the draft order warning field.

<details>
<summary>24 discount breaking changes</summary>

- `PriceRule`
- `PriceRuleAllocationMethod`
- `PriceRuleCustomerSelection`
- `PriceRuleDiscountCode`
- `PriceRuleDiscountCodeConnection`
- `PriceRuleDiscountCodeEdge`
- `PriceRuleEntitlementToPrerequisiteQuantityRatio`
- `PriceRuleFeature`
- `PriceRuleFixedAmountValue`
- `PriceRuleItemEntitlements`
- `PriceRuleLineItemPrerequisites`
- `PriceRuleMoneyRange`
- `PriceRulePercentValue`
- `PriceRulePrerequisiteToEntitlementQuantityRatio`
- `PriceRuleQuantityRange`
- `PriceRuleShareableUrl`
- `PriceRuleShareableUrlTargetType`
- `PriceRuleShippingLineEntitlements`
- `PriceRuleStatus`
- `PriceRuleTarget`
- `PriceRuleTrait`
- `PriceRuleValidityPeriod`
- `PriceRuleValue`
- `DraftOrderDiscountNotAppliedWarning.priceRule`

</details>

#### Admin API: inventory error codes

Shopify removes `ITEM_NOT_STOCKED_AT_LOCATION` from four inventory user error enums. Remove this value from error handling for inventory adjustment, movement, and quantity mutations. Shopify names no replacement.

<details>
<summary>4 removed enum values</summary>

- `InventoryAdjustQuantitiesUserErrorCode.ITEM_NOT_STOCKED_AT_LOCATION`
- `InventoryMoveQuantitiesUserErrorCode.ITEM_NOT_STOCKED_AT_LOCATION`
- `InventorySetOnHandQuantitiesUserErrorCode.ITEM_NOT_STOCKED_AT_LOCATION`
- `InventorySetQuantitiesUserErrorCode.ITEM_NOT_STOCKED_AT_LOCATION`

</details>

#### Customer Account API: checkout types

Shopify removes checkout, line item, gift card, shipping rate, and mailing address types, plus `Customer.lastIncompleteCheckout`. Change Customer Account API queries that use these types or the deprecated checkout field. Shopify names no replacements.

<details>
<summary>9 checkout breaking changes</summary>

- `AppliedGiftCard`
- `AvailableShippingRates`
- `Checkout`
- `CheckoutLineItem`
- `CheckoutLineItemConnection`
- `CheckoutLineItemEdge`
- `CustomerMailingAddress`
- `ShippingRate`
- `Customer.lastIncompleteCheckout`

</details>

#### Customer Account API: address and delivery inputs

Shopify removes `CustomerAddressInput.territoryCode`, `SubscriptionDeliveryMethodLocalDeliveryInput.address`, and the `deliveryAddress` argument from `subscriptionContractFetchDeliveryOptions`. Change customer address inputs and subscription delivery option calls that use them. Shopify names no replacements.

<details>
<summary>3 removed address inputs</summary>

- `CustomerAddressInput.territoryCode`
- `SubscriptionDeliveryMethodLocalDeliveryInput.address`
- `Mutation.subscriptionContractFetchDeliveryOptions(deliveryAddress: CustomerMailingAddressInput)`

</details>

#### Customer Account API: order shipping titles

Shopify removes `Order.shippingTitle`, which summarizes an order's shipping titles. Change order queries that use this field. Shopify names no replacement.

<details>
<summary>1 removed field</summary>

- `Order.shippingTitle`

</details>

### New features

#### Admin API: analytics annotations and targets

Apps can create, update, and delete annotations for notable events on a shop's analytics timeline. Apps can also manage merchant-defined targets that track one analytics metric over a date range.

<details>
<summary>31 analytics additions</summary>

- `AnalyticsAnnotation`
- `AnalyticsAnnotationConnection`
- `AnalyticsAnnotationCreateInput`
- `AnalyticsAnnotationCreatePayload`
- `AnalyticsAnnotationCreateUserError`
- `AnalyticsAnnotationCreateUserErrorCode`
- `AnalyticsAnnotationDeletePayload`
- `AnalyticsAnnotationDeleteUserError`
- `AnalyticsAnnotationDeleteUserErrorCode`
- `AnalyticsAnnotationEdge`
- `AnalyticsAnnotationSortKeys`
- `AnalyticsAnnotationSource`
- `AnalyticsAnnotationUpdateInput`
- `AnalyticsAnnotationUpdatePayload`
- `AnalyticsAnnotationUpdateUserError`
- `AnalyticsAnnotationUpdateUserErrorCode`
- `AnalyticsTarget`
- `AnalyticsTargetConnection`
- `AnalyticsTargetCreateInput`
- `AnalyticsTargetCreatePayload`
- `AnalyticsTargetCreateUserError`
- `AnalyticsTargetCreateUserErrorCode`
- `AnalyticsTargetEdge`
- `AnalyticsTargetSortKeys`
- `AnalyticsTargetUpdateInput`
- `AnalyticsTargetUpdatePayload`
- `AnalyticsTargetUpdateUserError`
- `AnalyticsTargetUpdateUserErrorCode`
- `AnalyticsTargetsDeletePayload`
- `AnalyticsTargetsDeleteUserError`
- `AnalyticsTargetsDeleteUserErrorCode`

</details>

#### Admin and Customer Account APIs: requested order edits

Apps can calculate a requested order edit's financial outcome and inspect line item monetary values. Customer Account API apps can request edits to unfulfilled line items and check which quantities are editable or ineligible. The `orderRequestEdit` mutation supports an optional idempotency key through `@idempotent`; retries with the same key return the original edit.

<details>
<summary>44 order edit additions</summary>

- `CalculateRequestedOrderEditInput`
- `CalculateRequestedOrderEditLineItemRemovalInput`
- `CalculateRequestedOrderEditLineItemsInput`
- `CalculatedRequestedOrderEdit`
- `CalculatedRequestedOrderEditLineItem`
- `CalculateRequestedOrderEditInput`
- `CalculateRequestedOrderEditLineItemRemovalInput`
- `CalculateRequestedOrderEditLineItemsInput`
- `CalculatedRequestedOrderEdit`
- `CalculatedRequestedOrderEditLineItem`
- `CalculatedRequestedOrderEditLineItemConnection`
- `CalculatedRequestedOrderEditLineItemEdge`
- `CalculatedRequestedOrderEditLineItems`
- `EditableLineItem`
- `EditableLineItemConnection`
- `EditableLineItemEdge`
- `IneligibleLineItem`
- `IneligibleLineItemConnection`
- `IneligibleLineItemEdge`
- `IneligibleQuantityDetail`
- `IneligibleReason`
- `OrderRequestEditPayload`
- `OrderRequestedEditInformation`
- `RequestedOrderEdit`
- `RequestedOrderEditConnection`
- `RequestedOrderEditEdge`
- `RequestedOrderEditErrorCode`
- `RequestedOrderEditFinancialSummary`
- `RequestedOrderEditLineItem`
- `RequestedOrderEditLineItemConnection`
- `RequestedOrderEditLineItemEdge`
- `RequestedOrderEditLineItemRemovalInput`
- `RequestedOrderEditLineItems`
- `RequestedOrderEditLineItemsInput`
- `RequestedOrderEditStatus`
- `RequestedOrderEditUserError`
- `QueryRoot.requestedOrderEditCalculate`
- `Mutation.orderRequestEdit`
- `CalculatedRequestedOrderEdit.editLineItems`
- `CalculatedRequestedOrderEdit.financialSummary`
- `CalculatedRequestedOrderEdit.lineItems`
- `CalculatedRequestedOrderEditLineItem.lineItem`
- `CalculatedRequestedOrderEditLineItem.quantity`
- `CalculatedRequestedOrderEditLineItem.subtotalSet`

</details>

#### Admin API: multiple product variant barcodes

Product variant inputs can accept up to 20 barcodes and declare each barcode's identifier standard. A variant input cannot set both `barcode` and `barcodes`; without a `BarcodeType`, Shopify stores the value as entered with no declared standard.

<details>
<summary>2 barcode additions</summary>

- `BarcodeInput`
- `BarcodeType`

</details>

#### Storefront API: Shop Pay authorizing user

Storefront apps can read the Shop user that authorized a payment request through `ShopPayPaymentRequestReceipt.shopUser`. `ShopPayPaymentRequestShopUser.publicId` exposes the user's public ID.

<details>
<summary>3 Shop Pay additions</summary>

- `ShopPayPaymentRequestShopUser`
- `ShopPayPaymentRequestShopUser.publicId`
- `ShopPayPaymentRequestReceipt.shopUser`

</details>

<details>
<summary>603 other additions</summary>

Admin API (540):

- `AuditTrailAdjustment`
- `AuditTrailAdjustmentType`
- `CollectionSourceInclusionConditionMetafieldIntInput`
- `CollectionSourceInclusionConditionMetafieldIntRelation`
- `CollectionSourceInclusionConditionUpdateMetafieldIntInput`
- `CustomerSmsMarketingConsent`
- `DiscountContextUnknown`
- `HasRollouts`
- `InventoryPurchaseOrder`
- `InventoryPurchaseOrderConnection`
- `InventoryPurchaseOrderEdge`
- `InventoryPurchaseOrderLineItem`
- `InventoryPurchaseOrderLineItemConnection`
- `InventoryPurchaseOrderLineItemEdge`
- `InventoryPurchaseOrderStatus`
- `InventorySupplierSnapshot`
- `MarketRelationship`
- `MarketRelationshipConnection`
- `MarketRelationshipEdge`
- `MarketRelationshipsStatus`
- `OrderCancelJobResult`
- `OrderCancelStatus`
- `OrderDisplayRequestedEditStatus`
- `PaymentInstrumentMandateInput`
- `PaymentInstrumentMandateResourceType`
- `PaymentInstrumentSendAddEmailPayload`
- `PricingAuditTrail`
- `ProductVariantBarcode`
- `ProductVariantBarcodeConnection`
- `ProductVariantBarcodeEdge`
- `PurchaseOrderLineItemSortKeys`
- `RequestedOrderEditCreateInput`
- `RequestedOrderEditCreatePayload`
- `RequestedOrderEditCreateUserError`
- `RequestedOrderEditCreateUserErrorCode`
- `RequestedOrderEditDeclineInput`
- `RequestedOrderEditDeclinePayload`
- `RequestedOrderEditDeclineUserError`
- `RequestedOrderEditDeclineUserErrorCode`
- `RequestedOrderEditResolveInput`
- `RequestedOrderEditResolvePayload`
- `RequestedOrderEditResolveUserError`
- `RequestedOrderEditResolveUserErrorCode`
- `ReturnPoliciesEditRules`
- `ReturnPoliciesReturnRules`
- `ReturnPoliciesReturnWindowStartingFrom`
- `ReturnPolicyProfile`
- `ReturnPolicyProfileConnection`
- `ReturnPolicyProfileEdge`
- `Rollout`
- `RolloutCatalogActivateChange`
- `RolloutCatalogChange`
- `RolloutCatalogDraftChange`
- `RolloutChange`
- `RolloutChangeConnection`
- `RolloutChangeEdge`
- `RolloutCheckoutAndAccountsConfigurationChange`
- `RolloutCheckoutAndAccountsConfigurationPublishChange`
- `RolloutConnection`
- `RolloutDiscountActivateChange`
- `RolloutDiscountChange`
- `RolloutDiscountExpireChange`
- `RolloutEdge`
- `RolloutSchedule`
- `RolloutSortKeys`
- `RolloutStatus`
- `RolloutThemeChange`
- `RolloutThemePublishChange`
- `RolloutTreatment`
- `SubscriptionBillingCycleContractEditCalculatePayload`
- `SubscriptionBillingCycleContractEditCalculateUserError`
- `SubscriptionBillingCycleContractEditCalculateUserErrorCode`
- `SubscriptionCalculatedContract`
- `SubscriptionCommittedContract`
- `SubscriptionContractCalculation`
- `SubscriptionContractCalculationAnchorInput`
- `SubscriptionContractCalculationAppManagedBillingConfigInput`
- `SubscriptionContractCalculationAppManagedPricingPolicyInput`
- `SubscriptionContractCalculationBillingCycleEditInput`
- `SubscriptionContractCalculationBillingPolicyInput`
- `SubscriptionContractCalculationCadence`
- `SubscriptionContractCalculationCadenceInput`
- `SubscriptionContractCalculationCadenceUnit`
- `SubscriptionContractCalculationCommitPayload`
- `SubscriptionContractCalculationCommitUserError`
- `SubscriptionContractCalculationCommitUserErrorCode`
- `SubscriptionContractCalculationComponentLineInput`
- `SubscriptionContractCalculationContractCreateInput`
- `SubscriptionContractCalculationContractUpdateInput`
- `SubscriptionContractCalculationCustomLineInput`
- `SubscriptionContractCalculationCustomerPaymentMethodInput`
- `SubscriptionContractCalculationCyclePriceAdjustmentInput`
- `SubscriptionContractCalculationDeliveryDiscountInput`
- `SubscriptionContractCalculationDeliveryMethodInput`
- `SubscriptionContractCalculationDeliveryMethodLocalDeliveryInput`
- `SubscriptionContractCalculationDeliveryMethodPickupInput`
- `SubscriptionContractCalculationDeliveryMethodShippingInput`
- `SubscriptionContractCalculationDeliveryOption`
- `SubscriptionContractCalculationDeliveryPolicyInput`
- `SubscriptionContractCalculationDiagnostic`
- `SubscriptionContractCalculationDiagnosticCode`
- `SubscriptionContractCalculationDiscountCodeInput`
- `SubscriptionContractCalculationDiscountFixedAmountInput`
- `SubscriptionContractCalculationDiscountValueInput`
- `SubscriptionContractCalculationFailure`
- `SubscriptionContractCalculationFetchDeliveryOptionsInput`
- `SubscriptionContractCalculationLineDiscountInput`
- `SubscriptionContractCalculationLineInput`
- `SubscriptionContractCalculationLocalDeliveryOption`
- `SubscriptionContractCalculationManualDiscountInput`
- `SubscriptionContractCalculationMonthdayAnchorInput`
- `SubscriptionContractCalculationMultipleFulfillmentConfig`
- `SubscriptionContractCalculationMultipleFulfillmentConfigInput`
- `SubscriptionContractCalculationOrderDiscountInput`
- `SubscriptionContractCalculationPaymentMethodInput`
- `SubscriptionContractCalculationPending`
- `SubscriptionContractCalculationPickupOption`
- `SubscriptionContractCalculationProductVariantLineInput`
- `SubscriptionContractCalculationProductVariantParentLineInput`
- `SubscriptionContractCalculationProjectedOrderTotals`
- `SubscriptionContractCalculationShippingOption`
- `SubscriptionContractCalculationSuccess`
- `SubscriptionContractCalculationWeekdayAnchorInput`
- `SubscriptionContractCalculationYeardayAnchorInput`
- `SubscriptionContractCreateCalculatePayload`
- `SubscriptionContractCreateCalculateUserError`
- `SubscriptionContractCreateCalculateUserErrorCode`
- `SubscriptionContractUpdateCalculatePayload`
- `SubscriptionContractUpdateCalculateUserError`
- `SubscriptionContractUpdateCalculateUserErrorCode`
- `SubscriptionGroupedLine`
- `SubscriptionGroupedLineConnection`
- `SubscriptionGroupedLineEdge`
- `SubscriptionParentLine`
- `QueryRoot.analyticsTargets`
- `QueryRoot.inventoryPurchaseOrder`
- `QueryRoot.inventoryPurchaseOrders`
- `QueryRoot.marketRelationships`
- `QueryRoot.marketRelationshipsStatus`
- `QueryRoot.returnPolicyProfile`
- `QueryRoot.returnPolicyProfiles`
- `QueryRoot.rollout`
- `QueryRoot.rollouts`
- `QueryRoot.subscriptionContractCalculation`
- `Mutation.analyticsAnnotationCreate`
- `Mutation.analyticsAnnotationDelete`
- `Mutation.analyticsAnnotationUpdate`
- `Mutation.analyticsTargetCreate`
- `Mutation.analyticsTargetUpdate`
- `Mutation.analyticsTargetsDelete`
- `Mutation.paymentInstrumentSendAddEmail`
- `Mutation.requestedOrderEditCreate`
- `Mutation.requestedOrderEditDecline`
- `Mutation.requestedOrderEditResolve`
- `Mutation.subscriptionBillingCycleContractEditCalculate`
- `Mutation.subscriptionContractCalculationCommit`
- `Mutation.subscriptionContractCreateCalculate`
- `Mutation.subscriptionContractUpdateCalculate`
- `AnalyticsAnnotation.createdAt`
- `AnalyticsAnnotation.createdByApp`
- `AnalyticsAnnotation.description`
- `AnalyticsAnnotation.endedAt`
- `AnalyticsAnnotation.id`
- `AnalyticsAnnotation.source`
- `AnalyticsAnnotation.startedAt`
- `AnalyticsAnnotation.title`
- `AnalyticsAnnotation.type`
- `AnalyticsAnnotation.updatedAt`
- `AnalyticsAnnotationConnection.edges`
- `AnalyticsAnnotationConnection.nodes`
- `AnalyticsAnnotationConnection.pageInfo`
- `AnalyticsAnnotationCreatePayload.analyticsAnnotation`
- `AnalyticsAnnotationCreatePayload.userErrors`
- `AnalyticsAnnotationCreateUserError.code`
- `AnalyticsAnnotationCreateUserError.field`
- `AnalyticsAnnotationCreateUserError.message`
- `AnalyticsAnnotationDeletePayload.deletedId`
- `AnalyticsAnnotationDeletePayload.userErrors`
- `AnalyticsAnnotationDeleteUserError.code`
- `AnalyticsAnnotationDeleteUserError.field`
- `AnalyticsAnnotationDeleteUserError.message`
- `AnalyticsAnnotationEdge.cursor`
- `AnalyticsAnnotationEdge.node`
- `AnalyticsAnnotationUpdatePayload.analyticsAnnotation`
- `AnalyticsAnnotationUpdatePayload.userErrors`
- `AnalyticsAnnotationUpdateUserError.code`
- `AnalyticsAnnotationUpdateUserError.field`
- `AnalyticsAnnotationUpdateUserError.message`
- `AnalyticsTarget.createdAt`
- `AnalyticsTarget.currencyCode`
- `AnalyticsTarget.endDate`
- `AnalyticsTarget.expectedValue`
- `AnalyticsTarget.filters`
- `AnalyticsTarget.id`
- `AnalyticsTarget.metric`
- `AnalyticsTarget.name`
- `AnalyticsTarget.presentmentExpectedValue`
- `AnalyticsTarget.shopifyqlQuery`
- `AnalyticsTarget.startDate`
- `AnalyticsTarget.updatedAt`
- `AnalyticsTargetConnection.edges`
- `AnalyticsTargetConnection.nodes`
- `AnalyticsTargetConnection.pageInfo`
- `AnalyticsTargetCreatePayload.analyticsTarget`
- `AnalyticsTargetCreatePayload.userErrors`
- `AnalyticsTargetCreateUserError.code`
- `AnalyticsTargetCreateUserError.field`
- `AnalyticsTargetCreateUserError.message`
- `AnalyticsTargetEdge.cursor`
- `AnalyticsTargetEdge.node`
- `AnalyticsTargetUpdatePayload.analyticsTarget`
- `AnalyticsTargetUpdatePayload.userErrors`
- `AnalyticsTargetUpdateUserError.code`
- `AnalyticsTargetUpdateUserError.field`
- `AnalyticsTargetUpdateUserError.message`
- `AnalyticsTargetsDeletePayload.deletedIds`
- `AnalyticsTargetsDeletePayload.userErrors`
- `AnalyticsTargetsDeleteUserError.code`
- `AnalyticsTargetsDeleteUserError.field`
- `AnalyticsTargetsDeleteUserError.message`
- `AuditTrailAdjustment.label`
- `AuditTrailAdjustment.price`
- `AuditTrailAdjustment.type`
- `AuditTrailAdjustment.value`
- `CalculatedRequestedOrderEditLineItem.totalTaxSet`
- `CalculatedRequestedOrderEditLineItemConnection.edges`
- `CalculatedRequestedOrderEditLineItemConnection.nodes`
- `CalculatedRequestedOrderEditLineItemConnection.pageInfo`
- `CalculatedRequestedOrderEditLineItemEdge.cursor`
- `CalculatedRequestedOrderEditLineItemEdge.node`
- `CalculatedRequestedOrderEditLineItems.removals`
- `CollectionSourceInclusionConditionMetafieldInt.definition`
- `CollectionSourceInclusionConditionMetafieldInt.id`
- `CollectionSourceInclusionConditionMetafieldInt.relation`
- `CollectionSourceInclusionConditionMetafieldInt.value`
- `CustomerSmsMarketingConsent.collectedFrom`
- `CustomerSmsMarketingConsent.optInLevel`
- `CustomerSmsMarketingConsent.sourceLocation`
- `CustomerSmsMarketingConsent.state`
- `CustomerSmsMarketingConsent.updatedAt`
- `DiscountContextUnknown.contextType`
- `HasRollouts.rollouts`
- `InventoryPurchaseOrder.archivedAt`
- `InventoryPurchaseOrder.currency`
- `InventoryPurchaseOrder.dateCreated`
- `InventoryPurchaseOrder.destination`
- `InventoryPurchaseOrder.id`
- `InventoryPurchaseOrder.lineItems`
- `InventoryPurchaseOrder.name`
- `InventoryPurchaseOrder.orderedAt`
- `InventoryPurchaseOrder.origin`
- `InventoryPurchaseOrder.status`
- `InventoryPurchaseOrder.transfers`
- `InventoryPurchaseOrderConnection.edges`
- `InventoryPurchaseOrderConnection.nodes`
- `InventoryPurchaseOrderConnection.pageInfo`
- `InventoryPurchaseOrderEdge.cursor`
- `InventoryPurchaseOrderEdge.node`
- `InventoryPurchaseOrderLineItem.id`
- `InventoryPurchaseOrderLineItem.inventoryItem`
- `InventoryPurchaseOrderLineItem.purchaseOrder`
- `InventoryPurchaseOrderLineItem.subtotal`
- `InventoryPurchaseOrderLineItem.supplierSku`
- `InventoryPurchaseOrderLineItem.taxPercent`
- `InventoryPurchaseOrderLineItem.title`
- `InventoryPurchaseOrderLineItem.totalCost`
- `InventoryPurchaseOrderLineItem.totalQuantity`
- `InventoryPurchaseOrderLineItem.unitCost`
- `InventoryPurchaseOrderLineItem.variantTitle`
- `InventoryPurchaseOrderLineItemConnection.edges`
- `InventoryPurchaseOrderLineItemConnection.nodes`
- `InventoryPurchaseOrderLineItemConnection.pageInfo`
- `InventoryPurchaseOrderLineItemEdge.cursor`
- `InventoryPurchaseOrderLineItemEdge.node`
- `InventorySupplierSnapshot.supplierName`
- `MarketRelationship.childMarket`
- `MarketRelationship.id`
- `MarketRelationship.parentMarket`
- `MarketRelationshipConnection.edges`
- `MarketRelationshipConnection.nodes`
- `MarketRelationshipConnection.pageInfo`
- `MarketRelationshipEdge.cursor`
- `MarketRelationshipEdge.node`
- `MarketRelationshipsStatus.version`
- `OrderCancelJobResult.done`
- `OrderCancelJobResult.errors`
- `OrderCancelJobResult.id`
- `OrderCancelJobResult.order`
- `OrderCancelJobResult.status`
- `PaymentInstrumentSendAddEmailPayload.customer`
- `PaymentInstrumentSendAddEmailPayload.userErrors`
- `PricingAuditTrail.priceAdjustments`
- `ProductVariantBarcode.type`
- `ProductVariantBarcode.value`
- `ProductVariantBarcodeConnection.edges`
- `ProductVariantBarcodeConnection.nodes`
- `ProductVariantBarcodeConnection.pageInfo`
- `ProductVariantBarcodeEdge.cursor`
- `ProductVariantBarcodeEdge.node`
- `RequestedOrderEdit.createdAt`
- `RequestedOrderEdit.id`
- `RequestedOrderEdit.lineItems`
- `RequestedOrderEdit.order`
- `RequestedOrderEdit.requestDeclinedAt`
- `RequestedOrderEdit.requestResolvedAt`
- `RequestedOrderEdit.requestedAt`
- `RequestedOrderEdit.status`
- `RequestedOrderEdit.updatedAt`
- `RequestedOrderEditConnection.edges`
- `RequestedOrderEditConnection.nodes`
- `RequestedOrderEditConnection.pageInfo`
- `RequestedOrderEditCreatePayload.requestedOrderEdit`
- `RequestedOrderEditCreatePayload.userErrors`
- `RequestedOrderEditCreateUserError.code`
- `RequestedOrderEditCreateUserError.field`
- `RequestedOrderEditCreateUserError.message`
- `RequestedOrderEditDeclinePayload.requestedOrderEdit`
- `RequestedOrderEditDeclinePayload.userErrors`
- `RequestedOrderEditDeclineUserError.code`
- `RequestedOrderEditDeclineUserError.field`
- `RequestedOrderEditDeclineUserError.message`
- `RequestedOrderEditEdge.cursor`
- `RequestedOrderEditEdge.node`
- `RequestedOrderEditFinancialSummary.editOrderLevelDiscountSubtotalSet`
- `RequestedOrderEditFinancialSummary.editSubtotalBeforeTargetAllDiscountsSet`
- `RequestedOrderEditFinancialSummary.editSubtotalSet`
- `RequestedOrderEditFinancialSummary.editSubtotalWithCartDiscountSet`
- `RequestedOrderEditFinancialSummary.editTotalSet`
- `RequestedOrderEditFinancialSummary.editTotalTaxSet`
- `RequestedOrderEditLineItem.id`
- `RequestedOrderEditLineItem.lineItem`
- `RequestedOrderEditLineItem.quantity`
- `RequestedOrderEditLineItem.resolvedQuantity`
- `RequestedOrderEditLineItemConnection.edges`
- `RequestedOrderEditLineItemConnection.nodes`
- `RequestedOrderEditLineItemConnection.pageInfo`
- `RequestedOrderEditLineItemEdge.cursor`
- `RequestedOrderEditLineItemEdge.node`
- `RequestedOrderEditLineItems.removals`
- `RequestedOrderEditResolvePayload.requestedOrderEdit`
- `RequestedOrderEditResolvePayload.userErrors`
- `RequestedOrderEditResolveUserError.code`
- `RequestedOrderEditResolveUserError.field`
- `RequestedOrderEditResolveUserError.message`
- `ReturnPoliciesEditRules.canAcceptEdits`
- `ReturnPoliciesEditRules.editWindowMinutes`
- `ReturnPoliciesReturnRules.canAcceptReturns`
- `ReturnPoliciesReturnRules.extendWindowToBusinessDay`
- `ReturnPoliciesReturnRules.returnWindowDays`
- `ReturnPoliciesReturnRules.returnWindowStartingFrom`
- `ReturnPolicyProfile.default`
- `ReturnPolicyProfile.editRules`
- `ReturnPolicyProfile.id`
- `ReturnPolicyProfile.markets`
- `ReturnPolicyProfile.name`
- `ReturnPolicyProfile.returnRules`
- `ReturnPolicyProfile.updatedAt`
- `ReturnPolicyProfileConnection.edges`
- `ReturnPolicyProfileConnection.nodes`
- `ReturnPolicyProfileConnection.pageInfo`
- `ReturnPolicyProfileEdge.cursor`
- `ReturnPolicyProfileEdge.node`
- `Rollout.archivedAt`
- `Rollout.concludedAt`
- `Rollout.createdAt`
- `Rollout.effectiveTrafficAllocation`
- `Rollout.id`
- `Rollout.name`
- `Rollout.schedule`
- `Rollout.startedAt`
- `Rollout.status`
- `Rollout.trafficAllocation`
- `Rollout.treatments`
- `Rollout.updatedAt`
- `RolloutCatalogActivateChange.catalog`
- `RolloutCatalogActivateChange.id`
- `RolloutCatalogChange.catalog`
- `RolloutCatalogChange.id`
- `RolloutCatalogDraftChange.catalog`
- `RolloutCatalogDraftChange.id`
- `RolloutChange.id`
- `RolloutChangeConnection.edges`
- `RolloutChangeConnection.nodes`
- `RolloutChangeConnection.pageInfo`
- `RolloutChangeEdge.cursor`
- `RolloutChangeEdge.node`
- `RolloutCheckoutAndAccountsConfigurationChange.checkoutAndAccountsConfiguration`
- `RolloutCheckoutAndAccountsConfigurationChange.id`
- `RolloutCheckoutAndAccountsConfigurationPublishChange.checkoutAndAccountsConfiguration`
- `RolloutCheckoutAndAccountsConfigurationPublishChange.id`
- `RolloutConnection.edges`
- `RolloutConnection.nodes`
- `RolloutConnection.pageInfo`
- `RolloutDiscountActivateChange.discount`
- `RolloutDiscountActivateChange.id`
- `RolloutDiscountChange.discount`
- `RolloutDiscountChange.id`
- `RolloutDiscountExpireChange.discount`
- `RolloutDiscountExpireChange.id`
- `RolloutEdge.cursor`
- `RolloutEdge.node`
- `RolloutSchedule.activateAt`
- `RolloutSchedule.concludeAt`
- `RolloutThemeChange.id`
- `RolloutThemeChange.theme`
- `RolloutThemePublishChange.id`
- `RolloutThemePublishChange.theme`
- `RolloutTreatment.changes`
- `RolloutTreatment.id`
- `RolloutTreatment.rollout`
- `RolloutTreatment.split`
- `SubscriptionBillingCycleContractEditCalculatePayload.subscriptionContractCalculation`
- `SubscriptionBillingCycleContractEditCalculatePayload.userErrors`
- `SubscriptionBillingCycleContractEditCalculateUserError.code`
- `SubscriptionBillingCycleContractEditCalculateUserError.field`
- `SubscriptionBillingCycleContractEditCalculateUserError.message`
- `SubscriptionCalculatedContract.billingPolicy`
- `SubscriptionCalculatedContract.currencyCode`
- `SubscriptionCalculatedContract.customAttributes`
- `SubscriptionCalculatedContract.customer`
- `SubscriptionCalculatedContract.customerPaymentMethod`
- `SubscriptionCalculatedContract.deliveryMethod`
- `SubscriptionCalculatedContract.deliveryPolicy`
- `SubscriptionCalculatedContract.deliveryPrice`
- `SubscriptionCalculatedContract.discounts`
- `SubscriptionCalculatedContract.groupedLines`
- `SubscriptionCalculatedContract.lines`
- `SubscriptionCalculatedContract.note`
- `SubscriptionContractCalculationCadence.count`
- `SubscriptionContractCalculationCadence.unit`
- `SubscriptionContractCalculationCommitPayload.contract`
- `SubscriptionContractCalculationCommitPayload.userErrors`
- `SubscriptionContractCalculationCommitUserError.code`
- `SubscriptionContractCalculationCommitUserError.field`
- `SubscriptionContractCalculationCommitUserError.message`
- `SubscriptionContractCalculationDiagnostic.code`
- `SubscriptionContractCalculationDiagnostic.field`
- `SubscriptionContractCalculationDiagnostic.message`
- `SubscriptionContractCalculationFailure.errors`
- `SubscriptionContractCalculationFailure.id`
- `SubscriptionContractCalculationLocalDeliveryOption.code`
- `SubscriptionContractCalculationLocalDeliveryOption.description`
- `SubscriptionContractCalculationLocalDeliveryOption.phoneRequired`
- `SubscriptionContractCalculationLocalDeliveryOption.presentmentTitle`
- `SubscriptionContractCalculationLocalDeliveryOption.price`
- `SubscriptionContractCalculationLocalDeliveryOption.title`
- `SubscriptionContractCalculationMultipleFulfillmentConfig.cadence`
- `SubscriptionContractCalculationMultipleFulfillmentConfig.numberOfFulfillments`
- `SubscriptionContractCalculationPending.id`
- `SubscriptionContractCalculationPickupOption.code`
- `SubscriptionContractCalculationPickupOption.description`
- `SubscriptionContractCalculationPickupOption.location`
- `SubscriptionContractCalculationPickupOption.phoneRequired`
- `SubscriptionContractCalculationPickupOption.pickupTime`
- `SubscriptionContractCalculationPickupOption.presentmentTitle`
- `SubscriptionContractCalculationPickupOption.price`
- `SubscriptionContractCalculationPickupOption.title`
- `SubscriptionContractCalculationProjectedOrderTotals.subtotal`
- `SubscriptionContractCalculationProjectedOrderTotals.total`
- `SubscriptionContractCalculationProjectedOrderTotals.totalDelivery`
- `SubscriptionContractCalculationProjectedOrderTotals.totalDeliveryDiscounts`
- `SubscriptionContractCalculationProjectedOrderTotals.totalMerchandiseDiscounts`
- `SubscriptionContractCalculationProjectedOrderTotals.totalTax`
- `SubscriptionContractCalculationShippingOption.code`
- `SubscriptionContractCalculationShippingOption.description`
- `SubscriptionContractCalculationShippingOption.phoneRequired`
- `SubscriptionContractCalculationShippingOption.presentmentTitle`
- `SubscriptionContractCalculationShippingOption.price`
- `SubscriptionContractCalculationShippingOption.title`
- `SubscriptionContractCalculationSuccess.calculatedContract`
- `SubscriptionContractCalculationSuccess.deliveryOptions`
- `SubscriptionContractCalculationSuccess.id`
- `SubscriptionContractCalculationSuccess.projectedOrderTotals`
- `SubscriptionContractCalculationSuccess.warnings`
- `SubscriptionContractCalculationSuccess.withMerchandiseCustomizations`
- `SubscriptionContractCreateCalculatePayload.subscriptionContractCalculation`
- `SubscriptionContractCreateCalculatePayload.userErrors`
- `SubscriptionContractCreateCalculateUserError.code`
- `SubscriptionContractCreateCalculateUserError.field`
- `SubscriptionContractCreateCalculateUserError.message`
- `SubscriptionContractUpdateCalculatePayload.subscriptionContractCalculation`
- `SubscriptionContractUpdateCalculatePayload.userErrors`
- `SubscriptionContractUpdateCalculateUserError.code`
- `SubscriptionContractUpdateCalculateUserError.field`
- `SubscriptionContractUpdateCalculateUserError.message`
- `SubscriptionGroupedLineConnection.edges`
- `SubscriptionGroupedLineConnection.nodes`
- `SubscriptionGroupedLineConnection.pageInfo`
- `SubscriptionGroupedLineEdge.cursor`
- `SubscriptionGroupedLineEdge.node`
- `SubscriptionParentLine.bundledBy`
- `SubscriptionParentLine.components`
- `SubscriptionParentLine.customAttributes`
- `SubscriptionParentLine.id`
- `SubscriptionParentLine.presentmentTitle`
- `SubscriptionParentLine.productId`
- `SubscriptionParentLine.quantity`
- `SubscriptionParentLine.sourceType`
- `SubscriptionParentLine.title`
- `SubscriptionParentLine.variantId`
- `CalculatedReturnShippingFee.taxAmountSet`
- `CustomerPhoneNumber.smsMarketingConsent`
- `DiscountAutomaticApp.rollouts`
- `DiscountAutomaticBasic.rollouts`
- `DiscountAutomaticBxgy.rollouts`
- `DiscountAutomaticFreeShipping.rollouts`
- `DiscountCodeApp.rollouts`
- `DiscountCodeBasic.rollouts`
- `DiscountCodeBxgy.rollouts`
- `DiscountCodeFreeShipping.rollouts`
- `ExchangeLineItem.productId`
- `ExchangeLineItem.title`
- `ExchangeLineItem.variantSku`
- `ExchangeLineItem.variantTitle`
- `InventoryShipment.totalCanceledQuantity`
- `InventoryShipmentLineItem.canceledQuantity`
- `Market.childMarkets`
- `Market.childMarketsCount`
- `Market.parentMarkets`
- `Market.parentMarketsCount`
- `Market.returnPolicyProfile`
- `Metafield.translatable`
- `Order.displayRequestedEditStatus`
- `Order.requestedOrderEdits`
- `OrderCancelPayload.jobResult`
- `PointOfSaleDevice.fiscalDeviceIdentifier`
- `ProductVariant.barcodes`
- `ProductVariantContextualPricing.auditTrail`
- `ReturnShippingFee.finalizedTaxAmountSet`
- `Shop.analyticsAnnotations`
- `ShopifyqlQueryResponse.analyticsTargets`
- `ShopifyqlQueryResponse.parseWarnings`
- `SubscriptionBillingCycleEditedContract.groupedLines`
- `SubscriptionBillingCycleEditedContract.latestCommittedProjectedOrderTotals`
- `SubscriptionBillingPolicy.cadence`
- `SubscriptionContract.groupedLines`
- `SubscriptionContract.latestCommittedProjectedOrderTotals`
- `SubscriptionContractBase.groupedLines`
- `SubscriptionDeliveryPolicy.multiFulfillment`
- `SubscriptionLine.weight`

Customer Account API (63):

- `CustomerSmsMarketingConsent`
- `CalculatedRequestedOrderEditLineItem.totalTaxSet`
- `CalculatedRequestedOrderEditLineItemConnection.edges`
- `CalculatedRequestedOrderEditLineItemConnection.nodes`
- `CalculatedRequestedOrderEditLineItemConnection.pageInfo`
- `CalculatedRequestedOrderEditLineItemEdge.cursor`
- `CalculatedRequestedOrderEditLineItemEdge.node`
- `CalculatedRequestedOrderEditLineItems.removals`
- `CustomerSmsMarketingConsent.state`
- `EditableLineItem.lineItem`
- `EditableLineItem.quantity`
- `EditableLineItemConnection.edges`
- `EditableLineItemConnection.nodes`
- `EditableLineItemConnection.pageInfo`
- `EditableLineItemEdge.cursor`
- `EditableLineItemEdge.node`
- `IneligibleLineItem.lineItem`
- `IneligibleLineItem.quantity`
- `IneligibleLineItem.quantityDetails`
- `IneligibleLineItemConnection.edges`
- `IneligibleLineItemConnection.nodes`
- `IneligibleLineItemConnection.pageInfo`
- `IneligibleLineItemEdge.cursor`
- `IneligibleLineItemEdge.node`
- `IneligibleQuantityDetail.quantity`
- `IneligibleQuantityDetail.reasonCode`
- `OrderRequestEditPayload.requestedOrderEdit`
- `OrderRequestEditPayload.userErrors`
- `OrderRequestedEditInformation.editableLineItems`
- `OrderRequestedEditInformation.hasEditableLineItems`
- `OrderRequestedEditInformation.ineligibleLineItems`
- `OrderRequestedEditInformation.isSelfServiceRequiredForCompliance`
- `RequestedOrderEdit.id`
- `RequestedOrderEdit.lineItems`
- `RequestedOrderEdit.requestedEditLineItems`
- `RequestedOrderEdit.status`
- `RequestedOrderEditConnection.edges`
- `RequestedOrderEditConnection.nodes`
- `RequestedOrderEditConnection.pageInfo`
- `RequestedOrderEditEdge.cursor`
- `RequestedOrderEditEdge.node`
- `RequestedOrderEditFinancialSummary.editOrderLevelDiscountSubtotalSet`
- `RequestedOrderEditFinancialSummary.editSubtotalBeforeTargetAllDiscountsSet`
- `RequestedOrderEditFinancialSummary.editSubtotalSet`
- `RequestedOrderEditFinancialSummary.editSubtotalWithCartDiscountSet`
- `RequestedOrderEditFinancialSummary.editTotalSet`
- `RequestedOrderEditFinancialSummary.editTotalTaxSet`
- `RequestedOrderEditLineItem.id`
- `RequestedOrderEditLineItem.lineItem`
- `RequestedOrderEditLineItem.quantity`
- `RequestedOrderEditLineItemConnection.edges`
- `RequestedOrderEditLineItemConnection.nodes`
- `RequestedOrderEditLineItemConnection.pageInfo`
- `RequestedOrderEditLineItemEdge.cursor`
- `RequestedOrderEditLineItemEdge.node`
- `RequestedOrderEditLineItems.removals`
- `RequestedOrderEditUserError.code`
- `RequestedOrderEditUserError.field`
- `RequestedOrderEditUserError.message`
- `CustomerAddress.countryCode`
- `CustomerPhoneNumber.smsMarketingConsent`
- `Order.requestedEditInformation`
- `Order.requestedOrderEdits`

</details>

### Release candidate

`2027-01` is the release candidate. Compared with `2026-10`, it has 16 Admin API breaking changes and no Storefront or Customer Account API breaking changes.

#### Admin API: integer metafield collection conditions

Shopify removes the legacy integer metafield condition types and `metafieldInteger` input fields. Use `CollectionSourceInclusionConditionMetafieldInt`, which supports the full integer metafield value range.

<details>
<summary>6 collection condition breaking changes</summary>

- `CollectionSourceInclusionConditionMetafieldInteger`
- `CollectionSourceInclusionConditionMetafieldIntegerInput`
- `CollectionSourceInclusionConditionMetafieldIntegerRelation`
- `CollectionSourceInclusionConditionUpdateMetafieldIntegerInput`
- `CollectionSourceInclusionConditionInput.metafieldInteger`
- `CollectionSourceInclusionConditionUpdateInput.metafieldInteger`

</details>

#### Admin API: automatic discount queries

Shopify removes `QueryRoot.automaticDiscounts` and the `DiscountAutomatic` connection types. Use `automaticDiscountNodes` instead.

<details>
<summary>3 automatic discount breaking changes</summary>

- `DiscountAutomaticConnection`
- `DiscountAutomaticEdge`
- `QueryRoot.automaticDiscounts`

</details>

#### Admin API: market currency settings

Shopify removes `Mutation.marketCurrencySettingsUpdate` and its payload and error types. Use `marketCreate` to create currency settings and `marketUpdate` to update them.

<details>
<summary>4 market currency breaking changes</summary>

- `MarketCurrencySettingsUpdatePayload`
- `MarketCurrencySettingsUserError`
- `MarketCurrencySettingsUserErrorCode`
- `Mutation.marketCurrencySettingsUpdate`

</details>

#### Admin API: metaobject access

Shopify removes `PRIVATE` and `PUBLIC_READ` from `MetaobjectAdminAccess`, plus `StandardMetaobjectDefinitionFieldTemplate.visibleToStorefrontApi`. Use `MERCHANT_READ` instead of both enum values. Use the definition's `access` field instead of field-level Storefront visibility.

<details>
<summary>3 metaobject access breaking changes</summary>

- `MetaobjectAdminAccess.PRIVATE`
- `MetaobjectAdminAccess.PUBLIC_READ`
- `StandardMetaobjectDefinitionFieldTemplate.visibleToStorefrontApi`

</details>

#### Release candidate additions

Shopify adds 177 Admin API items, 6 Storefront API items, and 50 Customer Account API items.

Admin API additions cover analytics schemas, draft order selling plans, packaged inventory item dimensions, and product variant compliance values.

Storefront API additions let apps change a Shop Pay session's business entity before payment submission or after the latest payment attempt fails.

Customer Account API additions cover order duties, fee lines, and subscription lines grouped by bundle parent.

### Versions in this release

| Alias             | Version    |
| ----------------- | ---------- |
| Current           | `2026-10`  |
| Previous          | `2026-07`  |
| Older supported   | `2026-04`  |
| Older supported   | `2026-01`  |
| Release candidate | `2027-01`  |
| Unstable          | `unstable` |

| API              | Types |
| ---------------- | ----: |
| Storefront       |   272 |
| Admin            |  2123 |
| Customer Account |   339 |

### Package changes

- The package now needs Node.js 22 or later (`engines`). Node.js 20 reached end
  of life on 2026-04-30.
- The package has no runtime dependencies. Before this release, an install also
  added `@anthropic-ai/sdk`, `graphql`, `ts-pattern`, and `zod`.
- npm shows a provenance statement for this version. The Release workflow
  publishes through npm trusted publishing.

## 2026.7.0

### Major Changes (New API Version: 2026-07)

- New current version 2026-07 for the Storefront, Admin, and Customer Account
  APIs. Version set: current=2026-07, previous=2026-04, olderSupported=[2026-01,
  2025-10], next(RC)=2026-10, unstable.
- Breaking changes from 2026-04 to 2026-07 (Admin only, 12 total): the
  InventoryScheduledChange type family was removed, remote payment input fields
  became required, and the deprecated inventorySetScheduledChanges mutation and
  CollectionInput arguments were removed. Full list in the README and in
  `comparisons/current`.
- Release candidate preview (2026-10): Admin removes the PriceRule type family;
  Customer Account removes legacy Checkout types. See `comparisons/next`.
- Type counts: Admin 2,041 / Customer Account 323 / Storefront 271.

This release completes the 2026 catch-up. The package is current with Shopify's
quarterly schedule again.

## 2026.4.0

### Major Changes (New API Version: 2026-04)

- New current version 2026-04 for the Storefront, Admin, and Customer Account
  APIs. Version set: current=2026-04, previous=2026-01, olderSupported=[2025-10,
  2025-07], next(RC)=2026-07, unstable.
- Breaking changes from 2026-01 to 2026-04 (Admin only, 18 total):
  DeliverySetting types removed, fulfillment order userErrors types changed,
  inventory compareQuantity fields removed, ShopPolicy and
  ShopifyPaymentsDispute date fields moved from Date to DateTime. Full list in
  the README and in `comparisons/current`.
- Type counts: Admin 1,928 / Customer Account 320 / Storefront 268.
- README is now generated under a strict style gate (no emojis, no filler,
  verified export paths).

Note: this release was published 2026-09-01 as a catch-up for the 2026-04
quarter. Its RC (2026-07) and unstable schemas are snapshots from the
publication date.

## 2026.1.0

### Major Changes (New API Version: 2026-01)

- **New current version 2026-01** for Storefront, Admin, and Customer Account
  APIs. Version set: current=2026-01, previous=2025-10, olderSupported=[2025-07,
  2025-04], next(RC)=2026-04, unstable.
- **Support-window version model**: each release now ships every API version
  Shopify still supports (4 stable quarters + release candidate + unstable),
  aligned with Shopify's 12-month support policy. See CONTRIBUTING.md "Version
  Support Principle" and decisions/011.
- **Comparisons for every adjacent version pair** (4 pairs), exported as
  `comparisons/<from>-to-<to>` plus the `comparisons/current` and
  `comparisons/next` aliases.
- **`RELEASE_DATE` env override** for back-dated builds, and fall-forward guards
  in the schema fetcher (header check + content-duplicate check) so
  retired-version schemas can never be silently overwritten.
- Type counts: Admin 1,790 / Customer Account 320 / Storefront 268.
- Breaking changes from 2025-10 to 2026-01 are listed in the README and in
  `comparisons/current`.

Note: this release was published 2026-09-01 as a catch-up for the 2026-01
quarter. Its RC (2026-04) and unstable schemas are snapshots from the
publication date.

## 2025.7.0

### Major Changes

- **First Major Release: Complete Shopify API Types with CalVer Versioning**

  This marks the first major release of `@juanpprieto/shopify-api-types`,
  providing comprehensive TypeScript definitions for all Shopify GraphQL APIs
  with proper CalVer versioning aligned with Shopify's quarterly release
  schedule.

  ## What's New

  ### **Complete API Coverage**
  - **Admin API**: 1,758+ types for store management, webhooks, analytics
  - **Storefront API**: 261+ types for product catalog, cart, checkout
  - **Customer Account API**: 296+ types for customer profiles, orders
  - **All API Versions**: 2025-04, 2025-07, 2025-10, and unstable

  ### **CalVer Versioning System**
  - **Shopify-Aligned**: Follows `YYYY.[1|4|7|10].PATCH` pattern for quarterly
    releases
  - **Automated**: Custom Changesets integration ensures proper CalVer
    formatting
  - **Tested**: Major releases correctly produce `2025.7.0` instead of
    `2026.0.0`

  ### **Developer Experience**
  - **Modern Export Conditions**: Full ESM/CommonJS compatibility
  - **Interactive Demo**: React/Vite examples for all API types
  - **Comprehensive Docs**: 636-line CONTRIBUTING.md with workflow guides
  - **Type Safety**: Complete GraphQL schema validation and comparison tools

  ### **Production Ready**
  - **Security**: CodeQL analysis, dependency scanning, vulnerability checks
  - **Quality**: 88 test cases across all build scripts and utilities
  - **CI/CD**: Automated releases with GitHub Actions
  - **Performance**: Optimized build process with 35% script reduction

  ## **Usage**

  ```bash
  npm install @juanpprieto/shopify-api-types
  ```

  ```typescript
  // Use current stable API version
  import type {
    Product,
    Shop,
  } from '@juanpprieto/shopify-api-types/admin/current';
  import type { Cart } from '@juanpprieto/shopify-api-types/sfapi/current';

  // Or specify version explicitly
  import type { Product } from '@juanpprieto/shopify-api-types/admin/2025-07';
  ```

  This release establishes the foundation for systematic CalVer releases aligned
  with Shopify's API development cycle. (New API Version)
