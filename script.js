// =============================================
//  CONFIG — Google Apps Script URL
// =============================================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz-JPMOOd40LJ4cHDl2FF7b2i8s0oM5K-mWEnXQz_KAh2C5dVqXrYuhJzoMi0HGyCya/exec';

// =============================================
//  DOM READY — listeners tab lagao jab page load ho
// =============================================
window.addEventListener('DOMContentLoaded', function () {
  // Inject SVG gradient for spinner
  const svgNS = 'http://www.w3.org/2000/svg';
  const defs = document.createElementNS(svgNS, 'defs');
  defs.innerHTML = `
    <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6a3cff"/>
      <stop offset="100%" stop-color="#ff507a"/>
    </linearGradient>
  `;
  document.querySelector('.loader-ring svg').prepend(defs);

  document.getElementById('f_cv').addEventListener('change', function () {
    document.getElementById('cv_name').textContent =
      this.files[0] ? this.files[0].name : 'No file chosen';
  });

  document.getElementById('f_letter').addEventListener('change', function () {
    document.getElementById('letter_name').textContent =
      this.files[0] ? this.files[0].name : 'No file chosen';
  });
});

// =============================================
//  LOADING OVERLAY HELPERS
// =============================================
function showLoading(msg) {
  const overlay = document.getElementById('loadingOverlay');
  document.getElementById('loadingSubText').textContent = msg || 'Uploading your details…';
  overlay.classList.add('active');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('active');
}

function updateLoadingMsg(msg) {
  const el = document.getElementById('loadingSubText');
  el.style.opacity = '0';
  setTimeout(() => {
    el.textContent = msg;
    el.style.opacity = '1';
  }, 200);
}

// =============================================
//  FORM RESET
// =============================================
function resetForm() {
  document.querySelectorAll('.field-input').forEach(el => el.value = '');
  document.querySelectorAll('input[type="radio"]').forEach(el => el.checked = false);
  document.getElementById('f_cv').value = '';
  document.getElementById('f_letter').value = '';
  document.getElementById('cv_name').textContent = 'No file chosen';
  document.getElementById('letter_name').textContent = 'No file chosen';
}

// =============================================
//  THANK YOU PAGE
// =============================================
function showThankYou(firstName, position, duration, joiningDate) {
  // Set name
  document.getElementById('ty_name').textContent = firstName || 'Candidate';

  // Build detail chips
  const details = document.getElementById('ty_details');
  details.innerHTML = '';
  const chips = [];
  if (position)    chips.push({ label: position });
  if (duration)    chips.push({ label: duration });
  if (joiningDate) chips.push({ label: 'Joining: ' + formatDate(joiningDate) });

  chips.forEach(c => {
    const chip = document.createElement('div');
    chip.className = 'ty-chip';
    chip.innerHTML = `<div class="ty-chip-dot"></div>${c.label}`;
    details.appendChild(chip);
  });

  // Show the page
  const page = document.getElementById('thankyouPage');
  page.classList.add('visible');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// =============================================
//  FILE → BASE64 HELPER
// =============================================
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

// =============================================
//  MAIN SUBMIT
// =============================================
async function handleSubmit() {
  const firstName  = document.getElementById('f_first_name').value.trim();
  const middleName = document.getElementById('f_middle_name').value.trim();
  const lastName   = document.getElementById('f_last_name').value.trim();
  const name       = [firstName, middleName, lastName].filter(Boolean).join(' ');
  const email    = document.getElementById('f_email').value.trim();
  const phone    = document.getElementById('f_phone').value.trim();
  const position = document.getElementById('f_position').value.trim();
  const duration = document.querySelector('input[name="duration"]:checked');
  const joining  = document.getElementById('f_joining').value;
  const statusEl = document.getElementById('statusMsg');
  const btn      = document.getElementById('submitBtn');

  statusEl.className = 'status-msg';
  statusEl.style.display = 'none';

  // Validation
  if (!firstName || !lastName || !email || !phone || !duration || !joining) {
    statusEl.className = 'status-msg error';
    statusEl.textContent = 'Please fill all required fields before submitting.';
    return;
  }
  if (!/^\d{10}$/.test(phone)) {
    statusEl.className = 'status-msg error';
    statusEl.textContent = 'Phone number must be exactly 10 digits.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Submitting...';
  showLoading('Preparing your application…');

  try {
    const formData = new FormData();
    formData.append('first_name',  firstName);
    formData.append('middle_name', middleName);
    formData.append('last_name',   lastName);
    formData.append('email',       email);
    formData.append('phone',       phone);
    formData.append('duration',    duration.value);
    formData.append('joining_date', joining);

    const cvFile     = document.getElementById('f_cv').files[0];
    const letterFile = document.getElementById('f_letter').files[0];

    if (cvFile) {
      if (cvFile.size > 10 * 1024 * 1024) throw new Error('CV file 10MB se badi hai.');
      updateLoadingMsg('Uploading CV…');
      formData.append('cv_base64',   await fileToBase64(cvFile));
      formData.append('cv_filename', cvFile.name);
      formData.append('cv_mimetype', cvFile.type);
    }

    if (letterFile) {
      if (letterFile.size > 10 * 1024 * 1024) throw new Error('Permission letter 10MB se badi hai.');
      updateLoadingMsg('Uploading permission letter…');
      formData.append('letter_base64',   await fileToBase64(letterFile));
      formData.append('letter_filename', letterFile.name);
      formData.append('letter_mimetype', letterFile.type);
    }

    updateLoadingMsg('Sending to Asterisc servers…');

    await fetch(SCRIPT_URL, {
      method: 'POST',
      body: formData,
      mode: 'no-cors'
    });

    updateLoadingMsg('Almost done…');
    await new Promise(r => setTimeout(r, 600));

    hideLoading();
    showThankYou(firstName, position, duration.value, joining);
    resetForm();

  } catch (e) {
    hideLoading();
    statusEl.className = 'status-msg error';
    statusEl.textContent = '❌ Submission failed: ' + e.message;
  }

  btn.disabled = false;
  btn.textContent = 'Submit Application';
}