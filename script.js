
const els = {
    nameInput: document.getElementById('nameInput'),
    btnWrite: document.getElementById('btnWrite'),
    nameDisplay: document.getElementById('nameDisplay'),
    heartContainer: document.getElementById('heartContainer'),
    heartImage: document.getElementById('heartImage'),
    colorPicker: document.getElementById('colorPicker'),
    fontSelect: document.getElementById('fontSelect'),
    toggleSound: document.getElementById('toggleSound'),
    heartbeat: document.getElementById('heartbeat'),
    music: document.getElementById('music'),
    whisper: document.getElementById('whisper'),
    playMusic: document.getElementById('playMusic'),
    playWhisper: document.getElementById('playWhisper'),
    recordVideo: document.getElementById('recordVideo'),
    shareOptions: document.getElementById('shareOptions'),
    canvas: document.getElementById('bgCanvas'),
    recordingCanvas: document.getElementById('recordingCanvas'),
    imageUpload: document.getElementById('imageUpload'),
    musicUpload: document.getElementById('musicUpload'),
    progressModal: document.getElementById('progressModal'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText')
};

let neon = '#ff1493', soundOn = true, recording = false, mediaRecorder = null, recordedChunks = [], petalsInterval;
const messages = ["Eres mi todo", "Te amo", "Mi corazón es tuyo", "Contigo soy feliz", "Eres mi mundo"];
let typingTimeout;
let isWriting = false;
let customMusic = null;
let recordingAnimationId = null;
let isWhispering = false;

// Mensajes románticos para susurro
const whisperMessages = [
    "Te amo más que a nada en este mundo",
    "Eres el sueño que no quiero despertar",
    "Cada latido es por ti",
    "Eres mi razón para sonreír",
    "Contigo todo es perfecto",
    "Eres mi sol en días nublados",
    "Te extraño cada segundo",
    "Eres mi hogar",
    "Gracias por existir",
    "Eres mi persona favorita"
];

// === ESTRELLAS ===
const ctx = els.canvas.getContext('2d');
let stars = [];
function initStars() {
    els.canvas.width = innerWidth; els.canvas.height = innerHeight;
    stars = Array.from({length: 150}, () => ({
    x: Math.random() * innerWidth, y: Math.random() * innerHeight,
    size: Math.random() * 2, speed: Math.random() * 0.5 + 0.1, opacity: Math.random() * 0.8 + 0.2
    }));
}
function drawStars() {
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(0, 0, els.canvas.width, els.canvas.height);
    stars.forEach(s => {
    s.y += s.speed; if (s.y > innerHeight) s.y = 0;
    ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
    });
    requestAnimationFrame(drawStars);
}
window.addEventListener('resize', initStars); initStars(); drawStars();

// === MANEJO DE ARCHIVOS ===
els.imageUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = function(event) {
        els.heartImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
    }
});

els.musicUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('audio/')) {
    const reader = new FileReader();
    reader.onload = function(event) {
        customMusic = new Audio(event.target.result);
        customMusic.loop = true;
    };
    reader.readAsDataURL(file);
    }
});

// === COLOR NEÓN (para texto y ondas) ===
els.colorPicker.addEventListener('input', e => {
    neon = e.target.value;
    document.documentElement.style.setProperty('--neon', neon);
    els.heartImage.style.filter = `drop-shadow(0 0 20px ${neon})`;
});

// === FUENTE ===
els.fontSelect.addEventListener('change', e => els.nameDisplay.style.fontFamily = e.target.value);

// === SONIDO ===
els.toggleSound.addEventListener('click', () => {
    soundOn = !soundOn;
    els.toggleSound.innerHTML = soundOn ? 'Sonido' : 'Mudo';
    if (!soundOn) {
    [els.heartbeat, els.music, els.whisper].forEach(a => a.pause());
    if (customMusic) customMusic.pause();
    // Detener susurro si está activo
    if (isWhispering) {
        window.speechSynthesis.cancel();
        isWhispering = false;
        els.playWhisper.classList.remove('whispering');
    }
    }
});

