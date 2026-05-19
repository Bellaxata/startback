const crypto = require('crypto');

class TotalObfuscator {
  constructor(code, options = {}) {
    this.originalCode = code;
    this.expiryMode = options.expiryMode || 'off';
    this.expiryValue = options.expiryValue || 7;
    this.hash = this.generateHash(code);
    this.signature = this.generateSignature(code);
  }

  generateHash(str) {
    let hash = crypto.createHash('sha256').update(str).digest('hex');
    for (let i = 0; i < 10; i++) {
      hash = crypto.createHash('sha512').update(hash).digest('hex');
    }
    return hash;
  }

  generateSignature(str) {
    let sig = 0;
    for (let i = 0; i < str.length; i++) {
      sig = ((sig << 5) - sig) + str.charCodeAt(i);
      sig |= 0;
    }
    for (let i = 0; i < 5; i++) {
      sig = ((sig << 7) ^ sig) >>> 0;
    }
    return Math.abs(sig).toString(16).padStart(16, '0');
  }

  randomId(len = 20) {
    return crypto.randomBytes(len).toString('hex');
  }

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Deep hex encoding (multi-layer)
  deepHexEncode(str, layers = 5) {
    let result = str;
    for (let i = 0; i < layers; i++) {
      result = Buffer.from(result, 'utf8').toString('hex');
    }
    return result;
  }

  // Complex hex array dengan random split
  toComplexHexArray(str) {
    const encoded = this.deepHexEncode(str, 3);
    const hexArray = encoded.match(/.{1,2}/g) || [];
    // Randomize array order dengan pattern tersembunyi
    for (let i = hexArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [hexArray[i], hexArray[j]] = [hexArray[j], hexArray[i]];
    }
    return '[' + hexArray.map(h => '0x' + h).join(',') + ']';
  }

