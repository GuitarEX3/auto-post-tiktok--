// =============================================
// TikTok Creator Suite — Merged sidepanel.js
// Generator (Gemini) + Auto Poster logic
// =============================================

// ---- Tab Navigation ----
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => { c.style.display = 'none'; c.classList.remove('active'); });
    btn.classList.add('active');
    const tab = document.getElementById('tab-' + btn.dataset.tab);
    tab.style.display = 'block';
    tab.classList.add('active');
  });
});

// =============================================
// SECTION 1: GENERATOR (Gemini AI)
// =============================================

let currentImageBase64 = null;
let apiKey = '';
let selectedStyle = 'review';
let useCharacter = true;

// Load saved API key
chrome.storage.local.get(['geminiApiKey'], (result) => {
  if (result.geminiApiKey) {
    apiKey = result.geminiApiKey;
    document.getElementById('apiKey').value = apiKey;
  }
});

document.getElementById('saveApiKey').addEventListener('click', () => {
  const key = document.getElementById('apiKey').value.trim();
  if (key) {
    chrome.storage.local.set({ geminiApiKey: key }, () => {
      apiKey = key;
      showGenError('✅ บันทึก API Key สำเร็จ!', 'success');
      setTimeout(hideGenError, 2000);
    });
  }
});

// Style selector
document.querySelectorAll('.style-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedStyle = btn.getAttribute('data-style');
  });
});

// Character toggle
document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    useCharacter = btn.getAttribute('data-character') === 'yes';
  });
});

// Duration slider
const durationSlider = document.getElementById('durationSlider');
durationSlider.addEventListener('input', () => {
  const val = parseInt(durationSlider.value);
  document.getElementById('durationLabel').textContent = val === 0 ? 'ไม่จำกัด' : val + ' วินาที';
});

// Style prompts
const stylePrompts = {
  review: {
    name: 'รีวิวทั่วไป',
    instruction: `เขียน script รีวิวสินค้าแบบตรงไปตรงมา เป็นกันเอง น่าเชื่อถือ
- เปิดด้วยการแนะนำตัวและสินค้า
- บอกเหตุผลที่เลือกซื้อ
- รีวิวการใช้งานจริง จุดเด่น จุดด้อย
- สรุปและบอกว่าเหมาะกับใคร
- ปิดด้วย Call-to-action`
  },
  paiyaa: {
    name: 'ป้ายยา',
    instruction: `เขียน script สไตล์ป้ายยา กระตุ้นความสนใจ น่าเชื่อถือ ไม่โอเวอร์จนเกินไป
- เปิดด้วยการตั้งคำถามหรือ pain point ที่คนดูเจอจริงๆ
- อธิบายว่าสินค้านี้แก้ปัญหาได้อย่างไร บอกจากประสบการณ์จริง ไม่พูดเกินจริง
- บอกผลลัพธ์ที่เห็นได้จริง
- ปิดด้วยการแนะนำว่าซื้อได้ที่ไหน เหมาะกับใครบ้าง`
  },
  household: {
    name: 'เครื่องใช้บ้าน',
    instruction: `เขียน script รีวิวเครื่องใช้ในบ้าน เน้นความคุ้มค่าและประโยชน์ใช้สอย
- เปิดด้วยปัญหาในบ้านที่สินค้านี้แก้ได้
- อธิบายวิธีใช้งาน ขนาด ความทนทาน
- เปรียบเทียบกับของเดิมที่เคยใช้
- บอกความคุ้มค่าด้านราคา`
  },
  fashion: {
    name: 'ขายเสื้อผ้า',
    instruction: `เขียน script สไตล์โชว์เสื้อผ้า เน้นวิชวลและความเท่
- เปิดด้วย action เดิน หันซ้ายขวา โชว์ตัว
- บรรยายลุคและ vibe ของชุด
- เน้น styling ว่า mix & match กับอะไรได้บ้าง
- ปิดด้วยท่าทางเท่ๆ แล้วบอกสั่งได้ที่ไหน`
  },
  factory: {
    name: 'โรงงาน/โชว์ต้นทาง',
    instruction: `เขียน script สไตล์โชว์สินค้าในโรงงาน เน้นความน่าเชื่อถือ
- เปิดด้วยการพาชมสถานที่ผลิต
- โชว์กระบวนการผลิตหรือสต็อกสินค้า
- เน้นว่าตัดพ่อค้าคนกลาง ราคาถูกกว่า
- ปิดด้วยการชวนสั่งตรง`
  },
  unboxing: {
    name: 'Unboxing',
    instruction: `เขียน script สไตล์ unboxing เน้นความตื่นเต้น
- เปิดด้วยความตื่นเต้นก่อนแกะกล่อง
- บรรยายตอนแกะกล่อง บอกของที่ได้ทั้งหมด
- ความประทับใจแรก
- สรุปว่าคุ้มไหมกับราคา`
  },
  funny: {
    name: 'ตลก/ขำๆ',
    instruction: `เขียน script สไตล์ตลก ขำๆ มีมุกตลอด แต่ยังขายของได้
- เปิดด้วยมุกหรือ situation ตลกๆ
- รีวิวสินค้าแบบสนุกสนาน ใส่ reaction ตลกๆ
- ยังบอกข้อดีของสินค้าได้จริง
- ปิดด้วยมุกแล้วค่อยบอกซื้อได้ที่ไหน`
  },
  food: {
    name: 'อาหาร/ของกิน',
    instruction: `เขียน script รีวิวอาหาร เน้นการบรรยายรสชาติให้น่ากิน
- เปิดด้วยการบรรยายหน้าตาและกลิ่น
- บอกรสชาติ เนื้อสัมผัส ความอร่อย
- บอก portion ราคาคุ้มไหม
- สรุปว่าติดใจไหม จะซื้ออีกไหม`
  },
  beauty: {
    name: 'ความงาม/สกินแคร์',
    instruction: `เขียน script รีวิวสกินแคร์ เน้นผลลัพธ์และความปลอดภัย
- เปิดด้วย skin type และปัญหาผิว
- บอก texture กลิ่น วิธีใช้
- บอกผลลัพธ์หลังใช้
- แนะนำว่าเหมาะกับผิวแบบไหน`
  },
  tech: {
    name: 'Tech/Gadget',
    instruction: `เขียน script รีวิว Tech เน้นสเปกและการใช้งานจริง
- เปิดด้วย first impression
- บอกสเปกสำคัญ
- ทดสอบ performance จากการใช้งานจริง
- สรุปว่าควรซื้อไหม เหมาะกับใคร`
  },
  compare: {
    name: 'เปรียบเทียบสินค้า',
    instruction: `เขียน script เปรียบเทียบสินค้า ช่วยให้คนดูตัดสินใจ
- บอกว่ากำลังเปรียบเทียบอะไรกับอะไร
- เทียบราคา คุณสมบัติหลักๆ
- บอกข้อดีข้อเสียของแต่ละตัว
- สรุปว่าตัวไหนเหมาะกับใคร`
  },
  pet: {
    name: 'สินค้าสัตว์เลี้ยง',
    instruction: `เขียน script รีวิวสินค้าสัตว์เลี้ยง น่ารัก อบอุ่น
- แนะนำน้องหมา/แมว/สัตว์เลี้ยง
- บอกว่าทำไมถึงเลือกซื้อ
- บรรยายปฏิกิริยาของสัตว์เลี้ยง
- บอกวัสดุ ความปลอดภัย`
  },
  tvcommercial: {
    name: 'โฆษณาทีวีมืออาชีพ',
    instruction: `เขียน script สไตล์โฆษณาทีวีมืออาชีพ ฉากสวยงาม บรรยากาศหรูหรา
- เปิดด้วยฉากสวยงามที่เกี่ยวข้องกับสินค้า (เช่น ห้องครัวสะอาดสวยสว่าง ห้องนอนโมเดิร์น สวนสวยๆ ตามบริบทสินค้า)
- ใช้การบรรยายแบบมืออาชีพ น้ำเสียงอบอุ่น สุภาพ มั่นใจ
- แสดงการใช้งานจริงในสถานการณ์ที่สวยงาม แสดงให้เห็นผลลัพธ์ชัดเจน
- บรรยายลักษณะเด่นของสินค้า วัสดุคุณภาพ เทคโนโลยี การออกแบบ
- แสดงความเปลี่ยนแปลง before/after หรือผลลัพธ์ที่ได้จากการใช้
- เน้นคุณภาพชีวิตที่ดีขึ้น ความสุข ความสะดวกสบาย
- ปิดด้วยแบรนด์/ชื่อสินค้า และ tagline สั้นๆ ที่ประทับใจ
- โทนเสียงต้องดูมืออาชีพ ไม่ตะโกน ไม่เร่งรีบ มีระดับ`
  },
  hook: {
    name: 'Hook แรงหยุดดู',
    instruction: `เขียน script สไตล์ "Hook แรง" สำหรับ TikTok/Reels ที่ทำให้คนหยุดนิ้วภายใน 1-2 วินาที แต่ยังดูมืออาชีพ ไม่ตลาดล่าง
- 🎯 เปิด 3 วินาทีแรก: ใช้ประโยคที่กระแทกใจ เช่น ตั้งคำถามที่คนดูรู้สึกว่า "นั่นฉันเลย!" หรือ Shock Statement หรือ "อย่าซื้อ [สินค้า] ถ้ายังไม่ดูคลิปนี้!" เลือก Hook ที่เหมาะกับสินค้า
- เน้นให้ Hook ทำให้คนรู้สึก อยากรู้ต่อ / กลัวพลาด / เข้าใจปัญหาตัวเอง
- ต่อมาค่อยๆ เปิดเผยสินค้า บอกว่ามันแก้ปัญหาได้ยังไง ไม่ต้องรีบ
- บอกประสบการณ์จริง อย่าใช้ภาษาขายโอเวอร์เกิน ให้ดูเป็นคนจริงๆ พูด
- ใส่ Social Proof เช่น "ซื้อมาแล้ว 3 อัน" "แม่บอกให้ลอง" "เพื่อนแนะนำ"
- ปิดด้วย CTA ที่เป็นธรรมชาติ ไม่ฟังดู forced เช่น "ลิ้งอยู่ในตระกร้าเลย"
- Script ทั้งหมดต้องฟังดูเหมือนคนจริงๆ คุยกัน ไม่ใช่อ่านสคริปต์`
  }
};