els.playMusic.addEventListener('click', () => {
    if (soundOn) {
    if (customMusic) {
        customMusic.play();
    } else {
        els.music.play();
    }
    }
});

// === SUSURRO MEJORADO ===
els.playWhisper.addEventListener('click', () => {
    if (!soundOn) return;
    
    if (isWhispering) {
    // Detener susurro
    window.speechSynthesis.cancel();
    isWhispering = false;
    els.playWhisper.classList.remove('whispering');
    return;
    }

    // Elegir mensaje aleatorio o susurrar el nombre
    const name = els.nameDisplay.textContent.trim();
    let messageToWhisper;
    
    if (name && Math.random() > 0.5) {
    // 50% de probabilidad de susurrar el nombre
    messageToWhisper = `${name}... te amo`;
    } else {
    // Mensaje romántico aleatorio
    messageToWhisper = whisperMessages[Math.floor(Math.random() * whisperMessages.length)];
    }

    // Crear burbuja de susurro
    showWhisperBubble(messageToWhisper);

    // Configurar síntesis de voz
    const utterance = new SpeechSynthesisUtterance(messageToWhisper);
    utterance.rate = 0.6; // Velocidad lenta para efecto de susurro
    utterance.pitch = 1.3; // Tono más alto
    utterance.volume = 0.4; // Volumen bajo
    utterance.lang = 'es-ES'; // Idioma español

    // Seleccionar voz femenina si está disponible
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => 
    voice.lang.includes('es') && 
    (voice.name.includes('female') || voice.name.includes('mujer') || voice.name.includes('Monica'))
    );
    if (femaleVoice) {
    utterance.voice = femaleVoice;
    }

    // Eventos del susurro
    utterance.onstart = () => {
    isWhispering = true;
    els.playWhisper.classList.add('whispering');
    // Crear efecto visual adicional
    createWhisperEffect();
    };

    utterance.onend = () => {
    isWhispering = false;
    els.playWhisper.classList.remove('whispering');
    hideWhisperBubble();
    };

    // Iniciar susurro
    window.speechSynthesis.speak(utterance);
});

function showWhisperBubble(message) {
    // Eliminar burbuja existente si hay
    const existingBubble = document.querySelector('.whisper-bubble');
    if (existingBubble) existingBubble.remove();

    // Crear nueva burbuja
    const bubble = document.createElement('div');
    bubble.className = 'whisper-bubble';
    bubble.textContent = message;
    
    // Posicionar cerca del botón de susurro
    const buttonRect = els.playWhisper.getBoundingClientRect();
    bubble.style.left = buttonRect.left - 150 + 'px';
    bubble.style.top = buttonRect.top - 80 + 'px';
    
    document.body.appendChild(bubble);

    // Animar aparición
    gsap.fromTo(bubble, 
    { opacity: 0, scale: 0.8, y: 10 },
    { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }
    );
}

function hideWhisperBubble() {
    const bubble = document.querySelector('.whisper-bubble');
    if (bubble) {
    gsap.to(bubble, {
        opacity: 0,
        scale: 0.8,
        y: 10,
        duration: 0.3,
        onComplete: () => bubble.remove()
    });
    }
}

function createWhisperEffect() {
    // Crear partículas mágicas alrededor del corazón
    for (let i = 0; i < 15; i++) {
    setTimeout(() => {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = '4px';
        particle.style.height = '4px';
        particle.style.background = 'rgba(147,20,255,0.8)';
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.boxShadow = '0 0 10px rgba(147,20,255,0.5)';
        
        const heartRect = els.heartContainer.getBoundingClientRect();
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 100;
        
        particle.style.left = heartRect.left + heartRect.width/2 + Math.cos(angle) * distance + 'px';
        particle.style.top = heartRect.top + heartRect.height/2 + Math.sin(angle) * distance + 'px';
        
        document.body.appendChild(particle);
        
        // Animar partícula hacia el corazón
        gsap.to(particle, {
        left: heartRect.left + heartRect.width/2,
        top: heartRect.top + heartRect.height/2,
        opacity: 0,
        scale: 0,
        duration: 2,
        ease: "power2.in",
        onComplete: () => particle.remove()
        });
    }, i * 100);
    }
}

