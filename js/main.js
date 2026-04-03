
/* ============================================================
   TERMS ACCORDION
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('termsToggle');
  const body   = document.getElementById('termsBody');
  const arrow  = document.getElementById('termsArrow');
  if (!toggle) return;

  toggle.addEventListener('click', function () {
    const isOpen = body.classList.contains('open');
    body.classList.toggle('open', !isOpen);
    arrow.classList.toggle('open', !isOpen);
  });
});

/* ============================================================
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

  /* ★ Sheet 1 — การจอง (booked / hold) */
  const BOOKINGS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR4AH7ZcEOX9TwF37rDtd78DWEzKSrtLOe-ViddgC4ZuvZ3t-M0tqomuREregstEw/pub?gid=1735014202&single=true&output=csv';

  /* ★ Sheet 2 — วันหยุดพิเศษ (holiday / special) */
  const SPECIAL_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR4AH7ZcEOX9TwF37rDtd78DWEzKSrtLOe-ViddgC4ZuvZ3t-M0tqomuREregstEw/pub?gid=2023050670&single=true&output=csv';

  /* ราคา 4 แบบ (บาท/คืน) */
  const PRICE = {
    weekday: 5900,   // อา–พฤ
    weekend: 7900,   // ศ–ส
    holiday: 9900,   // หยุดยาว / นักขัตฤกษ์
    special: 11900,  // ปีใหม่ / สงกรานต์
  };

  /* วันหยุดจาก Sheet 2 — โหลดอัตโนมัติ ไม่ต้อง hardcode */
  const PUBLIC_HOLIDAYS = new Set();
  const SPECIAL_DATES   = new Set();
  const HOLIDAY_NOTES   = new Map(); /* isoKey → note (แยกจาก booking status) */

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

  /* วันที่จาก Sheet — Map ของ 'YYYY-M-D' → status */
  let dateStatusMap = new Map();

  /* ══ ดึงข้อมูลจาก 2 Google Sheets พร้อมกัน ══════════════ */
  async function fetchBookings() {
    showLoadingState();
    const bust = Date.now();

    try {
      /* ดึงทั้ง 2 Sheet พร้อมกัน */
      const [resBookings, resSpecial] = await Promise.all([
        fetch(`${BOOKINGS_URL}&cachebust=${bust}`),
        fetch(`${SPECIAL_URL}&cachebust=${bust}`)
      ]);

      /* Sheet 1 — booked / hold */
      if (resBookings.ok) {
        const csv = await resBookings.text();
        console.log('✅ Sheet 1 fetched, length =', csv.length);
        console.log('📄 Sheet 1 raw (first 300):', csv.substring(0, 300));
        dateStatusMap = parseCSV(csv);
        console.log('✅ Sheet 1 parsed, entries =', dateStatusMap.size);
      } else {
        console.error('❌ Sheet 1 fetch failed:', resBookings.status);
      }

      /* Sheet 2 — holiday / special → เติม Sets + merge เข้า dateStatusMap */
      if (resSpecial.ok) {
        const csv2 = await resSpecial.text();
        console.log('✅ Sheet 2 fetched, length =', csv2.length);
        parseSpecialDays(csv2);
        console.log('✅ dateStatusMap size after merge =', dateStatusMap.size);
      } else {
        console.error('❌ Sheet 2 fetch failed:', resSpecial.status);
      }

      renderCalendar();
      renderHolidayList();
      setStatus('', '✨ เลือกวันที่ต้องการ เพื่อดูราคาและสอบถามการจอง');

    } catch (err) {
      console.warn('PAP Calendar: โหลดข้อมูลไม่ได้ —', err);
      dateStatusMap = new Map();
      renderCalendar();
      renderHolidayList();
      setStatus('error', '⚠️ โหลดข้อมูลวันว่างไม่ได้ · กรุณาติดต่อสอบถามโดยตรง');
    }
  }

  /* แปลง CSV → Map ของ 'YYYY-M-D' → status */
  function parseCSV(csv) {
    const map   = new Map();
    const lines = csv.trim().split('\n');
    /* ข้าม header row */
    for (let i = 1; i < lines.length; i++) {
      const cols    = lines[i].split(',');
      const rawDate = (cols[0] || '').trim().replace(/"/g, '');
      const status  = (cols[2] || '').trim().toLowerCase().replace(/"/g, '');

      if (!rawDate) continue;
      const validStatuses = ['booked', 'hold', 'holiday', 'special'];
      if (!validStatuses.includes(status)) continue;

      /* รองรับหลาย format: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY */
      const sep   = rawDate.includes('/') ? '/' : '-';
      const parts = rawDate.split(sep);
      if (parts.length !== 3) continue;

      let y, m, d;
      if (sep === '/') {
        const p0 = parseInt(parts[0], 10);
        const p1 = parseInt(parts[1], 10);
        const p2 = parseInt(parts[2], 10);
        if (p2 > 31) {
          // parts[2] คือปี → DD/MM/YYYY หรือ MM/DD/YYYY
          if (p0 > 12) {
            // DD/MM/YYYY แน่นอน
            d = p0; m = p1; y = p2;
          } else if (p1 > 12) {
            // MM/DD/YYYY แน่นอน
            m = p0; d = p1; y = p2;
          } else {
            // ไม่แน่ใจ → DD/MM/YYYY (Thai default)
            d = p0; m = p1; y = p2;
          }
        } else {
          // YYYY/MM/DD
          y = p0; m = p1; d = p2;
        }
      } else if (parseInt(parts[0], 10) > 31) {
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

      const note = (cols[1] || '').trim().replace(/"/g, '');
      console.log('```CSV:``` raw='+rawDate+' → y='+y+' m='+m+' d='+d+' key='+y+'-'+m+'-'+d);
      map.set(`${y}-${m}-${d}`, { status, note });
    }
    return map;
  }

  /* แปลง Sheet 2 CSV → เติม PUBLIC_HOLIDAYS / SPECIAL_DATES + merge ใน dateStatusMap */
  function parseSpecialDays(csv) {
    PUBLIC_HOLIDAYS.clear();
    SPECIAL_DATES.clear();
    const lines = csv.trim().split('\n');
    console.log('🗓️ parseSpecialDays: total lines =', lines.length);
    console.log('🗓️ raw CSV first 3 lines:', lines.slice(0,3));
    for (let i = 1; i < lines.length; i++) {
      const cols    = lines[i].split(',');
      const rawDate = (cols[0] || '').trim().replace(/"/g, '');
      const type    = (cols[2] || '').trim().toLowerCase().replace(/"/g, '');
      if (!rawDate || !type) continue;

      /* parse date */
      const sep   = rawDate.includes('/') ? '/' : '-';
      const parts = rawDate.split(sep);
      if (parts.length !== 3) continue;
      let y, m, d;
      if (sep === '/') {
        const p0 = parseInt(parts[0], 10);
        const p1 = parseInt(parts[1], 10);
        const p2 = parseInt(parts[2], 10);
        if (p2 > 31) {
          // DD/MM/YYYY หรือ MM/DD/YYYY
          if (p0 > 12) {
            d = p0; m = p1; y = p2; // DD/MM/YYYY แน่นอน
          } else if (p1 > 12) {
            m = p0; d = p1; y = p2; // MM/DD/YYYY แน่นอน
          } else {
            d = p0; m = p1; y = p2; // DD/MM/YYYY default (Thai)
          }
        } else {
          y = p0; m = p1; d = p2; // YYYY/MM/DD
        }
      } else if (parseInt(parts[0], 10) > 31) {
        // YYYY-MM-DD
        y = parseInt(parts[0], 10); m = parseInt(parts[1], 10); d = parseInt(parts[2], 10);
      } else {
        // DD-MM-YYYY
        d = parseInt(parts[0], 10); m = parseInt(parts[1], 10); y = parseInt(parts[2], 10);
      }
      if (isNaN(y) || isNaN(m) || isNaN(d)) continue;

      const isoKey  = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const mapKey  = `${y}-${m}-${d}`;

      const note2 = (cols[1] || '').trim().replace(/"/g, '');
      console.log(`📌 parsed: y=${y} m=${m} d=${d} type=${type} note=${note2} mapKey=${mapKey}`);
      if (type === 'holiday') {
        PUBLIC_HOLIDAYS.add(isoKey);
        HOLIDAY_NOTES.set(isoKey, note2);
        if (!dateStatusMap.has(mapKey)) dateStatusMap.set(mapKey, { status: 'holiday', note: note2 });
      } else if (type === 'special') {
        SPECIAL_DATES.add(isoKey);
        HOLIDAY_NOTES.set(isoKey, note2);
        if (!dateStatusMap.has(mapKey)) dateStatusMap.set(mapKey, { status: 'special', note: note2 });
      }
    }
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

  function getSheetEntry(y, m, d) {
    return dateStatusMap.get(`${y}-${m + 1}-${d}`) || null;
  }
  function getSheetStatus(y, m, d) {
    const e = getSheetEntry(y, m, d);
    return e ? (typeof e === 'object' ? e.status : e) : null;
  }
  function getSheetNote(y, m, d) {
    const e = getSheetEntry(y, m, d);
    return e ? (typeof e === 'object' ? e.note : '') : '';
  }
  function isBooked(y, m, d) {
    const s = getSheetStatus(y, m, d);
    return s === 'booked' || s === 'hold';
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
      const dow = new Date(viewYear, viewMonth, d).getDay();
      if (dow === 0) cell.classList.add('dp-sunday');
      if (dow === 6) cell.classList.add('dp-saturday');

      if (isPast(viewYear, viewMonth, d)) {
        cell.classList.add('cal-past');
      } else {
        const sheetStatus = getSheetStatus(viewYear, viewMonth, d);
        if (sheetStatus === 'booked') {
          cell.classList.add('cal-booked');
          if (isToday(viewYear, viewMonth, d)) cell.classList.add('cal-today-booked');
        } else if (sheetStatus === 'hold') {
          cell.classList.add('cal-hold');
        } else if (sheetStatus === 'special') {
          cell.classList.add('cal-special');
        } else if (sheetStatus === 'holiday') {
          cell.classList.add('cal-holiday-sheet');
        } else if (isToday(viewYear, viewMonth, d)) {
          cell.classList.add('cal-today');
        } else if (isWeekend(viewYear, viewMonth, d)) {
          cell.classList.add('cal-weekend');
        }
      }

      if (!isPast(viewYear, viewMonth, d)) {
        cell.addEventListener('click', () => onDayClick(d, cell));
      }

      calGrid.appendChild(cell);
    }
  }

  /* แสดงรายชื่อวันหยุดในเดือนที่กำลังดู */
  function renderHolidayList() {
    const listEl  = document.getElementById('calHolidayList');
    const itemsEl = document.getElementById('calHolidayListItems');
    if (!listEl || !itemsEl) return;

    const THAI_MONTHS_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.',
                               'ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const holidays = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const isoKey = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      let holidayType = '';
      if (SPECIAL_DATES.has(isoKey)) holidayType = 'special';
      else if (PUBLIC_HOLIDAYS.has(isoKey)) holidayType = 'holiday';

      if (holidayType) {
        const note = HOLIDAY_NOTES.get(isoKey) || '';
        if (note) holidays.push({ d, status: holidayType, note });
      }
    }

    if (holidays.length === 0) {
      listEl.style.display = 'none';
      return;
    }

    itemsEl.innerHTML = '';
    holidays.forEach(({ d, status, note }) => {
      const li = document.createElement('li');
      li.className = `cal-holiday-item cal-holiday-item-${status}`;
      li.innerHTML = `<span class="hli-dot"></span><span class="hli-date">${d} ${THAI_MONTHS_SHORT[viewMonth]}</span><span class="hli-name">${note}</span>`;
      itemsEl.appendChild(li);
    });

    listEl.style.display = 'block';
  }

  function onDayClick(d, cell) {
    if (cell.classList.contains('cal-booked')) {
      setStatus('booked', `❌ วันที่ ${d} ${THAI_MONTHS[viewMonth]} ${viewYear + 543} — จองแล้ว กรุณาเลือกวันอื่น`);
      return;
    }
    if (cell.classList.contains('cal-hold')) {
      setStatus('booked', `⏳ วันที่ ${d} ${THAI_MONTHS[viewMonth]} ${viewYear + 543} — รอยืนยัน กรุณาติดต่อสอบถาม`);
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
    renderHolidayList();
    setStatus('', '✨ เลือกวันที่ต้องการ เพื่อดูราคาและสอบถามการจอง');
  });

  calNext.addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    selectedCell = null;
    renderCalendar();
    renderHolidayList();
    setStatus('', '✨ เลือกวันที่ต้องการ เพื่อดูราคาและสอบถามการจอง');
  });

  /* ══ โหลดครั้งแรก ════════════════════════════════════════ */
  fetchBookings();

})();

/* ============================================================
   CUSTOM DATE PICKER — อา. จ. อ. พ. พฤ. ศ. ส.
   ============================================================ */

(function () {
  const MONTHS_TH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                     'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

  function toYMD(d) {
    const dd = new Date(d);
    return dd.getFullYear() + '-' +
      String(dd.getMonth()+1).padStart(2,'0') + '-' +
      String(dd.getDate()).padStart(2,'0');
  }

  function createPicker(opts) {
    // opts: { displayId, textId, popupId, gridId, monthId, prevId, nextId, hiddenId, minDateFn, onSelect }
    const display  = document.getElementById(opts.displayId);
    const textEl   = document.getElementById(opts.textId);
    const popup    = document.getElementById(opts.popupId);
    const grid     = document.getElementById(opts.gridId);
    const monthLbl = document.getElementById(opts.monthId);
    const prevBtn  = document.getElementById(opts.prevId);
    const nextBtn  = document.getElementById(opts.nextId);
    const hidden   = document.getElementById(opts.hiddenId);

    if (!display) return;

    const today = new Date();
    today.setHours(0,0,0,0);

    let cur = new Date(today.getFullYear(), today.getMonth(), 1);
    let selectedDate = null;
    let open = false;

    function renderGrid() {
      monthLbl.textContent = MONTHS_TH[cur.getMonth()] + ' ' + (cur.getFullYear() + 543);
      grid.innerHTML = '';

      const firstDay = new Date(cur.getFullYear(), cur.getMonth(), 1).getDay(); // 0=Sun
      const daysInMonth = new Date(cur.getFullYear(), cur.getMonth()+1, 0).getDate();
      const minDate = opts.minDateFn ? opts.minDateFn() : today;

      // Empty cells before first day (อา=0, so no offset needed for Sunday start)
      for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'dp-day dp-empty';
        grid.appendChild(empty);
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(cur.getFullYear(), cur.getMonth(), d);
        date.setHours(0,0,0,0);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dp-day';
        btn.textContent = d;

        const dow = date.getDay();
        if (dow === 0) btn.classList.add('dp-sunday');
        if (dow === 6) btn.classList.add('dp-saturday');
        if (toYMD(date) === toYMD(today)) btn.classList.add('dp-today');
        if (selectedDate && toYMD(date) === toYMD(selectedDate)) btn.classList.add('dp-selected');

        if (date < minDate) {
          btn.classList.add('dp-disabled');
          btn.disabled = true;
        } else {
          btn.addEventListener('click', function () {
            selectedDate = date;
            hidden.value = toYMD(date);
            // Format display: d เดือน พ.ศ.
            textEl.textContent = d + ' ' + MONTHS_TH[cur.getMonth()] + ' ' + (cur.getFullYear()+543);
            textEl.classList.add('dp-has-value');
            display.classList.remove('error');
            document.getElementById(opts.hiddenId.replace('bkCheck','err') + (opts.hiddenId.includes('In') ? 'In' : 'Out'))?.style && null;
            closePopup();
            if (opts.onSelect) opts.onSelect(date);
            // trigger summary update
            if (typeof updateSummary === 'function') updateSummary();
            if (typeof updatePreview === 'function') updatePreview();
          });
        }
        grid.appendChild(btn);
      }
    }

    function openPopup() {
      popup.style.display = 'block';
      display.classList.add('dp-open');
      open = true;
      renderGrid();
    }

    function closePopup() {
      popup.style.display = 'none';
      display.classList.remove('dp-open');
      open = false;
    }

    display.addEventListener('click', function(e) {
      e.stopPropagation();
      open ? closePopup() : openPopup();
    });
    display.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open ? closePopup() : openPopup(); }
      if (e.key === 'Escape') closePopup();
    });

    prevBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      cur.setMonth(cur.getMonth()-1);
      renderGrid();
    });
    nextBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      cur.setMonth(cur.getMonth()+1);
      renderGrid();
    });

    popup.addEventListener('click', function(e) { e.stopPropagation(); });

    return {
      getDate: () => selectedDate,
      getValue: () => hidden.value,
      setMin: (d) => { /* minDateFn handles this dynamically */ }
    };
  }

  document.addEventListener('DOMContentLoaded', function () {
    const pickerIn = createPicker({
      displayId: 'dpDisplayIn', textId: 'dpTextIn',
      popupId: 'dpPopupIn', gridId: 'dpGridIn',
      monthId: 'dpMonthIn', prevId: 'dpPrevIn', nextId: 'dpNextIn',
      hiddenId: 'bkCheckIn',
      minDateFn: function() {
        const t = new Date(); t.setHours(0,0,0,0); return t;
      },
      onSelect: function(date) {
        // re-render checkout picker if its selected date is now invalid
        if (pickerOut) {
          const outVal = document.getElementById('bkCheckOut').value;
          if (outVal && outVal <= toYMD(date)) {
            document.getElementById('bkCheckOut').value = '';
            document.getElementById('dpTextOut').textContent = 'เลือกวันที่...';
            document.getElementById('dpTextOut').classList.remove('dp-has-value');
          }
        }
      }
    });

    const pickerOut = createPicker({
      displayId: 'dpDisplayOut', textId: 'dpTextOut',
      popupId: 'dpPopupOut', gridId: 'dpGridOut',
      monthId: 'dpMonthOut', prevId: 'dpPrevOut', nextId: 'dpNextOut',
      hiddenId: 'bkCheckOut',
      minDateFn: function() {
        const inVal = document.getElementById('bkCheckIn').value;
        if (inVal) {
          const d = new Date(inVal);
          d.setDate(d.getDate()+1);
          d.setHours(0,0,0,0);
          return d;
        }
        const t = new Date(); t.setDate(t.getDate()+1); t.setHours(0,0,0,0); return t;
      }
    });

    // Close all pickers on outside click
    document.addEventListener('click', function() {
      document.querySelectorAll('.dp-popup').forEach(p => p.style.display = 'none');
      document.querySelectorAll('.dp-display').forEach(d => d.classList.remove('dp-open'));
    });
  });

  // expose toYMD for use in minDateFn closure
  window._dpToYMD = function(d) {
    return new Date(d).toISOString().split('T')[0];
  };
})();

