// YouTube Video ID and configuration
const VIDEO_ID = 'OKVw7zSZ4S0';
let player;
let captions = [];
let currentCaptionIndex = -1;
let isTracking = false;

// Load YouTube IFrame API
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Initialize YouTube player when API is ready
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
    height: '480',
    width: '640',
    videoId: VIDEO_ID,
    playerVars: {
        enablejsapi: 1,
        controls: 1,
        modestbranding: 1,
        rel: 0
    },
    events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange
    }
    });
}

function onPlayerReady(event) {
    // Player is ready - captions will be loaded when transcript is shown
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
    startTracking();
    } else {
    stopTracking();
    }
}

// Improved SRT loader with proper error handling
async function loadSRT(url = 'captions/captions_ALM-YT120.srt') {
    try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    
    captions = text.trim().split(/\n\s*\n/).map(block => {
        const lines = block.trim().split('\n');
        if (lines.length >= 3) {
        const timeString = lines[1];
        const timeMatch = timeString.match(new RegExp("(\\d{2}):(\\d{2}):(\\d{2}),(\\d{3})\\s*-->\\s*(\\d{2}):(\\d{2}):(\\d{2}),(\\d{3})"));
        if (timeMatch) {
            return {
            start: (+timeMatch[1]) * 3600 + (+timeMatch[2]) * 60 + (+timeMatch[3]) + (+timeMatch[4]) / 1000,
            end: (+timeMatch[5]) * 3600 + (+timeMatch[6]) * 60 + (+timeMatch[7]) + (+timeMatch[8]) / 1000,
            text: lines.slice(2).join(' ').replace(/<[^>]*>/g, '')
            };
        }
        }
        return null;
    }).filter(cap => cap !== null);
    
    renderCaptions();
    } catch (error) {
    console.error('Failed to load SRT:', error);
    captions = getEmbeddedCaptions();
    renderCaptions();
    }
}

// Fallback embedded captions
function getEmbeddedCaptions() {
    return [
    { start: 0, end: 5, text: "no caption" },
    ];
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}


function renderCaptions() {
    const container = document.getElementById("transcript-content");
    if (!container) return; // Exit if transcript container doesn't exist
    
    container.innerHTML = "";
    
    captions.forEach((cap, index) => {
    const div = document.createElement("div");
    div.className = "caption";
    div.dataset.index = index;
    div.dataset.start = cap.start;
    div.innerHTML = `
        <div class="caption-time">${formatTime(cap.start)}</div>
        <div class="caption-text">${cap.text}</div>
    `;
    
    div.addEventListener('click', () => {
        if (player) {
        player.seekTo(cap.start, true);
        player.playVideo();
        }
    });
    
    container.appendChild(div);
    });
}

// Tracking and highlighting functions
function startTracking() {
    if (!isTracking) {
    isTracking = true;
    updateHighlight();
    }
}

function stopTracking() {
    isTracking = false;
}

function updateHighlight() {
    if (!isTracking || !player || !captions.length) return;

    const currentTime = player.getCurrentTime();
    const newIndex = findCurrentCaptionIndex(currentTime);

    if (newIndex !== currentCaptionIndex) {
    // Remove previous highlight
    if (currentCaptionIndex >= 0) {
        const prevElement = document.querySelector(`[data-index="${currentCaptionIndex}"]`);
        if (prevElement) {
        prevElement.classList.remove('active');
        }
    }

    // Add new highlight
    currentCaptionIndex = newIndex;
    if (currentCaptionIndex >= 0) {
        const currentElement = document.querySelector(`[data-index="${currentCaptionIndex}"]`);
        if (currentElement) {
        currentElement.classList.add('active');
        scrollToElement(currentElement);
        }
    }
    }

    if (isTracking) {
    requestAnimationFrame(updateHighlight);
    }
}

function findCurrentCaptionIndex(currentTime) {
    for (let i = 0; i < captions.length; i++) {
    const caption = captions[i];
    if (currentTime >= caption.start && currentTime <= caption.end) {
        return i;
    }
    }
    return -1;
}

function scrollToElement(element) {
    const container = document.getElementById('transcript-content');
    if (!container) return; // Exit if transcript container doesn't exist
    
    const containerScrollTop = container.scrollTop;
    const elementTop = element.offsetTop;
    
    // Calculate the distance from the top of the visible area
    const distanceFromTop = elementTop - containerScrollTop;
    
    // Only scroll if the highlighted element is more than 250px from the top
    if (distanceFromTop > 400) {
        const scrollTop = elementTop - 400;
        
        container.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
        });
    }
}

// Toggle transcript visibility functions
function toggleTranscript() {
    const container = document.getElementById('transcriptContainer');
    const videoContainer = document.querySelector('.video-container');
    const videoWrapper = document.querySelector('.video-wrapper');
    const button = document.querySelector('.toggle-transcript');
    const showBtn = document.getElementById('showTranscriptBtn');
    
    if (container.classList.contains('hidden')) {
    showTranscript();
    } else {
    hideTranscript();
    }
}

function hideTranscript() {
    const videoContainer = document.getElementById('videoContainer');
    const transcriptContainer = videoContainer.querySelector('.transcript-container');
    
    if (transcriptContainer) {
    // Remove transcript container from DOM
    transcriptContainer.remove();
    videoContainer.classList.remove('has-transcript');
    }

    // Update button visibility
    document.querySelector('.show-transcript-btn').style.display = 'inline-block';
    document.querySelector('.hide-transcript-btn').style.display = 'none';
}

function showTranscript() {
    const videoContainer = document.getElementById('videoContainer');
    
    // Check if transcript already exists
    if (videoContainer.querySelector('.transcript-container')) {
    return;
    }

    // Create transcript container
    const transcriptContainer = document.createElement('div');
    transcriptContainer.className = 'transcript-container';
    transcriptContainer.innerHTML = `
    <div class="transcript">
        <h3>Transcript</h3>
        <div id="transcript-content">
        <!-- Captions will be loaded here -->
        </div>
    </div>
    `;

    // Add transcript to video container
    videoContainer.appendChild(transcriptContainer);
    videoContainer.classList.add('has-transcript');

    // Load captions into the new transcript container
    loadSRT();

    // Update button visibility
    document.querySelector('.show-transcript-btn').style.display = 'none';
    document.querySelector('.hide-transcript-btn').style.display = 'inline-block';
}