// Cargar voces cuando estén disponibles
window.speechSynthesis.onvoiceschanged = () => {
    // Las voces están cargadas
};

// === ESCRIBIR LETRA POR LETRA AUTOMÁTICAMENTE ===
els.nameInput.addEventListener('input', () => {
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
    writeName();
    }, 500);
});

els.btnWrite.addEventListener('click', writeName);
els.nameInput.addEventListener('keypress', e => e.key === 'Enter' && writeName());

function writeName() {
    const name = els.nameInput.value.trim();
    if (!name) return;

    if (isWriting) return;
    isWriting = true;

    els.nameDisplay.innerHTML = '';
    gsap.killTweensOf([els.nameDisplay, els.heartContainer]);

    const cursor = document.createElement('span');
    cursor.className = 'writing-cursor';
    els.nameDisplay.appendChild(cursor);

    const letters = [];
    let letterIndex = 0;
    
    function addNextLetter() {
    if (letterIndex >= name.length) {
        cursor.remove();
        showNameAndHeart();
        isWriting = false;
        return;
    }

    const letter = name[letterIndex];
    const span = document.createElement('span');
    span.className = 'letter';
    span.textContent = letter;
    span.setAttribute('data-letter', letter);
    
    els.nameDisplay.insertBefore(span, cursor);
    letters.push(span);

    createLetterParticles(span);
    
    if (soundOn) {
        els.heartbeat.currentTime = 0;
        els.heartbeat.play();
    }
    
    createPetal();
    
    gsap.to(span, {
        opacity: 1,
        y: 0,
        rotationX: 0,
        scale: 1,
        duration: 0.6,
        ease: "back.out(1.7)",
        onComplete: () => {
        gsap.to(span, {
            filter: "brightness(1.5)",
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut"
        });
        }
    });
    
    letterIndex++;
    
    let delay = 150;
    if (letter === ' ') delay = 50;
    else if (letterIndex > 0 && name[letterIndex-1] === ' ') delay = 200;
    
    setTimeout(addNextLetter, delay);
    }
    
    gsap.to(els.nameDisplay, { opacity: 1, duration: 0.5 });
    setTimeout(addNextLetter, 300);
}

function createLetterParticles(letterElement) {
    const rect = letterElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div');
    particle.className = 'letter-particle';
    document.body.appendChild(particle);
    
    const angle = (Math.PI * 2 * i) / 8;
    const velocity = 2 + Math.random() * 3;
    
    gsap.set(particle, {
        x: centerX,
        y: centerY,
        opacity: 1
    });
    
    gsap.to(particle, {
        x: centerX + Math.cos(angle) * velocity * 20,
        y: centerY + Math.sin(angle) * velocity * 20,
        opacity: 0,
        duration: 1,
        ease: "power2.out",
        onComplete: () => particle.remove()
    });
    }
}

function showNameAndHeart() {
    gsap.to(els.nameDisplay, { 
    rotationX: 0, 
    scale: 1, 
    duration: 1.2, 
    ease: "elastic.out(1, 0.5)" 
    });
    gsap.to(els.heartContainer, { 
    opacity: 1, 
    scale: 1, 
    duration: 1.5, 
    ease: "back.out(1.7)", 
    onComplete: () => {
        showMessage(); 
        startPetalsRain();
    }
    });
}

// === PÉTALOS ===
function createPetal() {
    const petal = document.createElement('div');
    petal.className = 'petal';
    petal.style.left = `${Math.random() * innerWidth}px`;
    document.body.appendChild(petal);
    setTimeout(() => petal.remove(), 5000);
}

