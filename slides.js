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
