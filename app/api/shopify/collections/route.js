import { NextResponse } from 'next/server';
import { fetchCollections, fetchCollectionById, createCollection, updateCollection, deleteCollection } from '../../../../config/grapghQl-utility';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('id');
    const first = parseInt(searchParams.get('first')) || 10;
    const after = searchParams.get('after') || null;
    const query = searchParams.get('query') || '';

    console.log('Collections API Request:', { collectionId, first, after, query });

    let result;
    
    if (collectionId) {
      // Fetch single collection by ID
      console.log('🔄 Fetching collection by ID from Shopify...');
      result = await fetchCollectionById(collectionId);
      
      return NextResponse.json({
        success: true,
        data: result,
        message: 'Successfully fetched collection'
      });
    } else {
      // Fetch collections with pagination
      console.log('🔄 Fetching collections from Shopify...');
      result = await fetchCollections(first, after, query);
      
      const collectionsCount = result?.collections?.edges?.length || 0;
      console.log(`✅ Successfully fetched ${collectionsCount} collections`);
      
      return NextResponse.json({
        success: true,
        data: result,
        message: `Successfully fetched ${collectionsCount} collections`
      });
    }

  } catch (error) {
    console.error('Collections API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch collections',
      details: error.stack
    }, { 
      status: 500 
    });
  }
}

export async function POST(request) {
  try {
    console.log('🔄 Creating new collection...');
    
    const collectionData = await request.json();
    
    // Validate required fields
    if (!collectionData.title || !collectionData.title.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Collection title is required'
      }, { status: 400 });
    }

    const result = await createCollection(collectionData);
    
    console.log('✅ Collection created successfully');

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Collection created successfully'
    });

  } catch (error) {
    console.error('❌ Collection Creation Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create collection',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { 
      status: 500 
    });
  }
}

export async function PUT(request) {
  try {
    console.log('🔄 Updating collection...');
    
    const body = await request.json();
    const { collectionId, ...updateData } = body;

    if (!collectionId) {
      return NextResponse.json({
        success: false,
        error: 'Collection ID is required'
      }, { status: 400 });
    }

    const result = await updateCollection(collectionId, updateData);
    
    console.log('✅ Collection updated successfully');

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Collection updated successfully'
    });

  } catch (error) {
    console.error('❌ Collection Update Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update collection',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { 
      status: 500 
    });
  }
}

export async function DELETE(request) {
  try {
    console.log('🔄 Deleting collection...');
    
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('id');

    if (!collectionId) {
      return NextResponse.json({
        success: false,
        error: 'Collection ID is required'
      }, { status: 400 });
    }

    const result = await deleteCollection(collectionId);
    
    console.log('✅ Collection deleted successfully');

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Collection deleted successfully'
    });

  } catch (error) {
    console.error('❌ Collection Delete Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete collection',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { 
      status: 500 
    });
  }
}