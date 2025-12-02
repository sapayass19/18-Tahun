document.addEventListener('DOMContentLoaded', () => {
    // === Inisialisasi Elemen DOM ===
    const contentBox = document.getElementById('contentBox');
    const openMessageBtn = document.getElementById('openMessageBtn');
    const messageOverlay = document.getElementById('messageOverlay');
    const closePopupBtn = document.getElementById('closePopupBtn');
    const skipTypingElement = document.getElementById('skipTypingBtn');
    const body = document.body;
    const birthdayMusic = document.getElementById('birthdayMusic');
    const birthdayMessage = document.getElementById('birthdayMessage');
    const muteBtn = document.getElementById('muteBtn');

    // === Elemen Baru untuk Pilihan Musik ===
    const musicChoiceOverlay = document.getElementById('musicChoiceOverlay');
    const playMusicBtn = document.getElementById('playMusicBtn');
    const noMusicBtn = document.getElementById('noMusicBtn');

    // === State dan Variabel Typing Effect ===
    let typingInterval;
    let currentProgress = 0;
    const fullText = birthdayMessage ? birthdayMessage.getAttribute('data-full-text') : '';
    let isFinishedTyping = false;
    const typingSpeed = 40; // Kecepatan mengetik (ms per karakter)
    
    // Flag untuk tahu apakah musik sudah diizinkan
    let musicAllowed = false; 

    // ===================================
    // ## Fungsi Kontrol Audio (Mute/Unmute)
    // ===================================
    function toggleMute() {
        if (!birthdayMusic) return;

        if (birthdayMusic.muted) {
            // UNMUTE: Nyalain suara
            birthdayMusic.muted = false;
            muteBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
            if (birthdayMusic.paused) {
                // Coba play lagi
                birthdayMusic.play().catch(err => console.log("Play gagal:", err));
            }
        } else {
            // MUTE: Matikan suara
            birthdayMusic.muted = true;
            muteBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
        }
    }

    if (muteBtn) muteBtn.addEventListener('click', toggleMute);
    
    // ===================================
    // ## Fungsi Inisialisasi Musik
    // ===================================
    function initializeMusic(shouldPlay) {
        if (!birthdayMusic || !muteBtn) return;
        
        musicChoiceOverlay.classList.add('hide'); // Sembunyikan overlay pilihan

        if (shouldPlay) {
            musicAllowed = true;
            // 1. Tampilkan tombol kontrol
            muteBtn.classList.add('show');
            // 2. Set loop agar lagu berulang
            birthdayMusic.loop = true; 
            
            // 3. SET MUTED: true & Icon Xmark.
            //    Musik di-play, tapi dalam keadaan mute. Browser akan mengizinkan.
            birthdayMusic.muted = true; 
            muteBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>'; // Icon Mute Default

            // 4. Coba play. Karena muted, ini biasanya akan berhasil.
            birthdayMusic.play().catch(err => {
                console.log("Play gagal saat inisialisasi (tapi seharusnya sudah di-mute):", err);
                // Biarkan muted tetap true sebagai fallback.
            });
        } else {
            musicAllowed = false;
            // 1. Sembunyikan tombol kontrol audio
            muteBtn.classList.remove('show');
            // 2. Stop musik
            birthdayMusic.pause();
            birthdayMusic.currentTime = 0;
        }
        
        // Setelah pilihan musik, baru tampilkan konten utama (efek fade-in)
        setTimeout(() => {
            contentBox.style.opacity = '1';
            contentBox.style.transform = 'translateY(0)';
        }, 500); 
    }
    
    // ===================================
    // ## Event Listener Pilihan Musik
    // ===================================
    if (playMusicBtn) playMusicBtn.addEventListener('click', () => initializeMusic(true));
    if (noMusicBtn) noMusicBtn.addEventListener('click', () => initializeMusic(false));

    // ===================================
    // ## Fungsi Tampilkan Overlay Musik
    // ===================================
    function showMusicChoiceOverlay() {
         // Pastikan konten utama tersembunyi dulu
        contentBox.style.opacity = '0';
        contentBox.style.transform = 'translateY(20px)';
        
        if(musicChoiceOverlay) {
            musicChoiceOverlay.classList.remove('hide');
        } else {
             // Fallback: Jika overlay tidak ada, langsung tampilkan konten utama tanpa musik
            initializeMusic(false); 
        }
    }
    
    // ===================================
    // ## Inisialisasi Awal: Tampilkan Overlay Musik setelah delay
    // ===================================
    setTimeout(showMusicChoiceOverlay, 1000); // Tampilkan setelah 1 detik

    // ===================================
    // ## Fungsi Skip Typing
    // ===================================
    function skipTyping() {
        clearTimeout(typingInterval);
        birthdayMessage.innerHTML = fullText;
        currentProgress = fullText.length;
        isFinishedTyping = true;
        if (skipTypingElement) skipTypingElement.style.display = 'none';
        openMessageBtn.textContent = 'Baca Lagi Pesannya';
        openMessageBtn.disabled = false;
    }

    if (skipTypingElement) skipTypingElement.addEventListener('click', skipTyping);

    // ===================================
    // ## Fungsi Utama Typing Message
    // ===================================
    function typeMessage(element) {
        clearTimeout(typingInterval);

        if (isFinishedTyping) {
            element.innerHTML = fullText;
            return;
        }
        
        if (skipTypingElement) {
            skipTypingElement.style.display = currentProgress < fullText.length ? 'inline-block' : 'none';
        }
        
        if (currentProgress === 0) element.innerHTML = '';
        else element.innerHTML = fullText.substring(0, currentProgress);

        function typing() {
            if (currentProgress < fullText.length) {
                let char = fullText.charAt(currentProgress);

                if (char === '<' || char === '&') {
                    let endChar = (char === '<') ? '>' : ';';
                    let endIndex = fullText.indexOf(endChar, currentProgress);
                    
                    if (endIndex !== -1) {
                        element.innerHTML += fullText.substring(currentProgress, endIndex + 1);
                        currentProgress = endIndex + 1;
                    } else {
                        element.innerHTML += char;
                        currentProgress++;
                    }
                } else {
                    element.innerHTML += char;
                    currentProgress++;
                }

                element.scrollTop = element.scrollHeight;
                typingInterval = setTimeout(typing, typingSpeed);
            } else {
                clearTimeout(typingInterval);
                isFinishedTyping = true;
                if (skipTypingElement) skipTypingElement.style.display = 'none';
                openMessageBtn.textContent = 'Pesan Sudah Dibaca! ✅';
                openMessageBtn.disabled = false;
            }
        }
        typing();
    }

    // ===================================
    // ## Event Listener Tombol "Baca Pesan"
    // ===================================
    openMessageBtn.addEventListener('click', () => {
        // Coba play musik HANYA jika diizinkan dan sedang pause
        if (birthdayMusic && musicAllowed && birthdayMusic.paused) {
            birthdayMusic.play().catch(err => console.log("Play gagal:", err));
        }

        messageOverlay.classList.add('show');
        body.classList.add('overlay-active');

        triggerConfettiEffect();
        
        if (birthdayMessage) typeMessage(birthdayMessage);

        if (!isFinishedTyping) {
            openMessageBtn.disabled = true;
            openMessageBtn.textContent = 'Mengetik Pesan...';
        } else {
            openMessageBtn.disabled = false;
            openMessageBtn.textContent = 'Baca Lagi Pesannya';
        }
    });

    // ===================================
    // ## Event Listener Tombol Tutup Pop-up
    // ===================================
    closePopupBtn.addEventListener('click', () => {
        clearTimeout(typingInterval);
        if (skipTypingElement) skipTypingElement.style.display = 'none';
        
        messageOverlay.classList.remove('show');
        body.classList.remove('overlay-active');
        
        openMessageBtn.disabled = false;
        openMessageBtn.textContent = isFinishedTyping ? 'Baca Lagi Pesannya' : 'Lanjut Baca Pesannya';
    });

    // ===================================
    // ## Fungsi Confetti Effect
    // ===================================
    function getRandomColor() {
        return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    }

    function triggerConfettiEffect() {
        const confettiContainer = document.getElementById('confetti-container');
        confettiContainer.innerHTML = '';
        
        const count = 50;
        for (let i = 0; i < count; i++) {
            const piece = document.createElement('div');
            piece.classList.add('confetti-piece');
            piece.style.left = `${Math.random() * 100}vw`;
            piece.style.backgroundColor = getRandomColor();
            piece.style.width = `${Math.random() * 8 + 4}px`;
            piece.style.height = `${Math.random() * 8 + 4}px`;
            piece.style.animationDuration = `${Math.random() * 3 + 2}s`;
            piece.style.animationDelay = `${Math.random() * 2}s`;
            piece.style.transform = `rotate(${Math.random() * 360}deg)`;
            confettiContainer.appendChild(piece);
            piece.addEventListener('animationend', () => piece.remove());
        }
    }
});