function startPetalsRain() {
    clearInterval(petalsInterval);
    petalsInterval = setInterval(createPetal, 300);
    setTimeout(() => clearInterval(petalsInterval), 8000);
}

// === MENSAJE ===
function showMessage() {
    const msg = document.createElement('div');
    msg.className = 'romantic-message';
    msg.textContent = messages[Math.floor(Math.random() * messages.length)];
    document.body.appendChild(msg);
    gsap.fromTo(msg, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1 });
    gsap.to(msg, { opacity: 0, y: -20, duration: 1, delay: 3, onComplete: () => msg.remove() });
}

// === GRABAR VIDEO MP4 SIN POPUP ===
els.recordVideo.addEventListener('click', () => {
    if (!els.nameDisplay.textContent) return alert('Escribe un nombre primero');
    recording ? stopRecording() : startRecording();
});

async function startRecording() {
    try {
    // Configurar canvas de grabación
    const recCanvas = els.recordingCanvas;
    const recCtx = recCanvas.getContext('2d');
    recCanvas.width = 1920;
    recCanvas.height = 1080;

    // Crear stream desde el canvas
    const canvasStream = recCanvas.captureStream(30); // 30 FPS
    
    // Crear contexto de audio
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Crear fuente de audio desde el elemento de música
    let audioSource;
    if (customMusic && customMusic.src) {
        audioSource = audioContext.createMediaElementSource(customMusic);
    } else {
        audioSource = audioContext.createMediaElementSource(els.music);
    }
    
    // Crear destino para el audio
    const destination = audioContext.createMediaStreamDestination();
    audioSource.connect(destination);
    audioSource.connect(audioContext.destination);
    
    // Combinar video y audio
    const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...destination.stream.getAudioTracks()
    ]);

    // Configurar MediaRecorder
    const options = {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000
    };

    mediaRecorder = new MediaRecorder(combinedStream, options);
    recordedChunks = [];

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
        recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        saveVideo(blob);
    };

    // Iniciar grabación
    mediaRecorder.start();
    recording = true;
    els.recordVideo.classList.add('recording');
    els.recordVideo.innerHTML = '<i class="fas fa-stop"></i>';
    
    // Mostrar modal de progreso
    els.progressModal.style.display = 'block';
    updateProgress(0);

    // Iniciar música si está activada
    if (soundOn) {
        if (customMusic) {
        customMusic.currentTime = 0;
        customMusic.play();
        } else {
        els.music.currentTime = 0;
        els.music.play();
        }
    }

    // Iniciar animación de grabación
    startRecordingAnimation(recCtx, recCanvas);

    // Detener la grabación después de 10 segundos
    setTimeout(() => {
        if (recording) stopRecording();
    }, 10000);

    } catch (err) {
    console.error('Error al iniciar la grabación:', err);
    alert('No se pudo iniciar la grabación. Por favor, intenta de nuevo.');
    }
}