// Page image scraper
const scanPageBtn = document.getElementById('scanPageBtn');
const pageImagesSection = document.getElementById('pageImagesSection');
const pageImagesGrid = document.getElementById('pageImagesGrid');

document.getElementById('closePageImages').addEventListener('click', () => {
  pageImagesSection.style.display = 'none';
  pageImagesGrid.innerHTML = '';
});

scanPageBtn.addEventListener('click', async () => {
  pageImagesGrid.innerHTML = '<p style="color:#888;font-size:13px;text-align:center;padding:10px;">กำลังดึงรูปจากหน้าเว็บ...</p>';
  pageImagesSection.style.display = 'block';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        function extractProductId(img) {
          // วิธีที่ 1: TikTok Studio — รูปอยู่ใน tr เดียวกับ product-tb-cell
          const row = img.closest('tr');
          if (row) {
            const cells = row.querySelectorAll('td');
            for (const cell of cells) {
              const tbCell = cell.querySelector('.product-tb-cell, [class*="product-tb-cell"]');
              if (tbCell) {
                const m = tbCell.textContent.trim().match(/^(\d{15,20})$/);
                if (m) return m[1];
              }
              const cellText = cell.textContent.trim();
              if (/^\d{15,20}$/.test(cellText)) return cellText;
            }
          }

          // วิธีที่ 2: data attributes บน element และ ancestors
          const dataKeys = ['data-product-id', 'data-id', 'data-item-id', 'data-sku-id', 'data-goods-id', 'data-spuid'];
          let node = img;
          for (let i = 0; i < 8; i++) {
            if (!node) break;
            for (const key of dataKeys) {
              const val = node.getAttribute && node.getAttribute(key);
              if (val && /^\d{10,20}$/.test(val.trim())) return val.trim();
            }
            node = node.parentElement;
          }

          // วิธีที่ 3: ค้นหา ID จาก URL ของรูป
          const urlPatterns = [
            /\/product\/(\d{10,20})\//,
            /product_id=(\d{10,20})/,
            /item\/(\d{10,20})\//,
            /goods\/(\d{10,20})\//,
            /sku\/(\d{10,20})\//,
            /[_-](\d{15,20})[_-]/,
            /\/(\d{15,20})\//
          ];
          for (const pat of urlPatterns) {
            const m = img.src.match(pat);
            if (m) return m[1];
          }

          // วิธีที่ 4: หา ID จาก URL ของหน้า
          const pageUrl = window.location.href;
          for (const pat of urlPatterns) {
            const m = pageUrl.match(pat);
            if (m) return m[1];
          }

          // วิธีที่ 5: ค้นหา text node ใกล้เคียงที่เป็น ID
          let parent = img.parentElement;
          for (let i = 0; i < 6; i++) {
            if (!parent) break;
            const text = parent.textContent;
            const idMatch = text.match(/\b(\d{15,20})\b/);
            if (idMatch) return idMatch[1];
            parent = parent.parentElement;
          }

          return null;
        }

        // ดึงข้อมูลจาก product table rows ก่อน (ถ้ามี)
        function extractRowData(img) {
          const row = img.closest('tr');
          if (!row) return { productId: null, productName: null, price: null, stock: null };

          // Product ID
          let productId = null;
          const cells = row.querySelectorAll('td');
          for (const cell of cells) {
            const tbCell = cell.querySelector('.product-tb-cell, [class*="product-tb-cell"]');
            const txt = (tbCell ? tbCell.textContent : cell.textContent).trim();
            if (/^\d{15,20}$/.test(txt)) { productId = txt; break; }
          }

          // Product Name — หาจาก .product-name หรือ span ใกล้ img
          let productName = null;
          const nameEl = row.querySelector('.product-name, [class*="product-name"]');
          if (nameEl) productName = nameEl.textContent.trim();
          if (!productName) {
            const nameCell = row.querySelector('td:first-child');
            if (nameCell) {
              const spans = nameCell.querySelectorAll('span');
              for (const s of spans) {
                const t = s.textContent.trim();
                if (t.length > 5 && !/^\d+$/.test(t)) { productName = t; break; }
              }
            }
          }

          // Price — หา cell ที่มี ฿ หรือตัวเลขราคา
          let price = null;
          for (const cell of cells) {
            const tbCell = cell.querySelector('.product-tb-cell, [class*="product-tb-cell"]');
            const txt = (tbCell ? tbCell.textContent : cell.textContent).trim();
            if (/^฿[\d,.]+$/.test(txt) || /^\$[\d,.]+$/.test(txt)) { price = txt; break; }
            if (/^[\d,]+\.\d{2}$/.test(txt)) { price = txt; break; }
          }

          // Stock — หา cell ที่เป็นตัวเลขจำนวนมาก (ไม่ใช่ ID, ไม่ใช่ราคา)
          let stock = null;
          for (const cell of cells) {
            const tbCell = cell.querySelector('.product-tb-cell, [class*="product-tb-cell"]');
            const txt = (tbCell ? tbCell.textContent : cell.textContent).trim();
            if (/^\d{1,8}$/.test(txt) && !(/^\d{15,20}$/.test(txt))) {
              const num = parseInt(txt);
              if (num > 0 && num < 9999999) { stock = txt; break; }
            }
          }

          return { productId, productName, price, stock };
        }

        const imgs = Array.from(document.images)
          .filter(img => img.naturalWidth >= 100 && img.naturalHeight >= 100 && img.src && !img.src.startsWith('data:'));

        const seen = new Set();
        const result = [];
        for (const img of imgs) {
          if (seen.has(img.src)) continue;
          seen.add(img.src);
          const rowData = extractRowData(img);
          const productId = rowData.productId || extractProductId(img);
          result.push({
            src: img.src,
            productId,
            productName: rowData.productName,
            price: rowData.price,
            stock: rowData.stock
          });
          if (result.length >= 30) break;
        }
        return result;
      }
    });

    const imgItems = results[0]?.result || [];
    if (imgItems.length === 0) {
      pageImagesGrid.innerHTML = '<p style="color:#888;font-size:13px;text-align:center;padding:10px;">ไม่พบรูปในหน้านี้</p>';
      return;
    }
    pageImagesGrid.innerHTML = '';
    imgItems.forEach(({ src, productId, productName, price, stock }) => {
      const item = document.createElement('div');
      item.className = 'page-img-item';
      item.style.position = 'relative';

      const img = document.createElement('img');
      img.src = src;
      img.onerror = () => item.remove();
      item.appendChild(img);

      // Badge แสดงข้อมูลสินค้า
      if (productId || productName) {
        const badge = document.createElement('div');
        badge.style.cssText = 'position:absolute;bottom:0;left:0;right:0;background:rgba(102,126,234,0.92);color:white;font-size:8px;padding:3px 4px;text-align:left;overflow:hidden;border-radius:0 0 4px 4px;line-height:1.4;';
        let badgeHtml = '';
        if (productName) badgeHtml += `<div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${productName}">📦 ${productName}</div>`;
        if (productId) badgeHtml += `<div style="font-family:monospace;font-size:7px;opacity:0.9;">🔗 ${productId}</div>`;
        const meta = [price && `💰 ${price}`, stock && `📊 ${Number(stock).toLocaleString()}`].filter(Boolean).join('  ');
        if (meta) badgeHtml += `<div>${meta}</div>`;
        badge.innerHTML = badgeHtml;
        item.appendChild(badge);
      }

      item.addEventListener('click', () => {
        document.querySelectorAll('.page-img-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        loadImageFromUrl(src, { productId, productName, price, stock });

        showProductIdBar(productId, productName, price, stock);
        const posterPid = document.getElementById('poster-productId');
        if (productId && posterPid) posterPid.value = productId;
      });
      pageImagesGrid.appendChild(item);
    });
  } catch (e) {
    pageImagesGrid.innerHTML = '<p style="color:#888;font-size:13px;text-align:center;padding:10px;">ไม่สามารถดึงรูปได้</p>';
  }
});

