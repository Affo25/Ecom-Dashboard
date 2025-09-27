import { NextResponse } from 'next/server';
import { fetchCustomers, fetchCustomerById, createCustomer, updateCustomer } from '../../../../config/grapghQl-utility';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('id');
    const first = parseInt(searchParams.get('first')) || 10;
    const after = searchParams.get('after') || null;
    const query = searchParams.get('query') || '';

    console.log('Customers API Request:', { customerId, first, after, query });

    let result;
    
    if (customerId) {
      // Fetch single customer by ID
      console.log('🔄 Fetching customer by ID from Shopify...');
      result = await fetchCustomerById(customerId);
      
      return NextResponse.json({
        success: true,
        data: result,
        message: 'Successfully fetched customer'
      });
    } else {
      // Fetch customers with pagination
      console.log('🔄 Fetching customers from Shopify...');
      result = await fetchCustomers(first, after, query);
      
      const customersCount = result?.customers?.edges?.length || 0;
      console.log(`✅ Successfully fetched ${customersCount} customers`);
      
      return NextResponse.json({
        success: true,
        data: result,
        message: `Successfully fetched ${customersCount} customers`
      });
    }

  } catch (error) {
    console.error('Customers API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch customers',
      details: error.stack
    }, { 
      status: 500 
    });
  }
}

export async function POST(request) {
  try {
    console.log('🔄 Creating new customer...');
    
    const customerData = await request.json();
    
    // Validate required fields
    if (!customerData.email || !customerData.email.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Customer email is required'
      }, { status: 400 });
    }

    const result = await createCustomer(customerData);
    
    console.log('✅ Customer created successfully');

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Customer created successfully'
    });

  } catch (error) {
    console.error('❌ Customer Creation Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create customer',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { 
      status: 500 
    });
  }
}

export async function PUT(request) {
  try {
    console.log('🔄 Updating customer...');
    
    const body = await request.json();
    const { customerId, ...updateData } = body;

    if (!customerId) {
      return NextResponse.json({
        success: false,
        error: 'Customer ID is required'
      }, { status: 400 });
    }

    const result = await updateCustomer(customerId, updateData);
    
    console.log('✅ Customer updated successfully');

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Customer updated successfully'
    });

  } catch (error) {
    console.error('❌ Customer Update Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update customer',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { 
      status: 500 
    });
  }
}