/* ============================================================
   SESSION 4 — ฟอร์มจอง + LINE
   ============================================================ */

(function () {

  /* ---- helpers ---- */
  const $ = id => document.getElementById(id);

  /* ---- set min date = today — handled by custom picker ---- */
  function initDateLimits() { return; // custom picker handles this
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

    const prices = { weekday: 5900, weekend: 7900, holiday: 9900, special: 11900 };
    let total = 0;
    let pricePerNight = 0; // ราคาคืนสุดท้าย (ใช้แสดง)
    const cur = new Date(start);
    for (let i = 0; i < nights; i++) {
      const day = cur.getDay();
      const yy  = cur.getFullYear();
      const mm  = cur.getMonth() + 1;
      const dd  = cur.getDate();
      const isoKey = `${yy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
      // ตรวจ special/holiday จาก Sheet
      let p = (day === 5 || day === 6) ? prices.weekend : prices.weekday;
      if (typeof SPECIAL_DATES !== 'undefined' && SPECIAL_DATES.has(isoKey)) p = prices.special;
      else if (typeof PUBLIC_HOLIDAYS !== 'undefined' && PUBLIC_HOLIDAYS.has(isoKey)) p = prices.holiday;
      pricePerNight = p;
      total += p;
      cur.setDate(cur.getDate() + 1);
    }
    return { nights, total, pricePerNight };
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

    const est = (ci && co) ? estimatePrice(ci, co) : null;
    const deposit = est ? Math.ceil(est.total * 0.5 / 100) * 100 : null;

    let msg = `🏊 PAP Pool Villa Cha-am\n`;
    msg += `━━━━━━━━━━━━━━━━━\n`;
    msg += `Booking name: คุณ ${name}\n`;
    msg += `เบอร์โทร: ${phone}\n`;
    msg += `━━━━━━━━━━━━━━━━━\n`;
    msg += `📅 Check-in:  ${thaiDate(ci)}\n`;
    msg += `📅 Check-out: ${thaiDate(co)}\n`;
    if (est && est.nights > 0) {
      msg += `🌙 จำนวน: ${est.nights} คืน\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━\n`;
    msg += `👥 ผู้เข้าพัก: ${guests} ท่าน\n`;
    if (purpose) msg += `🎉 จุดประสงค์: ${purpose}\n`;
    if (est && est.nights > 0) {
      msg += `\n💰 ราคา: ฿${est.pricePerNight.toLocaleString()} × ${est.nights} คืน\n`;
      msg += `💵 ยอดรวมทั้งสิ้น = ฿${est.total.toLocaleString()} บาท\n`;
      msg += `━━━━━━━━━━━━━━━━━\n`;
      msg += `💳 กรุณาโอนมัดจำ 50%\n`;
      msg += `   = ฿${deposit.toLocaleString()} บาท\n`;
      msg += `   ธนาคาร TTB สาขาโลตัส นวนคร\n`;
      msg += `   ออมทรัพย์ เลขที่บัญชี 129-2-28007-8\n`;
      msg += `   ชื่อบัญชี: น.ส.เพ็ญศิริ ฉันทวิเศษกุล\n`;
      msg += `━━━━━━━━━━━━━━━━━\n`;
    }
    if (note) msg += `📝 หมายเหตุ: ${note}\n`;
    msg += `━━━━━━━━━━━━━━━━━\n`;
    msg += `📋 เมื่อโอนเงินจองแล้ว ขอสงวนสิทธิ์คืนเงิน แต่สามารถเลื่อนวันเข้าพักได้ภายใน 1 ปี\n`;

    msg += `✨ PAP Pool Villa · ชะอำ เพชรบุรี`;

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
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  /* ---- Send Modal (QR + Desktop) ---- */
  let _qrLineObj = null, _qrMsObj = null;

  function openSendModal(channel) {
    const msg          = buildMessage();
    const lineUrl      = 'https://line.me/ti/p/@alo2064u';
    const messengerUrl = (window.MESSENGER_URL && !window.MESSENGER_URL.includes('YOUR_PAGE_NAME'))
      ? window.MESSENGER_URL : 'https://www.facebook.com/pappoolvilla/';

    copyToClipboard(msg).catch(() => {});

    const modal = document.getElementById('sendModal');
    if (!modal) return;

    // สร้าง QR ครั้งแรกเท่านั้น
    const qrLineEl = document.getElementById('qrLine');
    if (qrLineEl && !_qrLineObj) {
      _qrLineObj = new QRCode(qrLineEl, {
        text: lineUrl, width: 180, height: 180,
        colorDark: '#06c755', colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    }
    const qrMsEl = document.getElementById('qrMessenger');
    if (qrMsEl && !_qrMsObj) {
      _qrMsObj = new QRCode(qrMsEl, {
        text: messengerUrl, width: 180, height: 180,
        colorDark: '#0084ff', colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    }

    // ผูกปุ่ม Copy
    function bindCopyBtn(btnId, statusId) {
      const old = document.getElementById(btnId);
      if (!old) return;
      const neo = old.cloneNode(true);
      old.parentNode.replaceChild(neo, old);
      neo.addEventListener('click', () => {
        copyToClipboard(msg).then(() => {
          neo.textContent = '✅ คัดลอกแล้ว!';
          neo.classList.add('copied');
          const status = document.getElementById(statusId);
          if (status) status.textContent = '✅ คัดลอกแล้ว! เปิด LINE/Messenger แล้วกด Ctrl+V ได้เลย';
          setTimeout(() => {
            neo.textContent = '📋 Copy ข้อความ';
            neo.classList.remove('copied');
            if (status) status.textContent = '';
          }, 4000);
        }).catch(() => {
          neo.textContent = '⚠️ ลอง Ctrl+C แทน';
        });
      });
    }
    bindCopyBtn('btnCopyLine',      'copiedStatusLine');
    bindCopyBtn('btnCopyMessenger', 'copiedStatusMs');

    switchSendTab(channel);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSendModal() {
    const modal = document.getElementById('sendModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function switchSendTab(tab) {
    document.getElementById('panelLine').style.display      = tab === 'line'      ? 'block' : 'none';
    document.getElementById('panelMessenger').style.display = tab === 'messenger' ? 'block' : 'none';
    document.getElementById('tabLine').classList.toggle('active',      tab === 'line');
    document.getElementById('tabMessenger').classList.toggle('active', tab === 'messenger');
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('sendModalClose')?.addEventListener('click', closeSendModal);
    document.getElementById('sendModal')?.addEventListener('click', e => {
      if (e.target === document.getElementById('sendModal')) closeSendModal();
    });
    document.getElementById('tabLine')?.addEventListener('click',      () => switchSendTab('line'));
    document.getElementById('tabMessenger')?.addEventListener('click', () => switchSendTab('messenger'));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSendModal(); });
  });

  /* ---- Submit → LINE ---- */
  function submitViaLine()      { openSendModal('line'); }

  /* ---- Submit → Messenger ---- */
  function submitViaMessenger() { openSendModal('messenger'); }

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
