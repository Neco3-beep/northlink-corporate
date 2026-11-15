/**
 * 株式会社ノースリンク コーポレートサイト  main.js
 *
 * 1. ハンバーガーメニュー（スマホ・タブレット）
 * 2. スクロール時にヘッダーへ影をつける
 * 3. ページ内リンクのスムーズスクロール
 * 4. FAQアコーディオン
 * 5. お問い合わせフォームの入力チェック
 */
(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopQuery = window.matchMedia('(min-width: 1280px)');

  /* -------------------------------------------------------
     1. ハンバーガーメニュー
     ------------------------------------------------------- */
  function initMenu() {
    const header = document.querySelector('.header');
    const toggle = document.querySelector('.header__toggle');
    const nav = document.getElementById('global-nav');
    if (!header || !toggle || !nav) return;

    const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

    const open = () => {
      header.classList.add('header--open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden'; // 背景のスクロールを止める
    };

    const close = (returnFocus) => {
      header.classList.remove('header--open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (returnFocus) toggle.focus();
    };

    toggle.addEventListener('click', () => (isOpen() ? close(false) : open()));

    // Escキーで閉じる
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen()) close(true);
    });

    // メニュー内のリンクを押したら閉じる
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) close(false);
    });

    // メニューを開いている間は、Tabキーのフォーカスをメニュー内に閉じ込める
    header.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab' || !isOpen()) return;
      const items = [toggle, ...nav.querySelectorAll('a[href]')];
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    // PC幅に広げたらメニューの状態をリセット
    desktopQuery.addEventListener('change', (event) => {
      if (event.matches && isOpen()) close(false);
    });
  }

  /* -------------------------------------------------------
     2. スクロール時のヘッダー
     （position: sticky で上部に固定し、少しでもスクロールしたら影をつける）
     ------------------------------------------------------- */
  function initHeaderShadow() {
    const header = document.querySelector('.header');
    if (!header) return;

    let ticking = false;
    const update = () => {
      header.classList.toggle('header--scrolled', window.scrollY > 10);
      ticking = false;
    };

    // スクロールのたびに処理しすぎないよう、描画のタイミングにまとめる
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  }

  /* -------------------------------------------------------
     3. ページ内リンクのスムーズスクロール
     （ヘッダーの高さ分のずれは CSS の scroll-margin-top で調整）
     ------------------------------------------------------- */
  function initSmoothScroll() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;

      const id = decodeURIComponent(link.getAttribute('href').slice(1));
      const target = id && document.getElementById(id);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
        block: 'start',
      });

      // キーボード・読み上げソフト利用者のために、移動先へフォーカスも移す
      if (!target.matches('a[href], button, input, select, textarea, [tabindex]')) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus({ preventScroll: true });
      history.pushState(null, '', `#${id}`);
    });
  }

  /* -------------------------------------------------------
     4. FAQアコーディオン
     ------------------------------------------------------- */
  function initAccordion() {
    document.querySelectorAll('.faq').forEach((faq) => {
      // このクラスが付いたときだけCSSで回答を閉じる（JS無効時は全て表示）
      faq.classList.add('faq--js');

      faq.querySelectorAll('.faq__button').forEach((button) => {
        const item = button.closest('.faq__item');
        button.setAttribute('aria-expanded', 'false');

        button.addEventListener('click', () => {
          const willOpen = button.getAttribute('aria-expanded') !== 'true';
          button.setAttribute('aria-expanded', String(willOpen));
          item.classList.toggle('faq__item--open', willOpen);
        });
      });
    });
  }

  /* -------------------------------------------------------
     5. お問い合わせフォームの入力チェック
     ------------------------------------------------------- */
  function initForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const summary = document.getElementById('form-summary');
    const complete = document.getElementById('form-complete');
    const MAX_LENGTH = 1000;

    // 項目ごとのチェック内容。問題なければ空文字、あればエラー文を返す
    const rules = {
      name: (field) => (field.value.trim() ? '' : 'お名前を入力してください。'),
      email: (field) => {
        const value = field.value.trim();
        if (!value) return 'メールアドレスを入力してください。';
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? ''
          : 'メールアドレスの形式が正しくありません（例：info@example.com）。';
      },
      tel: (field) => {
        const value = field.value.trim();
        if (!value) return ''; // 任意項目
        return /^[0-9-]{10,13}$/.test(value)
          ? ''
          : '電話番号は半角数字とハイフンで入力してください（例：03-0000-0000）。';
      },
      category: (field) => (field.value ? '' : 'お問い合わせ種別を選択してください。'),
      message: (field) => {
        const length = field.value.trim().length;
        if (!length) return 'お問い合わせ内容を入力してください。';
        return length > MAX_LENGTH
          ? `お問い合わせ内容は${MAX_LENGTH}文字以内で入力してください（現在${length}文字）。`
          : '';
      },
      privacy: (field) => (field.checked ? '' : '個人情報の取り扱いへの同意が必要です。'),
    };

    const showError = (field, message) => {
      const error = document.getElementById(`${field.id}-error`);
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (field.classList.contains('form__control')) {
        field.classList.toggle('form__control--error', Boolean(message));
      }
      if (error) error.textContent = message;
    };

    const validate = (field) => {
      const message = rules[field.name](field);
      showError(field, message);
      return !message;
    };

    Object.keys(rules).forEach((name) => {
      const field = form.elements[name];
      if (!field) return;

      // 入力欄から離れたときにチェック（空のまま通過しただけでは出さない）
      field.addEventListener('blur', () => {
        if (field.type === 'checkbox') return;
        if (field.value || field.getAttribute('aria-invalid') === 'true') validate(field);
      });

      // エラー表示中は、直した瞬間にエラーを消す
      field.addEventListener('input', () => {
        if (field.getAttribute('aria-invalid') === 'true') validate(field);
      });
      field.addEventListener('change', () => {
        if (field.getAttribute('aria-invalid') === 'true') validate(field);
      });
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const invalidFields = Object.keys(rules)
        .map((name) => form.elements[name])
        .filter((field) => field && !validate(field));

      if (invalidFields.length > 0) {
        summary.textContent = `入力内容に${invalidFields.length}件の不備があります。赤字のメッセージをご確認ください。`;
        summary.hidden = false;
        invalidFields[0].focus();
        return;
      }

      summary.hidden = true;

      // ※ デモ用：実際にはここでサーバーへ送信する処理を実装します
      form.hidden = true;
      complete.hidden = false;
      complete.focus();
      complete.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    });
  }

  initMenu();
  initHeaderShadow();
  initSmoothScroll();
  initAccordion();
  initForm();
})();
