// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('✅ Service Worker registered successfully:', registration.scope);
            })
            .catch(error => {
                console.log('❌ Service Worker registration failed:', error);
            });
    });
}

// Install PWA prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('💾 PWA install prompt is ready');
});

function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('✅ User accepted the install prompt');
            } else {
                console.log('❌ User dismissed the install prompt');
            }
            deferredPrompt = null;
        });
    }
}

// Notification Permission
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('✅ Notification permission granted');
            }
        });
    }
}

// Show Notification
function showNotification(title, options) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, options);
    }
}

// Local Storage Helpers
function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Error saving to storage:', error);
        return false;
    }
}

function getFromStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error('Error reading from storage:', error);
        return null;
    }
}

function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Error removing from storage:', error);
        return false;
    }
}

// User Authentication Helpers
function setUserSession(userData) {
    saveToStorage('userSession', userData);
    saveToStorage('isLoggedIn', true);
}

function getUserSession() {
    return getFromStorage('userSession');
}

function isUserLoggedIn() {
    return getFromStorage('isLoggedIn') === true;
}

function logoutUser() {
    removeFromStorage('userSession');
    removeFromStorage('isLoggedIn');
    window.location.href = 'login.html';
}

// Phone Number Formatting
function formatPhoneNumber(phone) {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as Egyptian number
    if (cleaned.startsWith('20')) {
        return cleaned;
    } else if (cleaned.startsWith('0')) {
        return '2' + cleaned;
    } else {
        return '20' + cleaned;
    }
}

// WhatsApp Link Generator
function getWhatsAppLink(phone, message = '') {
    const formattedPhone = formatPhoneNumber(phone);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedPhone}${message ? '?text=' + encodedMessage : ''}`;
}

// Call Link Generator
function getCallLink(phone) {
    const formattedPhone = formatPhoneNumber(phone);
    return `tel:+${formattedPhone}`;
}

// Share Functionality
async function shareContent(title, text, url) {
    if (navigator.share) {
        try {
            await navigator.share({
                title: title,
                text: text,
                url: url
            });
            console.log('✅ Content shared successfully');
        } catch (error) {
            console.log('❌ Error sharing:', error);
        }
    } else {
        // Fallback: Copy to clipboard
        const shareText = `${title}\n${text}\n${url}`;
        navigator.clipboard.writeText(shareText).then(() => {
            alert('✅ تم نسخ الرابط!');
        });
    }
}

// Copy to Clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('✅ تم النسخ بنجاح!');
    }).catch(err => {
        console.error('❌ Error copying:', err);
    });
}

// Smooth Scroll
function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Form Validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
}

// Toast Notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 20px 30px;
        border-radius: 15px;
        font-size: 18px;
        font-weight: bold;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slide-in-right 0.5s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slide-in-left 0.5s ease reverse';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 500);
    }, 3000);
}

// Geolocation
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                position => resolve(position),
                error => reject(error)
            );
        } else {
            reject(new Error('Geolocation not supported'));
        }
    });
}

// Calculate Distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance.toFixed(2); // Returns distance in km
}

// Initialize App
function initializeApp() {
    console.log('🚀 Initializing Nozha 2 Services App...');
    
    // Request notification permission
    requestNotificationPermission();
    
    // Check if user is logged in
    const isLoggedIn = isUserLoggedIn();
    console.log('User logged in:', isLoggedIn);
    
    // Add viewport height fix for mobile browsers
    function setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    
    console.log('✅ App initialized successfully');
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Export functions for use in other scripts
window.NozhaServices = {
    installPWA,
    showNotification,
    saveToStorage,
    getFromStorage,
    removeFromStorage,
    setUserSession,
    getUserSession,
    isUserLoggedIn,
    logoutUser,
    formatPhoneNumber,
    getWhatsAppLink,
    getCallLink,
    shareContent,
    copyToClipboard,
    smoothScrollTo,
    validateEmail,
    validatePhone,
    showToast,
    getCurrentPosition,
    calculateDistance
};
