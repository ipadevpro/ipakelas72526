/**
 * CORS Debug Utilities
 * Membantu debugging masalah CORS dengan Google Apps Script
 */

const API_URL = 'https://script.google.com/macros/s/AKfycbxX3iaITRDs8i2LMO_RZzIR8rsyTGIgexgn99slhwGT4UJPKj4KDCPgB0tcHVw8msQ2Vg/exec';

export interface CORSTestResult {
  success: boolean;
  error?: string;
  status?: number;
  headers?: Record<string, string>;
  corsIssue?: boolean;
  timestamp: Date;
}

/**
 * Test CORS connection dengan Google Apps Script
 */
export async function testCORSConnection(): Promise<CORSTestResult> {
  const timestamp = new Date();
  
  try {
    console.log('🧪 Testing CORS connection to:', API_URL);
    
    // Buat request sesuai aturan CORS (URLSearchParams, POST, no custom headers)
    const formData = new URLSearchParams();
    formData.append('action', 'test');
    formData.append('username', 'cors-test');
    formData.append('password', 'cors-test');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData
      // Tidak ada custom headers sesuai CORS rules
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        corsIssue: response.status === 0 || response.status === 404,
        timestamp
      };
    }
    
    const data = await response.json();
    console.log('✅ CORS test successful:', data);
    
    return {
      success: true,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      timestamp
    };
    
  } catch (error) {
    console.error('❌ CORS test failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Deteksi jenis error CORS
    const corsIssue = 
      errorMessage.includes('CORS') ||
      errorMessage.includes('Access-Control') ||
      errorMessage.includes('Origin') ||
      errorMessage.includes('Load failed') ||
      errorMessage.includes('Network request failed');
    
    return {
      success: false,
      error: errorMessage,
      corsIssue,
      timestamp
    };
  }
}

/**
 * Diagnose CORS issues dan berikan saran perbaikan
 */
export function diagnoseCORSIssue(testResult: CORSTestResult): string[] {
  const suggestions: string[] = [];
  
  if (!testResult.success) {
    if (testResult.corsIssue) {
      suggestions.push(
        '🚨 CORS Issue Detected!',
        '',
        '📋 Langkah Perbaikan:',
        '1. Buka Google Apps Script (script.google.com)',
        '2. Pilih project yang sedang digunakan',
        '3. Klik "Deploy" > "Manage Deployments"',
        '4. Pastikan setting:',
        '   - Execute as: Me (owner)',
        '   - Who has access: Anyone (even anonymous)',
        '5. Jika sudah benar, coba deploy ulang dengan versi baru',
        '',
        '🔧 Verifikasi Backend:',
        '- Pastikan ada response.addHeader(\'Access-Control-Allow-Origin\', \'*\')',
        '- Pastikan ada function doPost() yang menangani request',
        '- Pastikan tidak ada error di backend script'
      );
    }
    
    if (testResult.status === 404) {
      suggestions.push(
        '🔗 URL Issue:',
        '- URL Google Apps Script mungkin salah atau expired',
        '- Deploy ulang dan update URL di src/lib/api.ts',
        '- Pastikan URL berakhiran "/exec"'
      );
    }
    
    if (testResult.status === 0) {
      suggestions.push(
        '🌐 Network Issue:',
        '- Periksa koneksi internet',
        '- Coba akses Google Apps Script langsung di browser',
        '- Pastikan Google Apps Script service tidak down'
      );
    }
    
    if (testResult.error?.includes('Load failed')) {
      suggestions.push(
        '⚡ Load Failed:',
        '- Ini biasanya CORS issue',
        '- Pastikan deployment setting di Google Apps Script benar',
        '- Coba test di browser lain atau incognito mode'
      );
    }
  } else {
    suggestions.push(
      '✅ CORS Connection Successful!',
      '- API dapat diakses dari browser',
      '- CORS headers sudah benar',
      '- Issue mungkin di level aplikasi atau authentication'
    );
  }
  
  return suggestions;
}

/**
 * Generate CORS debug report
 */
export async function generateCORSReport(): Promise<string> {
  const testResult = await testCORSConnection();
  const suggestions = diagnoseCORSIssue(testResult);
  
  const report = [
    '🔍 CORS DEBUG REPORT',
    '=' .repeat(50),
    `⏰ Timestamp: ${testResult.timestamp.toISOString()}`,
    `🎯 Target URL: ${API_URL}`,
    `✅ Success: ${testResult.success}`,
    '',
    '📊 Response Details:',
    `   Status: ${testResult.status || 'N/A'}`,
    `   Error: ${testResult.error || 'None'}`,
    `   CORS Issue: ${testResult.corsIssue ? 'Yes' : 'No'}`,
    '',
    '🌐 Response Headers:',
    testResult.headers ? 
      Object.entries(testResult.headers)
        .map(([key, value]) => `   ${key}: ${value}`)
        .join('\n') : 
      '   No headers received',
    '',
    '💡 Suggestions:',
    ...suggestions.map(s => `   ${s}`),
    '',
    '🔗 Useful Links:',
    '   - Google Apps Script: https://script.google.com',
    '   - CORS Debug Guide: ./cors-debug.md',
    '   - Current API URL: ' + API_URL
  ].join('\n');
  
  return report;
}

/**
 * Log CORS debug info to console
 */
export async function logCORSDebug(): Promise<void> {
  const report = await generateCORSReport();
  console.log(report);
}

/**
 * Test dengan berbagai metode untuk debugging
 */
export async function comprehensiveCORSTest(): Promise<Record<string, CORSTestResult>> {
  const tests: Record<string, () => Promise<CORSTestResult>> = {
    'Standard POST with URLSearchParams': async () => {
      try {
        const formData = new URLSearchParams();
        formData.append('action', 'test');
        const response = await fetch(API_URL, {
          method: 'POST',
          body: formData
        });
        return {
          success: response.ok,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          timestamp: new Date()
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          corsIssue: true,
          timestamp: new Date()
        };
      }
    },
    
    'GET Request': async () => {
      try {
        const response = await fetch(API_URL + '?action=test', {
          method: 'GET'
        });
        return {
          success: response.ok,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          timestamp: new Date()
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          corsIssue: true,
          timestamp: new Date()
        };
      }
    }
  };
  
  const results: Record<string, CORSTestResult> = {};
  
  for (const [testName, testFn] of Object.entries(tests)) {
    console.log(`🧪 Running test: ${testName}`);
    results[testName] = await testFn();
  }
  
  return results;
}
