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

/**
 * Utility to download data as a JSON file
 * @param {any} data - The data to download
 * @param {string} filename - The name of the file to save as
 */
export function downloadJsonFile(data, filename) {
  try {
    // Serialize to JSON string, handling BigInt
    const jsonString = JSON.stringify(data, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value
    , 2)
    
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename.endsWith('.json') ? filename : `${filename}.json`
    
    document.body.appendChild(link)
    link.click()
    
    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Download failed:', error)
    throw new Error('Failed to generate download file')
  }
}
