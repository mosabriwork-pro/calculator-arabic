import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Customer database file path
const CUSTOMERS_FILE_PATH = path.join(process.cwd(), 'data', 'customers.json')

// Ensure data directory exists
const ensureDataDirectory = () => {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Load customers from persistent storage
const loadCustomers = (): Record<string, any> => {
  try {
    ensureDataDirectory()
    if (fs.existsSync(CUSTOMERS_FILE_PATH)) {
      const data = fs.readFileSync(CUSTOMERS_FILE_PATH, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading customers:', error)
  }
  return {}
}

// Save customers to persistent storage
const saveCustomers = (customers: Record<string, any>) => {
  try {
    ensureDataDirectory()
    fs.writeFileSync(CUSTOMERS_FILE_PATH, JSON.stringify(customers, null, 2))
  } catch (error) {
    console.error('Error saving customers:', error)
  }
}

export async function GET() {
  try {
    const customers = loadCustomers()
    
    // Convert to array format for easier handling in frontend
    const customersArray = Object.values(customers).map((customer: any) => ({
      email: customer.email,
      name: customer.name || '',
      registrationDate: customer.registrationDate || '',
      lastActivity: customer.lastActivity || '',
      usageCount: customer.usageCount || 0,
      status: customer.status || 'active',
      lastLogin: customer.lastLogin || '',
      accessCodeSent: customer.accessCodeSent || false,
      lastUpdated: customer.lastUpdated || '',
      subscriptionStart: customer.subscriptionStart || '',
      subscriptionEnd: customer.subscriptionEnd || '',
      isExpired: customer.isExpired || false
    }))
    
    return NextResponse.json({
      success: true,
      customers: customersArray,
      total: customersArray.length
    })
  } catch (error) {
    console.error('Error loading customers:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to load customers',
      customers: [],
      total: 0
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { email, status, subscriptionStart, subscriptionEnd, isExpired } = await request.json()
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 })
    }
    
    const customers = loadCustomers()
    
    if (customers[email]) {
      // Update status if provided
      if (status) {
        customers[email].status = status
      }
      
      // Update subscription dates if provided
      if (subscriptionStart) {
        customers[email].subscriptionStart = subscriptionStart
      }
      
      if (subscriptionEnd) {
        customers[email].subscriptionEnd = subscriptionEnd
      }
      
      // Update expired status if provided
      if (isExpired !== undefined) {
        customers[email].isExpired = isExpired
      }
      
      customers[email].lastUpdated = new Date().toISOString()
      saveCustomers(customers)
      
      return NextResponse.json({
        success: true,
        message: 'Customer updated successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Customer not found'
      }, { status: 404 })
    }
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update customer'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 })
    }
    
    const customers = loadCustomers()
    
    if (customers[email]) {
      // Delete the customer
      delete customers[email]
      saveCustomers(customers)
      
      return NextResponse.json({
        success: true,
        message: 'Customer deleted successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Customer not found'
      }, { status: 404 })
    }
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete customer'
    }, { status: 500 })
  }
} 