function showProductIdBar(productId, productName, price, stock) {
  let bar = document.getElementById('productIdBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'productIdBar';
    bar.style.cssText = 'margin-top:10px;padding:10px 12px;background:#f0f2ff;border:1px solid #667eea;border-radius:8px;font-size:12px;color:#495057;';
    const uploadSection = document.querySelector('.upload-section');
    uploadSection.parentElement.insertBefore(bar, uploadSection.nextSibling);
  }
  if (productId || productName) {
    let html = '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">';
    html += '<div style="flex:1;min-width:0;">';
    if (productName) html += `<div style="font-weight:600;color:#333;margin-bottom:4px;word-break:break-word;">📦 ${productName}</div>`;
    if (productId) html += `<div style="font-family:monospace;color:#667eea;font-size:11px;">🔗 ${productId}</div>`;
    const meta = [price && `💰 ราคา: <strong>${price}</strong>`, stock && `📊 สต็อก: <strong>${Number(stock).toLocaleString()}</strong>`].filter(Boolean).join(' &nbsp;|&nbsp; ');
    if (meta) html += `<div style="margin-top:4px;font-size:11px;">${meta}</div>`;
    html += '</div>';
    if (productId) html += `<button onclick="navigator.clipboard.writeText('${productId}');this.textContent='✅';setTimeout(()=>this.textContent='📋 Copy ID',1500)" style="padding:4px 10px;background:#667eea;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;white-space:nowrap;flex-shrink:0;">📋 Copy ID</button>`;
    html += '</div>';
    bar.innerHTML = html;
    bar.style.display = 'block';
  } else {
    bar.innerHTML = `<span style="color:#999;">⚠️ ไม่พบข้อมูลสินค้าในรูปนี้</span>`;
    bar.style.display = 'block';
  }
}

let selectedProductInfo = null; // เก็บข้อมูลสินค้าที่ดึงได้จากหน้าเว็บ

async function loadImageFromUrl(url, productInfo = null) {
  selectedProductInfo = productInfo || null;
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const reader = new FileReader();
    reader.onload = (e) => {
      currentImageBase64 = e.target.result.split(',')[1];
      document.getElementById('previewImg').src = e.target.result;
      document.getElementById('imagePreview').style.display = 'block';
      document.getElementById('uploadBox').parentElement.style.display = 'none';
      document.getElementById('generateBtn').disabled = false;
    };
    reader.readAsDataURL(blob);
  } catch(e) {
    showGenError('ไม่สามารถโหลดรูปได้');
  }
}

// Image upload
document.getElementById('imageInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showGenError('ไฟล์ใหญ่เกิน 5MB'); return; }
  const reader = new FileReader();
  reader.onload = (ev) => {
    currentImageBase64 = ev.target.result.split(',')[1];
    document.getElementById('previewImg').src = ev.target.result;
    document.getElementById('imagePreview').style.display = 'block';
    document.getElementById('uploadBox').parentElement.style.display = 'none';
    document.getElementById('generateBtn').disabled = false;
  };
  reader.readAsDataURL(file);
});

document.getElementById('removeImage').addEventListener('click', () => {
  currentImageBase64 = null;
  selectedProductInfo = null;
  document.getElementById('previewImg').src = '';
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('uploadBox').parentElement.style.display = 'block';
  document.getElementById('generateBtn').disabled = true;
  document.getElementById('genResults').style.display = 'none';
  hideGenError();
});

// Generate
document.getElementById('generateBtn').addEventListener('click', generateReviewPrompt);

