// ============================================================================
// V4 PHOTO GALLERY MIGRATION PATCH - FIREBASE STORAGE
// ============================================================================
// Goal:
// - Stop storing large base64 photo data directly in Firestore group documents
// - Use Firebase Storage for photo binaries
// - Store only lightweight metadata (id, url, title, uploadedAt, uploadedBy)
// - Preserve existing behavior (max 5 photos/night, thumbnails, lightbox)
// - Integrate cleanly with existing V4 code (window.groupData, saveGroupData)
//
// Integration notes:
// - This file is designed to be loaded AFTER firebase is initialized and
//   AFTER v4-enhancements.js so it can override photo-specific functions.
// - It assumes Firebase Web SDK v8-style global `firebase` object is present.
// - It does NOT modify unrelated features (nights, players, voting, admin).
//
// Usage:
// - Include this file as an additional script tag on admin.html AFTER
//   v4-enhancements.js, e.g.:
//     <script src="v4-enhancements.js"></script>
//     <script src="v4-photo-migration-patch.js"></script>
// - Once deployed, new photos will be stored in Storage with URLs in
//   window.groupData.nights[nightIndex].photos[].url
// - You should manually clean old `data` fields in Firestore once this patch
//   is live to bring the document size back under 1 MB.
// ============================================================================

