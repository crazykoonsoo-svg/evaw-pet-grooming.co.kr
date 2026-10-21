/* 지점 페이지 전용: 📍 가까운 지점 문의 폼 (지역별 안내글의 가까운 지점 문의와 같은 접수 경로 사용) */
(function () {
  function formatContactNumber(value) {
    var digits = value.replace(/\D/g, '').slice(0, 11);
    var prefix = digits.indexOf('02') === 0 ? 2 : 3;
    if (digits.length <= prefix) return digits;
    if (digits.length <= prefix + 4) return digits.slice(0, prefix) + '-' + digits.slice(prefix);
    return digits.slice(0, prefix) + '-' + digits.slice(prefix, -4) + '-' + digits.slice(-4);
  }
  function isValidContactNumber(value) {
    if (!/^[0-9 -]+$/.test(value)) return false;
    var digits = value.replace(/\D/g, '');
    return /^(010\d{8}|01[16789]\d{7,8})$/.test(digits) ||
      /^(02\d{7,8}|0(?:3[1-3]|4[1-4]|5[1-5]|6[1-4])\d{7,8}|070\d{8})$/.test(digits);
  }
  var branch = (location.pathname.match(/\/branches\/([^\/]+)/) || [])[1] || 'branch';
  function track(eventName) {
    if (typeof gtag === 'function') gtag('event', eventName, { form_type: 'nearby', cta_location: 'hero', page_variant: 'branch_' + branch, send_to: 'G-HCPV87VR4G' });
  }

  var overlay = document.getElementById('nearbyOverlay');
  var form = document.getElementById('nearby-form');
  if (!overlay || !form) return;
  var started = false, returnFocus = null;

  window.formatNearbyContact = formatContactNumber;
  window.openNearbyModal = function () {
    started = false;
    returnFocus = document.activeElement;
    form.style.display = '';
    document.getElementById('nearby-success').hidden = true;
    document.getElementById('nearby-error').hidden = true;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    overlay.querySelector('.modal-sheet').scrollTop = 0;
    overlay.querySelector('.modal-close').focus({ preventScroll: true });
    track('lead_form_open');
  };
  window.closeNearbyModal = function () {
    if (!overlay.classList.contains('open')) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (returnFocus) returnFocus.focus();
  };
  form.addEventListener('input', function () { if (!started) { started = true; track('lead_form_start'); } });
  overlay.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.stopPropagation(); window.closeNearbyModal(); return; }
    if (e.key !== 'Tab') return;
    var items = Array.prototype.filter.call(overlay.querySelectorAll('button,a[href],input,summary'), function (el) { return !el.disabled && el.getClientRects().length; });
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  window.submitNearbyForm = async function (event) {
    event.preventDefault();
    var btn = document.getElementById('nearby-submit');
    if (btn.disabled) return;
    var name = document.getElementById('nearby-name').value.trim();
    var phone = document.getElementById('nearby-phone').value.trim();
    var region = document.getElementById('nearby-region').value.trim();
    var error = document.getElementById('nearby-error');
    error.hidden = true;
    function fail(message, id) { error.textContent = message; error.hidden = false; if (id) document.getElementById(id).focus(); }
    if (!name) return fail('성함을 입력해 주세요.', 'nearby-name');
    if (!isValidContactNumber(phone)) return fail('연락처를 올바르게 입력해 주세요.', 'nearby-phone');
    if (!region) return fail('희망지역을 입력해 주세요.', 'nearby-region');
    if (!document.getElementById('nearby-agree').checked) return fail('개인정보 수집 및 이용에 동의해 주세요.', 'nearby-agree');
    btn.disabled = true; btn.textContent = '전송 중...';
    var inquiry = { 성함: name, 연락처: phone, 수강목적: '가까운 지점 문의', 희망지역: region, 문의사항: '가까운 지점 안내 요청 (지점 페이지: ' + branch + ')' };
    try {
      var response = await fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(Object.assign({ access_key: 'b45d09cf-f309-4553-a511-33909841478b', subject: '[Evaw Pet] 가까운 지점 문의가 도착했습니다' }, inquiry)) });
      var result = await response.json();
      if (!response.ok || !result.success) throw new Error('submit failed');
      fetch('https://script.google.com/macros/s/AKfycbzzBkQ19GqbtwzB2eI-9_0KEgpimsYdVWttHz_HGz-Ck4wS_X3xXLy_5mO9d8c_MKULZg/exec', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(inquiry), mode: 'no-cors' }).catch(function () {});
      form.reset();
      form.style.display = 'none';
      document.getElementById('nearby-success').hidden = false;
      document.querySelector('#nearby-success button').focus();
      if (typeof naverCnv === 'function') naverCnv('1');
      if (typeof ga4 === 'function') ga4('form_submit', '가까운지점_문의_branch_' + branch);
      track('lead_submit_success');
    } catch (err) { fail('전송하지 못했습니다. 잠시 후 다시 시도해 주세요.'); }
    finally { btn.disabled = false; btn.textContent = '가까운 지점 문의하기'; }
  };
})();
