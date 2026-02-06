// ============================================================================
// V4 ENHANCEMENTS - PHOTO GALLERY SYSTEM WITH TITLES
// ============================================================================
// This module adds photo upload/gallery functionality to V3 stable
// - Night photos: stored in nights[index].photos array with titles
// - Player photos: stored in playerInfo[playerName].photos array with titles
// - Gallery tab with filtering
// - Lightbox viewer with navigation and title display
// - All functions exposed globally BEFORE any HTML generation
// ============================================================================

(function() {
  'use strict';

  // ============================================================================
  // GLOBAL STATE
  // ============================================================================
  let currentLightboxPhotos = [];
  let currentLightboxIndex = 0;

  // ============================================================================
  // PHOTO UTILITIES
  // ============================================================================

  async function compressImage(base64, maxWidth = 800) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = base64;
    });
  }

  // ============================================================================
  // NIGHT PHOTO FUNCTIONS
  // ============================================================================

  window.handleNightPhotoUpload = async function(event, nightIndex) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', true);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const compressed = await compressImage(e.target.result);
        
        // Initialize photos array if needed
        if (!window.groupData.nights[nightIndex].photos) {
          window.groupData.nights[nightIndex].photos = [];
        }

        // Check limit
        if (window.groupData.nights[nightIndex].photos.length >= 5) {
          showToast('Maximum 5 photos per night', true);
          return;
        }

        // Get title from input
        const titleInput = document.getElementById('nightPhotoTitle');
        const title = titleInput ? titleInput.value.trim() : '';

        // Add photo
        window.groupData.nights[nightIndex].photos.push({
          data: compressed,
          title: title,
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'Admin'
        });

        await window.saveGroupData();
        showToast('Photo added!');
        
        // Clear title input and file input
        if (titleInput) titleInput.value = '';
        event.target.value = '';
        
        // Refresh thumbnails display
        displayNightPhotos(nightIndex);
      } catch (error) {
        console.error('Error uploading photo:', error);
        showToast('Error uploading photo', true);
      }
    };
    reader.readAsDataURL(file);
  };

  window.deleteNightPhoto = async function(nightIndex, photoIndex) {
    if (!confirm('Delete this photo?')) return;

    window.groupData.nights[nightIndex].photos.splice(photoIndex, 1);
    await window.saveGroupData();
    showToast('Photo deleted');
    displayNightPhotos(nightIndex);
  };

  function displayNightPhotos(nightIndex) {
    const container = document.getElementById('nightPhotoThumbnails');
    if (!container) return;

    const photos = window.groupData.nights[nightIndex]?.photos || [];
    
    if (photos.length === 0) {
      container.innerHTML = '<div style="font-size:12px; color:var(--text-secondary); text-align:center; padding:10px;">No photos yet</div>';
      return;
    }

    container.innerHTML = photos.map((photo, idx) => `
      <div style="position:relative; display:inline-block; margin:5px;">
        <img src="${photo.data}" 
             style="width:80px; height:80px; object-fit:cover; border-radius:8px; cursor:pointer; border:1px solid var(--glass-border);"
             onclick="openLightbox(${nightIndex}, ${idx}, 'night')"
             title="${photo.title || ''}">
        ${photo.title ? `<div style="position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.8); color:white; font-size:9px; padding:3px 5px; border-radius:0 0 8px 8px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${photo.title}</div>` : ''}
        <button onclick="deleteNightPhoto(${nightIndex}, ${idx}); event.stopPropagation();"
                style="position:absolute; top:2px; right:2px; background:rgba(239,68,68,0.9); color:white; border:none; border-radius:50%; width:20px; height:20px; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center;">×</button>
      </div>
    `).join('');
  }

  // ============================================================================
  // PLAYER PHOTO FUNCTIONS
  // ============================================================================

  window.handlePlayerPhotoUpload = async function(event, playerName) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', true);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const compressed = await compressImage(e.target.result);
        
        // Initialize playerInfo and photos array if needed
        if (!window.groupData.playerInfo) {
          window.groupData.playerInfo = {};
        }
        if (!window.groupData.playerInfo[playerName]) {
          window.groupData.playerInfo[playerName] = { photos: [] };
        }
        if (!window.groupData.playerInfo[playerName].photos) {
          window.groupData.playerInfo[playerName].photos = [];
        }

        // Check limit
        if (window.groupData.playerInfo[playerName].photos.length >= 5) {
          showToast('Maximum 5 photos per player', true);
          return;
        }

        // Get title from input
        const titleInput = document.getElementById('playerPhotoTitle');
        const title = titleInput ? titleInput.value.trim() : '';

        // Add photo
        window.groupData.playerInfo[playerName].photos.push({
          data: compressed,
          title: title,
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'Admin'
        });

        await window.saveGroupData();
        showToast('Photo added!');
        
        // Clear title input and file input
        if (titleInput) titleInput.value = '';
        event.target.value = '';
        
        // Refresh thumbnails display
        displayPlayerPhotos(playerName);
      } catch (error) {
        console.error('Error uploading photo:', error);
        showToast('Error uploading photo', true);
      }
    };
    reader.readAsDataURL(file);
  };

  window.deletePlayerPhoto = async function(playerName, photoIndex) {
    if (!confirm('Delete this photo?')) return;

    window.groupData.playerInfo[playerName].photos.splice(photoIndex, 1);
    await window.saveGroupData();
    showToast('Photo deleted');
    displayPlayerPhotos(playerName);
  };

  function displayPlayerPhotos(playerName) {
    const container = document.getElementById('playerPhotoThumbnails');
    if (!container) return;

    const photos = window.groupData.playerInfo?.[playerName]?.photos || [];
    
    if (photos.length === 0) {
      container.innerHTML = '<div style="font-size:12px; color:var(--text-secondary); text-align:center; padding:10px;">No photos yet</div>';
      return;
    }

    container.innerHTML = photos.map((photo, idx) => `
      <div style="position:relative; display:inline-block; margin:5px;">
        <img src="${photo.data}" 
             style="width:80px; height:80px; object-fit:cover; border-radius:8px; cursor:pointer; border:1px solid var(--glass-border);"
             onclick="openLightbox('${playerName}', ${idx}, 'player')"
             title="${photo.title || ''}">
        ${photo.title ? `<div style="position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.8); color:white; font-size:9px; padding:3px 5px; border-radius:0 0 8px 8px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${photo.title}</div>` : ''}
        <button onclick="deletePlayerPhoto('${playerName}', ${idx}); event.stopPropagation();"
                style="position:absolute; top:2px; right:2px; background:rgba(239,68,68,0.9); color:white; border:none; border-radius:50%; width:20px; height:20px; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center;">×</button>
      </div>
    `).join('');
  }

  // ============================================================================
  // LIGHTBOX VIEWER
  // ============================================================================

  window.openLightbox = function(entityId, photoIndex, type) {
    let photos = [];
    
    if (type === 'night') {
      photos = window.groupData.nights[entityId]?.photos || [];
    } else if (type === 'player') {
      photos = window.groupData.playerInfo?.[entityId]?.photos || [];
    }

    if (!photos || photos.length === 0) return;

    currentLightboxPhotos = photos;
    currentLightboxIndex = photoIndex;
    
    displayLightboxPhoto();
    document.getElementById('lightboxModal').classList.add('active');
  };

  window.closeLightbox = function() {
    document.getElementById('lightboxModal').classList.remove('active');
    currentLightboxPhotos = [];
    currentLightboxIndex = 0;
  };

  window.navigateLightbox = function(direction) {
    if (direction === 'prev') {
      currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxPhotos.length) % currentLightboxPhotos.length;
    } else {
      currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxPhotos.length;
    }
    displayLightboxPhoto();
  };

  function displayLightboxPhoto() {
    const photo = currentLightboxPhotos[currentLightboxIndex];
    if (!photo) return;

    const img = document.getElementById('lightboxImage');
    const counter = document.getElementById('lightboxCounter');
    const title = document.getElementById('lightboxTitle');
    
    if (img) {
      img.src = photo.data;
    }
    if (counter) {
      counter.textContent = `${currentLightboxIndex + 1} / ${currentLightboxPhotos.length}`;
    }
    if (title) {
      title.textContent = photo.title || '';
      title.style.display = photo.title ? 'block' : 'none';
    }
  }

  // ============================================================================
  // GALLERY TAB FUNCTIONS
  // ============================================================================

  window.loadGallery = function() {
    const container = document.getElementById('galleryGrid');
    if (!container) return;

    // Collect all photos from nights and players
    const allPhotos = [];

    // Night photos
    (window.groupData.nights || []).forEach((night, nightIndex) => {
      (night.photos || []).forEach((photo, photoIndex) => {
        allPhotos.push({
          ...photo,
          source: 'night',
          sourceId: nightIndex,
          photoIndex: photoIndex,
          nightDate: night.date,
          location: night.location
        });
      });
    });

    // Player photos
    Object.entries(window.groupData.playerInfo || {}).forEach(([playerName, info]) => {
      (info.photos || []).forEach((photo, photoIndex) => {
        allPhotos.push({
          ...photo,
          source: 'player',
          sourceId: playerName,
          photoIndex: photoIndex,
          playerName: playerName
        });
      });
    });

    // Sort by upload date (newest first)
    allPhotos.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    if (allPhotos.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:40px; color:var(--text-secondary);">
          <div style="font-size:48px; margin-bottom:10px;">📸</div>
          <div style="font-size:16px;">No photos yet</div>
          <div style="font-size:13px; margin-top:8px;">Upload photos from Night or Player modals</div>
        </div>
      `;
      return;
    }

    // Display photos in grid
    container.innerHTML = allPhotos.map((photo, idx) => {
      const caption = photo.source === 'night' 
        ? `${photo.nightDate} ${photo.location ? '• ' + photo.location : ''}`
        : photo.playerName;
      
      const uploadDate = new Date(photo.uploadedAt).toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric' 
      });

      return `
        <div style="position:relative; cursor:pointer;" 
             onclick="openGalleryLightbox(${idx})">
          <img src="${photo.data}" 
               style="width:100%; height:200px; object-fit:cover; border-radius:12px; border:1px solid var(--glass-border);">
          <div style="position:absolute; bottom:0; left:0; right:0; background:linear-gradient(transparent, rgba(0,0,0,0.8)); padding:12px; border-radius:0 0 12px 12px;">
            ${photo.title ? `<div style="font-size:13px; font-weight:700; color:white; margin-bottom:4px;">${photo.title}</div>` : ''}
            <div style="font-size:12px; font-weight:600; color:rgba(255,255,255,0.9);">${caption}</div>
            <div style="font-size:10px; color:rgba(255,255,255,0.7);">${uploadDate}</div>
          </div>
        </div>
      `;
    }).join('');

    // Store for lightbox
    window.galleryPhotos = allPhotos;
  };

  window.filterGallery = function(filter) {
    // Update filter buttons
    document.querySelectorAll('.gallery-filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    event.target.classList.add('active');

    const container = document.getElementById('galleryGrid');
    if (!container || !window.galleryPhotos) return;

    let filteredPhotos = window.galleryPhotos;

    if (filter === 'nights') {
      filteredPhotos = window.galleryPhotos.filter(p => p.source === 'night');
    } else if (filter === 'players') {
      filteredPhotos = window.galleryPhotos.filter(p => p.source === 'player');
    }

    if (filteredPhotos.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:40px; color:var(--text-secondary); grid-column:1/-1;">
          <div style="font-size:48px; margin-bottom:10px;">📸</div>
          <div style="font-size:16px;">No ${filter} photos</div>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredPhotos.map((photo, idx) => {
      const caption = photo.source === 'night' 
        ? `${photo.nightDate} ${photo.location ? '• ' + photo.location : ''}`
        : photo.playerName;
      
      const uploadDate = new Date(photo.uploadedAt).toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric' 
      });

      // Find original index in galleryPhotos
      const originalIndex = window.galleryPhotos.indexOf(photo);

      return `
        <div style="position:relative; cursor:pointer;" 
             onclick="openGalleryLightbox(${originalIndex})">
          <img src="${photo.data}" 
               style="width:100%; height:200px; object-fit:cover; border-radius:12px; border:1px solid var(--glass-border);">
          <div style="position:absolute; bottom:0; left:0; right:0; background:linear-gradient(transparent, rgba(0,0,0,0.8)); padding:12px; border-radius:0 0 12px 12px;">
            ${photo.title ? `<div style="font-size:13px; font-weight:700; color:white; margin-bottom:4px;">${photo.title}</div>` : ''}
            <div style="font-size:12px; font-weight:600; color:rgba(255,255,255,0.9);">${caption}</div>
            <div style="font-size:10px; color:rgba(255,255,255,0.7);">${uploadDate}</div>
          </div>
        </div>
      `;
    }).join('');
  };

  window.openGalleryLightbox = function(index) {
    if (!window.galleryPhotos || window.galleryPhotos.length === 0) return;

    currentLightboxPhotos = window.galleryPhotos;
    currentLightboxIndex = index;
    
    displayLightboxPhoto();
    document.getElementById('lightboxModal').classList.add('active');
  };

  // ============================================================================
  // MODAL INJECTION FUNCTIONS
  // ============================================================================

  function injectNightPhotoSection() {
    const modal = document.getElementById('addNightModal');
    if (!modal) return;

    const modalContent = modal.querySelector('.modal-content');
    if (!modalContent) return;

    // Check if already injected
    if (document.getElementById('nightPhotoSection')) return;

    // Find the notes textarea
    const notesGroup = Array.from(modalContent.querySelectorAll('.form-group')).find(group => {
      const label = group.querySelector('.form-label');
      return label && label.textContent.includes('Notes');
    });

    if (!notesGroup) return;

    // Create photo section
    const photoSection = document.createElement('div');
    photoSection.id = 'nightPhotoSection';
    photoSection.className = 'form-group';
    photoSection.innerHTML = `
      <label class="form-label">📸 Photos (Max 5)</label>
      <input type="text" 
             id="nightPhotoTitle" 
             placeholder="Photo title (optional)" 
             class="form-input"
             style="margin-bottom:8px;">
      <input type="file" 
             id="nightPhotoInput" 
             accept="image/*" 
             style="display:none;">
      <button type="button" 
              class="btn btn-secondary btn-small" 
              onclick="document.getElementById('nightPhotoInput').click()"
              style="width:100%; margin-bottom:10px;">
        + Add Photo
      </button>
      <div id="nightPhotoThumbnails" 
           style="min-height:40px; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:8px; padding:10px; display:flex; flex-wrap:wrap; gap:5px;">
        <div style="font-size:12px; color:var(--text-secondary); text-align:center; width:100%; padding:10px;">No photos yet</div>
      </div>
    `;

    // Insert after notes
    notesGroup.parentNode.insertBefore(photoSection, notesGroup.nextSibling);
  }

  function injectPlayerPhotoSection() {
    const modal = document.getElementById('addPlayerModal');
    if (!modal) return;

    const modalContent = modal.querySelector('.modal-content');
    if (!modalContent) return;

    // Check if already injected
    if (document.getElementById('playerPhotoSection')) return;

    // Find the player name input
    const nameGroup = Array.from(modalContent.querySelectorAll('.form-group')).find(group => {
      const label = group.querySelector('.form-label');
      return label && label.textContent.includes('Player Name');
    });

    if (!nameGroup) return;

    // Create photo section
    const photoSection = document.createElement('div');
    photoSection.id = 'playerPhotoSection';
    photoSection.className = 'form-group';
    photoSection.innerHTML = `
      <label class="form-label">📸 Photos (Max 5)</label>
      <input type="text" 
             id="playerPhotoTitle" 
             placeholder="Photo title (optional)" 
             class="form-input"
             style="margin-bottom:8px;">
      <input type="file" 
             id="playerPhotoInput" 
             accept="image/*" 
             style="display:none;">
      <button type="button" 
              class="btn btn-secondary btn-small" 
              onclick="document.getElementById('playerPhotoInput').click()"
              style="width:100%; margin-bottom:10px;">
        + Add Photo
      </button>
      <div id="playerPhotoThumbnails" 
           style="min-height:40px; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:8px; padding:10px; display:flex; flex-wrap:wrap; gap:5px;">
        <div style="font-size:12px; color:var(--text-secondary); text-align:center; width:100%; padding:10px;">No photos yet</div>
      </div>
    `;

    // Insert after name
    nameGroup.parentNode.insertBefore(photoSection, nameGroup.nextSibling);
  }

  function injectGalleryTab() {
    // Check if tab already exists
    if (document.getElementById('gallery')) return;

    // Add Gallery tab button
    const tabs = document.querySelector('.tabs');
    if (tabs) {
      const galleryTab = document.createElement('div');
      galleryTab.className = 'tab';
      galleryTab.textContent = '📸 Gallery';
      galleryTab.onclick = () => window.switchTab('gallery');
      tabs.appendChild(galleryTab);
    }

    // Add Gallery tab content
    const container = document.querySelector('.container');
    if (container) {
      const galleryContent = document.createElement('div');
      galleryContent.id = 'gallery';
      galleryContent.className = 'tab-content';
      galleryContent.innerHTML = `
        <div class="glass-card">
          <div class="card-header">
            <div class="card-title">Photo Gallery</div>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-small btn-secondary gallery-filter-btn active" onclick="filterGallery('all')">All</button>
              <button class="btn btn-small btn-secondary gallery-filter-btn" onclick="filterGallery('nights')">Nights</button>
              <button class="btn btn-small btn-secondary gallery-filter-btn" onclick="filterGallery('players')">Players</button>
            </div>
          </div>
          <div id="galleryGrid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:15px;"></div>
        </div>
      `;
      container.appendChild(galleryContent);
    }
  }

  function injectLightboxModal() {
    // Check if already exists
    if (document.getElementById('lightboxModal')) return;

    const lightboxHTML = `
      <div id="lightboxModal" class="modal">
        <div class="modal-overlay" onclick="closeLightbox()"></div>
        <div class="modal-content" style="max-width:90vw; max-height:90vh; background:rgba(10, 14, 39, 0.95); padding:0; overflow:hidden;">
          <button onclick="closeLightbox()" 
                  style="position:absolute; top:15px; right:15px; background:rgba(255,255,255,0.1); border:1px solid var(--glass-border); color:white; width:40px; height:40px; border-radius:50%; font-size:24px; cursor:pointer; z-index:10; display:flex; align-items:center; justify-content:center;">×</button>
          
          <div style="position:relative; display:flex; align-items:center; justify-content:center; min-height:400px; max-height:80vh;">
            <button onclick="navigateLightbox('prev')" 
                    style="position:absolute; left:20px; background:rgba(255,255,255,0.1); border:1px solid var(--glass-border); color:white; width:50px; height:50px; border-radius:50%; font-size:24px; cursor:pointer; z-index:5; display:flex; align-items:center; justify-content:center;">‹</button>
            
            <img id="lightboxImage" 
                 src="" 
                 style="max-width:100%; max-height:80vh; object-fit:contain; border-radius:8px;">
            
            <button onclick="navigateLightbox('next')" 
                    style="position:absolute; right:20px; background:rgba(255,255,255,0.1); border:1px solid var(--glass-border); color:white; width:50px; height:50px; border-radius:50%; font-size:24px; cursor:pointer; z-index:5; display:flex; align-items:center; justify-content:center;">›</button>
          </div>
          
          <div style="text-align:center; padding:15px; border-top:1px solid var(--glass-border);">
            <div id="lightboxTitle" 
                 style="font-size:16px; font-weight:600; color:var(--text-primary); margin-bottom:8px;">
            </div>
            <div id="lightboxCounter" 
                 style="font-size:14px; color:var(--text-secondary); font-family:'Space Mono', monospace;">
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', lightboxHTML);
  }

  // ============================================================================
  // MODAL HOOK INTEGRATION
  // ============================================================================

  // Hook into existing editNight function to display photos
  const originalEditNight = window.editNight;
  window.editNight = function(index) {
    // Call original function
    if (originalEditNight) {
      originalEditNight(index);
    }

    // Setup photo upload handler for this specific night
    const photoInput = document.getElementById('nightPhotoInput');
    if (photoInput) {
      // Remove old listeners by cloning
      const newPhotoInput = photoInput.cloneNode(true);
      photoInput.parentNode.replaceChild(newPhotoInput, photoInput);
      
      // Add new listener
      newPhotoInput.addEventListener('change', (e) => window.handleNightPhotoUpload(e, index));
    }

    // Clear title input
    const titleInput = document.getElementById('nightPhotoTitle');
    if (titleInput) titleInput.value = '';

    // Display existing photos
    displayNightPhotos(index);
  };

  // Hook into existing editPlayer function to display photos
  const originalEditPlayer = window.editPlayer;
  window.editPlayer = function(index) {
    // Call original function
    if (originalEditPlayer) {
      originalEditPlayer(index);
    }

    const playerName = window.groupData.players[index];

    // Setup photo upload handler for this specific player
    const photoInput = document.getElementById('playerPhotoInput');
    if (photoInput) {
      // Remove old listeners by cloning
      const newPhotoInput = photoInput.cloneNode(true);
      photoInput.parentNode.replaceChild(newPhotoInput, photoInput);
      
      // Add new listener
      newPhotoInput.addEventListener('change', (e) => window.handlePlayerPhotoUpload(e, playerName));
    }

    // Clear title input
    const titleInput = document.getElementById('playerPhotoTitle');
    if (titleInput) titleInput.value = '';

    // Display existing photos
    displayPlayerPhotos(playerName);
  };

  // Hook into saveNight to preserve photos when creating new night
  const originalSaveNight = window.saveNight;
  window.saveNight = async function() {
    const modal = document.getElementById('addNightModal');
    const editIndex = modal.dataset.editIndex;

    // If editing existing night, preserve photos
    if (editIndex !== undefined && editIndex !== '') {
      const existingNight = window.groupData.nights[parseInt(editIndex)];
      const existingPhotos = existingNight?.photos || [];
      
      // Call original save
      await originalSaveNight();

      // Restore photos to the night that was just updated
      if (existingPhotos.length > 0) {
        window.groupData.nights[parseInt(editIndex)].photos = existingPhotos;
        await window.saveGroupData();
      }
    } else {
      // New night - just call original
      await originalSaveNight();
    }
  };

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  function initV4Enhancements() {
    console.log('Initializing V4 Photo Gallery Enhancements...');

    // Inject UI elements
    injectNightPhotoSection();
    injectPlayerPhotoSection();
    injectGalleryTab();
    injectLightboxModal();

    // Add Gallery to tab switching
    const originalSwitchTab = window.switchTab;
    window.switchTab = function(tabName) {
      originalSwitchTab(tabName);
      if (tabName === 'gallery') {
        window.loadGallery();
      }
    };

    console.log('V4 Photo Gallery Enhancements loaded successfully!');
  }

  // Wait for DOM and groupData to be ready
  function waitForReady() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkReady);
    } else {
      checkReady();
    }
  }

  function checkReady() {
    if (window.groupData && document.getElementById('addNightModal')) {
      initV4Enhancements();
    } else {
      setTimeout(checkReady, 100);
    }
  }

  waitForReady();

})();
