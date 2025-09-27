const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_ADMIN_API_TOKEN;
const secret = process.env.SHOPIFY_API_SECRET;
const version = process.env.SHOPIFY_API_VERSION;

// Debug function to check configuration
function checkConfig() {
  const issues = [];
  if (!domain || domain === 'YOUR_STORE_NAME.myshopify.com') {
    issues.push('SHOPIFY_STORE_DOMAIN not set correctly');
  }
  if (!token) {
    issues.push('SHOPIFY_ADMIN_API_TOKEN not set');
  }
  if (!version) {
    issues.push('SHOPIFY_API_VERSION not set');
  }
  
  if (issues.length > 0) {
    console.error('Shopify Configuration Issues:', issues);
    return false;
  }
  return true;
}

async function shopifyGraphQL(query, variables = {}) {
  // Check configuration first
  if (!checkConfig()) {
    throw new Error('Shopify API configuration is incomplete. Please check your environment variables.');
  }

  const url = `https://${domain}/admin/api/${version}/graphql.json`;
  
  console.log('Making request to:', url);
  console.log('Using token:', token ? `${token.substring(0, 8)}...` : 'NOT SET');

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    });

    console.log('Response status:', res.status);
    console.log('Response headers:', res.headers);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('HTTP Error:', res.status, errorText);
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }

    const json = await res.json();
    console.log('Response JSON:', json);

    if (json.errors) {
      console.error("Shopify GraphQL Errors:", json.errors);
      throw new Error(`Shopify API Error: ${json.errors.map(e => e.message).join(', ')}`);
    }

    return json.data;
  } catch (error) {
    console.error('Shopify API Error:', error);
    throw error;
  }
}

// Fetch products from Shopify
async function fetchProducts(first = 10, after = null, query = "") {
  const graphqlQuery = `
    query getProducts($first: Int!, $after: String, $query: String) {
      products(first: $first, after: $after, query: $query) {
        edges {
          node {
            id
            title
            handle
            description
            status
            vendor
            productType
            tags
            createdAt
            updatedAt
            totalInventory
            images(first: 5) {
              edges {
                node {
                  id
                  url
                  altText
                }
              }
            }
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  price
                  compareAtPrice
                  sku
                  inventoryQuantity
                }
              }
            }
            options {
              id
              name
              values
            }
            seo {
              title
              description
            }
            media(first: 10) {
              edges {
                node {
                  __typename
                  ... on MediaImage {
                    id
                    image {
                      url
                      width
                      height
                    }
                    alt
                  }
                }
              }
            }
            metafields(first: 10, namespace: "custom") {
              edges {
                node {
                  id
                  namespace
                  key
                  value
                  type
                }
              }
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
        }
      }
    }
  `;

  const variables = {
    first,
    after,
    query: query || null
  };

  return await shopifyGraphQL(graphqlQuery, variables);
}

