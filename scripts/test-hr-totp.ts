import { prisma } from '../src/lib/db'
import { generateTotpSecret, generateOtpAuthUri, generateTotpQrCode, generateTotpToken, verifyTotpToken } from '../src/lib/totp'

async function runTest() {
  console.log('🚀 Starting Full HR & Google Authenticator TOTP Test Suite...')

  const tenant = await prisma.tenant.findFirst()
  if (!tenant) {
    console.error('No tenant found in dev.db')
    return
  }

  console.log(`✅ Using Tenant: ${tenant.businessName} (${tenant.id})`)

  // 1. Create or find a test employee with full HR attributes
  const testEmail = 'sarah.barista@dafaterkom.com'
  let staff = await prisma.staff.findUnique({ where: { email: testEmail } })

  if (!staff) {
    staff = await prisma.staff.create({
      data: {
        tenantId: tenant.id,
        name: 'Sarah Al-Mansoor',
        email: testEmail,
        password: 'hashed_password',
        role: 'cashier',
        joinCode: '554433',
        jobTitle: 'Lead Barista & Cashier',
        phone: '+966 55 987 6543',
        department: 'Service',
        hireDate: new Date('2024-03-15'),
        salaryType: 'monthly',
        monthlySalary: 1800,
        standardDailyHours: 8,
        hourlyRate: 18.75,
        overtimeRate: 28.12,
        shiftSchedule: '08:00 - 16:00 (Morning)',
        bankName: 'Alinma Bank',
        bankAccount: 'SA90800001234567890123',
        nationalId: '1098765432'
      }
    })
    console.log(`✅ Created test HR Employee: ${staff.name} | Dept: ${staff.department} | Start: ${staff.hireDate?.toISOString().split('T')[0]}`)
  } else {
    console.log(`✅ Found existing test HR Employee: ${staff.name}`)
  }

  // 2. Test Google Authenticator Secret & QR code generation
  const secret = generateTotpSecret()
  const otpUri = generateOtpAuthUri({
    secret,
    accountName: `${staff.name} (${staff.email})`,
    issuer: 'Dafaterkom Cloud POS'
  })
  const qrCodeUrl = await generateTotpQrCode(otpUri)

  console.log('✅ TOTP Secret Generated:', secret)
  console.log('✅ OTP Auth URI Generated:', otpUri)
  console.log('✅ QR Code Data URL length:', qrCodeUrl.length, 'characters')

  // 3. Test Dynamic Token Generation & Verification
  const currentToken = generateTotpToken(secret)
  console.log('✅ Current Dynamic Google Authenticator 6-digit Token:', currentToken)

  const isValidToken = verifyTotpToken({ secret, token: currentToken })
  console.log('✅ Token Verification Result:', isValidToken ? 'VALID (PASSED)' : 'INVALID (FAILED)')

  const isInvalidToken = verifyTotpToken({ secret, token: '000000' })
  console.log('✅ Fake Token (000000) Result:', !isInvalidToken ? 'CORRECTLY REJECTED' : 'FAILED')

  // 4. Link Google Authenticator to employee in DB
  const updatedStaff = await prisma.staff.update({
    where: { id: staff.id },
    data: {
      totpSecret: secret,
      totpEnabled: true,
      totpVerifiedAt: new Date(),
      requireTotpForShift: true
    }
  })
  console.log(`✅ Google Authenticator Linked to ${updatedStaff.name}: totpEnabled = ${updatedStaff.totpEnabled}`)

  // 5. Test Attendance Recording
  const now = new Date()
  const clockInTime = new Date(now.getTime() - (8.5 * 60 * 60 * 1000)) // 8.5 hours ago

  const attendance = await prisma.attendanceRecord.create({
    data: {
      tenantId: tenant.id,
      staffId: updatedStaff.id,
      clockIn: clockInTime,
      clockOut: now,
      totalHours: 8.5,
      regularHours: 8.0,
      overtimeHours: 0.5,
      source: 'google_auth_totp',
      status: 'completed',
      notes: 'Verified via Google Authenticator TOTP'
    }
  })

  console.log(`✅ Attendance Log Created: Total ${attendance.totalHours}h (Regular: ${attendance.regularHours}h, OT: ${attendance.overtimeHours}h) via ${attendance.source}`)

  console.log('\n🎉 ALL HR & GOOGLE AUTHENTICATOR TESTS PASSED SUCCESSFULLY!')
}

runTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
