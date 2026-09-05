export interface ApplePassField {
  key: string
  label: string
  value: string | number
  changeMessage?: string
  textAlignment?: 'PKTextAlignmentLeft' | 'PKTextAlignmentCenter' | 'PKTextAlignmentRight' | 'PKTextAlignmentNatural'
}

export interface ApplePassBarcode {
  format: 'PKBarcodeFormatQR' | 'PKBarcodeFormatPDF417' | 'PKBarcodeFormatAztec' | 'PKBarcodeFormatCode128'
  message: string
  messageEncoding: string
  altText?: string
}

export interface ApplePassLocation {
  latitude: number
  longitude: number
  altitude?: number
  relevantText?: string
}

export interface ApplePassStructure {
  headerFields?: ApplePassField[]
  primaryFields?: ApplePassField[]
  secondaryFields?: ApplePassField[]
  auxiliaryFields?: ApplePassField[]
  backFields?: ApplePassField[]
}

export interface ApplePassJson {
  formatVersion: number
  passTypeIdentifier: string
  serialNumber: string
  teamIdentifier: string
  webServiceURL?: string
  authenticationToken?: string
  organizationName: string
  description: string
  logoText: string
  foregroundColor?: string
  backgroundColor?: string
  labelColor?: string
  storeCard?: ApplePassStructure
  generic?: ApplePassStructure
  barcodes: ApplePassBarcode[]
  locations?: ApplePassLocation[]
  maxDistance?: number
  sharingProhibited?: boolean
}

export interface AppleWalletConfig {
  passTypeIdentifier: string
  teamIdentifier: string
  organizationName: string
  backgroundColor: string
  foregroundColor: string
  labelColor: string
  relevantText: string
  hasCertificates: boolean
}

export function getLoyaltyTier(points: number): string {
  if (points >= 500) return 'Diamond VIP'
  if (points >= 200) return 'Platinum Member'
  if (points >= 50) return 'Gold Member'
  return 'Member'
}
