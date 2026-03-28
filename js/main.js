/* ============================================================
   PAP POOL VILLA — main.js
   Session 1: Navbar scroll effect + Mobile hamburger
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('navHamburger');
  const mobileMenu = document.getElementById('navMobile');
  const mobileLinks = document.querySelectorAll('.mobile-link, .btn-mobile-check, .btn-mobile-line');

  /* ---------- Navbar scroll effect ---------- */
  const handleScroll = () => {
    if (window.scrollY > 60) {/* ============================================================
   MESSENGER CONFIG — เปลี่ยน URL ตรงนี้จุดเดียว
   ใส่ชื่อ Facebook Page เช่น "PapPoolVilla" หรือ URL เต็ม
   ============================================================ */
window.MESSENGER_URL = 'https://www.facebook.com/pappoolvilla/#';

// Auto-update all Messenger links on page load
document.addEventListener('DOMContentLoaded', function () {
  if (window.MESSENGER_URL && !window.MESSENGER_URL.includes('YOUR_PAGE_NAME')) {
    document.querySelectorAll('a[href*="YOUR_PAGE_NAME"]').forEach(function (el) {
      el.href = window.MESSENGER_URL;
    });
  }
});

/* ============================================================
   PAP POOL VILLA — main.js
   Session 1: Navbar scroll effect + Mobile hamburger
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('navHamburger');
  const mobileMenu = document.getElementById('navMobile');
  const mobileLinks = document.querySelectorAll('.mobile-link, .btn-mobile-check, .btn-mobile-line');

  /* ---------- Navbar scroll effect ---------- */
  const handleScroll = () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // run once on load

  /* ---------- Mobile hamburger ---------- */
  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  // Close mobile menu when a link is clicked
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', false);
    });
  });

  // Close mobile menu on outside click
  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target)) {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('active');
    }
  });

  /* ---------- Smooth scroll for anchor links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navHeight = navbar.offsetHeight;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 12;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ---------- Animate elements on scroll (will be used by all sessions) ---------- */
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements with .animate-on-scroll class (sessions 2-5 will use this)
  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });

});

/* ============================================================
   SESSION 3 — Calendar · ดึงข้อมูลจาก Google Sheets (CSV)
   ============================================================

   ══ วิธีตั้ง Google Sheet (เจ้าของทำครั้งเดียว) ══════════
   1. สร้าง Google Sheet → row 1 คือ header: date | note | status
   2. กรอกวันที่จองแบบนี้:
        A            B              C
        date         note           status
        2025-08-10   คุณสมชาย      booked
        2025-08-11   คุณสมชาย      booked
        2025-09-20   hold           hold
   3. File → Share → Publish to web
      → เลือก Sheet1 → CSV → กด Publish → Copy URL
   4. วาง URL ที่ได้ลงใน SHEET_CSV_URL ด้านล่าง
   ═══════════════════════════════════════════════════════════ */