async function generateReviewPrompt() {
  if (!apiKey) { showGenError('❌ กรุณาใส่ API Key ก่อนใช้งาน'); return; }
  if (!currentImageBase64) { showGenError('❌ กรุณาอัปโหลดรูปสินค้าก่อน'); return; }

  const btnText = document.querySelector('#generateBtn .btn-text');
  const loading = document.querySelector('#generateBtn .loading');
  btnText.style.display = 'none';
  loading.style.display = 'inline-flex';
  document.getElementById('generateBtn').disabled = true;
  hideGenError();

  try {
    const durationVal = parseInt(durationSlider.value);
    const durationText = durationVal === 0 ? 'ไม่จำกัดความยาว' : `${durationVal} วินาที`;
    const style = stylePrompts[selectedStyle];

    // สร้างบล็อกข้อมูลสินค้าจากที่ดึงมาได้
    let productInfoBlock = '';
    if (selectedProductInfo) {
      const pi = selectedProductInfo;
      productInfoBlock = '\n\n📌 ข้อมูลสินค้าที่ดึงมาจากหน้าเว็บ (ใช้ข้อมูลเหล่านี้ในการเขียน Script):';
      if (pi.productName) productInfoBlock += `\n- ชื่อสินค้า: ${pi.productName}`;
      if (pi.price) productInfoBlock += `\n- ราคา: ${pi.price}`;
      if (pi.stock) productInfoBlock += `\n- สต็อก: ${Number(pi.stock).toLocaleString()} ชิ้น`;
      if (pi.productId) productInfoBlock += `\n- Product ID: ${pi.productId}`;
      productInfoBlock += '\nกรุณาใช้ชื่อสินค้าจริงและราคาจริงในการเขียน Script และ Caption ด้วย';
    }

    const prompt = `วิเคราะห์รูปภาพสินค้านี้และสร้างเนื้อหาทั้งหมดเป็นภาษาไทยเท่านั้น ห้ามใช้ภาษาอังกฤษเด็ดขาด ยกเว้นชื่อแบรนด์หรือชื่อสินค้าที่เป็นภาษาอังกฤษเท่านั้น

⚠️ ห้ามใช้คำโอเวอร์หรือเกินจริง เช่น "เปลี่ยนชีวิต" "ดีที่สุดในโลก" ให้ใช้ภาษาที่จริงใจ น่าเชื่อถือ และสมดุล

สไตล์วิดีโอ: ${style.name}
ความยาววิดีโอ: ${durationText}
วิธีเขียน Script:
${style.instruction}${productInfoBlock}

${useCharacter ? `สร้างเนื้อหา 4 ส่วน:
1. ตัวละครผู้นำเสนอ — ออกแบบตัวละครให้เข้ากับสินค้า ระบุ: ชื่อ บุคลิก การแต่งกาย วิธีพูด ⚠️ ห้ามให้ตัวละครแนะนำชื่อตัวเองในสคริปต์
2. Script วิดีโอ — เหมาะกับ ${durationText} ใช้ภาษาพูดแบบไทยๆ เป็นกันเอง ให้เริ่มรีวิวสินค้าได้เลย
3. แคปชั่นโพสต์ (50-100 คำ) — น่าสนใจ มี Call-to-action
4. แฮชแท็ก 10-15 ตัว — ภาษาไทยเป็นหลัก

ตอบในรูปแบบ JSON เท่านั้น:
{"character":"...","script":"...","caption":"...","hashtags":"..."}` : `สร้างเนื้อหา 3 ส่วน:
1. Script วิดีโอ — เหมาะกับ ${durationText} เข้าสู่เนื้อหารีวิวทันที
2. แคปชั่นโพสต์ (50-100 คำ) — น่าสนใจ มี Call-to-action
3. แฮชแท็ก 10-15 ตัว

ตอบในรูปแบบ JSON เท่านั้น:
{"character":"","script":"...","caption":"...","hashtags":"..."}`}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: currentImageBase64 } }] }],
        generationConfig: { temperature: 0.8, topK: 40, topP: 0.95, maxOutputTokens: 3000 }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API request failed');
    }

    const data = await response.json();
    const parts = data.candidates[0].content.parts;
    const textPart = parts.find(p => p.text && !p.thought);
    const generatedText = textPart ? textPart.text : parts.map(p => p.text || '').join('');

    let parsedData;
    try {
      const cleaned = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      parsedData = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
    } catch {
      parsedData = extractDataFromText(generatedText);
    }

    function toSafeString(val) {
      if (!val) return '';
      if (typeof val === 'string') return val;
      if (typeof val === 'object') return Object.entries(val).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n');
      return String(val);
    }

    const scriptText = (toSafeString(parsedData.script) || 'ไม่สามารถสร้าง script ได้').trimEnd();
    const characterRaw = parsedData.character;
    let characterText = '';
    if (!characterRaw) characterText = 'ไม่สามารถสร้างตัวละครได้';
    else characterText = toSafeString(characterRaw);

    document.getElementById('characterOutput').value = characterText;
    document.getElementById('promptOutput').value = scriptText + '\n\nคลิปนี้พูดภาษาไทย';
    document.getElementById('captionOutput').value = toSafeString(parsedData.caption);
    document.getElementById('hashtagOutput').value = toSafeString(parsedData.hashtags);

    document.getElementById('characterSection').style.display = useCharacter ? 'block' : 'none';
    document.getElementById('genResults').style.display = 'block';
    setTimeout(() => document.getElementById('genResults').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);

  } catch (error) {
    if (error.message.includes('API_KEY_INVALID')) showGenError('❌ API Key ไม่ถูกต้อง');
    else if (error.message.includes('QUOTA_EXCEEDED')) showGenError('❌ โควต้า API หมดแล้ว');
    else showGenError('❌ เกิดข้อผิดพลาด: ' + error.message);
  } finally {
    btnText.style.display = 'inline';
    loading.style.display = 'none';
    document.getElementById('generateBtn').disabled = false;
  }
}

function extractDataFromText(text) {
  const result = { character: '', script: '', caption: '', hashtags: '' };
  const ch = text.match(/["']?character["']?\s*:\s*["']([\s\S]*?)["']\s*,\s*["']?script/i);
  if (ch) result.character = ch[1].trim();
  const s = text.match(/["']?script["']?\s*:\s*["']([\s\S]*?)["']\s*,\s*["']?caption/i);
  if (s) result.script = s[1].trim();
  const c = text.match(/["']?caption["']?\s*:\s*["']([\s\S]*?)["']\s*,\s*["']?hashtag/i);
  if (c) result.caption = c[1].trim();
  const h = text.match(/["']?hashtags?["']?\s*:\s*["']([\s\S]*?)["']\s*\}/i);
  if (h) result.hashtags = h[1].trim();
  return result;
}

// Copy buttons (generator)
document.querySelectorAll('.btn-copy').forEach(btn => {
  btn.addEventListener('click', () => {
    const textarea = document.getElementById(btn.getAttribute('data-target'));
    textarea.select();
    document.execCommand('copy');
    const orig = btn.textContent;
    btn.textContent = '✅ คัดลอกแล้ว!';
    setTimeout(() => { btn.textContent = orig; }, 2000);
  });
});

// Send to Auto Poster
document.getElementById('sendToPosterBtn').addEventListener('click', () => {
  const caption = document.getElementById('captionOutput').value;
  const hashtags = document.getElementById('hashtagOutput').value;
  const fullCaption = hashtags ? caption + '\n' + hashtags : caption;

  document.getElementById('poster-caption').value = fullCaption;

  // Switch to poster tab
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => { c.style.display = 'none'; c.classList.remove('active'); });
  const posterBtn = document.querySelector('[data-tab="poster"]');
  posterBtn.classList.add('active');
  const posterTab = document.getElementById('tab-poster');
  posterTab.style.display = 'block';
  posterTab.classList.add('active');

  // Show notice
  document.getElementById('prefillNotice').style.display = 'flex';
  document.getElementById('poster-caption').scrollIntoView({ behavior: 'smooth', block: 'center' });
});

document.getElementById('dismissPrefill').addEventListener('click', () => {
  document.getElementById('prefillNotice').style.display = 'none';
});

function showGenError(message, type = 'error') {
  const el = document.getElementById('genErrorMsg');
  el.textContent = message;
  el.style.display = 'block';
  if (type === 'success') {
    el.style.background = '#d4edda'; el.style.color = '#155724'; el.style.borderColor = '#c3e6cb';
  } else {
    el.style.background = '#f8d7da'; el.style.color = '#721c24'; el.style.borderColor = '#f5c6cb';
  }
}
function hideGenError() { document.getElementById('genErrorMsg').style.display = 'none'; }

// =============================================
// SECTION 2: AUTO POSTER
// =============================================

const STORAGE_KEY = 'tiktok_auto_posts';
let allData = [];
let currentFilter = 'all';

// IndexedDB for video files
const DB_NAME = 'TikTokAutoPosterDB';
const DB_VERSION = 1;
const VIDEO_STORE = 'videos';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(VIDEO_STORE)) db.createObjectStore(VIDEO_STORE, { keyPath: 'id' });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveVideoFile(id, file) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VIDEO_STORE, 'readwrite');
    tx.objectStore(VIDEO_STORE).put({ id, file, name: file.name, type: file.type });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getVideoFile(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VIDEO_STORE, 'readonly');
    const req = tx.objectStore(VIDEO_STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function deleteVideoFile(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VIDEO_STORE, 'readwrite');
    tx.objectStore(VIDEO_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadData() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  allData = result[STORAGE_KEY] || [];
  renderTable();
  updateItemCount();
}

async function saveData() {
  await chrome.storage.local.set({ [STORAGE_KEY]: allData });
}

function updateItemCount() {
  document.getElementById('itemCount').textContent = getFilteredData().length;
}

function getFilteredData() {
  if (currentFilter === 'all') return allData;
  return allData.filter(item => item.status === currentFilter);
}

function formatScheduledTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return `${d.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;
}

function getTimeBadge(scheduledAt) {
  if (!scheduledAt) return '<span class="time-badge immediate">ทันที</span>';
  const diff = new Date(scheduledAt).getTime() - Date.now();
  const label = formatScheduledTime(scheduledAt);
  if (diff < 0) return `<span class="time-badge overdue">⚠️ ${label}</span>`;
  if (diff < 30 * 60 * 1000) return `<span class="time-badge soon">🟢 ${label}</span>`;
  return `<span class="time-badge">⏰ ${label}</span>`;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderTable() {
  const tbody = document.getElementById('dataTableBody');
  const data = getFilteredData();
  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">ไม่มีข้อมูล — เพิ่มรายการด้านบน</td></tr>';
    updateItemCount();
    return;
  }
  tbody.innerHTML = data.map((item, index) => `
    <tr data-id="${item.id}">
      <td><input type="checkbox" class="row-check" data-id="${item.id}" /></td>
      <td>${index + 1}</td>
      <td class="caption-cell" title="${escapeHtml(item.caption)}">${escapeHtml(item.caption)}</td>
      <td>${escapeHtml(item.productId)}</td>
      <td class="video-cell">${item.hasVideo ? `<span class="video-badge">🎬 ${escapeHtml(item.videoName || 'video')}</span>` : '<span class="no-video">-</span>'}</td>
      <td>${item.price ? item.price + ' ฿' : '-'}</td>
      <td>${getTimeBadge(item.scheduledAt)}</td>
      <td><span class="status-badge ${item.status}">${item.status}</span></td>
      <td class="table-actions">
        <button class="btn-icon" onclick="editItem('${item.id}')">✏️</button>
        <button class="btn-icon" onclick="deleteItem('${item.id}')">🗑️</button>
      </td>
    </tr>
  `).join('');
  updateItemCount();
}

function showStatus(message, type = 'info') {
  const bar = document.getElementById('statusBar');
  bar.textContent = message;
  bar.className = `status-bar show ${type}`;
  setTimeout(() => bar.classList.remove('show'), 3000);
}

// File Upload
let pendingVideoFile = null;

function setupFileUpload() {
  const area = document.getElementById('fileUploadArea');
  const input = document.getElementById('videoFile');
  const text = document.getElementById('fileUploadText');

  area.addEventListener('click', () => input.click());
  area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('drag-over'); });
  area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) handleFileSelected(file);
    else showStatus('กรุณาเลือกไฟล์วิดีโอเท่านั้น', 'error');
  });
  input.addEventListener('change', () => { if (input.files[0]) handleFileSelected(input.files[0]); });

  function handleFileSelected(file) {
    pendingVideoFile = file;
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    text.textContent = `${file.name} (${sizeMB} MB)`;
    area.classList.add('has-file');
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function addNewItem() {
  const caption = document.getElementById('poster-caption').value.trim();
  const productId = document.getElementById('poster-productId').value.trim();
  const price = document.getElementById('poster-price').value.trim();
  const status = document.getElementById('poster-status').value;
  const scheduleDate = document.getElementById('scheduleDate').value;
  const scheduleTime = document.getElementById('scheduleTime').value;

  if (!caption || !productId) { showStatus('กรุณากรอก Caption และ Product ID', 'error'); return; }
  if (!pendingVideoFile) { showStatus('กรุณาเลือกไฟล์วิดีโอ', 'error'); return; }

  let scheduledAt = null;
  if (scheduleDate && scheduleTime) {
    scheduledAt = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();
  } else if (scheduleDate && !scheduleTime) {
    showStatus('กรุณาระบุเวลาด้วย หรือล้างวันที่ออก', 'error'); return;
  } else if (!scheduleDate && scheduleTime) {
    showStatus('กรุณาระบุวันที่ด้วย หรือล้างเวลาออก', 'error'); return;
  }

  const id = generateId();
  await saveVideoFile(id, pendingVideoFile);

  const newItem = { id, caption, productId, hasVideo: true, videoName: pendingVideoFile.name, price: price ? parseFloat(price) : null, status, scheduledAt, createdAt: new Date().toISOString() };
  allData.unshift(newItem);
  await saveData();
  renderTable();

  // Reset form
  document.getElementById('poster-caption').value = '';
  document.getElementById('poster-productId').value = '';
  document.getElementById('poster-price').value = '';
  document.getElementById('videoFile').value = '';
  document.getElementById('scheduleDate').value = '';
  document.getElementById('scheduleTime').value = '';
  document.getElementById('schedulePreview').textContent = '';
  document.getElementById('fileUploadText').textContent = 'คลิกเพื่อเลือกวิดีโอ หรือลากไฟล์มาวาง';
  document.getElementById('fileUploadArea').classList.remove('has-file');
  pendingVideoFile = null;

  showStatus(scheduledAt ? `เพิ่มสำเร็จ! จะโพสต์เวลา ${formatScheduledTime(scheduledAt)}` : 'เพิ่มรายการสำเร็จ!', 'success');
}

window.editItem = async function(id) {
  const item = allData.find(i => i.id === id);
  if (!item) return;
  const newCaption = prompt('Caption:', item.caption);
  if (newCaption === null) return;
  const newProductId = prompt('Product ID:', item.productId);
  if (newProductId === null) return;
  item.caption = newCaption.trim();
  item.productId = newProductId.trim();
  await saveData();
  renderTable();
  showStatus('แก้ไขสำเร็จ!', 'success');
};

window.deleteItem = async function(id) {
  if (!confirm('ต้องการลบรายการนี้?')) return;
  allData = allData.filter(i => i.id !== id);
  await deleteVideoFile(id);
  await saveData();
  renderTable();
  showStatus('ลบรายการสำเร็จ!', 'success');
};

async function deleteSelected() {
  const selected = getSelectedIds();
  if (selected.length === 0) { showStatus('กรุณาเลือกรายการที่ต้องการลบ', 'error'); return; }
  if (!confirm(`ต้องการลบ ${selected.length} รายการ?`)) return;
  allData = allData.filter(item => !selected.includes(item.id));
  for (const id of selected) await deleteVideoFile(id);
  await saveData();
  renderTable();
  showStatus(`ลบ ${selected.length} รายการสำเร็จ!`, 'success');
}

function getSelectedIds() {
  return Array.from(document.querySelectorAll('.row-check:checked')).map(cb => cb.dataset.id);
}
function selectAll() { document.querySelectorAll('.row-check').forEach(cb => cb.checked = true); }
function deselectAll() { document.querySelectorAll('.row-check').forEach(cb => cb.checked = false); }

document.getElementById('checkAll').addEventListener('change', (e) => {
  document.querySelectorAll('.row-check').forEach(cb => cb.checked = e.target.checked);
});

// Scheduler
let schedulerTimer = null;
let countdownTimer = null;

function startScheduler(items, tiktokTabId) {
  const sorted = [...items].sort((a, b) => {
    const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
    const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
    return ta - tb;
  });
  let index = 0;

  function runNext() {
    if (index >= sorted.length) {
      logBot(`\n========== เสร็จสิ้นทุกรายการ ==========`);
      showStatus(`โพสต์ครบ ${sorted.length} รายการแล้ว!`, 'success');
      clearCountdown();
      return;
    }
    const item = sorted[index];
    const now = Date.now();
    const scheduledTs = item.scheduledAt ? new Date(item.scheduledAt).getTime() : now;
    const delay = Math.max(0, scheduledTs - now);
    if (delay > 0) {
      logBot(`⏳ รายการที่ ${index + 1}/${sorted.length} จะโพสต์เวลา ${formatScheduledTime(item.scheduledAt)} (อีก ${Math.ceil(delay / 60000)} นาที)`);
      startCountdown(item.scheduledAt, index + 1, sorted.length);
    }
    schedulerTimer = setTimeout(async () => {
      clearCountdown();
      logBot(`\n========== รายการที่ ${index + 1}/${sorted.length} ==========`);
      logBot(`Caption: ${item.caption}`);
      logBot(`Product ID: ${item.productId}`);
      logBot(`วิดีโอ: ${item.videoName}`);
      await chrome.tabs.update(tiktokTabId, { url: 'https://www.tiktok.com/tiktokstudio/upload?from=creator_center', active: true });
      await sleep(6000);
      try {
        const videoRecord = await getVideoFile(item.id);
        if (!videoRecord) throw new Error('ไม่พบไฟล์วิดีโอใน storage');
        const arrayBuffer = await videoRecord.file.arrayBuffer();
        const videoData = Array.from(new Uint8Array(arrayBuffer));
        await runSinglePost(tiktokTabId, item, videoData, videoRecord.name, videoRecord.type);
        logBot(`✅ สำเร็จ!`);
        await deleteVideoFile(item.id);
        allData = allData.filter(it => it.id !== item.id);
        await saveData();
        renderTable();
        index++;
        if (index < sorted.length) await sleep(30000);
        runNext();
      } catch (error) {
        logBot(`❌ เกิดข้อผิดพลาด: ${error.message}`);
        logBot(`⏭️ ข้ามไปรายการถัดไป...`);
        index++;
        await sleep(10000);
        runNext();
      }
    }, delay);
  }
  runNext();
}

function startCountdown(scheduledAt, current, total) {
  const bar = document.getElementById('countdownBar');
  bar.classList.add('show');
  countdownTimer = setInterval(() => {
    const remaining = new Date(scheduledAt).getTime() - Date.now();
    if (remaining <= 0) { clearCountdown(); return; }
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    bar.textContent = `⏳ รายการที่ ${current}/${total} จะโพสต์ใน ${mins} นาที ${secs} วินาที (${formatScheduledTime(scheduledAt)})`;
  }, 1000);
}

function clearCountdown() {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  const bar = document.getElementById('countdownBar');
  bar.classList.remove('show');
  bar.textContent = '';
}

async function runAutoPost() {
  const selected = getSelectedIds();
  const items = allData.filter(item => selected.includes(item.id));
  if (items.length === 0) { showStatus('กรุณาเลือกรายการที่ต้องการรัน', 'error'); return; }
  const missingVideo = items.find(i => !i.hasVideo);
  if (missingVideo) { showStatus('บางรายการไม่มีวิดีโอ', 'error'); return; }

  const immediate = items.filter(i => !i.scheduledAt).length;
  const scheduled = items.filter(i => i.scheduledAt).length;
  let confirmMsg = `ต้องการรัน Auto Post ${items.length} รายการ?\n`;
  if (immediate > 0) confirmMsg += `• ${immediate} รายการ: รันทันที\n`;
  if (scheduled > 0) confirmMsg += `• ${scheduled} รายการ: รอเวลาที่กำหนด\n`;
  confirmMsg += `\n✅ หลังโพสต์สำเร็จ รายการจะถูกลบออกอัตโนมัติ`;
  if (!confirm(confirmMsg)) return;

  showStatus(`เริ่ม scheduler สำหรับ ${items.length} รายการ...`, 'info');
  const tabs = await chrome.tabs.query({});
  let tiktokTab = tabs.find(tab => tab.url && tab.url.includes('tiktok.com'));
  if (!tiktokTab) {
    tiktokTab = await chrome.tabs.create({ url: 'https://www.tiktok.com/tiktokstudio/upload?from=creator_center', active: true });
    await sleep(3000);
  }
  startScheduler(items, tiktokTab.id);
}

async function runSinglePost(tabId, item, videoData, videoName, videoType) {
      const result = await chrome.scripting.executeScript({
        target: { tabId },
        args: [item, videoData, videoName || 'video.mp4', videoType || 'video/mp4'],
        func: async (item, videoData, videoName, videoType) => {
          const sleep = (ms) => new Promise(r => setTimeout(r, ms));
      const waitFor = (selector, timeout = 60000) => new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
          const el = document.querySelector(selector);
          if (el) resolve(el);
          else if (Date.now() - start > timeout) reject(new Error(`Timeout waiting for ${selector}`));
          else setTimeout(check, 500);
        };
        check();
      });
      const log = (msg) => {
        console.log('[TikTok Bot]', msg);
        chrome.runtime.sendMessage({ type: 'botLog', level: 'info', message: msg });
      };
      try {
        log('Step 1: Uploading video...');
        const uint8 = new Uint8Array(videoData);
        const videoBlob = new Blob([uint8], { type: videoType });
        const videoFile = new File([videoBlob], videoName, { type: videoType });
        const waitForFileInput = (timeout = 30000) => new Promise((resolve, reject) => {
          const start = Date.now();
          const check = () => {
            const input = document.querySelector('input[type="file"]') || document.querySelector('input[accept*="video"]');
            if (input) return resolve(input);
            if (Date.now() - start > timeout) return reject(new Error('File input not found'));
            setTimeout(check, 500);
          };
          check();
        });
        const fileInput = await waitForFileInput(30000);
        log('Found file input, injecting video...');
        const origDisplay = fileInput.style.display;
        const origVisibility = fileInput.style.visibility;
        fileInput.style.display = 'block';
        fileInput.style.visibility = 'visible';
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(videoFile);
        fileInput.files = dataTransfer.files;
        fileInput.dispatchEvent(new Event('input', { bubbles: true }));
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        fileInput.style.display = origDisplay;
        fileInput.style.visibility = origVisibility;
        log('Video injected! Waiting for upload...');
        const waitForUploadComplete = (timeout = 120000) => new Promise((resolve, reject) => {
          const start = Date.now();
          const check = () => {
            if (document.querySelector('.info-status.success')) return resolve(true);
            if (Date.now() - start > timeout) return reject(new Error('Upload timeout'));
            setTimeout(check, 1000);
          };
          check();
        });
        try { await waitForUploadComplete(); log('Upload complete!'); } catch { log('Upload wait timeout, proceeding...'); }
        await sleep(4000);
        log('Step 2: Adding caption...');
        const captionText = (item.caption || '').slice(0, 2200); // TikTok limit ~2200 chars
        const editor = await waitFor('[data-e2e="caption-editor"] div[contenteditable="true"], .public-DraftEditor-content', 60000);

        // Clear any existing caption to avoid accumulating text between posts
        try {
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(editor);
          selection.removeAllRanges();
          selection.addRange(range);
          document.execCommand('delete');
        } catch (e) {
          console.warn('Clear caption failed', e);
        }

        editor.focus();
        await sleep(100);

        // Try to simulate a paste event so DraftJS/React picks up the change
        try {
          const dt = new DataTransfer();
          dt.setData('text/plain', captionText);
          const pasteEvt = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
          editor.dispatchEvent(pasteEvt);
        } catch (e) {
          console.warn('Paste simulation failed', e);
        }

        // Fallback to insertText + explicit input event
        document.execCommand('insertText', false, captionText);
        editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: captionText }));

        log(`Caption added (${captionText.length} chars)`);
        await sleep(2000);
        log('Step 3: Clicking Add (product link) button...');
        await sleep(1500); // allow TikTok UI to render commerce buttons
        const isVisible = (el) => {
          if (!el) return false;
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        // Target only the product "Add" button, not generic "+ Add"
        const selectors = [
          '[data-e2e="add-link-button"]',                         // primary
          '[data-e2e="anchor_container"] button',                 // add-link container
          '[data-e2e="ecom_product_anchor"] button',
          '[data-e2e="ecom_product_anchor"] [role="button"]',
          '[data-e2e*="product_anchor"] button',
          '[data-e2e*="product_anchor"] [role="button"]',
          'button[data-e2e*="add-link"]',
          'button[aria-label*="Add link"]',
          'button[aria-label*="Add product"]'
        ];
        const findAddLinkBtn = () => {
          for (const sel of selectors) {
            try {
              const el = document.querySelector(sel);
              if (el && isVisible(el)) return el;
            } catch (e) {
              // ignore selector errors on unsupported engines
            }
          }
          const allBtns = Array.from(document.querySelectorAll('button, div[role="button"]')).filter(isVisible);
          return allBtns.find(el => {
            const text = (el.textContent || '').trim().toLowerCase();
            return text === 'add' || text === '+ add' || text === 'add link' || text === '+ add link' || text === 'เพิ่ม' || text === 'เพิ่มลิงก์';
          }) || null;
        };
        const addLinkBtn = await new Promise((resolve, reject) => {
          const start = Date.now();
          const check = () => {
            const btn = findAddLinkBtn();
            if (btn) return resolve(btn);
            if (Date.now() - start > 15000) return reject(new Error('Add link button not found'));
            setTimeout(check, 500);
          };
          check();
        });
        addLinkBtn.click();
        log('Clicked Add link button');
        await sleep(3000);
        log('Step 4: Clicking Next on modal...');
        // Ensure modal/drawer is visible before searching Next
        await new Promise(res => {
          const start = Date.now();
          const tick = () => {
            const dlg = document.querySelector('[data-e2e="anchor_container"], [data-e2e*="product_anchor"], [role="dialog"]');
            if (dlg) return res(true);
            if (Date.now() - start > 5000) return res(false);
            setTimeout(tick, 300);
          };
          tick();
        });
        const findNextBtn = () => {
          const allBtns = Array.from(document.querySelectorAll('button, div[role="button"]')).filter(isVisible);
          return allBtns.find(el => {
            const label = el.querySelector('.TUXButton-label');
            const text = (label ? label.textContent : el.textContent || '').trim().toLowerCase();
            const enabled = !(el.disabled) && el.getAttribute('aria-disabled') !== 'true';
            const attr = (el.getAttribute('aria-label') || '').toLowerCase();
            return enabled && (
              text === 'next' || text === 'ถัดไป' || text === 'confirm' || text === 'done' || text === 'ต่อไป' ||
              attr.includes('next') || attr.includes('confirm') || attr.includes('ถัดไป')
            );
          });
        };
        const nextBtn1 = await new Promise((resolve, reject) => {
          const start = Date.now();
          const check = () => {
            const btn = findNextBtn();
            if (btn) return resolve(btn);
            if (Date.now() - start > 10000) return reject(new Error('Next button not found on modal'));
            setTimeout(check, 500);
          };
          check();
        });
        nextBtn1.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await sleep(600);
        nextBtn1.click();
        // double-click safeguard if UI swallows first click
        await sleep(600);
        try { if (!nextBtn1.disabled && nextBtn1.getAttribute('aria-disabled') !== 'true') nextBtn1.click(); } catch {}
        log('Clicked Next (modal)');
        await sleep(4000);
        log(`Step 5: Selecting product ${item.productId}...`);
        const waitForProductList = (timeout = 15000) => new Promise((resolve, reject) => {
          const start = Date.now();
          const check = () => {
            const allCells = Array.from(document.querySelectorAll('td, .product-id, [class*="product"]'));
            const found = allCells.find(el => el.textContent.trim() === item.productId);
            if (found) return resolve(found);
            const rows = document.querySelectorAll('tr');
            for (const row of rows) { if (row.textContent.includes(item.productId)) return resolve(row); }
            if (Date.now() - start > timeout) return reject(new Error('Product list not loaded'));
            setTimeout(check, 800);
          };
          check();
        });
        await waitForProductList();
        await sleep(500);
        const allRows = Array.from(document.querySelectorAll('tr'));
        let targetRow = null;
        for (const row of allRows) { if (row.textContent.includes(item.productId)) { targetRow = row; break; } }
        if (!targetRow) throw new Error(`Product ${item.productId} not found`);
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await sleep(1200);
        const radioSelectors = ['input[type="radio"]', 'input[type="checkbox"]', '[role="radio"]', '[class*="radio"]', '[class*="Radio"]', 'td:first-child'];
        for (const sel of radioSelectors) {
          const el = targetRow.querySelector(sel);
          if (el) {
            el.click();
            try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch {}
            await sleep(1000);
            break;
          }
        }
        log('Product selected!');
        await sleep(1500);
        log('Step 6: Clicking Next to confirm product...');
        const findNextBtn2 = () => {
          const modal = document.querySelector('.product-selector-modal, [role="dialog"][title="Add product links"]') || document;
          const allBtns = Array.from(modal.querySelectorAll('button, div[role="button"]')).filter(isVisible);
          return allBtns.find(el => {
            const label = el.querySelector('.TUXButton-label');
            const text = (label ? label.textContent : el.textContent || '').trim();
            const enabled = !(el.disabled) && el.getAttribute('aria-disabled') !== 'true';
            return enabled && text === 'Next';
          });
        };
        const nextBtn2 = await new Promise((resolve, reject) => {
          const start = Date.now();
          const check = () => {
            const btn = findNextBtn2();
            if (btn) return resolve(btn);
            if (Date.now() - start > 15000) return reject(new Error('Next button not found after product select'));
            setTimeout(check, 400);
          };
          check();
        });
        nextBtn2.click();
        await sleep(700);
        try { if (!nextBtn2.disabled && nextBtn2.getAttribute('aria-disabled') !== 'true') nextBtn2.click(); } catch {}
        log('Clicked Next (confirm product)');
        await sleep(3500);
        log('Step 7: Clicking Add button to confirm product link...');
        // Sanitize product name (remove special chars that block Add, e.g. '+')
        const modal = document.querySelector('.common-modal[title="Add product links"], .product-selector-modal, [role="dialog"][title="Add product links"]') || document;
        const productInput = modal.querySelector('input[type="text"]');
        if (productInput) {
          const raw = productInput.value || '';
          const cleaned = raw.replace(/[+]/g, ' ').replace(/\s+/g, ' ').trim();
          if (cleaned !== raw) {
            productInput.value = cleaned;
            try {
              productInput.dispatchEvent(new Event('input', { bubbles: true }));
              productInput.dispatchEvent(new Event('change', { bubbles: true }));
            } catch {}
            await sleep(200);
          }
        }
        const findAddConfirmBtn = () => {
          const allBtns = Array.from(modal.querySelectorAll('button, div[role="button"]')).filter(isVisible);
          return allBtns.find(el => {
            const label = el.querySelector('.TUXButton-label');
            const text = (label ? label.textContent : el.textContent || '').trim();
            const enabled = !(el.disabled) && el.getAttribute('aria-disabled') !== 'true';
            return enabled && (text === 'Add' || text === 'เพิ่ม');
          });
        };
        const addConfirmBtn = await new Promise((resolve, reject) => {
          const start = Date.now();
          const check = () => {
            const btn = findAddConfirmBtn();
            if (btn) return resolve(btn);
            if (Date.now() - start > 10000) return reject(new Error('Add confirm button not found'));
            setTimeout(check, 500);
          };
          check();
        });
        addConfirmBtn.click();
        await sleep(700);
        try { if (!addConfirmBtn.disabled && addConfirmBtn.getAttribute('aria-disabled') !== 'true') addConfirmBtn.click(); } catch {}
        log('Clicked Add (confirm product link)');
        await sleep(3500);
        log('Step 8: Enabling AI content...');
        const advancedSettings = document.querySelector('div[data-e2e="advanced_settings_container"]');
        if (advancedSettings) {
          advancedSettings.click();
          await sleep(2000);
          const aigcSwitch = document.querySelector('div[data-e2e="aigc_container"] input[type="checkbox"]');
          if (aigcSwitch && !aigcSwitch.checked) { aigcSwitch.click(); await sleep(1000); }
        }
        log('Step 9: Posting...');
        await sleep(2000);
        const postBtn = document.querySelector('button[data-e2e="post_video_button"]');
        if (!postBtn) throw new Error('Post button not found');
        if (postBtn.disabled) throw new Error('Post button is disabled');
        postBtn.click();
        await sleep(5000);
        log('Post submitted!');
        return { ok: true, message: 'Success' };
      } catch (error) {
        log(`Error: ${error.message}`);
        return { ok: false, error: error.message };
      }
    }
  });
  const r = result && result[0] && result[0].result;
  if (r && r.ok) return r;
  if (r && !r.ok) throw new Error(r.error || 'Script returned error');
  throw new Error('No result from script execution');
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// Bot Logs
function logBot(message) {
  const logsBox = document.getElementById('botLogs');
  const timestamp = new Date().toLocaleTimeString('th-TH');
  logsBox.textContent += `[${timestamp}] ${message}\n`;
  logsBox.scrollTop = logsBox.scrollHeight;
}

