// ==========================================
// POKER NIGHT MANAGER - V6 ADMIN TOOLS
// ==========================================
// Add with: <script src="v6-admin-tools.js"></script>
// Adds admin utilities like password reset

(function() {
  'use strict';

  console.log('🔧 Loading V6 Admin Tools...');

  // ==========================================
  // PASSWORD HASHING (Same as used in index.html)
  // ==========================================

  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ==========================================
  // INJECT CSS
  // ==========================================

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* V6 Admin Tools Styles */
      .password-reset-section {
        margin-top: 20px;
        padding: 20px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
      }

      .password-input-group {
        display: flex;
        gap: 10px;
        margin-top: 10px;
      }

      .password-input-group input {
        flex: 1;
        padding: 10px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: white;
        font-size: 14px;
      }

      .password-strength {
        font-size: 12px;
        margin-top: 5px;
        padding: 5px 10px;
        border-radius: 4px;
      }

      .password-strength.weak {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }

      .password-strength.medium {
        background: rgba(245, 158, 11, 0.2);
        color: #f59e0b;
      }

      .password-strength.strong {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
      }
    `;
    document.head.appendChild(style);
  }

  // ==========================================
  // RESET PASSWORD MODAL
  // ==========================================

  function showResetPasswordModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'resetPasswordModal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px;">
        <h2>🔑 Reset Group Passwords</h2>
        <p style="color: rgba(255,255,255,0.7); margin-bottom: 20px;">
          Change the admin and/or viewer passwords for this group.
        </p>
        
        <div class="password-reset-section">
          <h3 style="margin-bottom: 15px;">Admin Password</h3>
          <div class="password-input-group">
            <input type="password" id="newAdminPassword" placeholder="New admin password (min 6 chars)">
            <button class="btn btn-secondary" onclick="
              const input = document.getElementById('newAdminPassword');
              input.type = input.type === 'password' ? 'text' : 'password';
            ">👁️</button>
          </div>
          <div id="adminPasswordStrength" class="password-strength" style="display: none;"></div>
        </div>
        
        <div class="password-reset-section">
          <h3 style="margin-bottom: 15px;">Viewer Password</h3>
          <div class="password-input-group">
            <input type="password" id="newViewerPassword" placeholder="New viewer password (min 6 chars)">
            <button class="btn btn-secondary" onclick="
              const input = document.getElementById('newViewerPassword');
              input.type = input.type === 'password' ? 'text' : 'password';
            ">👁️</button>
          </div>
          <div id="viewerPasswordStrength" class="password-strength" style="display: none;"></div>
        </div>
        
        <div style="background: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 15px; margin-top: 20px;">
          <p style="font-size: 0.9em; color: #f59e0b;">
            ⚠️ <strong>Important:</strong> Save your new passwords! You cannot recover them later.
          </p>
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="window.V6.submitPasswordReset()">Reset Passwords</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add password strength indicators
    document.getElementById('newAdminPassword').addEventListener('input', (e) => {
      updatePasswordStrength('admin', e.target.value);
    });
    
    document.getElementById('newViewerPassword').addEventListener('input', (e) => {
      updatePasswordStrength('viewer', e.target.value);
    });
  }

  function updatePasswordStrength(type, password) {
    const strengthDiv = document.getElementById(type + 'PasswordStrength');
    if (!password) {
      strengthDiv.style.display = 'none';
      return;
    }
    
    let strength = 'weak';
    let message = '❌ Weak - Need at least 6 characters';
    
    if (password.length >= 6) {
      strength = 'medium';
      message = '✓ OK - Minimum length met';
    }
    
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      strength = 'strong';
      message = '✅ Strong - Good password!';
    }
    
    strengthDiv.style.display = 'block';
    strengthDiv.className = 'password-strength ' + strength;
    strengthDiv.textContent = message;
  }

  async function submitPasswordReset() {
    const adminPassword = document.getElementById('newAdminPassword').value;
    const viewerPassword = document.getElementById('newViewerPassword').value;
    
    if (!adminPassword && !viewerPassword) {
      alert('Please enter at least one new password');
      return;
    }
    
    if (adminPassword && adminPassword.length < 6) {
      alert('Admin password must be at least 6 characters');
      return;
    }
    
    if (viewerPassword && viewerPassword.length < 6) {
      alert('Viewer password must be at least 6 characters');
      return;
    }
    
    if (!confirm('Reset passwords? Make sure you save the new passwords!')) {
      return;
    }
    
    const data = window.groupData || groupData;
    if (!data) {
      alert('Group data not loaded');
      return;
    }
    
    try {
      // Update admin password if provided
      if (adminPassword) {
        const hash = await hashPassword(adminPassword);
        data.adminPasswordHash = hash;
      }
      
      // Update viewer password if provided
      if (viewerPassword) {
        const hash = await hashPassword(viewerPassword);
        data.viewerPasswordHash = hash;
      }
      
      // Save to Firestore
      if (window.saveGroupData) {
        await window.saveGroupData();
      }
      
      // Show success message
      const successModal = document.createElement('div');
      successModal.className = 'modal active';
      successModal.innerHTML = `
        <div class="modal-content" style="max-width: 450px; text-align: center;">
          <h2 style="color: #10b981;">✅ Passwords Updated!</h2>
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 20px; margin: 20px 0;">
            ${adminPassword ? `<p><strong>New Admin Password:</strong> ${adminPassword}</p>` : ''}
            ${viewerPassword ? `<p style="margin-top: 10px;"><strong>New Viewer Password:</strong> ${viewerPassword}</p>` : ''}
          </div>
          <p style="color: #f59e0b; font-size: 0.9em; margin-bottom: 20px;">
            📝 Save these passwords now! You cannot recover them later.
          </p>
          <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Done</button>
        </div>
      `;
      
      document.getElementById('resetPasswordModal').remove();
      document.body.appendChild(successModal);
      
    } catch (error) {
      console.error('Password reset error:', error);
      alert('Failed to reset passwords: ' + error.message);
    }
  }

  // ==========================================
  // ADD TO SETTINGS/MENU
  // ==========================================

  function addResetPasswordButton() {
    // Try to find settings modal or create a menu item
    const settingsModal = document.getElementById('settingsModal');
    
    if (settingsModal) {
      // Add to existing settings modal
      const modalContent = settingsModal.querySelector('.modal-content');
      if (modalContent && !document.getElementById('resetPasswordBtn')) {
        const resetSection = document.createElement('div');
        resetSection.id = 'resetPasswordBtn';
        resetSection.className = 'form-group';
        resetSection.style.marginTop = '20px';
        resetSection.style.paddingTop = '20px';
        resetSection.style.borderTop = '1px solid rgba(255, 255, 255, 0.1)';
        resetSection.innerHTML = `
          <h3>🔑 Password Management</h3>
          <p style="font-size: 0.9em; color: rgba(255,255,255,0.6); margin: 10px 0;">
            Reset admin or viewer passwords for this group
          </p>
          <button class="btn btn-secondary" onclick="window.V6.showResetPasswordModal()">
            Reset Passwords
          </button>
        `;
        modalContent.appendChild(resetSection);
      }
    } else {
      // Create a floating button in header if no settings
      const header = document.querySelector('.header-right');
      if (header && !document.getElementById('resetPasswordFloatingBtn')) {
        const resetBtn = document.createElement('div');
        resetBtn.id = 'resetPasswordFloatingBtn';
        resetBtn.className = 'icon-btn';
        resetBtn.title = 'Reset Passwords';
        resetBtn.innerHTML = '🔑';
        resetBtn.onclick = () => showResetPasswordModal();
        header.insertBefore(resetBtn, header.firstChild);
      }
    }
  }

  // ==========================================
  // PUBLIC API
  // ==========================================

  window.V6 = {
    showResetPasswordModal,
    submitPasswordReset
  };

  // ==========================================
  // INITIALIZE
  // ==========================================

  function initialize() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        injectStyles();
        setTimeout(addResetPasswordButton, 1000); // Wait for settings modal to exist
        console.log('✅ V6 Admin Tools loaded');
      });
    } else {
      injectStyles();
      setTimeout(addResetPasswordButton, 1000);
      console.log('✅ V6 Admin Tools loaded');
    }
  }

  initialize();

})();
