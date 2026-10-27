  function formatContactNumber(value) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    const prefix = digits.startsWith('02') ? 2 : 3;
    if (digits.length <= prefix) return digits;
    if (digits.length <= prefix + 4) return digits.slice(0, prefix) + '-' + digits.slice(prefix);
    return digits.slice(0, prefix) + '-' + digits.slice(prefix, -4) + '-' + digits.slice(-4);
  }
  function isValidContactNumber(value, mobileOnly = false) {
    if (!/^[0-9 -]+$/.test(value)) return false;
    const digits = value.replace(/\D/g, '');
    const mobile = /^(010\d{8}|01[16789]\d{7,8})$/.test(digits);
    return mobile || (!mobileOnly && /^(02\d{7,8}|0(?:3[1-3]|4[1-4]|5[1-5]|6[1-4])\d{7,8}|070\d{8})$/.test(digits));
  }

  const leadSessions = { consultation: {started:false, source:'general'}, nearby: {started:false, source:'general'} };
  let leadClickSource = 'general';
  function trackLead(eventName, formType) {
    if (typeof gtag !== 'function') return;
    const variant = location.pathname.includes('/staff/goyeji/') ? 'goyeji' : location.pathname.includes('/staff/hansumina/') ? 'hansumina' : 'news';
    gtag('event', eventName, {form_type:formType, cta_location:leadSessions[formType].source, page_variant:variant, send_to:'G-HCPV87VR4G'});
  }
  function beginLead(formType) {
    leadSessions[formType] = {started:false, source:leadClickSource};
    leadClickSource = 'general';
    trackLead('lead_form_open', formType);
  }
  function startLead(formType) {
    if (leadSessions[formType].started) return;
    leadSessions[formType].started = true;
    trackLead('lead_form_start', formType);
  }
  document.addEventListener('click', e => {
    const button = e.target.closest('[onclick]');
    if (!button) return;
    const action = button.getAttribute('onclick');
    const type = action.includes('openNearbyModal(') ? 'nearby' : action.includes('openModal(') ? 'consultation' : null;
    if (!type) return;
    const section = button.closest('section[id], .course-modal-overlay[id], #stickyBar');
    leadClickSource = section ? section.id : button.closest('.cta-banner') ? 'middle_cta' : 'navigation';
    leadSessions[type].source = leadClickSource;
    trackLead('lead_cta_click', type);
  }, true);
  document.getElementById('formState').addEventListener('input', () => startLead('consultation'));
  document.getElementById('nearby-form').addEventListener('input', () => startLead('nearby'));

  let nearbyReturnFocus = null;
  function openNearbyModal() {
    beginLead('nearby');
    nearbyReturnFocus = document.activeElement;
    document.getElementById('nearby-form').style.display = '';
    document.getElementById('nearby-success').hidden = true;
    document.getElementById('nearby-error').hidden = true;
    document.getElementById('nearbyOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    document.querySelector('#nearbyOverlay .modal-sheet').scrollTop = 0;
    document.querySelector('#nearbyOverlay .modal-close').focus({preventScroll:true});
  }
  function closeNearbyModal() {
    const overlay = document.getElementById('nearbyOverlay');
    if (!overlay.classList.contains('open')) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (nearbyReturnFocus) nearbyReturnFocus.focus();
  }
  document.getElementById('nearbyOverlay').addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.stopPropagation(); closeNearbyModal(); }
    if (e.key !== 'Tab') return;
    const items = [...e.currentTarget.querySelectorAll('button,a[href],input,summary')].filter(el => !el.disabled && el.getClientRects().length);
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  async function submitNearbyForm(event) {
    event.preventDefault();
    const btn = document.getElementById('nearby-submit');
    if (btn.disabled) return;
    const name = document.getElementById('nearby-name').value.trim();
    const phone = document.getElementById('nearby-phone').value.trim();
    const region = document.getElementById('nearby-region').value.trim();
    const error = document.getElementById('nearby-error');
    error.hidden = true;
    function fail(message, id) { error.textContent = message; error.hidden = false; if (id) document.getElementById(id).focus(); }
    if (!name) return fail('성함을 입력해 주세요.', 'nearby-name');
    if (!isValidContactNumber(phone)) return fail('연락처를 올바르게 입력해 주세요.', 'nearby-phone');
    if (!region) return fail('희망지역을 입력해 주세요.', 'nearby-region');
    if (!document.getElementById('nearby-agree').checked) return fail('개인정보 수집 및 이용에 동의해 주세요.', 'nearby-agree');
    btn.disabled = true; btn.textContent = '전송 중...';
    const inquiry = {성함:name, 연락처:phone, 수강목적:'가까운 지점 문의', 희망지역:region, 문의사항:'가까운 지점 안내 요청'};
    try {
      const response = await fetch('https://api.web3forms.com/submit', {method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'}, body:JSON.stringify({access_key:'b45d09cf-f309-4553-a511-33909841478b',subject:'[Evaw Pet] 가까운 지점 문의가 도착했습니다',...inquiry})});
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error('submit failed');
      fetch('https://script.google.com/macros/s/AKfycbzzBkQ19GqbtwzB2eI-9_0KEgpimsYdVWttHz_HGz-Ck4wS_X3xXLy_5mO9d8c_MKULZg/exec', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(inquiry),mode:'no-cors'}).catch(() => {});
      document.getElementById('nearby-form').reset();
      document.getElementById('nearby-form').style.display = 'none';
      document.getElementById('nearby-success').hidden = false;
      document.querySelector('#nearby-success button').focus();
      naverCnv('1'); ga4('form_submit','가까운지점_문의'); trackLead('lead_submit_success', 'nearby');
    } catch (err) { fail('전송하지 못했습니다. 잠시 후 다시 시도해 주세요.'); }
    finally { btn.disabled = false; btn.textContent = '가까운 지점 문의하기'; }
  }

  function syncConsultViewport() {
    const viewport = window.visualViewport;
    document.documentElement.style.setProperty('--consult-viewport-height', `${viewport ? viewport.height : window.innerHeight}px`);
    document.documentElement.style.setProperty('--consult-viewport-top', `${viewport ? viewport.offsetTop : 0}px`);
    document.documentElement.style.setProperty('--sticky-bar-space', `${document.getElementById('stickyBar').offsetHeight + 16}px`);
  }
  syncConsultViewport();
  window.addEventListener('resize', syncConsultViewport, { passive:true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncConsultViewport, { passive:true });
    window.visualViewport.addEventListener('scroll', syncConsultViewport, { passive:true });
  }
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(syncConsultViewport).observe(document.getElementById('stickyBar'));
  }