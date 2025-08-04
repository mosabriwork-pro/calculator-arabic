import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Permanent codes file path
const PERMANENT_CODES_FILE_PATH = path.join(process.cwd(), 'data', 'permanent-codes.json')

// Ensure data directory exists
const ensureDataDirectory = () => {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Load permanent codes from file
const loadPermanentCodes = (): Record<string, string> => {
  try {
    ensureDataDirectory()
    if (fs.existsSync(PERMANENT_CODES_FILE_PATH)) {
      const data = fs.readFileSync(PERMANENT_CODES_FILE_PATH, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading permanent codes:', error)
  }
  return {}
}

// Save permanent codes to file
const savePermanentCodes = (codes: Record<string, string>) => {
  try {
    ensureDataDirectory()
    fs.writeFileSync(PERMANENT_CODES_FILE_PATH, JSON.stringify(codes, null, 2))
  } catch (error) {
    console.error('Error saving permanent codes:', error)
  }
}

export async function GET() {
  try {
    const codes = loadPermanentCodes()
    
    return NextResponse.json({
      success: true,
      codes: codes
    })
  } catch (error) {
    console.error('Error in GET /api/permanent-codes:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to load permanent codes',
      codes: {}
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, code, adminPassword } = await request.json()
    
    if (!email || !code) {
      return NextResponse.json({
        success: false,
        error: 'Email and code are required'
      }, { status: 400 })
    }

    if (adminPassword !== 'admin123') {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }
    
    const codes = loadPermanentCodes()
    codes[email] = code
    savePermanentCodes(codes)
    
    return NextResponse.json({
      success: true,
      email: email,
      code: code,
      message: 'Permanent code added successfully'
    })
  } catch (error) {
    console.error('Error in POST /api/permanent-codes:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to add permanent code'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { email, adminPassword } = await request.json()
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 })
    }

    if (adminPassword !== 'admin123') {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }
    
    const codes = loadPermanentCodes()
    
    if (codes[email]) {
      delete codes[email]
      savePermanentCodes(codes)
      
      return NextResponse.json({
        success: true,
        message: 'Permanent code deleted successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Code not found'
      }, { status: 404 })
    }
  } catch (error) {
    console.error('Error in DELETE /api/permanent-codes:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete permanent code'
    }, { status: 500 })
  }
} 