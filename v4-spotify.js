// ============================================================================
// V4 ENHANCEMENTS - SPOTIFY INTEGRATION (MANUAL PLAYLIST)
// ============================================================================
// This module adds Spotify music integration to V3 stable
// - Manual playlist setup (admin pastes Spotify playlist URL)
// - Song request system (anyone can request songs)
// - Admin approval workflow (approve/reject/delete requests)
// - Embedded Spotify player
// - Works in both admin and viewer modes
// - Ready to upgrade to full API when Spotify reopens
// ============================================================================

(function() {
  'use strict';

  // ============================================================================
  // SPOTIFY UTILITIES
  // ============================================================================

  function extractPlaylistId(url) {
    // Extract playlist ID from various Spotify URL formats
    // https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
    // spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
    const patterns = [
      /playlist\/([a-zA-Z0-9]+)/,
      /playlist:([a-zA-Z0-9]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  function generateRequestId() {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // ============================================================================
  // SPOTIFY PLAYLIST SETUP
  // ============================================================================

  window.openSpotifySetup = function() {
    const modal = document.getElementById('spotifySetupModal');
    if (!modal) return;

    // Pre-fill if playlist already exists
    const urlInput = document.getElementById('spotifyPlaylistUrl');
    const nameInput = document.getElementById('spotifyPlaylistName');
    
    if (window.groupData.spotify?.playlistUrl) {
      urlInput.value = window.groupData.spotify.playlistUrl;
    }
    if (window.groupData.spotify?.playlistName) {
      nameInput.value = window.groupData.spotify.playlistName;
    }

    modal.classList.add('active');
  };

  window.saveSpotifyPlaylist = async function() {
    const url = document.getElementById('spotifyPlaylistUrl').value.trim();
    const name = document.getElementById('spotifyPlaylistName').value.trim() || 'Poker Night Jams';

    if (!url) {
      showToast('Please enter a Spotify playlist URL', true);
      return;
    }

    const playlistId = extractPlaylistId(url);
    if (!playlistId) {
      showToast('Invalid Spotify playlist URL', true);
      return;
    }

    // Initialize spotify object if needed
    if (!window.groupData.spotify) {
      window.groupData.spotify = {
        songRequests: []
      };
    }

    window.groupData.spotify.playlistId = playlistId;
    window.groupData.spotify.playlistUrl = url;
    window.groupData.spotify.playlistName = name;
    window.groupData.spotify.createdAt = window.groupData.spotify.createdAt || new Date().toISOString();

    await window.saveGroupData();
    showToast('Spotify playlist connected! 🎵');
    closeModal('spotifySetupModal');
    
    // Refresh music tab
    if (document.getElementById('music').classList.contains('active')) {
      window.loadMusic();
    }
  };

  window.removeSpotifyPlaylist = async function() {
    if (!confirm('Remove Spotify playlist? (Song requests will be kept)')) return;

    window.groupData.spotify.playlistId = null;
    window.groupData.spotify.playlistUrl = null;
    window.groupData.spotify.playlistName = null;

    await window.saveGroupData();
    showToast('Spotify playlist removed');
    closeModal('spotifySetupModal');
    window.loadMusic();
  };

  // ============================================================================
  // SONG REQUEST FUNCTIONS
  // ============================================================================

  window.openSongRequestModal = function() {
    // Clear form
    document.getElementById('requestSongName').value = '';
    document.getElementById('requestArtist').value = '';
    document.getElementById('requestAlbum').value = '';
    document.getElementById('requestNotes').value = '';

    document.getElementById('songRequestModal').classList.add('active');
  };

  window.submitSongRequest = async function() {
    const songName = document.getElementById('requestSongName').value.trim();
    const artist = document.getElementById('requestArtist').value.trim();
    const album = document.getElementById('requestAlbum').value.trim();
    const notes = document.getElementById('requestNotes').value.trim();

    if (!songName || !artist) {
      showToast('Please enter song name and artist', true);
      return;
    }

    // Initialize spotify object if needed
    if (!window.groupData.spotify) {
      window.groupData.spotify = {
        songRequests: []
      };
    }
    if (!window.groupData.spotify.songRequests) {
      window.groupData.spotify.songRequests = [];
    }

    const request = {
      id: generateRequestId(),
      songName: songName,
      artist: artist,
      album: album,
      notes: notes,
      requestedBy: window.isAdmin ? 'Admin' : 'Viewer',
      requestedAt: new Date().toISOString(),
      status: 'pending' // pending, approved, rejected
    };

    window.groupData.spotify.songRequests.push(request);

    await window.saveGroupData();
    showToast('Song request submitted! 🎵');
    closeModal('songRequestModal');

    // Refresh music tab
    if (document.getElementById('music').classList.contains('active')) {
      window.loadMusic();
    }
  };

  window.approveSongRequest = async function(requestId) {
    const request = window.groupData.spotify.songRequests.find(r => r.id === requestId);
    if (!request) return;

    request.status = 'approved';
    request.approvedAt = new Date().toISOString();
    request.approvedBy = 'Admin';

    await window.saveGroupData();
    
    // Create Spotify search URL to help admin find and add the song
    const searchQuery = encodeURIComponent(`${request.songName} ${request.artist}`);
    const spotifySearchUrl = `https://open.spotify.com/search/${searchQuery}`;
    
    // Open Spotify search in new tab (admin can quickly add the song)
    window.open(spotifySearchUrl, '_blank');
    
    showToast('Song approved! Opening Spotify to add it... 🎵');
    window.loadMusic();
  };

  window.rejectSongRequest = async function(requestId) {
    const request = window.groupData.spotify.songRequests.find(r => r.id === requestId);
    if (!request) return;

    request.status = 'rejected';
    request.rejectedAt = new Date().toISOString();
    request.rejectedBy = 'Admin';

    await window.saveGroupData();
    showToast('Song request rejected');
    window.loadMusic();
  };

  window.deleteSongRequest = async function(requestId) {
    if (!confirm('Delete this song request?')) return;

    const index = window.groupData.spotify.songRequests.findIndex(r => r.id === requestId);
    if (index === -1) return;

    window.groupData.spotify.songRequests.splice(index, 1);

    await window.saveGroupData();
    showToast('Song request deleted');
    window.loadMusic();
  };

  // ============================================================================
  // MUSIC TAB LOADING
  // ============================================================================

  window.loadMusic = function() {
    const container = document.getElementById('musicContent');
    if (!container) return;

    const hasPlaylist = window.groupData.spotify?.playlistId;
    const requests = window.groupData.spotify?.songRequests || [];

    let html = '';

    // Playlist Section
    if (hasPlaylist) {
      const playlistId = window.groupData.spotify.playlistId;
      const playlistName = window.groupData.spotify.playlistName || 'Poker Night Jams';
      
      html += `
        <div class="glass-card">
          <div class="card-header">
            <div class="card-title">🎵 ${playlistName}</div>
            ${window.isAdmin ? `<button class="btn btn-secondary btn-small" onclick="openSpotifySetup()">⚙️ Settings</button>` : ''}
          </div>
          <div style="background:rgba(0,0,0,0.3); border-radius:12px; overflow:hidden;">
            <iframe 
              style="border-radius:12px;" 
              src="https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0" 
              width="100%" 
              height="380" 
              frameBorder="0" 
              allowfullscreen="" 
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy">
            </iframe>
          </div>
          <div style="margin-top:12px; display:flex; gap:10px; align-items:center;">
            <a href="${window.groupData.spotify.playlistUrl}" 
               target="_blank" 
               class="btn btn-primary" 
               style="text-decoration:none; flex:1; text-align:center;">
              🎵 Open in Spotify App
            </a>
            <div style="font-size:11px; color:var(--text-secondary); flex:2;">
              For full playback, open in Spotify app or log into Spotify in your browser
            </div>
          </div>
          <div style="margin-top:12px; padding:12px; background:rgba(99,102,241,0.1); border:1px solid var(--accent-purple); border-radius:8px; font-size:13px; color:var(--text-secondary);">
            <strong>💡 How it works:</strong> Players request songs below → Admin approves → Admin manually adds approved songs to the Spotify playlist → Everyone enjoys the music! 🎉
          </div>
        </div>
      `;
    } else {
      // No playlist setup yet
      html += `
        <div class="glass-card">
          <div style="text-align:center; padding:40px;">
            <div style="font-size:64px; margin-bottom:15px;">🎵</div>
            <div style="font-size:20px; font-weight:700; color:var(--text-primary); margin-bottom:10px;">No Spotify Playlist Connected</div>
            <div style="font-size:14px; color:var(--text-secondary); margin-bottom:20px;">
              ${window.isAdmin 
                ? 'Create a playlist in Spotify, then connect it here to start collecting song requests!' 
                : 'Ask your admin to set up a Spotify playlist to start requesting songs!'}
            </div>
            ${window.isAdmin ? `
              <button class="btn btn-primary" onclick="openSpotifySetup()">
                🎵 Connect Spotify Playlist
              </button>
              <div style="margin-top:15px; font-size:12px; color:var(--text-secondary);">
                <strong>Quick Setup:</strong> Create a playlist in Spotify → Copy the share link → Paste it here
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    // Song Requests Section
    html += `
      <div class="glass-card" style="margin-top:20px;">
        <div class="card-header">
          <div class="card-title">Song Requests</div>
          <button class="btn btn-primary btn-small" onclick="openSongRequestModal()">+ Request Song</button>
        </div>
    `;

    if (requests.length === 0) {
      html += `
        <div style="text-align:center; padding:30px; color:var(--text-secondary);">
          <div style="font-size:48px; margin-bottom:10px;">🎤</div>
          <div style="font-size:14px;">No song requests yet</div>
          <div style="font-size:12px; margin-top:6px;">Be the first to request a song!</div>
        </div>
      `;
    } else {
      // Filter buttons
      html += `
        <div style="display:flex; gap:8px; margin-bottom:15px; flex-wrap:wrap;">
          <button class="btn btn-small btn-secondary music-filter-btn active" onclick="filterSongRequests('all')">All (${requests.length})</button>
          <button class="btn btn-small btn-secondary music-filter-btn" onclick="filterSongRequests('pending')">Pending (${requests.filter(r => r.status === 'pending').length})</button>
          <button class="btn btn-small btn-secondary music-filter-btn" onclick="filterSongRequests('approved')">Approved (${requests.filter(r => r.status === 'approved').length})</button>
          <button class="btn btn-small btn-secondary music-filter-btn" onclick="filterSongRequests('rejected')">Rejected (${requests.filter(r => r.status === 'rejected').length})</button>
        </div>
      `;

      // Song requests list
      html += `<div id="songRequestsList">`;
      
      // Sort by newest first
      const sortedRequests = [...requests].sort((a, b) => 
        new Date(b.requestedAt) - new Date(a.requestedAt)
      );

      sortedRequests.forEach(request => {
        const date = new Date(request.requestedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        });

        let statusBadge = '';
        if (request.status === 'pending') {
          statusBadge = '<span style="background:rgba(245,158,11,0.2); color:var(--warning); padding:4px 8px; border-radius:6px; font-size:11px; font-weight:600;">⏳ PENDING</span>';
        } else if (request.status === 'approved') {
          statusBadge = '<span style="background:rgba(16,185,129,0.2); color:var(--success); padding:4px 8px; border-radius:6px; font-size:11px; font-weight:600;">✓ APPROVED</span>';
        } else if (request.status === 'rejected') {
          statusBadge = '<span style="background:rgba(239,68,68,0.2); color:var(--error); padding:4px 8px; border-radius:6px; font-size:11px; font-weight:600;">✗ REJECTED</span>';
        }

        html += `
          <div class="song-request-item" data-status="${request.status}" style="background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:12px; padding:15px; margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
              <div style="flex:1;">
                <div style="font-size:16px; font-weight:700; color:var(--text-primary); margin-bottom:4px;">
                  ${request.songName}
                </div>
                <div style="font-size:14px; color:var(--accent-cyan); margin-bottom:6px;">
                  ${request.artist}${request.album ? ` • ${request.album}` : ''}
                </div>
                ${request.notes ? `
                  <div style="font-size:12px; color:var(--text-secondary); font-style:italic; margin-bottom:6px;">
                    "${request.notes}"
                  </div>
                ` : ''}
                <div style="font-size:11px; color:var(--text-secondary);">
                  Requested by ${request.requestedBy} • ${date}
                </div>
              </div>
              <div style="margin-left:15px;">
                ${statusBadge}
              </div>
            </div>
            
            ${window.isAdmin ? `
              <div style="display:flex; gap:8px; margin-top:12px; padding-top:12px; border-top:1px solid var(--glass-border);">
                ${request.status === 'pending' ? `
                  <button class="btn btn-small" 
                          style="background:rgba(16,185,129,0.2); border:1px solid var(--success); color:var(--success);"
                          onclick="approveSongRequest('${request.id}')">
                    ✓ Approve
                  </button>
                  <button class="btn btn-small btn-danger" 
                          onclick="rejectSongRequest('${request.id}')">
                    ✗ Reject
                  </button>
                ` : request.status === 'approved' ? `
                  <button class="btn btn-small btn-primary" 
                          onclick="window.open('https://open.spotify.com/search/${encodeURIComponent(request.songName + ' ' + request.artist)}', '_blank')">
                    ➕ Add to Playlist in Spotify
                  </button>
                ` : ''}
                <button class="btn btn-small btn-danger" 
                        onclick="deleteSongRequest('${request.id}')">
                  🗑️ Delete
                </button>
              </div>
            ` : ''}
          </div>
        `;
      });

      html += `</div>`; // End songRequestsList
    }

    html += `</div>`; // End glass-card

    container.innerHTML = html;
  };

  window.filterSongRequests = function(status) {
    // Update filter buttons
    document.querySelectorAll('.music-filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Filter items
    const items = document.querySelectorAll('.song-request-item');
    items.forEach(item => {
      if (status === 'all' || item.dataset.status === status) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  };

  // ============================================================================
  // NIGHT MODAL INTEGRATION
  // ============================================================================

  function injectNightMusicButton() {
    const modal = document.getElementById('addNightModal');
    if (!modal) return;

    const modalContent = modal.querySelector('.modal-content');
    if (!modalContent) return;

    // Check if already injected
    if (document.getElementById('nightMusicButton')) return;

    // Find the photo section or notes section
    const photoSection = document.getElementById('nightPhotoSection');
    const notesGroup = Array.from(modalContent.querySelectorAll('.form-group')).find(group => {
      const label = group.querySelector('.form-label');
      return label && label.textContent.includes('Notes');
    });

    const targetSection = photoSection || notesGroup;
    if (!targetSection) return;

    // Create music button
    const musicButton = document.createElement('div');
    musicButton.id = 'nightMusicButton';
    musicButton.style.marginTop = '15px';
    musicButton.innerHTML = `
      <button type="button" 
              class="btn btn-secondary" 
              onclick="openSongRequestModal(); closeModal('addNightModal');"
              style="width:100%;">
        🎵 Request Song for Playlist
      </button>
      <div style="font-size:11px; color:var(--text-secondary); text-align:center; margin-top:6px;">
        View all requests in the Music tab
      </div>
    `;

    // Insert after target section
    targetSection.parentNode.insertBefore(musicButton, targetSection.nextSibling);
  }

  // ============================================================================
  // UI INJECTION
  // ============================================================================

  function injectMusicTab() {
    // Check if tab already exists
    if (document.getElementById('music')) return;

    // Add Music tab button
    const tabs = document.querySelector('.tabs');
    if (tabs) {
      const musicTab = document.createElement('div');
      musicTab.className = 'tab';
      musicTab.textContent = '🎵 Music';
      musicTab.onclick = () => window.switchTab('music');
      tabs.appendChild(musicTab);
    }

    // Add Music tab content
    const container = document.querySelector('.container');
    if (container) {
      const musicContent = document.createElement('div');
      musicContent.id = 'music';
      musicContent.className = 'tab-content';
      musicContent.innerHTML = '<div id="musicContent"></div>';
      container.appendChild(musicContent);
    }
  }

  function injectSpotifyModals() {
    // Check if already exists
    if (document.getElementById('spotifySetupModal')) return;

    const modalsHTML = `
      <!-- Spotify Setup Modal -->
      <div id="spotifySetupModal" class="modal">
        <div class="modal-overlay" onclick="closeModal('spotifySetupModal')"></div>
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-title">🎵 Spotify Playlist Setup</div>
            <button onclick="closeModal('spotifySetupModal')" class="modal-close">×</button>
          </div>

          <div class="form-group">
            <label class="form-label">Playlist Name</label>
            <input type="text" 
                   id="spotifyPlaylistName" 
                   class="form-input" 
                   placeholder="e.g., Poker Night Jams">
          </div>

          <div class="form-group">
            <label class="form-label">Spotify Playlist URL</label>
            <input type="text" 
                   id="spotifyPlaylistUrl" 
                   class="form-input" 
                   placeholder="https://open.spotify.com/playlist/...">
            <div style="font-size:11px; color:var(--text-secondary); margin-top:6px;">
              💡 Open Spotify → Create/find playlist → Click Share → Copy link → Paste here
            </div>
          </div>

          <div style="display:flex; gap:10px;">
            <button class="btn btn-primary" onclick="saveSpotifyPlaylist()">Save Playlist</button>
            <button class="btn btn-secondary" onclick="closeModal('spotifySetupModal')">Cancel</button>
            ${window.groupData?.spotify?.playlistId ? `
              <button class="btn btn-danger" onclick="removeSpotifyPlaylist()">Remove Playlist</button>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Song Request Modal -->
      <div id="songRequestModal" class="modal">
        <div class="modal-overlay" onclick="closeModal('songRequestModal')"></div>
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-title">🎤 Request a Song</div>
            <button onclick="closeModal('songRequestModal')" class="modal-close">×</button>
          </div>

          <div class="form-group">
            <label class="form-label">Song Name *</label>
            <input type="text" 
                   id="requestSongName" 
                   class="form-input" 
                   placeholder="e.g., Bohemian Rhapsody">
          </div>

          <div class="form-group">
            <label class="form-label">Artist *</label>
            <input type="text" 
                   id="requestArtist" 
                   class="form-input" 
                   placeholder="e.g., Queen">
          </div>

          <div class="form-group">
            <label class="form-label">Album (Optional)</label>
            <input type="text" 
                   id="requestAlbum" 
                   class="form-input" 
                   placeholder="e.g., A Night at the Opera">
          </div>

          <div class="form-group">
            <label class="form-label">Notes (Optional)</label>
            <textarea id="requestNotes" 
                      class="form-textarea" 
                      rows="2" 
                      placeholder="Any special notes about this request..."></textarea>
          </div>

          <div style="display:flex; gap:10px;">
            <button class="btn btn-primary" onclick="submitSongRequest()">🎵 Submit Request</button>
            <button class="btn btn-secondary" onclick="closeModal('songRequestModal')">Cancel</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalsHTML);
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  function initSpotifyIntegration() {
    console.log('Initializing V4 Spotify Integration...');

    // Check if we're in admin or viewer mode
    window.isAdmin = typeof saveNight === 'function'; // Only admin has saveNight

    // Inject UI elements
    injectMusicTab();
    injectSpotifyModals();
    injectNightMusicButton();

    // Hook into tab switching
    const originalSwitchTab = window.switchTab;
    window.switchTab = function(tabName) {
      originalSwitchTab(tabName);
      if (tabName === 'music') {
        window.loadMusic();
      }
    };

    console.log('V4 Spotify Integration loaded successfully!');
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
    if (window.groupData && document.querySelector('.tabs')) {
      initSpotifyIntegration();
    } else {
      setTimeout(checkReady, 100);
    }
  }

  waitForReady();

})();