async function loadBotLogs() {
  const response = await chrome.runtime.sendMessage({ type: 'getBotLogs' });
  if (response && response.ok && response.logs) {
    const logsBox = document.getElementById('botLogs');
    logsBox.textContent = response.logs.map(log => `[${new Date(log.ts).toLocaleTimeString('th-TH')}] ${log.message}`).join('\n');
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'botLogBroadcast' && msg.log) logBot(msg.log.message);
});

// Poster Event Listeners
document.getElementById('btnAdd').addEventListener('click', addNewItem);
document.getElementById('btnSelectAll').addEventListener('click', selectAll);
document.getElementById('btnDeselectAll').addEventListener('click', deselectAll);
document.getElementById('btnRunSelected').addEventListener('click', runAutoPost);
document.getElementById('btnDeleteSelected').addEventListener('click', deleteSelected);
document.getElementById('btnCopyLogs').addEventListener('click', async () => {
  await navigator.clipboard.writeText(document.getElementById('botLogs').textContent);
  showStatus('คัดลอก Logs แล้ว!', 'success');
});
document.getElementById('btnClearLogs').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'clearBotLogs' });
  document.getElementById('botLogs').textContent = 'Logs cleared.';
});
document.getElementById('filterStatus').addEventListener('change', (e) => {
  currentFilter = e.target.value;
  renderTable();
});

