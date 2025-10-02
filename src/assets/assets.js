import logo from './logo.png';
import upload from './upload.png'
import login from './login-bg.jpg';
import profile from './profile.png';
import device from './device.png';
import supermarket from './supermarket.png';

// Fallback URLs for when S3 is not accessible
const FALLBACK_BASE = '/images/';

export const assets = {
    logo,
    upload,
    login,
    profile,
    device,
    supermarket
}

// Helper function to get fallback image URL
export const getFallbackImage = (type) => {
    switch(type) {
        case 'category': return FALLBACK_BASE + 'upload.png';
        case 'item': return FALLBACK_BASE + 'supermarket.png';
        default: return FALLBACK_BASE + 'supermarket.png';
    }
}