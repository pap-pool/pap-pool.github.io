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

      track.innerHTML = '';
      let loaded  = 0;
      let settled = 0;
      const total = end - start + 1;

      function onAllSettled() {
        if (track.children.length === 0) {
          track.innerHTML = `<div class="room-ph"><span>ยังไม่มีรูปภาพ</span></div>`;
        } else {
          addRoomDots(track);
          enableDragScroll(track);
          bindRoomLightbox(track);
        }
      }

      for (let i = start; i <= end; i++) {
        const filename = `${prefix}${i}.jpg`;
        const src = `./img/${filename}`;

        loadImg(src,
          (img, actualSrc) => {
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;scroll-snap-align:start;flex-shrink:0;';
            img.alt = filename;
            img.dataset.src = actualSrc;
            img.dataset.caption = filename;
            track.appendChild(img);
            loaded++;
            updateDots(track, loaded);
            settled++;
            if (settled === total) onAllSettled();
          },
          () => {
            settled++;
            if (settled === total) onAllSettled();
          }
        );
      }
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

  function bindRoomLightbox(track) {
    const imgs = track.querySelectorAll('img');
    imgs.forEach((img, i) => {
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => {
        // สร้าง items array จาก img elements ในห้องนี้
        const items = [...imgs].map(im => ({
          dataset: { src: im.dataset.src || im.src, caption: im.dataset.caption || im.alt }
        }));
        openLightbox(items, i);
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
      if (item.dataset.lbBound) return;
      item.dataset.lbBound = '1';
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
  const lbWrap = lightbox.querySelector('.lb-img-wrap');

  function openLightbox(items, index) {
    currentItems = items;
    currentIndex = index;
    showItem(currentIndex);
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    // push history เพื่อให้ปุ่มย้อนกลับมือถือปิด lightbox แทนออกจากเว็บ
    history.pushState({ modal: 'lightbox' }, '');
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

    lbWrap.style.animation = 'none';
    lbWrap.offsetHeight;
    lbWrap.style.animation = '';

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

  // ปุ่มย้อนกลับมือถือ → ปิด lightbox แทนออกจากเว็บ
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.modal === 'lightbox') {
      closeLightbox();
    }
  });

  /* ---------- Touch Swipe (mobile) ----------
     ปัดซ้าย → รูปถัดไป | ปัดขวา → รูปก่อนหน้า | ปัดลง → ปิด
  ------------------------------------------ */
  (function initSwipe() {
    const SWIPE_THRESHOLD = 50;
    const SWIPE_MAX_Y     = 80;
    const CLOSE_THRESHOLD = 100;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchDeltaX = 0;
    let isDragging  = false;

    const wrap = lbWrap;

    function resetTransform() {
      wrap.style.transition = 'transform 0.25s ease';
      wrap.style.transform  = 'translateX(0) rotate(0deg)';
      setTimeout(() => { wrap.style.transition = ''; }, 260);
    }

    lightbox.addEventListener('touchstart', (e) => {
      if (!lightbox.classList.contains('active')) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchDeltaX = 0;
      isDragging  = true;
    }, { passive: true });

    lightbox.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      touchDeltaX       = e.touches[0].clientX - touchStartX;
      const touchDeltaY = e.touches[0].clientY - touchStartY;
      if (Math.abs(touchDeltaY) > SWIPE_MAX_Y && Math.abs(touchDeltaX) < SWIPE_THRESHOLD) {
        isDragging = false;
        resetTransform();
        return;
      }
      const shift     = Math.max(-80, Math.min(80, touchDeltaX * 0.4));
      const rotateDeg = touchDeltaX * 0.02;
      wrap.style.transition = 'none';
      wrap.style.transform  = `translateX(${shift}px) rotate(${rotateDeg}deg)`;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      isDragging = false;
      const touchDeltaY = e.changedTouches[0].clientY - touchStartY;
      if (touchDeltaY > CLOSE_THRESHOLD && Math.abs(touchDeltaX) < SWIPE_THRESHOLD) {
        resetTransform(); closeLightbox(); return;
      }
      if (touchDeltaX < -SWIPE_THRESHOLD) { resetTransform(); nextItem(); return; }
      if (touchDeltaX >  SWIPE_THRESHOLD) { resetTransform(); prevItem(); return; }
      resetTransform();
    }, { passive: true });
  })();

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
