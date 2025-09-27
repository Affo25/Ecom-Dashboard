import { NextResponse } from 'next/server';
import { fetchOrders, fetchOrderById, updateOrderStatus, createOrder } from '../../../../config/grapghQl-utility';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    const first = parseInt(searchParams.get('first')) || 10;
    const after = searchParams.get('after') || null;
    const query = searchParams.get('query') || '';
    const status = searchParams.get('status') || '';

    console.log('Orders API Request:', { orderId, first, after, query, status });

    let result;
    
    if (orderId) {
      // Fetch single order by ID
      console.log('🔄 Fetching order by ID from Shopify...');
      result = await fetchOrderById(orderId);
      
      return NextResponse.json({
        success: true,
        data: result,
        message: 'Successfully fetched order'
      });
    } else {
      // Fetch orders with pagination
      console.log('🔄 Fetching orders from Shopify...');
      const orderQuery = [query, status].filter(Boolean).join(' ');
      result = await fetchOrders(first, after, orderQuery);
      
      const ordersCount = result?.orders?.edges?.length || 0;
      console.log(`✅ Successfully fetched ${ordersCount} orders`);
      
      return NextResponse.json({
        success: true,
        data: result,
        message: `Successfully fetched ${ordersCount} orders`
      });
    }

  } catch (error) {
    console.error('Orders API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch orders',
      details: error.stack
    }, { 
      status: 500 
    });
  }
}

export async function PUT(request) {
  try {
    console.log('🔄 Updating order status...');
    
    const body = await request.json();
    const { orderId, status, note } = body;

    if (!orderId || !status) {
      return NextResponse.json({
        success: false,
        error: 'Order ID and status are required'
      }, { status: 400 });
    }

    const result = await updateOrderStatus(orderId, status, note);
    
    console.log('✅ Order status updated successfully');

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Order status updated successfully'
    });

  } catch (error) {
    console.error('❌ Order Update Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update order',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { 
      status: 500 
    });
  }
}