/* ============================================================
   PAP POOL VILLA — gallery.js
   Session 2: Lightbox + Drag-to-scroll + Auto-load villa images
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Helper: โหลดรูปลอง .jpg ก่อน ถ้าไม่ได้ลอง .JPG ---------- */
  function loadImg(src, onSuccess, onFail) {
    const img = new Image();
    img.onload = () => onSuccess(img, src);
    img.onerror = () => {
      // ลอง extension อีกแบบ
      const alt = src.endsWith('.jpg')
        ? src.replace(/\.jpg$/, '.JPG')
        : src.replace(/\.JPG$/, '.jpg');
      const img2 = new Image();
      img2.onload = () => onSuccess(img2, alt);
      img2.onerror = () => onFail();
      img2.src = alt;
    };
    img.src = src;
  }

  /* ---------- Auto-load รูปห้องนอน (room11-19, room21-29, room31-39) ---------- */
  function loadRoomImages() {
    const configs = [
      { trackId: 'roomTrack1', prefix: 'room1', start: 1, end: 9 },
      { trackId: 'roomTrack2', prefix: 'room2', start: 1, end: 9 },
      { trackId: 'roomTrack3', prefix: 'room3', start: 1, end: 9 },
    ];

    configs.forEach(({ trackId, prefix, start, end }) => {
      const track = document.getElementById(trackId);
      if (!track) return;

      // เคลียร์ placeholder
      track.innerHTML = '';
      let loaded = 0;

      for (let i = start; i <= end; i++) {
        const filename = `${prefix}${i}.jpg`;
        const src = `./img/${filename}`;

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'flex-shrink:0;width:100%;height:100%;scroll-snap-align:start;';

        loadImg(src,
          (img, actualSrc) => {
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;scroll-snap-align:start;';
            img.alt = filename;
            img.dataset.src = actualSrc;
            img.dataset.caption = filename;
            track.appendChild(img);
            loaded++;
            updateDots(track, loaded);
          },
          () => { /* ไม่มีรูป — ข้ามไป */ }
        );
      }

      // ถ้าไม่มีรูปเลย แสดง placeholder
      setTimeout(() => {
        if (track.children.length === 0) {
          track.innerHTML = `<div class="room-ph"><span>ยังไม่มีรูปภาพ</span></div>`;
        } else {
          addRoomDots(track);
          enableDragScroll(track);
        }
      }, 1500);
    });
  }

  function addRoomDots(track) {
    const imgs = track.querySelectorAll('img');
    if (imgs.length <= 1) return;

    const dotsWrap = document.createElement('div');
    dotsWrap.className = 'room-dots';

    imgs.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'room-dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', () => {
        track.scrollTo({ left: track.offsetWidth * i, behavior: 'smooth' });
      });
      dotsWrap.appendChild(dot);
    });

    // แทรก dots หลัง track
    track.parentElement.after(dotsWrap);

    // อัปเดต active dot ตาม scroll
    track.addEventListener('scroll', () => {
      const index = Math.round(track.scrollLeft / track.offsetWidth);
      dotsWrap.querySelectorAll('.room-dot').forEach((d, i) => {
        d.classList.toggle('active', i === index);
      });
    });
  }

  function updateDots(track, count) { /* placeholder */ }

  loadRoomImages();

  /* ---------- Auto-load ภายในบ้านพัก (a01, a02, ...) ---------- */
  function loadVillaImages() {
    const track = document.getElementById('villaTrack');
    if (!track) return;

    // โหลดรูป a01 → a99 อัตโนมัติ หยุดเมื่อรูปไม่มี 3 ตัวติดกัน
    let index = 1;
    let failCount = 0;
    const MAX_FAIL = 3; // หยุดถ้าไม่เจอรูป 3 ตัวติดกัน

    function tryLoad(i) {
      const num  = String(i).padStart(2, '0');
      const src  = `./img/a${num}.jpg`;
      const item = document.createElement('div');
      item.className       = 'hscroll-item';
      item.dataset.src     = src;
      item.dataset.caption = `ภายในบ้านพัก · a${num}`;

      item.innerHTML = `<div class="hscroll-placeholder"><span>a${num}.jpg</span></div>`;
      track.appendChild(item);

      loadImg(src,
        (img, actualSrc) => {
          img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
          img.alt = `ภายในบ้านพัก a${num}`;
          item.dataset.src = actualSrc;
          item.innerHTML = '';
          item.appendChild(img);
          failCount = 0;
          tryLoad(i + 1);
        },
        () => {
          item.remove();
          failCount++;
          if (failCount < MAX_FAIL) {
            tryLoad(i + 1);
          } else {
            bindVillaLightbox();
          }
        }
      );
    }

    tryLoad(1);
  }

  function bindVillaLightbox() {
    const items = document.querySelectorAll('#villaTrack .hscroll-item');
    items.forEach((item, i) => {
      item.addEventListener('click', () => openLightbox([...items], i));
    });
  }

  loadVillaImages();

  /* ---------- Lightbox ---------- */
  const lightbox  = document.getElementById('lightbox');
  const lbImg     = document.getElementById('lbImg');
  const lbCaption = document.getElementById('lbCaption');
  const lbClose   = document.getElementById('lbClose');
  const lbPrev    = document.getElementById('lbPrev');
  const lbNext    = document.getElementById('lbNext');

  let currentItems = [];
  let currentIndex = 0;

  function openLightbox(items, index) {
    currentItems = items;
    currentIndex = index;
    showItem(currentIndex);
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    lbImg.src = '';
  }

  function showItem(index) {
    const item    = currentItems[index];
    const src     = item.dataset.src || '';
    const caption = item.dataset.caption || '';

    // reset animation ทุกครั้งที่เปลี่ยนรูป
    const wrap = document.querySelector('.lb-img-wrap');
    wrap.style.animation = 'none';
    wrap.offsetHeight; // reflow
    wrap.style.animation = '';

    lbImg.src     = src;
    lbImg.onerror = () => { lbImg.style.display = 'none'; };
    lbImg.onload  = () => { lbImg.style.display = 'block'; };
    lbCaption.textContent = caption;
    lbPrev.style.display = currentItems.length > 1 ? 'flex' : 'none';
    lbNext.style.display = currentItems.length > 1 ? 'flex' : 'none';
  }

  function prevItem() {
    currentIndex = (currentIndex - 1 + currentItems.length) % currentItems.length;
    showItem(currentIndex);
  }

  function nextItem() {
    currentIndex = (currentIndex + 1) % currentItems.length;
    showItem(currentIndex);
  }

  // Activities (b01-b09) — img อยู่ใน HTML แล้ว ผูก lightbox อย่างเดียว
  document.querySelectorAll('.act-card').forEach((card, i, all) => {
    card.addEventListener('click', () => openLightbox([...all], i));
  });

  // Gallery (02, 03, ...) — โหลดรูปจริง รองรับ .jpg และ .JPG
  document.querySelectorAll('#galleryTrack .hscroll-item').forEach((item, i, all) => {
    const src = item.dataset.src;
    const ph  = item.querySelector('.hscroll-placeholder');
    if (src && ph) {
      loadImg(src,
        (img, actualSrc) => {
          img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
          item.dataset.src = actualSrc;
          item.insertBefore(img, ph);
          ph.style.display = 'none';
        },
        () => { /* ไม่มีรูป — คง placeholder ไว้ */ }
      );
    }
    item.addEventListener('click', () => openLightbox([...all], i));
  });

  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click',  prevItem);
  lbNext.addEventListener('click',  nextItem);

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  prevItem();
    if (e.key === 'ArrowRight') nextItem();
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  /* ---------- Drag-to-scroll ---------- */
  function enableDragScroll(track) {
    if (!track) return;
    let isDown = false;
    let startX, scrollLeft;

    track.addEventListener('mousedown', (e) => {
      isDown = true;
      track.style.cursor = 'grabbing';
      startX     = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    });

    track.addEventListener('mouseleave', () => { isDown = false; track.style.cursor = 'grab'; });
    track.addEventListener('mouseup',    () => { isDown = false; track.style.cursor = 'grab'; });

    track.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x    = e.pageX - track.offsetLeft;
      const walk = (x - startX) * 1.5;
      track.scrollLeft = scrollLeft - walk;
    });
  }

  enableDragScroll(document.getElementById('villaTrack'));
  enableDragScroll(document.getElementById('galleryTrack'));

});