// Schedule
function updateSchedulePreview() {
  const d = document.getElementById('scheduleDate').value;
  const t = document.getElementById('scheduleTime').value;
  const preview = document.getElementById('schedulePreview');
  if (d && t) {
    const dt = new Date(`${d}T${t}:00`);
    const diff = dt - new Date();
    if (diff < 0) {
      preview.textContent = `⚠️ เวลานี้ผ่านไปแล้ว! จะรันทันที`;
      preview.style.color = 'var(--danger)';
    } else {
      const mins = Math.round(diff / 60000);
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      const timeStr = dt.toLocaleString('th-TH', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      preview.textContent = `✅ จะโพสต์: ${timeStr} (อีก ${hrs > 0 ? hrs + ' ชม. ' : ''}${remMins} นาที)`;
      preview.style.color = 'var(--primary)';
    }
  } else preview.textContent = '';
}
document.getElementById('scheduleDate').addEventListener('change', updateSchedulePreview);
document.getElementById('scheduleTime').addEventListener('change', updateSchedulePreview);
document.getElementById('btnClearSchedule').addEventListener('click', () => {
  document.getElementById('scheduleDate').value = '';
  document.getElementById('scheduleTime').value = '';
  document.getElementById('schedulePreview').textContent = '';
});

setInterval(renderTable, 60000);

// Initialize
setupFileUpload();
loadData();
loadBotLogs();