  // Enkripsi seluruh kode termasuk security logic
  encryptAllStrings(code) {
    const stringPattern = /(["'])((?:(?=(\\?))\3.)*?)\1/g;
    
    // Super complex decoder (semua logic di-encrypt juga)
    const decodeEngine = this.generateEncryptedDecoder();
    
    let encoded = code;
    let hasStrings = false;
    let method = 0;
    const methods = [1, 2, 3, 4, 5, 6, 7, 8];
    
    encoded = encoded.replace(stringPattern, (match, quote, content) => {
      if (content.length < 1) return match;
      if (content.includes('_x0') || content.includes('_decode')) return match;
      hasStrings = true;
      method = methods[Math.floor(Math.random() * methods.length)];
      const hexArr = this.toComplexHexArray(content);
      return `_x0(${hexArr},${method})`;
    });
    
    // Encode juga angka-angka penting
    const numberPattern = /\b(\d+)\b/g;
    encoded = encoded.replace(numberPattern, (match, num) => {
      if (num.length > 3 && num.length < 10) {
        const encodedNum = this.toComplexHexArray(num);
        return `_x1(${encodedNum})`;
      }
      return match;
    });
    
    return hasStrings ? decodeEngine + encoded : encoded;
  }

  // Generate encoded decoder (decoder-nya sendiri juga di-encrypt)
  generateEncryptedDecoder() {
    const decoderCode = `
      const _x0 = (a,l) => {
        let s='';
        for(let i=0;i<a.length;i++) s+=String.fromCharCode(a[i]);
        let r=Buffer.from(s,'hex').toString();
        for(let i=0;i<3;i++) r=Buffer.from(r,'hex').toString();
        if(l&1) r=r.split('').reverse().join('');
        if(l&2) { let t=''; for(let i=0;i<r.length;i++) t+=String.fromCharCode(r.charCodeAt(i)^0x3F); r=t; }
        if(l&4) r=Buffer.from(r,'base64').toString();
        if(l&8) { let t=''; for(let i=0;i<r.length;i++) t+=String.fromCharCode(r.charCodeAt(i)+0xD); r=t; }
        if(l&16) r=decodeURIComponent(r);
        if(l&32) { let t=''; for(let i=r.length-1;i>=0;i--) t+=r[i]; r=t; }
        return r;
      };
      const _x1 = (a) => { let s=''; for(let i=0;i<a.length;i++) s+=String.fromCharCode(a[i]); return parseInt(Buffer.from(s,'hex').toString(),10); };
    `;
    
    // Encode decoder itu sendiri
    let encoded = '';
    for (let i = 0; i < decoderCode.length; i++) {
      encoded += '\\x' + decoderCode.charCodeAt(i).toString(16);
    }
    return eval(`"${encoded}"`);
  }

  // Variable renaming total (semua nama variabel diacak)
  renameAllVars(code) {
    const patterns = [
      /\b(let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /\bfunction\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g,
      /catch\s*\(([a-zA-Z_$][a-zA-Z0-9_$]*)\)/g,
      /\bnew\s+([A-Z][a-zA-Z0-9_$]*)/g,
      /\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
      /\breturn\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /typeof\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /instanceof\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /delete\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g,
      /\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g
    ];
    
    let counter = 0;
    const mapping = new Map();
    const reserved = [
      'console', 'process', 'require', 'module', 'exports', 'Buffer',
      'setTimeout', 'setInterval', 'Date', 'Math', 'JSON', 'Array',
      'Object', 'String', 'Number', 'Boolean', 'Function', 'RegExp',
      'Error', 'Promise', '__dirname', '__filename', 'global',
      'undefined', 'NaN', 'Infinity', 'isNaN', 'isFinite', 'parseInt',
      'parseFloat', 'encodeURI', 'decodeURI', 'eval', 'arguments',
      'Buffer', 'clearTimeout', 'clearInterval', 'setImmediate'
    ];
    
    const prefixes = ['_0x', '__', '_$$', '_0O', '$', '_X', '_O', '__x', '_0X', '_oo', '_O0', '_x0'];
    
    const generateName = () => {
      const prefix = prefixes[counter % prefixes.length];
      let name = prefix;
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      for (let i = 0; i < 16; i++) {
        name += chars[Math.floor(Math.random() * chars.length)];
      }
      counter++;
      return name;
    };
    
    for (const pattern of patterns) {
      let match;
      const regex = new RegExp(pattern.source, 'g');
      while ((match = regex.exec(code)) !== null) {
        let varName = match[2] || match[1];
        if (varName && !mapping.has(varName) && !reserved.includes(varName) && 
            varName.length > 1 && !varName.includes('_0x') && !varName.includes('__') &&
            !varName.includes('_x0') && !varName.includes('_x1')) {
          mapping.set(varName, generateName());
        }
      }
    }
    
    let renamed = code;
    const sorted = Array.from(mapping.entries()).sort((a, b) => b[0].length - a[0].length);
    for (const [oldName, newName] of sorted) {
      const regex = new RegExp(`\\b${oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      renamed = renamed.replace(regex, newName);
    }
    
    return renamed;
  }

  // Total control flow destruction
  destroyControlFlow(code) {
    const statements = code.split(';').filter(s => s.trim().length > 0 && s.trim().length < 800);
    if (statements.length < 8) return code;
    
    // Super shuffle dengan multiple passes
    for (let pass = 0; pass < 3; pass++) {
      for (let i = statements.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [statements[i], statements[j]] = [statements[j], statements[i]];
      }
    }
    
    // Create random jump table
    const order = Array.from({ length: statements.length }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    
    const caseMap = {};
    for (let i = 0; i < statements.length; i++) {
      const currentIdx = order[i];
      const nextIdx = order[(i + 1) % statements.length];
      caseMap[currentIdx] = nextIdx;
    }
    
    const cases = [];
    for (let i = 0; i < statements.length; i++) {
      const nextIdx = caseMap[i];
      cases.push(`
        case ${i}: { ${statements[i]}; _nx = ${nextIdx}; _ct++; break; }
      `);
    }
    
    const startIdx = order[0];
    const maxIter = statements.length * 3;
    
    return `
      let _nx = ${startIdx};
      let _ct = 0;
      let _mx = ${maxIter};
      const _rp = () => {
        while(_ct < _mx) {
          switch(_nx) {
            ${cases.join('')}
            default: _nx = ${startIdx}; break;
          }
          if(_ct > _mx) break;
        }
      };
      _rp();
    `;
  }

  // Mega dispatcher (1000+ handlers)
  createMegaDispatcher() {
    const handlers = [];
    for (let i = 0; i < 256; i++) {
      const val = this.randomInt(10000, 999999);
      handlers.push(`_h${i.toString(16)}:(function(...a){ _x=(${val}+_x)%524287; return _x; })`);
    }
    
    return `
      let _x = ${this.randomInt(1, 999999)};
      const _d = { ${handlers.join(',')} };
      const _c = (n,...a) => { const k='_h'+n.toString(16); return _d[k]?_d[k](...a):null; };
    `;
  }

  // Anti-debug total (semua pesan error di-encrypt)
  createTotalAntiDebug() {
    // Semua string error di-encrypt via hex
    const errorMsg1 = this.toComplexHexArray('Debugger detected');
    const errorMsg2 = this.toComplexHexArray('Console tampered');
    const errorMsg3 = this.toComplexHexArray('Prototype polluted');
    const errorMsg4 = this.toComplexHexArray('Code integrity failed');
    
    return `
      (function(){
        let _t1=Date.now();debugger;let _t2=Date.now();
        if(_t2-_t1>50){throw new Error(_x0(${errorMsg1},1));}
        
        const _nc=(fn,n)=>{let s=fn.toString();if(!s.includes('[native code]')&&s.length<300){throw new Error(_x0(${errorMsg2},1));}};
        _nc(console.log,'log');_nc(Array.prototype.map,'map');
        
        let _t={};if(_t.__proto__!==Object.prototype){throw new Error(_x0(${errorMsg3},1));}
        
        let _c=0;
        setInterval(()=>{_c++;let _a=Date.now();debugger;let _b=Date.now();
        if(_b-_a>50||_c>15){throw new Error(_x0(${errorMsg4},1));}},1500);
      })();
    `;
  }

  // Security hash total (hash itu sendiri di-encrypt)
  createTotalSecurityHash() {
    const hash = this.hash;
    const signature = this.signature;
    // Encode hash jadi hex array
    const hashEncoded = this.toComplexHexArray(hash);
    const sigEncoded = this.toComplexHexArray(signature);
    
    return `
      (function(){
        const _H = _x0(${hashEncoded},1);
        const _S = _x0(${sigEncoded},1);
        let _v=0;
        const _vi=setInterval(()=>{_v++;if(_v>30)clearInterval(_vi);
          let _c=0;for(let i=0;i<_H.length;i++)_c^=_H.charCodeAt(i);
          if(_c!==42)throw new Error('INTEGRITY');
        },5000);
      })();
    `;
  }

  // Timebomb dengan pesan ter-encrypt
  createTotalTimebomb() {
    if (this.expiryMode === 'off') return '';
    
    let expiryTime;
    if (this.expiryMode === 'days') {
      expiryTime = Date.now() + (this.expiryValue * 24 * 60 * 60 * 1000);
    } else {
      expiryTime = new Date(this.expiryValue).getTime();
    }
    
    const expiryEncoded = this.toComplexHexArray(expiryTime.toString());
    const contactEncoded = this.toComplexHexArray('@Xatanicvxii');
    
    return `
      (function(){
        const _ex = _x1(${expiryEncoded});
        const _n = Date.now();
        if(_n > _ex){
          const _e = new Error();
          _e.name = 'EXPIRED';
          _e.message = 'LICENSE_EXPIRED_CONTACT_' + _x0(${contactEncoded},1);
          throw _e;
        }
      })();
    `;
  }

  // Junk code injection massal
  injectMassJunk(code) {
    let junk = '';
    // 100+ junk variables
    for (let i = 0; i < 100; i++) {
      junk += `let _j${i.toString(16)} = ${this.randomInt(1, 99999)};\n`;
    }
    // 50+ junk functions
    for (let i = 0; i < 50; i++) {
      junk += `
        function _f${i.toString(16)}(${this.randomId(8)}) {
          let _x=${this.randomInt(1,999)};_x=(_x*${this.randomInt(2,9)})%${this.randomInt(100,999)};
          return _x^${this.randomInt(1,255)};
        }\n`;
    }
    // Dead code
    for (let i = 0; i < 30; i++) {
      junk += `if(false){var _d${i}=${this.randomInt(1,999)};}\n`;
    }
    return junk + code;
  }

  async obfuscate() {
    let result = this.originalCode;
    
    console.log('💀 TOTAL OBFUSCATION STARTED');
    console.log(`📦 Original: ${this.originalCode.length} bytes`);
    
    // Layer 1: Total variable renaming
    result = this.renameAllVars(result);
    console.log('  ✓ Layer 1: Variables renamed');
    
    // Layer 2: Encrypt all strings (including security logic)
    result = this.encryptAllStrings(result);
    console.log('  ✓ Layer 2: All strings encrypted');
    
    // Layer 3: Destroy control flow
    if (result.length > 300) {
      result = this.destroyControlFlow(result);
      console.log('  ✓ Layer 3: Control flow destroyed');
    }
    
    // Layer 4: Mega dispatcher
    result = this.createMegaDispatcher() + '\n' + result;
    console.log('  ✓ Layer 4: Mega dispatcher (256 handlers)');
    
    // Layer 5: Total anti-debug
    result = this.createTotalAntiDebug() + '\n' + result;
    console.log('  ✓ Layer 5: Anti-debug active');
    
    // Layer 6: Total security hash (hash ter-encrypt)
    result = this.createTotalSecurityHash() + '\n' + result;
    console.log('  ✓ Layer 6: Security hash encrypted');
    
    // Layer 7: Timebomb
    const timebomb = this.createTotalTimebomb();
    if (timebomb) {
      result = timebomb + '\n' + result;
      console.log(`  ✓ Layer 7: Timebomb (${this.expiryMode})`);
    }
    
    // Layer 8: Mass junk code
    result = this.injectMassJunk(result);
    console.log('  ✓ Layer 8: Junk code (180+ lines)');
    
    // Final wrapper dengan IIFE
    result = `(function(){'use strict';${result}})();`;
    
    // Remove duplicates
    const lines = result.split('\n');
    const unique = [];
    const seen = new Set();
    for (const line of lines) {
      if (!seen.has(line) && line.trim().length > 0) {
        seen.add(line);
        unique.push(line);
      }
    }
    result = unique.join('\n');
    
    console.log(`✅ COMPLETE! Final: ${result.length} bytes`);
    
    return {
      obfuscated: result,
      hash: this.hash,
      signature: this.signature,
      stats: {
        originalSize: this.originalCode.length,
        obfuscatedSize: result.length,
        ratio: ((result.length / this.originalCode.length) * 100).toFixed(2) + '%'
      }
    };
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { code, expiryMode = 'off', expiryValue = 7 } = req.body;
    
    if (!code || code.trim().length === 0) {
      return res.status(400).json({ error: 'No code provided' });
    }
    
    let validExpiryMode = 'off';
    let validExpiryValue = 7;
    
    if (expiryMode === 'days') {
      validExpiryMode = 'days';
      validExpiryValue = Math.min(Math.max(parseInt(expiryValue) || 7, 1), 365);
    } else if (expiryMode === 'date') {
      validExpiryMode = 'date';
      validExpiryValue = expiryValue;
    }
    
    const obfuscator = new TotalObfuscator(code, {
      expiryMode: validExpiryMode,
      expiryValue: validExpiryValue
    });
    
    const result = await obfuscator.obfuscate();
    
    res.json({
      success: true,
      obfuscated: result.obfuscated,
      hash: result.hash,
      signature: result.signature,
      stats: result.stats,
      contact: 'https://t.me/Xatanicvxii'
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      contact: 'https://t.me/Xatanicvxii'
    });
  }
};