(function() {
  'use strict';

  // --------------------------------------------------------------------------
  // SAFETY CHECKS
  // --------------------------------------------------------------------------
  if (!window.firebase || !firebase.storage) {
    console.error('[PhotoPatch] Firebase Storage not available. Patch disabled.');
    return;
  }

  if (!window.groupData) {
    console.warn('[PhotoPatch] window.groupData not yet loaded. Patch will rely on runtime access.');
  }

  if (!window.saveGroupData) {
    console.error('[PhotoPatch] window.saveGroupData is missing. Patch cannot persist metadata.');
    return;
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  // Determine the current group ID from existing state.
  // This patch does NOT assume a specific field; it checks common patterns and
  // falls back to a safe default that does not break anything.
  function getCurrentGroupId() {
    // Common pattern: groupData.id
    if (window.groupData && typeof window.groupData.id === 'string' && window.groupData.id.trim() !== '') {
      return window.groupData.id;
    }
    // Alternate pattern: groupData.groupCode
    if (window.groupData && typeof window.groupData.groupCode === 'string' && window.groupData.groupCode.trim() !== '') {
      return window.groupData.groupCode;
    }
    // Fallback: do not hard-code; use a generic label so path is still valid
    return 'group-unknown';
  }

  // Upload compressed base64 image (data URL) to Firebase Storage and return a download URL.
  async function uploadNightPhotoToStorage(nightIndex, photoId, base64Data) {
    const groupId = getCurrentGroupId();
    const safeNight = typeof nightIndex === 'number' ? nightIndex : String(nightIndex || 'unknown');

    const storagePath = `groups/${groupId}/nights/${safeNight}/${photoId}.jpg`;

    const ref = firebase.storage().ref(storagePath);
    // base64Data is a data URL from compressImage (e.g. "data:image/jpeg;base64,...")
    await ref.putString(base64Data, 'data_url');
    return ref.getDownloadURL();
  }

  // --------------------------------------------------------------------------
  // PATCHED NIGHT PHOTO UPLOAD
  // --------------------------------------------------------------------------
  // We override the existing window.handleNightPhotoUpload to:
  // - Compress image (using existing compressImage from v4-enhancements.js)
  // - Upload to Storage
  // - Store only { id, url, title, uploadedAt, uploadedBy } in groupData
  // - Keep max 5 photos/night behavior and UI refresh
  // --------------------------------------------------------------------------

  const originalHandleNightPhotoUpload = window.handleNightPhotoUpload;

  window.handleNightPhotoUpload = async function(event, nightIndex) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type || !file.type.startsWith('image/')) {
      if (typeof window.showToast === 'function') {
        window.showToast('Please select an image file', true);
      } else {
        alert('Please select an image file');
      }
      return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        if (typeof window.compressImage !== 'function') {
          console.error('[PhotoPatch] compressImage is not available. Falling back to original handler.');
          if (typeof originalHandleNightPhotoUpload === 'function') {
            // Fall back to original behavior to avoid breaking existing flow.
            return originalHandleNightPhotoUpload(event, nightIndex);
          }
          return;
        }

        const compressed = await window.compressImage(e.target.result);

        // Initialize nights/photos structure if needed
        if (!window.groupData) {
          console.error('[PhotoPatch] window.groupData not available at upload time.');
          if (typeof window.showToast === 'function') {
            window.showToast('Group data not loaded', true);
          }
          return;
        }

        if (!Array.isArray(window.groupData.nights)) {
          console.error('[PhotoPatch] groupData.nights is not an array.');
          if (typeof window.showToast === 'function') {
            window.showToast('Nights data not initialized', true);
          }
          return;
        }

        const night = window.groupData.nights[nightIndex];
        if (!night) {
          console.error('[PhotoPatch] Invalid nightIndex:', nightIndex);
          if (typeof window.showToast === 'function') {
            window.showToast('Invalid night selected', true);
          }
          return;
        }

        if (!Array.isArray(night.photos)) {
          night.photos = [];
        }

        // Keep original logical limit
        if (night.photos.length >= 5) {
          if (typeof window.showToast === 'function') {
            window.showToast('Maximum 5 photos per night', true);
          } else {
            alert('Maximum 5 photos per night');
          }
          return;
        }

        // Get title from input (same as original)
        const titleInput = document.getElementById('nightPhotoTitle');
        const title = titleInput ? titleInput.value.trim() : '';

        // Generate a photo ID (unique per night)
        const timestamp = Date.now();
        const photoId = `night-${nightIndex}-${timestamp}`;

        // Upload to Storage
        const url = await uploadNightPhotoToStorage(nightIndex, photoId, compressed);

        // Store lightweight metadata only
        night.photos.push({
          id: photoId,
          url: url,
          title: title,
          uploadedAt: new Date(timestamp).toISOString(),
          uploadedBy: 'Admin'
        });

        // Persist without large blobs
        await window.saveGroupData();

        if (typeof window.showToast === 'function') {
          window.showToast('Photo added!');
        }

        // Clear inputs
        if (titleInput) titleInput.value = '';
        event.target.value = '';

        // Refresh thumbnails display using existing function
        if (typeof window.displayNightPhotos === 'function') {
          window.displayNightPhotos(nightIndex);
        }
      } catch (error) {
        console.error('[PhotoPatch] Error uploading night photo:', error);
        if (typeof window.showToast === 'function') {
          window.showToast('Error uploading photo', true);
        } else {
          alert('Error uploading photo: ' + (error && error.message ? error.message : error));
        }
      }
    };

    reader.readAsDataURL(file);
  };

  // --------------------------------------------------------------------------
  // PATCHED DISPLAY NIGHT PHOTOS
  // --------------------------------------------------------------------------
  // Ensure displayNightPhotos uses photo.url instead of photo.data.
  // We wrap/override only the rendering portion to avoid breaking other logic.
  // --------------------------------------------------------------------------

  const originalDisplayNightPhotos = window.displayNightPhotos;

  window.displayNightPhotos = function(nightIndex) {
    const container = document.getElementById('nightPhotoThumbnails');
    if (!container) {
      // If the container is missing, defer to original implementation (if any)
      if (typeof originalDisplayNightPhotos === 'function') {
        return originalDisplayNightPhotos(nightIndex);
      }
      return;
    }

    if (!window.groupData || !Array.isArray(window.groupData.nights)) {
      container.innerHTML = '<p>No night data loaded.</p>';
      return;
    }

    const night = window.groupData.nights[nightIndex];
    const photos = night && Array.isArray(night.photos) ? night.photos : [];

    if (photos.length === 0) {
      container.innerHTML = '<p>No photos yet</p>';
      return;
    }

    // Render using url field when available; fall back to data for legacy entries
    container.innerHTML = photos.map((photo, index) => {
      const src = photo.url || photo.data || '';
      const safeTitle = (photo.title || '').replace(/"/g, '&quot;');
      return (
        '<div class="photo-thumbnail" onclick="openLightbox(' + nightIndex + ', ' + index + ')">' +
          '<img src="' + src + '" alt="' + safeTitle + '">' +
          '<div class="photo-title">' + safeTitle + '</div>' +
        '</div>'
      );
    }).join('');
  };

  // --------------------------------------------------------------------------
  // LOG PATCH LOADING
  // --------------------------------------------------------------------------

  console.log('✅ V4 Photo Migration Patch loaded (Firebase Storage enabled for night photos).');

})();
