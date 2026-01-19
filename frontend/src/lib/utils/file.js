import { isAddress } from 'viem'

/**
 * Parses a file containing Ethereum addresses
 * @param {File} file - The file object to parse
 * @returns {Promise<string[]>} - Array of valid unique addresses
 */
export async function parseAddressesFromFile(file) {
  if (!file) throw new Error('No file provided')

  try {
    const content = await file.text()
    // Normalize to lowercase to handle mixed-case addresses with invalid checksums
    // Split by newlines, commas, or spaces
    const addresses = content
      .split(/[\n, ]+/)
      .map(addr => addr.trim().toLowerCase())
      .filter(addr => isAddress(addr))
    
    // Return unique addresses
    return [...new Set(addresses)]
  } catch (err) {
    throw new Error('Failed to parse file content')
  }
}

/**
 * Parses a JSON file
 * @param {File} file - The file object to parse
 * @returns {Promise<any>} - Parsed JSON content
 */
export async function parseJsonFile(file) {
  if (!file) throw new Error('No file provided')

  try {
    const text = await file.text()
    return JSON.parse(text)
  } catch (err) {
    throw new Error('Invalid JSON file')
  }
}
