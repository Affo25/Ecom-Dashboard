import { NextResponse } from 'next/server';
import { fetchProducts, fetchAllProducts, createProduct, createProductWithVariants, updateProduct, updateProductVariant, addProductImages } from '../../../../config/grapghQl-utility';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fetchAll = searchParams.get('all') === 'true';
    const query = searchParams.get('query') || '';
    const first = parseInt(searchParams.get('first')) || 10;
    const after = searchParams.get('after') || null;

    console.log('Products API Request:', { 
      fetchAll, 
      query, 
      first: fetchAll ? 'ALL' : first,
      after: fetchAll ? 'N/A' : after 
    });

    let result;

    if (fetchAll) {
      // Fetch ALL products using the new function
      console.log('🔄 Fetching ALL products from Shopify...');
      result = await fetchAllProducts(query);
      
      console.log(`✅ Successfully fetched ${result.totalCount} products from ${result.pagesFetched} pages`);
      
      return NextResponse.json({
        success: true,
        data: result,
        message: `Successfully fetched ${result.totalCount} products`
      });
    } else {
      // Fetch paginated products using the existing function
      console.log('🔄 Fetching paginated products from Shopify...');
      const data = await fetchProducts(first, after, query);
      
      const productsCount = data?.products?.edges?.length || 0;
      console.log(`✅ Successfully fetched ${productsCount} products (paginated)`);
      
      return NextResponse.json({
        success: true,
        data: data,
        message: `Successfully fetched ${productsCount} products`
      });
    }

  } catch (error) {
    console.error('Products API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch products',
      details: error.stack
    }, { 
      status: 500 
    });
  }
}

export async function POST(request) {
  try {
    console.log('🔄 Creating new product...');
    console.log('Environment check:', {
      domain: process.env.SHOPIFY_STORE_DOMAIN,
      hasToken: !!process.env.SHOPIFY_ADMIN_API_TOKEN,
      version: process.env.SHOPIFY_API_VERSION
    });
    
    let productData;
    try {
      productData = await request.json();
      console.log('Product data received:', JSON.stringify(productData, null, 2));
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON data in request body',
        details: jsonError.message
      }, { status: 400 });
    }

    // Validate required fields
    if (!productData.title || productData.title.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Product title is required'
      }, { status: 400 });
    }

    // Transform the data to match Shopify's expected format
    const shopifyProductData = {
      title: productData.title.trim(),
      descriptionHtml: productData.descriptionHtml || '',
      vendor: productData.vendor || '',
      productType: productData.productType || '',
      tags: Array.isArray(productData.tags) ? productData.tags : [],
      status: productData.status || 'ACTIVE',
    };

    // Add SEO data if provided
    if (productData.seo && (productData.seo.title || productData.seo.description)) {
      shopifyProductData.seo = {
        title: productData.seo.title || '',
        description: productData.seo.description || ''
      };
    }

    // Handle variants separately - ProductInput doesn't accept variants directly
    // We'll create the product first, then add variant data if needed
    const hasVariantData = productData.price || productData.sku || productData.inventoryQuantity;
    let variantData = null;

    if (hasVariantData) {
      variantData = {
        price: productData.price ? productData.price.toString() : '0.00',
        compareAtPrice: productData.compareAtPrice ? productData.compareAtPrice.toString() : null,
        sku: productData.sku || '',
        inventoryQuantity: productData.inventoryQuantity ? parseInt(productData.inventoryQuantity) : 0,
      };
    }

    console.log('Transformed product data:', JSON.stringify(shopifyProductData, null, 2));
    if (variantData) {
      console.log('Variant data:', JSON.stringify(variantData, null, 2));
    }

    // Create the product using appropriate GraphQL utility
    console.log('📡 Sending to Shopify GraphQL...');
    let result;

    // Always create simple product first (ProductInput doesn't accept variants)
    console.log('Creating product...');
    result = await createProduct(shopifyProductData);
    
    // If we have variant data, update the default variant that was created
    if (variantData && result && result.product && result.product.variants && result.product.variants.edges.length > 0) {
      try {
        const defaultVariantId = result.product.variants.edges[0].node.id;
        console.log('Updating default variant with pricing data...', defaultVariantId);
        
        const variantUpdateResult = await updateProductVariant(defaultVariantId, variantData);
        
        if (variantUpdateResult && variantUpdateResult.success === false) {
          console.warn('⚠️ Failed to update variant:', variantUpdateResult.error);
          // Don't fail the whole operation - product was created successfully
        } else {
          console.log('✅ Variant updated successfully');
        }
      } catch (variantError) {
        console.warn('⚠️ Failed to update variant:', variantError.message);
        // Don't fail the whole operation - product was created successfully
      }
    }

    // Handle image uploads if provided
    if (productData.imagesToAdd && Array.isArray(productData.imagesToAdd) && result && result.product) {
      const validImages = productData.imagesToAdd.filter(img => img.src && img.src.trim() !== '');
      
      if (validImages.length > 0) {
        try {
          console.log(`Adding ${validImages.length} images to product...`);
          await addProductImages(result.product.id, validImages);
          console.log('✅ Images added successfully');
        } catch (imageError) {
          console.warn('⚠️ Failed to add images:', imageError.message);
          // Don't fail the whole operation - product was created successfully
        }
      } else {
        console.log('No valid images to add');
      }
    }
    
    console.log('Raw GraphQL result:', JSON.stringify(result, null, 2));

    // Check for GraphQL errors
    if (result.userErrors && result.userErrors.length > 0) {
      console.error('Shopify validation errors:', result.userErrors);
      return NextResponse.json({
        success: false,
        error: 'Shopify validation errors: ' + result.userErrors.map(e => e.message).join(', '),
        validationErrors: result.userErrors
      }, { status: 400 });
    }
    
    console.log('✅ Product created successfully:', result.product?.id);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Product created successfully'
    });

  } catch (error) {
    console.error('❌ Product Creation Error:', error);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create product',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { 
      status: 500 
    });
  }
}