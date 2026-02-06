// ==========================================
// POKER NIGHT MANAGER - V4 VOTING SYSTEM
// ==========================================
// Add with: <script src="v4-voting.js"></script>
// Requires: v4-enhancements.js (for styling compatibility)

(function() {
  'use strict';

  console.log('🗳️ Loading V4 Voting System...');

  // ==========================================
  // STATE
  // ==========================================
  
  let currentPollId = null;

  // ==========================================
  // INJECT CSS
  // ==========================================

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* V5 Voting System Styles */
      
      #polls {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }

      .poll-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 25px;
        margin-bottom: 20px;
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .poll-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      }

      .poll-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
      }

      .poll-title {
        font-size: 1.4em;
        font-weight: 600;
        margin-bottom: 8px;
      }

      .poll-meta {
        font-size: 0.9em;
        color: rgba(255, 255, 255, 0.6);
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
      }

      .poll-status {
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .poll-status.open {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
      }

      .poll-status.closed {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.6);
      }

      .poll-options {
        margin: 20px 0;
      }

      .poll-option {
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid transparent;
        border-radius: 12px;
        padding: 15px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .poll-option:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(99, 102, 241, 0.5);
      }

      .poll-option.selected {
        background: rgba(99, 102, 241, 0.2);
        border-color: #6366f1;
      }

      .poll-option.winner {
        background: rgba(16, 185, 129, 0.2);
        border-color: #10b981;
      }

      .poll-option-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      .poll-option-text {
        font-size: 1.1em;
        font-weight: 500;
      }

      .poll-option-bar {
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
        margin: 10px 0;
      }

      .poll-option-fill {
        height: 100%;
        background: linear-gradient(90deg, #6366f1, #06b6d4);
        transition: width 0.5s ease;
      }

      .poll-option-stats {
        display: flex;
        justify-content: space-between;
        font-size: 0.95em;
        color: rgba(255, 255, 255, 0.7);
      }

      .poll-option-percentage {
        font-weight: 600;
        color: #6366f1;
      }

      .poll-voters {
        font-size: 0.85em;
        color: rgba(255, 255, 255, 0.5);
        font-style: italic;
        margin-top: 8px;
      }

      .poll-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .add-option-input {
        display: flex;
        gap: 10px;
        margin-top: 15px;
        padding: 15px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
      }

      .add-option-input input {
        flex: 1;
        padding: 10px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: white;
        font-size: 14px;
      }

      .poll-type-badge {
        display: inline-block;
        padding: 4px 10px;
        background: rgba(99, 102, 241, 0.2);
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        color: #6366f1;
      }

      @media (max-width: 768px) {
        .poll-header {
          flex-direction: column;
          gap: 10px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ==========================================
  // INJECT HTML
  // ==========================================

  function injectHTML() {
    // Add Polls Tab
    const tabButtons = document.querySelector('.tabs');
    if (tabButtons && !document.querySelector('.tab[onclick*="polls"]')) {
      const pollsTab = document.createElement('div');
      pollsTab.className = 'tab';
      pollsTab.innerHTML = '📊 Polls';
      pollsTab.setAttribute('onclick', "switchTab('polls')");
      tabButtons.appendChild(pollsTab);
    }

    // Add Polls Tab Content
    const tabContainer = document.querySelector('.tab-container') || document.body;
    if (!document.getElementById('polls')) {
      const pollsContent = document.createElement('div');
      pollsContent.id = 'polls';
      pollsContent.className = 'tab-content';
      
      // Check if viewer mode
      const isViewer = document.title.includes('Viewer') || window.location.href.includes('viewer.html');
      
      pollsContent.innerHTML = `
        <div class="tab-header" style="display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 30px;">
          <h2 style="margin-bottom: 15px;">📊 Polls & Voting</h2>
          ${!isViewer ? '<button class="btn btn-primary" onclick="window.V4.createPoll()">➕ Create Poll</button>' : ''}
        </div>
        <div id="pollsList"></div>
      `;
      tabContainer.appendChild(pollsContent);
    }
  }

  // ==========================================
  // CREATE POLL
  // ==========================================

  function createPoll() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'createPollModal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <h2>📊 Create Poll</h2>
        
        <div class="form-group">
          <label>Poll Question</label>
          <input type="text" id="pollQuestion" class="form-input" placeholder="e.g., When should we play next?" style="width: 100%;">
        </div>
        
        <div class="form-group">
          <label>Poll Type</label>
          <select id="pollType" class="form-select" style="width: 100%;">
            <option value="single">Single Choice (pick one)</option>
            <option value="multiple">Multiple Choice (pick many)</option>
            <option value="open">Open (voters can add options)</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Options</label>
          <div id="pollOptionsContainer"></div>
          <button type="button" class="btn btn-secondary" onclick="window.V4.addPollOptionInput()">+ Add Option</button>
        </div>
        
        <div class="form-group">
          <label>
            <input type="checkbox" id="pollAnonymous">
            Anonymous voting (hide who voted)
          </label>
        </div>
        
        <div class="form-group">
          <label>Close poll automatically (optional)</label>
          <input type="datetime-local" id="pollClosingDate" class="form-input" style="width: 100%;">
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="window.V4.submitPoll()">Create Poll</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add 3 default option inputs
    for (let i = 0; i < 3; i++) {
      addPollOptionInput();
    }
    
    // Focus on question
    setTimeout(() => document.getElementById('pollQuestion').focus(), 100);
  }

  function addPollOptionInput() {
    const container = document.getElementById('pollOptionsContainer');
    if (!container) return;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-input poll-option-input';
    input.placeholder = `Option ${container.children.length + 1}`;
    input.style.width = '100%';
    input.style.marginBottom = '10px';
    container.appendChild(input);
  }

  async function submitPoll() {
    const question = document.getElementById('pollQuestion').value.trim();
    const type = document.getElementById('pollType').value;
    const anonymous = document.getElementById('pollAnonymous').checked;
    const closingDate = document.getElementById('pollClosingDate').value;
    
    if (!question) {
      alert('Please enter a poll question');
      return;
    }
    
    const optionInputs = document.querySelectorAll('.poll-option-input');
    const options = Array.from(optionInputs)
      .map(input => input.value.trim())
      .filter(v => v);
    
    if (options.length < 2 && type !== 'open') {
      alert('Please enter at least 2 options');
      return;
    }
    
    const data = window.groupData || groupData;
    if (!data.polls) data.polls = [];
    
    const poll = {
      id: 'poll_' + Date.now(),
      question,
      type,
      createdBy: localStorage.getItem('currentUserName') || 'Admin',
      createdAt: new Date().toISOString(),
      options: options.map((text, i) => ({
        id: 'opt_' + Date.now() + '_' + i,
        text,
        votes: [],
        voters: []
      })),
      settings: {
        anonymous,
        closingDate: closingDate || null
      },
      status: 'open'
    };
    
    data.polls.push(poll);
    
    if (window.saveGroupData) {
      await window.saveGroupData();
    }
    
    document.getElementById('createPollModal').remove();
    loadPolls();
    alert('Poll created!');
  }

  // ==========================================
  // DISPLAY POLLS
  // ==========================================

  function loadPolls() {
    const data = window.groupData || groupData;
    if (!data) return;
    
    if (!data.polls) data.polls = [];
    
    const container = document.getElementById('pollsList');
    if (!container) return;
    
    if (data.polls.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px; color: rgba(255,255,255,0.4);">
          <div style="font-size: 64px; margin-bottom: 15px;">📊</div>
          <p style="font-size: 1.2em;">No polls yet</p>
          <p style="margin-top: 10px; font-size: 0.9em;">Create a poll to get feedback from your group</p>
        </div>
      `;
      return;
    }
    
    // Sort by date (newest first)
    const sorted = [...data.polls].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    container.innerHTML = sorted.map(poll => renderPollCard(poll)).join('');
  }

  function renderPollCard(poll) {
    const data = window.groupData || groupData;
    const currentUser = localStorage.getItem('currentUserName') || 'Viewer';
    
    // Check if admin mode (look for role in localStorage or check if admin.html)
    const isAdmin = localStorage.getItem('userRole') === 'admin' || 
                     document.title.includes('Admin') ||
                     window.location.href.includes('admin.html');
    
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
    const hasVoted = poll.options.some(opt => opt.voters.includes(currentUser));
    
    // Check if poll should auto-close
    if (poll.status === 'open' && poll.settings.closingDate) {
      const now = new Date();
      const closeDate = new Date(poll.settings.closingDate);
      if (now > closeDate) {
        poll.status = 'closed';
        determineWinner(poll);
      }
    }
    
    return `
      <div class="poll-card">
        <div class="poll-header">
          <div>
            <h3 class="poll-title">${poll.question}</h3>
            <div class="poll-meta">
              <span>📝 ${poll.createdBy}</span>
              <span>📅 ${new Date(poll.createdAt).toLocaleDateString()}</span>
              <span class="poll-type-badge">${poll.type}</span>
              ${poll.settings.closingDate ? `<span>⏰ Closes ${new Date(poll.settings.closingDate).toLocaleDateString()}</span>` : ''}
              ${!poll.settings.anonymous ? '<span>👁️ Public</span>' : '<span>🔒 Anonymous</span>'}
            </div>
          </div>
          <span class="poll-status ${poll.status}">${poll.status}</span>
        </div>
        
        <div class="poll-options">
          ${poll.options.map(option => renderPollOption(poll, option, totalVotes, currentUser)).join('')}
        </div>
        
        ${poll.type === 'open' && poll.status === 'open' ? `
          <div class="add-option-input">
            <input type="text" id="newOption_${poll.id}" placeholder="Add your own option...">
            <button class="btn btn-secondary" onclick="window.V4.addCustomOption('${poll.id}')">Add</button>
          </div>
        ` : ''}
        
        ${isAdmin ? `
          <div class="poll-actions">
            ${poll.status === 'open' ? `
              <button class="btn btn-secondary btn-sm" onclick="window.V4.closePoll('${poll.id}')">Close Poll</button>
            ` : `
              <button class="btn btn-secondary btn-sm" onclick="window.V4.reopenPoll('${poll.id}')">Reopen Poll</button>
            `}
            <button class="btn btn-danger btn-sm" onclick="window.V4.deletePoll('${poll.id}')">Delete</button>
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderPollOption(poll, option, totalVotes, currentUser) {
    const percentage = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;
    const hasVoted = option.voters.includes(currentUser);
    const isWinner = poll.status === 'closed' && poll.winner === option.id;
    
    return `
      <div class="poll-option ${hasVoted ? 'selected' : ''} ${isWinner ? 'winner' : ''}" 
           onclick="${poll.status === 'open' ? `window.V4.vote('${poll.id}', '${option.id}')` : ''}">
        <div class="poll-option-header">
          <div class="poll-option-text">
            ${isWinner ? '🏆 ' : ''}${option.text}
          </div>
          ${poll.status === 'open' && hasVoted ? '<span style="color: #6366f1;">✓</span>' : ''}
        </div>
        <div class="poll-option-bar">
          <div class="poll-option-fill" style="width: ${percentage}%;"></div>
        </div>
        <div class="poll-option-stats">
          <span class="poll-option-percentage">${percentage}%</span>
          <span>${option.votes.length} vote${option.votes.length !== 1 ? 's' : ''}</span>
        </div>
        ${!poll.settings.anonymous && option.voters.length > 0 ? `
          <div class="poll-voters">Voted by: ${option.voters.join(', ')}</div>
        ` : ''}
      </div>
    `;
  }

  // ==========================================
  // VOTING
  // ==========================================

  async function vote(pollId, optionId) {
    const data = window.groupData || groupData;
    const poll = data.polls.find(p => p.id === pollId);
    if (!poll) return;
    
    if (poll.status !== 'open') {
      alert('This poll is closed');
      return;
    }
    
    const currentUser = localStorage.getItem('currentUserName') || 'Viewer';
    
    // For single choice, remove previous votes
    if (poll.type === 'single') {
      poll.options.forEach(opt => {
        const voterIndex = opt.voters.indexOf(currentUser);
        if (voterIndex > -1) {
          opt.voters.splice(voterIndex, 1);
          opt.votes.splice(voterIndex, 1);
        }
      });
    }
    
    // Add new vote
    const option = poll.options.find(opt => opt.id === optionId);
    if (!option) return;
    
    // Toggle vote for multiple choice
    const alreadyVoted = option.voters.includes(currentUser);
    if (alreadyVoted && poll.type === 'multiple') {
      // Remove vote
      const index = option.voters.indexOf(currentUser);
      option.voters.splice(index, 1);
      option.votes.splice(index, 1);
    } else if (!alreadyVoted) {
      // Add vote
      option.voters.push(currentUser);
      option.votes.push(currentUser);
    }
    
    if (window.saveGroupData) {
      await window.saveGroupData();
    }
    
    loadPolls();
  }

  async function addCustomOption(pollId) {
    const input = document.getElementById('newOption_' + pollId);
    const optionText = input.value.trim();
    
    if (!optionText) {
      alert('Please enter an option');
      return;
    }
    
    const data = window.groupData || groupData;
    const poll = data.polls.find(p => p.id === pollId);
    if (!poll) return;
    
    // Check if option already exists
    if (poll.options.some(opt => opt.text.toLowerCase() === optionText.toLowerCase())) {
      alert('This option already exists');
      return;
    }
    
    poll.options.push({
      id: 'opt_' + Date.now(),
      text: optionText,
      votes: [],
      voters: [],
      addedBy: localStorage.getItem('currentUserName') || 'Viewer'
    });
    
    if (window.saveGroupData) {
      await window.saveGroupData();
    }
    
    input.value = '';
    loadPolls();
  }

  // ==========================================
  // ADMIN ACTIONS
  // ==========================================

  async function closePoll(pollId) {
    if (!confirm('Close this poll? Results will be published.')) return;
    
    const data = window.groupData || groupData;
    const poll = data.polls.find(p => p.id === pollId);
    if (!poll) return;
    
    poll.status = 'closed';
    poll.closedAt = new Date().toISOString();
    determineWinner(poll);
    
    if (window.saveGroupData) {
      await window.saveGroupData();
    }
    
    loadPolls();
  }

  async function reopenPoll(pollId) {
    if (!confirm('Reopen this poll?')) return;
    
    const data = window.groupData || groupData;
    const poll = data.polls.find(p => p.id === pollId);
    if (!poll) return;
    
    poll.status = 'open';
    poll.winner = null;
    
    if (window.saveGroupData) {
      await window.saveGroupData();
    }
    
    loadPolls();
  }

  async function deletePoll(pollId) {
    if (!confirm('Delete this poll? This cannot be undone.')) return;
    
    const data = window.groupData || groupData;
    data.polls = data.polls.filter(p => p.id !== pollId);
    
    if (window.saveGroupData) {
      await window.saveGroupData();
    }
    
    loadPolls();
  }

  function determineWinner(poll) {
    const sorted = [...poll.options].sort((a, b) => b.votes.length - a.votes.length);
    if (sorted.length > 0 && sorted[0].votes.length > 0) {
      poll.winner = sorted[0].id;
    }
  }

  // ==========================================
  // HOOKS
  // ==========================================

  function hookIntoExistingCode() {
    const originalSwitchTab = window.switchTab;
    if (originalSwitchTab) {
      window.switchTab = function(tabName) {
        originalSwitchTab(tabName);
        if (tabName === 'polls') loadPolls();
      };
    }
  }

  // ==========================================
  // PUBLIC API
  // ==========================================

  window.V4 = {
    createPoll,
    addPollOptionInput,
    submitPoll,
    vote,
    addCustomOption,
    closePoll,
    reopenPoll,
    deletePoll,
    loadPolls
  };

  // ==========================================
  // INITIALIZE
  // ==========================================

  function initialize() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        injectStyles();
        injectHTML();
        hookIntoExistingCode();
        console.log('✅ V4 Voting System loaded');
      });
    } else {
      injectStyles();
      injectHTML();
      hookIntoExistingCode();
      console.log('✅ V5 Voting System loaded');
    }
  }

  initialize();

})();
