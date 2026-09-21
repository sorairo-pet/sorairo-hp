// ご安置スライドショー（トップページのヒーロー内）
// 2026/9/21: ページを開いた時点では動かさず、スライドが画面に入った時に動き出す。
// 　（以前は開いた瞬間に始まっていたので、スマホでスクロールして来た頃には終わっていた）
// 　真ん中の再生ボタンからも始められる。お客様が自分で止めた場合は、
// 　画面に入り直しても勝手には再開しない。
(function () {
  var box = document.getElementById('careSlides');
  if (!box) { return; }

  var slides = [].slice.call(box.querySelectorAll('.slide'));
  var bar    = box.querySelector('.slide-progress');
  var nowEl  = box.querySelector('.sc-now');
  var btn    = box.querySelector('.slide-play');
  var btnTxt = box.querySelector('.sp-txt');
  if (!slides.length || !bar || !btn) { return; }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var idx = 0, playing = false, t0 = 0, raf = null, ended = false, userPaused = false;

  function dur(i) { return (parseFloat(slides[i].getAttribute('data-sec')) || 10) * 1000; }

  function paint() {
    slides.forEach(function (s, i) { s.classList.toggle('is-active', i === idx); });
    if (nowEl) { nowEl.textContent = String(idx + 1); }
  }

  function go(i) {
    idx = (i + slides.length) % slides.length;
    ended = false;
    t0 = performance.now();
    bar.style.width = '0%';
    paint();
  }

  function tick(now) {
    if (!playing) { return; }
    var p = (now - t0) / dur(idx);
    if (p >= 1) {
      // 最後の「まとめ」まで来たら、そこで止めて表示したままにする
      if (idx >= slides.length - 1) { bar.style.width = '100%'; ended = true; pause(); return; }
      go(idx + 1);
    } else {
      bar.style.width = (p * 100).toFixed(2) + '%';
    }
    raf = requestAnimationFrame(tick);
  }

  function play() {
    if (playing) { return; }
    // 最後まで見終わったあとに押したら、はじめから
    if (ended || idx >= slides.length - 1) { go(0); }
    playing = true;
    box.classList.add('is-playing');
    t0 = performance.now() - (parseFloat(bar.style.width) || 0) / 100 * dur(idx);
    raf = requestAnimationFrame(tick);
  }

  function pause() {
    if (!playing) { return; }
    playing = false;
    cancelAnimationFrame(raf);
    box.classList.remove('is-playing');
    if (btnTxt) { btnTxt.textContent = ended ? 'もう一度見る' : 'つづきを見る'; }
  }

  btn.addEventListener('click', function () { userPaused = false; play(); });

  // 再生中にスライドをタップしたら止まる（もう一度ボタンが出る）
  // ここで止めた時は、画面に入り直しても勝手に再開しない
  box.addEventListener('click', function (e) {
    if (playing && !btn.contains(e.target)) { userPaused = true; pause(); }
  });

  document.addEventListener('visibilitychange', function () { if (document.hidden) { pause(); } });

  // 画面に入ったら動き出す／出ていったら止める
  if (!reduce && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && en.intersectionRatio >= 0.4) {
          if (!playing && !userPaused && !ended) { play(); }
        } else if (en.intersectionRatio < 0.1) {
          if (playing) { pause(); }
        }
      });
    }, { threshold: [0, 0.1, 0.4] }).observe(box);
  }

  paint();
  bar.style.width = '0%';
})();

// スマホで長い節をたたむ（2026/9/21）
// class="sp-fold" の節は、スマホ（720px以下）では見出しと「開く」ボタンだけを出す。
// 　たたむのはCSS（style.css末尾）で、このJSが動いた時だけ（.is-foldable）＝JSが止まっても中身は読める。
// 　ページ内メニューからその節へ飛んだ時は、自動で開く。
(function () {
  var secs = [].slice.call(document.querySelectorAll('section.sp-fold'));
  secs.forEach(function (sec) {
    var head = sec.querySelector('.sec-head');
    if (!head) { return; }
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fold-btn';
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = '開いて見る';
    head.parentNode.insertBefore(btn, head.nextSibling);
    btn.addEventListener('click', function () { setOpen(sec, !sec.classList.contains('is-open')); });
    sec.classList.add('is-foldable');
  });
  function setOpen(sec, open) {
    sec.classList.toggle('is-open', open);
    var btn = sec.querySelector('.fold-btn');
    if (btn) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? '閉じる' : '開いて見る';
    }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) { return; }
    var sec = document.getElementById(a.getAttribute('href').slice(1));
    if (sec && sec.classList.contains('is-foldable')) { setOpen(sec, true); }
  });
})();
