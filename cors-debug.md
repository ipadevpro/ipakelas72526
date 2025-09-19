# 🔧 CORS Debug Guide

## Error yang Terjadi
```
Origin http://localhost:5173 is not allowed by Access-Control-Allow-Origin
```

## 📋 Checklist Perbaikan CORS

### ✅ 1. Verifikasi Deployment Google Apps Script

**Langkah-langkah:**

1. **Buka Google Apps Script** di [script.google.com](https://script.google.com)
2. **Pilih project** yang sedang digunakan
3. **Klik "Deploy" > "Manage Deployments"**
4. **Pastikan setting berikut:**
   - ✅ **Execute as:** `Me (pemilik script)`
   - ✅ **Who has access:** `Anyone (even anonymous)`

### ✅ 2. Verifikasi Kode Backend CORS

**Pastikan fungsi `doPost()` memiliki header CORS:**

```javascript
function doPost(e) {
  // Setup CORS untuk cross-origin request
  var response = ContentService.createTextOutput();
  response.setMimeType(ContentService.MimeType.JSON);
  
  // Tambahkan header CORS - WAJIB!
  response.addHeader('Access-Control-Allow-Origin', '*');
  response.addHeader('Access-Control-Allow-Methods', 'GET, POST');
  response.addHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // ... rest of your code
}
```

### ✅ 3. Deploy Ulang dengan Versi Baru

**Jika sudah ada deployment sebelumnya:**

1. **Klik "Deploy" > "New Deployment"**
2. **Pilih "Web App"**
3. **Increment version** (misalnya dari v1 ke v2)
4. **Execute as:** `Me`
5. **Who has access:** `Anyone (even anonymous)`
6. **Klik "Deploy"**
7. **Copy URL baru** dan update di `src/lib/api.ts`

### ✅ 4. Test Koneksi API

Jalankan test ini di browser console:

```javascript
// Test CORS dengan fetch sederhana
fetch('YOUR_GAS_URL_HERE', {
  method: 'POST',
  body: new URLSearchParams({
    action: 'test'
  })
})
.then(response => response.json())
.then(data => console.log('✅ Success:', data))
.catch(error => console.error('❌ Error:', error));
```

## 🚨 Kemungkinan Penyebab Error

### 1. **URL Expired/Invalid**
- URL Google Apps Script berubah setelah deploy ulang
- Update URL di `src/lib/api.ts` line 11

### 2. **Deployment Setting Salah**
- Execute as: harus `Me (owner)`
- Access: harus `Anyone (even anonymous)`

### 3. **Missing CORS Headers**
- Backend tidak menambahkan header CORS
- Pastikan ada `response.addHeader('Access-Control-Allow-Origin', '*')`

### 4. **Development vs Production**
- Localhost (http://localhost:5173) vs Production domain
- CORS harus mengizinkan semua origin dengan `*`

## 🔄 Langkah Perbaikan Cepat

### **Step 1: Update Backend**
```javascript
function doPost(e) {
  var response = ContentService.createTextOutput();
  response.setMimeType(ContentService.MimeType.JSON);
  
  // CORS Headers - WAJIB untuk frontend
  response.addHeader('Access-Control-Allow-Origin', '*');
  response.addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.addHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  try {
    var params = e.parameter;
    var action = params.action;
    
    // Handle your actions here...
    
    response.setContent(JSON.stringify(result));
    return response;
  } catch(error) {
    response.setContent(JSON.stringify({
      success: false,
      error: error.toString()
    }));
    return response;
  }
}

// TAMBAHKAN ini untuk handle OPTIONS request
function doOptions(e) {
  var response = ContentService.createTextOutput('');
  response.addHeader('Access-Control-Allow-Origin', '*');
  response.addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.addHeader('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}
```

### **Step 2: Deploy Ulang**
1. Save script
2. Deploy > New Deployment
3. Web App, versi baru
4. Execute as: Me, Access: Anyone
5. Copy URL baru

### **Step 3: Update Frontend**
Update URL di `src/lib/api.ts`:
```javascript
const API_URL = 'URL_BARU_DARI_STEP_2';
```

## 🧪 Test Script

Buat file `test-cors.html` untuk test manual:

```html
<!DOCTYPE html>
<html>
<head>
    <title>CORS Test</title>
</head>
<body>
    <button onclick="testCORS()">Test CORS</button>
    <div id="result"></div>
    
    <script>
    function testCORS() {
        const url = 'PASTE_YOUR_GAS_URL_HERE';
        
        fetch(url, {
            method: 'POST',
            body: new URLSearchParams({
                action: 'test',
                username: 'test',
                password: 'test'
            })
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('result').innerHTML = 
                '<pre style="color: green;">✅ Success: ' + JSON.stringify(data, null, 2) + '</pre>';
        })
        .catch(error => {
            document.getElementById('result').innerHTML = 
                '<pre style="color: red;">❌ Error: ' + error + '</pre>';
        });
    }
    </script>
</body>
</html>
```

## 📝 Catatan Penting

1. **Jangan gunakan custom headers** di frontend
2. **Gunakan URLSearchParams** untuk body (bukan JSON)
3. **Deploy setting harus tepat** di Google Apps Script
4. **URL berubah setiap kali deploy ulang** versi baru

## 🆘 Jika Masih Error

1. Cek browser console untuk error detail
2. Verifikasi URL di Network tab browser
3. Pastikan Google Apps Script service tidak down
4. Try different browser atau incognito mode