// Create a new product in Shopify
async function createProduct(productData) {
  const graphqlMutation = `
    mutation productCreate($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
          title
          handle
          description
          status
          vendor
          productType
          tags
          variants(first: 10) {
            edges {
              node {
                id
                title
                price
                compareAtPrice
                sku
                inventoryQuantity
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: productData
  };

  const result = await shopifyGraphQL(graphqlMutation, variables);
  
  if (result.productCreate.userErrors && result.productCreate.userErrors.length > 0) {
    console.error("Product creation errors:", result.productCreate.userErrors);
    throw new Error("Failed to create product: " + result.productCreate.userErrors.map(e => e.message).join(", "));
  }

  return result.productCreate;
}

// Create a new product with variants and options in Shopify
async function createProductWithVariants(productData) {
  const { variants, options, ...baseProductData } = productData;

  const graphqlMutation = `
    mutation productCreate($input: ProductInput!, $media: [CreateMediaInput!]) {
      productCreate(input: $input, media: $media) {
        product {
          id
          title
          handle
          description
          status
          vendor
          productType
          tags
          options {
            id
            name
            values
          }
          variants(first: 50) {
            edges {
              node {
                id
                title
                price
                compareAtPrice
                sku
                inventoryQuantity
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  // Prepare the input data with variants
  const input = {
    ...baseProductData,
    options: options ? options.map(option => ({
      name: option.name,
      values: option.values
    })) : undefined,
    variants: variants ? variants.map(variant => ({
      price: variant.price,
      compareAtPrice: variant.compareAtPrice || null,
      sku: variant.sku || null,
      inventoryQuantity: variant.inventoryQuantity || 0,
      inventoryItem: {
        tracked: true
      },
      inventoryPolicy: "DENY",
      requiresShipping: variant.requiresShipping !== false,
      taxable: variant.taxable !== false,
      weight: variant.weight || null,
      weightUnit: variant.weightUnit || "KILOGRAMS",
      options: [variant.option1, variant.option2, variant.option3].filter(Boolean)
    })) : undefined
  };

  const variables = {
    input,
    media: []
  };

  const result = await shopifyGraphQL(graphqlMutation, variables);
  
  if (result.productCreate.userErrors && result.productCreate.userErrors.length > 0) {
    console.error("Product creation errors:", result.productCreate.userErrors);
    throw new Error("Failed to create product with variants: " + result.productCreate.userErrors.map(e => e.message).join(", "));
  }

  return result.productCreate;
}

// Update an existing product
async function updateProduct(productId, productData) {
  const graphqlMutation = `
    mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
          title
          handle
          description
          status
          vendor
          productType
          tags
          variants(first: 10) {
            edges {
              node {
                id
                title
                price
                compareAtPrice
                sku
                inventoryQuantity
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      id: productId,
      ...productData
    }
  };

  const result = await shopifyGraphQL(graphqlMutation, variables);
  
  if (result.productUpdate.userErrors && result.productUpdate.userErrors.length > 0) {
    console.error("Product update errors:", result.productUpdate.userErrors);
    throw new Error("Failed to update product: " + result.productUpdate.userErrors.map(e => e.message).join(", "));
  }

  return result.productUpdate;
}

// Delete a product
async function deleteProduct(productId) {
  const graphqlMutation = `
    mutation productDelete($input: ProductDeleteInput!) {
      productDelete(input: $input) {
        deletedProductId
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      id: productId
    }
  };

  const result = await shopifyGraphQL(graphqlMutation, variables);
  
  if (result.productDelete.userErrors && result.productDelete.userErrors.length > 0) {
    console.error("Product deletion errors:", result.productDelete.userErrors);
    throw new Error("Failed to delete product: " + result.productDelete.userErrors.map(e => e.message).join(", "));
  }

  return result.productDelete;
}

// Fetch a single product by ID
async function fetchProductById(productId) {
  const graphqlQuery = `
    query getProduct($id: ID!) {
      product(id: $id) {
        id
        title
        handle
        description
        status
        vendor
        productType
        tags
        createdAt
        updatedAt
        totalInventory
        images(first: 10) {
          edges {
            node {
              id
              url
              altText
            }
          }
        }
        variants(first: 50) {
          edges {
            node {
              id
              title
              price
              compareAtPrice
              sku
              inventoryQuantity
            }
          }
        }
        options {
          id
          name
          values
        }
        seo {
          title
          description
        }
      }
    }
  `;

  const variables = { id: productId };
  return await shopifyGraphQL(graphqlQuery, variables);
}

// Test API connection
async function testConnection() {
  const testQuery = `
    query {
      shop {
        name
        email
        myshopifyDomain
        plan {
          displayName
        }
      }
    }
  `;

  try {
    const result = await shopifyGraphQL(testQuery);
    console.log('API Connection Test Successful:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('API Connection Test Failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Create staged uploads for files (needed for file uploads vs URL images)
async function createStagedUpload(filename, mimeType, fileSize) {
  const graphqlMutation = `
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: [{
      filename: filename,
      mimeType: mimeType,
      httpMethod: 'POST'
    }]
  };

  const result = await shopifyGraphQL(graphqlMutation, variables);
  
  if (result.stagedUploadsCreate.userErrors && result.stagedUploadsCreate.userErrors.length > 0) {
    throw new Error("Failed to create staged upload: " + result.stagedUploadsCreate.userErrors.map(e => e.message).join(", "));
  }

  return result.stagedUploadsCreate.stagedTargets[0];
}

// Add images to an existing product
async function addProductImages(productId, images) {
  console.log('Adding images to product:', productId);
  console.log('Images data:', JSON.stringify(images, null, 2));

  const graphqlMutation = `
    mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media {
          id
          alt
          mediaContentType
          ... on MediaImage {
            id
            alt
            image {
              url
              altText
              width
              height
            }
          }
        }
        mediaUserErrors {
          field
          message
        }
      }
    }
  `;

  const media = images.map(image => {
    // Validate that we have a valid image source
    if (!image.src || image.src.trim() === '') {
      console.warn('Skipping image with empty src:', image);
      return null;
    }

    return {
      originalSource: image.src,
      alt: image.altText || image.alt || '',
      mediaContentType: 'IMAGE'
    };
  }).filter(Boolean); // Remove any null entries

  if (media.length === 0) {
    console.warn('No valid images to upload');
    return { media: [], mediaUserErrors: [] };
  }

  console.log('Prepared media data:', JSON.stringify(media, null, 2));

  const variables = {
    productId,
    media
  };

  const result = await shopifyGraphQL(graphqlMutation, variables);
  
  console.log('Media creation result:', JSON.stringify(result, null, 2));
  
  if (result.productCreateMedia.mediaUserErrors && result.productCreateMedia.mediaUserErrors.length > 0) {
    console.error("Product image creation errors:", result.productCreateMedia.mediaUserErrors);
    throw new Error("Failed to add product images: " + result.productCreateMedia.mediaUserErrors.map(e => e.message).join(", "));
  }

  return result.productCreateMedia;
}

// Set product category (using metafields as Shopify doesn't have direct category assignment)
async function setProductCategory(productId, categoryName) {
  const graphqlMutation = `
    mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
          title
          metafields(first: 10) {
            edges {
              node {
                id
                namespace
                key
                value
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      id: productId,
      metafields: [
        {
          namespace: "custom",
          key: "category",
          value: categoryName,
          type: "single_line_text_field"
        }
      ]
    }
  };

  const result = await shopifyGraphQL(graphqlMutation, variables);
  
  if (result.productUpdate.userErrors && result.productUpdate.userErrors.length > 0) {
    console.error("Product category assignment errors:", result.productUpdate.userErrors);
    throw new Error("Failed to set product category: " + result.productUpdate.userErrors.map(e => e.message).join(", "));
  }

  return result.productUpdate;
}

// Publish product to sales channel
async function publishProductToChannel(productId, publicationId) {
  const graphqlMutation = `
    mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        publishable {
          availablePublicationsCount {
            count
          }
          resourcePublicationsCount {
            count
          }
        }
        shop {
          name
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    id: productId,
    input: [
      {
        publicationId: publicationId
      }
    ]
  };

  const result = await shopifyGraphQL(graphqlMutation, variables);
  
  if (result.publishablePublish.userErrors && result.publishablePublish.userErrors.length > 0) {
    console.error("Product publishing errors:", result.publishablePublish.userErrors);
    throw new Error("Failed to publish product: " + result.publishablePublish.userErrors.map(e => e.message).join(", "));
  }

  return result.publishablePublish;
}

// Publish product to multiple sales channels at once
async function publishProductToMultipleChannels(productId, publicationIds) {
  if (!publicationIds || publicationIds.length === 0) {
    return { success: true, message: 'No publications specified' };
  }

  const graphqlMutation = `
    mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        publishable {
          availablePublicationsCount {
            count
          }
          resourcePublicationsCount {
            count
          }
        }
        shop {
          name
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    id: productId,
    input: publicationIds.map(pubId => ({ publicationId: pubId }))
  };

  const result = await shopifyGraphQL(graphqlMutation, variables);
  
  if (result.publishablePublish.userErrors && result.publishablePublish.userErrors.length > 0) {
    console.error("Product publishing errors:", result.publishablePublish.userErrors);
    throw new Error("Failed to publish product: " + result.publishablePublish.userErrors.map(e => e.message).join(", "));
  }

  return result.publishablePublish;
}

// Fetch ALL products from Shopify (handles pagination automatically)
async function fetchAllProducts(query = "") {
  console.log('Starting to fetch all products from Shopify...');
  let allProducts = [];
  let hasNextPage = true;
  let cursor = null;
  let pageCount = 0;

  while (hasNextPage) {
    try {
      pageCount++;
      console.log(`Fetching page ${pageCount}...`);
      
      const result = await fetchProducts(250, cursor, query); // Use max 250 per request
      
      if (!result || !result.products || !result.products.edges) {
        console.error('Invalid response structure:', result);
        break;
      }

      // Add products from this page
      const productsInPage = result.products.edges.map(edge => edge.node);
      allProducts.push(...productsInPage);
      
      console.log(`Page ${pageCount}: Found ${productsInPage.length} products. Total so far: ${allProducts.length}`);

      // Check if there are more pages
      hasNextPage = result.products.pageInfo?.hasNextPage || false;
      
      if (hasNextPage && result.products.edges.length > 0) {
        // Get cursor for next page
        cursor = result.products.edges[result.products.edges.length - 1]?.cursor;
      }
      
      // Safety check to prevent infinite loops
      if (pageCount > 100) {
        console.warn('Reached maximum page limit (100). Stopping pagination.');
        break;
      }
      
    } catch (error) {
      console.error(`Error fetching page ${pageCount}:`, error);
      break;
    }
  }

  console.log(`✅ Finished fetching all products. Total: ${allProducts.length} products from ${pageCount} pages`);
  
  return {
    products: allProducts,
    totalCount: allProducts.length,
    pagesFetched: pageCount
  };
}

// Fetch available publications/sales channels
async function fetchPublications() {
  const graphqlQuery = `
    query {
      publications(first: 250) {
        edges {
          node {
            id
            name
            supportsFuturePublishing
          }
        }
      }
    }
  `;

  const result = await shopifyGraphQL(graphqlQuery);
  
  if (!result.publications || !result.publications.edges) {
    throw new Error("Failed to fetch publications");
  }

  return {
    publications: result.publications.edges.map(edge => edge.node)
  };
}

// Update a product variant with pricing and inventory data
async function updateProductVariant(variantId, variantData) {
  // Use the simpler productUpdate mutation to update the variant through the product
  // This is more reliable than the productVariantUpdate mutation
  console.log('🔄 Updating product variant:', { variantId, variantData });
  
  // Extract product ID from variant ID
  const productId = variantId.replace('gid://shopify/ProductVariant/', '').split('/')[0];
  const fullProductId = `gid://shopify/Product/${productId.split('_')[0] || productId}`;
  
  // Alternative approach: Use productUpdate with variants array
  const graphqlMutation = `
    mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
          variants(first: 1) {
            edges {
              node {
                id
                title
                price
                compareAtPrice
                sku
                inventoryQuantity
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  // Build variant update input
  const variantInput = {
    id: variantId
  };
  
  if (variantData.price) variantInput.price = variantData.price;
  if (variantData.compareAtPrice) variantInput.compareAtPrice = variantData.compareAtPrice;
  if (variantData.sku) variantInput.sku = variantData.sku;
  
  // Handle inventory separately as it requires special structure
  if (variantData.inventoryQuantity) {
    // For now, skip inventory updates as they require location management
    console.log('⚠️ Inventory updates require location management - skipping for now');
  }

  const variables = {
    input: {
      id: fullProductId,
      variants: [variantInput]
    }
  };

  console.log('📡 Sending variant update mutation:', JSON.stringify(variables, null, 2));

  try {
    const result = await shopifyGraphQL(graphqlMutation, variables);
    
    if (result.productUpdate?.userErrors && result.productUpdate.userErrors.length > 0) {
      console.error("Product variant update errors:", result.productUpdate.userErrors);
      throw new Error("Failed to update product variant: " + result.productUpdate.userErrors.map(e => e.message).join(", "));
    }

    console.log('✅ Variant updated successfully');
    return result.productUpdate;
  } catch (error) {
    console.error('❌ Error updating variant:', error);
    // Don't throw error - just log it and continue
    console.log('⚠️ Variant update failed, but continuing with product creation');
    return { success: false, error: error.message };
  }
}

module.exports = { 
  shopifyGraphQL,
  fetchProducts,
  fetchAllProducts,
  createProduct,
  createProductWithVariants,
  updateProduct,
  updateProductVariant,
  deleteProduct,
  fetchProductById,
  testConnection,
  createStagedUpload,
  addProductImages,
  setProductCategory,
  publishProductToChannel,
  publishProductToMultipleChannels,
  fetchPublications
};