(function initCalendar() {

  /* ★ แก้ตรงนี้เท่านั้น — วาง URL จาก "Publish to web → CSV" */
  const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTLmiNIZoecy9P1JOnri-81-MMXB0qmWTXnRB0wBYC-diyk2an7gnMcguro4WzwOQ/pub?gid=1085240737&single=true&output=csv';
  /* ตัวอย่าง:
     'https://docs.google.com/spreadsheets/d/1aBcD.../pub?gid=0&single=true&output=csv'
  */

  /* ราคา 4 แบบ (บาท/คืน) */
  const PRICE = {
    weekday: 5900,   // อา–พฤ
    weekend: 7900,   // ศ–ส
    holiday: 9900,   // หยุดยาว / นักขัตฤกษ์
    special: 11900,  // ปีใหม่ / สงกรานต์
  };

  /* วันหยุดนักขัตฤกษ์ — เพิ่ม/ลบได้ตรงนี้ format YYYY-MM-DD */
  const PUBLIC_HOLIDAYS = new Set([
    '2025-12-31','2026-01-01','2026-01-02',   // ปีใหม่
    '2026-04-13','2026-04-14','2026-04-15','2026-04-16', // สงกรานต์
    '2025-10-13', // วันคล้ายวันสวรรคต ร.9
    '2025-10-23', // วันปิยมหาราช
    '2025-12-05', // วันพ่อ
    '2025-12-10', // วันรัฐธรรมนูญ
  ]);

  /* วันพิเศษ (ปีใหม่/สงกรานต์) */
  const SPECIAL_DATES = new Set([
    '2025-12-31','2026-01-01','2026-01-02',
    '2026-04-13','2026-04-14','2026-04-15','2026-04-16',
  ]);

  const THAI_MONTHS = [
    'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน',
    'พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม',
    'กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'
  ];

  /* DOM refs */
  const calGrid       = document.getElementById('calGrid');
  const calMonthTitle = document.getElementById('calMonthTitle');
  const calPrev       = document.getElementById('calPrev');
  const calNext       = document.getElementById('calNext');
  const calStatus     = document.getElementById('calStatus');
  const calStatusText = document.getElementById('calStatusText');
  if (!calGrid) return;

  const now = new Date();
  let viewYear  = now.getFullYear();
  let viewMonth = now.getMonth();
  let selectedCell = null;

  /* วันที่จอง — Set ของ 'YYYY-M-D' */
  let bookedSet = new Set();

  /* ══ ดึงข้อมูลจาก Google Sheets CSV ══════════════════════ */
  async function fetchBookings() {
    showLoadingState();

    /* ถ้ายังไม่ได้ตั้ง URL → ใช้ fallback ว่างเปล่า */
    if (!SHEET_CSV_URL || SHEET_CSV_URL.includes('YOUR_GOOGLE')) {
      bookedSet = new Set();
      renderCalendar();
      setStatus('', '✨ เลือกวันที่ต้องการ เพื่อดูราคาและสอบถามการจอง');
      return;
    }

    try {
      /* เติม cache-bust เพื่อได้ข้อมูลล่าสุดเสมอ */
      const url = `${SHEET_CSV_URL}&cachebust=${Date.now()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('fetch failed');

      const csv  = await res.text();
      bookedSet  = parseCSV(csv);
      renderCalendar();
      setStatus('', '✨ เลือกวันที่ต้องการ เพื่อดูราคาและสอบถามการจอง');

    } catch (err) {
      console.warn('PAP Calendar: โหลดข้อมูลไม่ได้ —', err);
      bookedSet = new Set();
      renderCalendar();
      setStatus('error', '⚠️ โหลดข้อมูลวันว่างไม่ได้ · กรุณาติดต่อสอบถามโดยตรง');
    }
  }

  /* แปลง CSV → Set ของ 'YYYY-M-D' */
  function parseCSV(csv) {
    const set   = new Set();
    const lines = csv.trim().split('\n');
    /* ข้าม header row */
    for (let i = 1; i < lines.length; i++) {
      const cols   = lines[i].split(',');
      const rawDate = (cols[0] || '').trim().replace(/"/g, '');
      const status  = (cols[2] || '').trim().toLowerCase().replace(/"/g, '');

      if (!rawDate) continue;
      if (status !== 'booked' && status !== 'hold') continue;

      /* รองรับหลาย format อัตโนมัติ
         YYYY-MM-DD / YYYY-M-D  → 2025-08-10
         DD-MM-YYYY / D-M-YYYY  → 10-08-2025
         DD/MM/YYYY             → 10/08/2025  */
      const sep   = rawDate.includes('/') ? '/' : '-';
      const parts = rawDate.split(sep);
      if (parts.length !== 3) continue;

      let y, m, d;
      if (parseInt(parts[0], 10) > 31) {
        // YYYY-MM-DD
        y = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10);
        d = parseInt(parts[2], 10);
      } else {
        // DD-MM-YYYY
        d = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10);
        y = parseInt(parts[2], 10);
      }
      if (isNaN(y) || isNaN(m) || isNaN(d)) continue;

      set.add(`${y}-${m}-${d}`);
    }
    return set;
  }

  function showLoadingState() {
    calGrid.innerHTML = '<div class="cal-loading">⏳ กำลังโหลดข้อมูล...</div>';
    calMonthTitle.textContent = '— กำลังโหลด —';
  }

  /* ══ Render ปฏิทิน ═══════════════════════════════════════ */
  /* คืนประเภทราคาของวัน */
  function getPriceType(y, m, d) {
    const key = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    if (SPECIAL_DATES.has(key)) return 'special';
    if (PUBLIC_HOLIDAYS.has(key)) return 'holiday';
    const dow = new Date(y, m, d).getDay();
    if (dow === 5 || dow === 6) return 'weekend'; // ศ, ส
    return 'weekday'; // อา, จ, อ, พ, พฤ
  }

  function isWeekend(y, m, d) {
    const type = getPriceType(y, m, d);
    return type === 'weekend' || type === 'holiday' || type === 'special';
  }

  function isBooked(y, m, d) {
    return bookedSet.has(`${y}-${m + 1}-${d}`);
  }

  function isPast(y, m, d) {
    const date  = new Date(y, m, d);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return date < today;
  }

  function isToday(y, m, d) {
    return y === now.getFullYear() && m === now.getMonth() && d === now.getDate();
  }

  function renderCalendar() {
    calGrid.innerHTML = '';
    calMonthTitle.textContent = `${THAI_MONTHS[viewMonth]} ${viewYear + 543}`;

    const firstDow    = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    for (let i = 0; i < firstDow; i++) {
      const empty = document.createElement('div');
      empty.className = 'cal-day cal-empty';
      calGrid.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day';
      cell.textContent = d;

      if (isPast(viewYear, viewMonth, d)) {
        cell.classList.add('cal-past');
      } else if (isToday(viewYear, viewMonth, d)) {
        cell.classList.add('cal-today');
      } else if (isBooked(viewYear, viewMonth, d)) {
        cell.classList.add('cal-booked');
      } else if (isWeekend(viewYear, viewMonth, d)) {
        cell.classList.add('cal-weekend');
      }

      if (!isPast(viewYear, viewMonth, d)) {
        cell.addEventListener('click', () => onDayClick(d, cell));
      }

      calGrid.appendChild(cell);
    }
  }

  function onDayClick(d, cell) {
    if (cell.classList.contains('cal-booked')) {
      setStatus('booked', `❌ วันที่ ${d} ${THAI_MONTHS[viewMonth]} ${viewYear + 543} — จองแล้ว กรุณาเลือกวันอื่น`);
      return;
    }
    if (cell.classList.contains('cal-past')) return;

    if (selectedCell) selectedCell.classList.remove('cal-selected');
    cell.classList.add('cal-selected');
    selectedCell = cell;

    const ptype = getPriceType(viewYear, viewMonth, d);
    const price  = PRICE[ptype];
    const typeLabel = {
      weekday: '🌤️ วันอาทิตย์–พฤหัส',
      weekend: '🎉 วันศุกร์–เสาร์',
      holiday: '🏖️ หยุดยาว/นักขัตฤกษ์',
      special: '🎆 ปีใหม่/สงกรานต์',
    }[ptype];
    setStatus('available',
      `✅ ${d} ${THAI_MONTHS[viewMonth]} ${viewYear + 543} — ${typeLabel} · ราคา ${price.toLocaleString()} บาท / คืน`
    );
  }

  function setStatus(type, text) {
    calStatus.className = 'cal-status';
    calStatusText.textContent = text;
    if (type === 'booked')    calStatus.classList.add('status-booked');
    if (type === 'available') calStatus.classList.add('status-available');
    if (type === 'error')     calStatus.classList.add('status-booked');
  }

  /* ══ ปุ่มเดือนก่อน / ถัดไป ══════════════════════════════ */
  calPrev.addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    selectedCell = null;
    renderCalendar();
    setStatus('', '✨ เลือกวันที่ต้องการ เพื่อดูราคาและสอบถามการจอง');
  });

  calNext.addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    selectedCell = null;
    renderCalendar();
    setStatus('', '✨ เลือกวันที่ต้องการ เพื่อดูราคาและสอบถามการจอง');
  });

  /* ══ โหลดครั้งแรก ════════════════════════════════════════ */
  fetchBookings();

})();

/* ============================================================
   SESSION 4 — ฟอร์มจอง + LINE
   ============================================================ */

(function () {

  /* ---- helpers ---- */
  const $ = id => document.getElementById(id);

  /* ---- set min date = today ---- */
  function initDateLimits() {
    const today = new Date().toISOString().split('T')[0];
    const checkIn  = $('bkCheckIn');
    const checkOut = $('bkCheckOut');
    if (!checkIn) return;
    checkIn.min  = today;
    checkOut.min = today;

    checkIn.addEventListener('change', function () {
      checkOut.min = this.value;
      if (checkOut.value && checkOut.value <= this.value) {
        const d = new Date(this.value);
        d.setDate(d.getDate() + 1);
        checkOut.value = d.toISOString().split('T')[0];
      }
      updateSummary();
    });

    checkOut.addEventListener('change', updateSummary);
  }

  /* ---- price estimate ---- */
  function estimatePrice(checkInStr, checkOutStr) {
    const start = new Date(checkInStr);
    const end   = new Date(checkOutStr);
    const nights = Math.round((end - start) / 86400000);
    if (nights <= 0) return null;

    let total = 0;
    const prices = { weekday: 5900, weekend: 7900 };
    const cur = new Date(start);
    for (let i = 0; i < nights; i++) {
      const day = cur.getDay(); // 0=Sun,5=Fri,6=Sat
      total += (day === 5 || day === 6) ? prices.weekend : prices.weekday;
      cur.setDate(cur.getDate() + 1);
    }
    return { nights, total };
  }

  function updateSummary() {
    const ci = $('bkCheckIn')?.value;
    const co = $('bkCheckOut')?.value;
    const summary = $('bkDateSummary');
    if (!ci || !co || !summary) return;

    const est = estimatePrice(ci, co);
    if (!est || est.nights <= 0) { summary.style.display = 'none'; return; }

    $('bkNightsText').textContent = `🌙 ${est.nights} คืน`;
    $('bkEstPrice').textContent   = `ราคาประมาณ ฿${est.total.toLocaleString()} (ไม่รวมส่วนลด/โปรโมชั่น)`;
    summary.style.display = 'flex';
    updatePreview();
  }

  /* ---- format Thai date ---- */
  function thaiDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.',
                    'ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
  }

  /* ---- Live preview ---- */
  function buildMessage() {
    const name    = $('bkName')?.value.trim()    || '—';
    const phone   = $('bkPhone')?.value.trim()   || '—';
    const ci      = $('bkCheckIn')?.value;
    const co      = $('bkCheckOut')?.value;
    const guests  = $('bkGuests')?.value          || '—';
    const purpose = $('bkPurpose')?.value         || '';
    const note    = $('bkNote')?.value.trim()     || '';

    const addons = [...document.querySelectorAll('input[name="addon"]:checked')]
                    .map(el => el.value);

    const est = (ci && co) ? estimatePrice(ci, co) : null;

    let msg = `🏊 สอบถาม/จอง PAP Pool Villa ชะอำ\n`;
    msg += `━━━━━━━━━━━━━━━━━\n`;
    msg += `👤 ชื่อ: ${name}\n`;
    msg += `📞 เบอร์: ${phone}\n`;
    msg += `━━━━━━━━━━━━━━━━━\n`;
    msg += `📅 Check-in:  ${thaiDate(ci)}\n`;
    msg += `📅 Check-out: ${thaiDate(co)}\n`;
    if (est && est.nights > 0) msg += `🌙 จำนวนคืน: ${est.nights} คืน\n`;
    msg += `━━━━━━━━━━━━━━━━━\n`;
    msg += `👥 ผู้เข้าพัก: ${guests} ท่าน\n`;
    if (purpose) msg += `🎉 จุดประสงค์: ${purpose}\n`;
    if (addons.length > 0) msg += `🌟 บริการเสริม: ${addons.join(', ')}\n`;
    if (note) msg += `📝 หมายเหตุ: ${note}\n`;
    msg += `━━━━━━━━━━━━━━━━━\n`;
    msg += `✨ ส่งจากเว็บไซต์ PapPoolVilla.com`;

    return msg;
  }

  function updatePreview() {
    const preview = $('bkPreviewText');
    if (!preview) return;
    preview.textContent = buildMessage();
  }

  function initLivePreview() {
    const fields = ['bkName','bkPhone','bkCheckIn','bkCheckOut',
                    'bkGuests','bkPurpose','bkNote'];
    fields.forEach(id => {
      const el = $(id);
      if (el) el.addEventListener('input', updatePreview);
      if (el) el.addEventListener('change', updatePreview);
    });
    document.querySelectorAll('input[name="addon"]').forEach(el => {
      el.addEventListener('change', updatePreview);
    });
  }

  /* ---- Validation ---- */
  function validate() {
    let valid = true;

    function check(id, errId, condition) {
      const el  = $(id);
      const err = $(errId);
      const grp = el?.closest('.form-group');
      if (!condition) {
        grp?.classList.add('has-error');
        el?.classList.add('error');
        valid = false;
      } else {
        grp?.classList.remove('has-error');
        el?.classList.remove('error');
      }
    }

    check('bkName',     'errName',     $('bkName')?.value.trim().length > 0);
    check('bkPhone',    'errPhone',    /^[0-9\-\s+]{9,15}$/.test($('bkPhone')?.value.trim() || ''));
    check('bkCheckIn',  'errCheckIn',  !!$('bkCheckIn')?.value);
    check('bkCheckOut', 'errCheckOut', !!$('bkCheckOut')?.value && $('bkCheckOut')?.value > $('bkCheckIn')?.value);
    check('bkGuests',   'errGuests',   !!$('bkGuests')?.value);

    return valid;
  }

  /* ---- Copy to clipboard helper ---- */
  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback for older browsers / http
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  /* ---- Show toast ---- */
  function showCopyToast() {
    const toast = $('bkCopyToast');
    if (!toast) return;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4500);
  }

  /* ---- Submit → LINE ---- */
  function submitViaLine() {
    const msg = buildMessage();
    const url = `https://line.me/ti/p/penta29?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }

  /* ---- Submit → Messenger (copy + open) ---- */
  function submitViaMessenger() {
    const msg = buildMessage();
    const messengerUrl = (window.MESSENGER_URL && !window.MESSENGER_URL.includes('YOUR_PAGE_NAME'))
      ? window.MESSENGER_URL
      : 'https://www.messenger.com';

    copyToClipboard(msg).then(() => {
      showCopyToast();
      // Short delay so user sees toast before tab switches
      setTimeout(() => window.open(messengerUrl, '_blank'), 800);
    });
  }

  /* ---- Init form submit ---- */
  function initFormSubmit() {
    const form = $('bookingForm');
    if (!form) return;

    // LINE button (type=submit)
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;
      submitViaLine();
    });

    // Messenger button (type=button — bypasses form submit)
    const btnMsg = $('btnSubmitMessenger');
    if (btnMsg) {
      btnMsg.addEventListener('click', function () {
        if (!validate()) return;
        submitViaMessenger();
      });
    }

    // Clear errors on input
    form.querySelectorAll('.form-input').forEach(el => {
      el.addEventListener('input', function () {
        this.classList.remove('error');
        this.closest('.form-group')?.classList.remove('has-error');
      });
    });
  }

  /* ---- Init ---- */
  document.addEventListener('DOMContentLoaded', function () {
    initDateLimits();
    initLivePreview();
    initFormSubmit();
  });

})();

      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // run once on load

  /* ---------- Mobile hamburger ---------- */
  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  // Close mobile menu when a link is clicked
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', false);
    });
  });

  // Close mobile menu on outside click
  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target)) {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('active');
    }
  });

  /* ---------- Smooth scroll for anchor links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navHeight = navbar.offsetHeight;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 12;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ---------- Animate elements on scroll (will be used by all sessions) ---------- */
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements with .animate-on-scroll class (sessions 2-5 will use this)
  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });

});
