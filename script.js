// =============================================
//  CONFIG — Google Apps Script URL
// =============================================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz-JPMOOd40LJ4cHDl2FF7b2i8s0oM5K-mWEnXQz_KAh2C5dVqXrYuhJzoMi0HGyCya/exec';

// =============================================
//  DOM READY — listeners tab lagao jab page load ho
// =============================================
window.addEventListener('DOMContentLoaded', function () {
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

  try {
    // ✅ CORS FIX: FormData use karo — JSON + Content-Type header
    // se CORS block hota hai, FormData se nahi
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
      formData.append('cv_base64',   await fileToBase64(cvFile));
      formData.append('cv_filename', cvFile.name);
      formData.append('cv_mimetype', cvFile.type);
    }

    if (letterFile) {
      if (letterFile.size > 10 * 1024 * 1024) throw new Error('Permission letter 10MB se badi hai.');
      formData.append('letter_base64',   await fileToBase64(letterFile));
      formData.append('letter_filename', letterFile.name);
      formData.append('letter_mimetype', letterFile.type);
    }

    // ✅ no-cors mode — Apps Script redirect ko handle karta hai
    await fetch(SCRIPT_URL, {
      method: 'POST',
      body: formData,
      mode: 'no-cors'   // ← CORS error band, response opaque aayega
    });

    // no-cors mein response body nahi milta — fetch throw nahi
    // kiya matlab data chala gaya
    statusEl.className = 'status-msg success';
    statusEl.textContent = '✅ Application submitted! You will receive a confirmation soon.';
    resetForm();

  } catch (e) {
    statusEl.className = 'status-msg error';
    statusEl.textContent = '❌ Submission failed: ' + e.message;
  }

  btn.disabled = false;
  btn.textContent = 'Submit Application';
}