function startRecordingAnimation(ctx, canvas) {
    let frame = 0;
    const maxFrames = 300; // 10 segundos a 30 FPS

    function drawFrame() {
    if (!recording || frame >= maxFrames) {
        if (frame >= maxFrames) stopRecording();
        return;
    }

    // Limpiar canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar estrellas
    ctx.save();
    stars.forEach(star => {
        const x = (star.x / els.canvas.width) * canvas.width;
        const y = (star.y / els.canvas.height) * canvas.height;
        const size = star.size * 2;
        
        ctx.fillStyle = `rgba(255,255,255,${star.opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();

    // Dibujar nombre
    ctx.save();
    ctx.font = '120px "Great Vibes"';
    ctx.fillStyle = neon;
    ctx.shadowColor = neon;
    ctx.shadowBlur = 40;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const name = els.nameDisplay.textContent;
    const nameY = canvas.height * 0.25;
    
    // Animación de aparición de letras
    const lettersToShow = Math.min(name.length, Math.floor((frame / 30) * name.length / 2));
    for (let i = 0; i < lettersToShow; i++) {
        const letter = name[i];
        const letterX = (canvas.width / 2) - (name.length * 30) + (i * 60);
        const opacity = Math.min(1, (frame - i * 5) / 20);
        
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillText(letter, letterX, nameY);
        ctx.restore();
    }
    ctx.restore();

    // Dibujar corazón
    ctx.save();
    const heartX = canvas.width / 2;
    const heartY = canvas.height * 0.55;
    const heartSize = 300;
    
    // Animación de latido
    const pulse = 1 + 0.1 * Math.sin(frame * 0.1);
    ctx.translate(heartX, heartY);
    ctx.scale(pulse, pulse);
    
    // Dibujar forma de corazón
    ctx.beginPath();
    ctx.moveTo(0, -heartSize/2);
    ctx.bezierCurveTo(-heartSize/2, -heartSize, -heartSize, -heartSize/2, -heartSize/2, 0);
    ctx.bezierCurveTo(-heartSize/2, heartSize/3, 0, heartSize/2, 0, heartSize);
    ctx.bezierCurveTo(0, heartSize/2, heartSize/2, heartSize/3, heartSize/2, 0);
    ctx.bezierCurveTo(heartSize, -heartSize/2, heartSize/2, -heartSize, 0, -heartSize/2);
    ctx.closePath();
    
    // Crear gradiente
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, heartSize);
    gradient.addColorStop(0, neon);
    gradient.addColorStop(1, 'rgba(255,20,147,0.3)');
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Añadir imagen dentro del corazón
    ctx.save();
    ctx.clip();
    const img = els.heartImage;
    if (img.complete) {
        ctx.drawImage(img, -heartSize/2, -heartSize/2, heartSize, heartSize);
    }
    ctx.restore();
    
    ctx.restore();

    // Dibujar pétalos
    ctx.save();
    const petalCount = Math.floor(frame / 3);
    for (let i = 0; i < petalCount; i++) {
        const petalY = (frame * 3 + i * 50) % canvas.height;
        const petalX = Math.random() * canvas.width;
        
        ctx.fillStyle = `rgba(255,105,180,${0.8 - (petalY / canvas.height) * 0.5})`;
        ctx.beginPath();
        ctx.ellipse(petalX, petalY, 8, 12, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    // Actualizar progreso
    const progress = Math.floor((frame / maxFrames) * 100);
    updateProgress(progress);

    frame++;
    recordingAnimationId = requestAnimationFrame(drawFrame);
    }

    drawFrame();
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    recording = false;
    els.recordVideo.classList.remove('recording');
    els.recordVideo.innerHTML = 'Video';
    
    if (recordingAnimationId) {
        cancelAnimationFrame(recordingAnimationId);
    }
    
    // Detener música
    if (customMusic) customMusic.pause();
    else els.music.pause();
    }
}

function saveVideo(blob) {
    try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amor_${els.nameDisplay.textContent}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    updateProgress(100);
    
    setTimeout(() => {
        els.progressModal.style.display = 'none';
        els.shareOptions.classList.add('visible');
    }, 1000);
    
    } catch (error) {
    console.error('Error al guardar el video:', error);
    alert('Error al guardar el video');
    els.progressModal.style.display = 'none';
    }
}

function updateProgress(percent) {
    els.progressFill.style.width = percent + '%';
    els.progressText.textContent = percent + '%';
}

// Cerrar modal
document.querySelector('.close').onclick = function() {
    els.progressModal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == els.progressModal) {
    els.progressModal.style.display = 'none';
    }
}

// === COMPARTIR ===
document.getElementById('shareFacebook').onclick = () => open(`https://www.facebook.com/profile.php?id=61557243424237=${location.href}`, '_blank');
document.getElementById('shareTwitter').onclick = () => open(`https://github.com/Hexdec-MC=${encodeURIComponent('Te dedico este amor: ' + els.nameDisplay.textContent)}`, '_blank');

// Iniciar con un nombre predeterminado
window.addEventListener('load', () => {
    els.nameInput.value = "Amor";
    writeName();
});
