let currentFileContent = null;
let currentFileName = null;

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFileBtn');
const encryptBtn = document.getElementById('encryptBtn');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const outputCode = document.getElementById('outputCode');
const hashInfo = document.getElementById('hashInfo');
const expiryInfo = document.getElementById('expiryInfo');
const statsInfo = document.getElementById('statsInfo');

// Expiry mode
const expiryModes = document.querySelectorAll('input[name="expiryMode"]');
const daysModeInput = document.getElementById('daysModeInput');
const dateModeInput = document.getElementById('dateModeInput');
const daysSlider = document.getElementById('daysSlider');
const daysValue = document.getElementById('daysValue');
const datePicker = document.getElementById('datePicker');
const datePreview = document.getElementById('datePreview');

const today = new Date().toISOString().split('T')[0];
datePicker.min = today;

expiryModes.forEach(mode => {
  mode.addEventListener('change', () => {
    if (mode.value === 'days') {
      daysModeInput.style.display = 'block';
      dateModeInput.style.display = 'none';
    } else if (mode.value === 'date') {
      daysModeInput.style.display = 'none';
      dateModeInput.style.display = 'block';
    } else {
      daysModeInput.style.display = 'none';
      dateModeInput.style.display = 'none';
    }
  });
});

daysSlider.addEventListener('input', () => {
  daysValue.textContent = daysSlider.value + ' days';
});

datePicker.addEventListener('change', () => {
  const selected = new Date(datePicker.value);
  const formatted = selected.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  datePreview.textContent = `Expires on: ${formatted}`;
});

document.querySelectorAll('.preset-day').forEach(btn => {
  btn.addEventListener('click', () => {
    const days = btn.getAttribute('data-days');
    daysSlider.value = days;
    daysValue.textContent = days + ' days';
  });
});

// File upload
browseBtn.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('click', (e) => {
  if (e.target !== browseBtn && !fileInput.contains(e.target)) {
    fileInput.click();
  }
});

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  if (e.dataTransfer.files.length > 0) {
    handleFile(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFile(e.target.files[0]);
  }
});

function handleFile(file) {
  if (!file.name.match(/\.(js|mjs|txt)$/i)) {
    alert('Please upload a .js, .mjs, or .txt file');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    alert('File too large! Maximum 5MB');
    return;
  }
  
  currentFileName = file.name;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    currentFileContent = e.target.result;
    fileName.textContent = file.name;
    fileSize.textContent = `(${(file.size / 1024).toFixed(2)} KB)`;
    fileInfo.style.display = 'flex';
    uploadArea.style.display = 'none';
    encryptBtn.disabled = false;
    outputCode.textContent = 'Ready to obfuscate...';
  };
  reader.readAsText(file);
}

removeFileBtn.addEventListener('click', () => {
  currentFileContent = null;
  currentFileName = null;
  fileInfo.style.display = 'none';
  uploadArea.style.display = 'block';
  encryptBtn.disabled = true;
  outputCode.textContent = 'Waiting for file upload...';
  copyBtn.disabled = true;
  downloadBtn.disabled = true;
  hashInfo.innerHTML = '';
  expiryInfo.innerHTML = '';
  statsInfo.innerHTML = '';
});

function getExpirySettings() {
  const selectedMode = document.querySelector('input[name="expiryMode"]:checked').value;
  if (selectedMode === 'off') return { mode: 'off', value: 7 };
  if (selectedMode === 'days') return { mode: 'days', value: parseInt(daysSlider.value) };
  const dateValue = datePicker.value;
  if (!dateValue) { alert('Please select an expiry date'); return null; }
  return { mode: 'date', value: dateValue };
}

// ENCRYPT
encryptBtn.addEventListener('click', async () => {
  if (!currentFileContent) { alert('Please upload a file first'); return; }
  
  const expiry = getExpirySettings();
  if (!expiry) return;
  
  encryptBtn.classList.add('loading');
  encryptBtn.disabled = true;
  encryptBtn.innerHTML = '<span class="btn-icon">💀</span> OBFUSCATING TOTAL...';
  outputCode.textContent = '🔒 Applying total obfuscation (all code encrypted)...\n⏱️ Please wait...\n';
  
  try {
    const response = await fetch('/api/encrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: currentFileContent,
        expiryMode: expiry.mode,
        expiryValue: expiry.value
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      outputCode.textContent = data.obfuscated;
      
      hashInfo.innerHTML = `🔐 SECURITY HASH: ${data.hash.substring(0, 32)}...<br>🛡️ SIGNATURE: ${data.signature}`;
      
      let expiryText = expiry.mode === 'off' ? 'No expiry' : 
                       expiry.mode === 'days' ? `Expires after ${expiry.value} days` : 
                       `Expires on ${new Date(expiry.value).toLocaleDateString()}`;
      
      expiryInfo.innerHTML = `⏰ TIMEBOMB: ${expiryText}<br>📞 Contact: @Xatanicvxii on Telegram`;
      statsInfo.innerHTML = `📊 Original: ${data.stats.originalSize} bytes | Obfuscated: ${data.stats.obfuscatedSize} bytes | Ratio: ${data.stats.ratio}`;
      
      copyBtn.disabled = false;
      downloadBtn.disabled = false;
      
      encryptBtn.innerHTML = '<span class="btn-icon">✅</span> OBFUSCATED!';
      setTimeout(() => {
        encryptBtn.innerHTML = '<span class="btn-icon">💀</span> TOTAL OBFUSCATE';
      }, 2000);
    } else {
      outputCode.textContent = `❌ Error: ${data.error}`;
    }
  } catch (error) {
    outputCode.textContent = `❌ Error: ${error.message}`;
  } finally {
    encryptBtn.classList.remove('loading');
    encryptBtn.disabled = false;
  }
});

// COPY - FIXED
copyBtn.addEventListener('click', async () => {
  const text = outputCode.textContent;
  if (text && !text.includes('Waiting') && !text.includes('OBFUSCATING') && !text.includes('Error')) {
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.innerHTML = '✓ Copied!';
      setTimeout(() => { copyBtn.innerHTML = '📋 Copy'; }, 1500);
    } catch(e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      copyBtn.innerHTML = '✓ Copied!';
      setTimeout(() => { copyBtn.innerHTML = '📋 Copy'; }, 1500);
    }
  }
});

// DOWNLOAD - FIXED (PASTI BISA)
downloadBtn.addEventListener('click', () => {
  const text = outputCode.textContent;
  
  // Debug
  console.log('Download clicked, text length:', text ? text.length : 0);
  console.log('Text preview:', text ? text.substring(0, 100) : 'empty');
  
  if (!text || text.includes('Waiting') || text.includes('OBFUSCATING') || text.includes('Error') || text === 'Ready to obfuscate...') {
    alert('No obfuscated code to download. Please obfuscate a file first.');
    return;
  }
  
  try {
    // Method 1: Blob + URL
    const blob = new Blob([text], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const baseName = currentFileName ? currentFileName.replace(/\.(js|mjs|txt)$/i, '') : 'protected';
    const expiryMode = document.querySelector('input[name="expiryMode"]:checked').value;
    a.download = `${baseName}_total_${expiryMode}.js`;
    a.href = url;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    // Feedback
    const originalText = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '✓ Downloaded!';
    setTimeout(() => {
      downloadBtn.innerHTML = originalText;
    }, 1500);
    
    console.log('Download triggered successfully');
    
  } catch (err) {
    console.error('Download error:', err);
    alert('Download failed: ' + err.message);
  }
});