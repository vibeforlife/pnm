// ============================================================================
// V4 ENHANCEMENTS - POKER COACH
// ============================================================================
// This module adds poker assistance tools to V3 stable
// - AI table analysis (photo → strategic advice) - toggleable by admin
// - Pot odds calculator
// - Hand strength chart
// - Starting hands guide
// - Outs calculator
// All tools work offline, AI requires Anthropic API key
// ============================================================================

(function() {
  'use strict';

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
  // AI ANALYSIS FUNCTIONS
  // ============================================================================

  window.openAIAnalysis = function() {
    // Check if AI is enabled
    if (!window.groupData.pokerCoach?.aiEnabled) {
      showToast('AI Analysis is currently disabled by admin', true);
      return;
    }

    // Check if API key is configured
    if (!window.groupData.pokerCoach?.apiKey) {
      if (window.isAdmin) {
        showToast('Please add your Anthropic API key in Settings first', true);
        window.openPokerCoachSettings();
      } else {
        showToast('AI Analysis not configured. Ask your admin to set it up.', true);
      }
      return;
    }

    // Clear previous analysis
    document.getElementById('aiAnalysisResult').innerHTML = '';
    document.getElementById('aiPhotoPreview').innerHTML = '';
    
    document.getElementById('aiAnalysisModal').classList.add('active');
  };

  window.handleAIPhotoUpload = async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', true);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // Compress image before processing
        const compressedImage = await compressImage(e.target.result);
        
        // Show preview
        document.getElementById('aiPhotoPreview').innerHTML = `
          <img src="${compressedImage}" 
               style="width:100%; max-width:400px; border-radius:8px; border:1px solid var(--glass-border);">
        `;

        // Show analyzing state
        document.getElementById('aiAnalysisResult').innerHTML = `
          <div style="text-align:center; padding:30px;">
            <div style="font-size:48px; margin-bottom:15px;">🤔</div>
            <div style="font-size:16px; font-weight:600; color:var(--text-primary); margin-bottom:8px;">
              Analyzing your poker situation...
            </div>
            <div style="font-size:13px; color:var(--text-secondary);">
              This may take a few seconds
            </div>
          </div>
        `;

        await analyzePokerSituation(compressedImage);
      } catch (error) {
        console.error('AI Analysis error:', error);
        document.getElementById('aiAnalysisResult').innerHTML = `
          <div style="padding:20px; background:rgba(239,68,68,0.1); border:1px solid var(--error); border-radius:12px;">
            <div style="font-size:14px; font-weight:600; color:var(--error); margin-bottom:8px;">
              ❌ Analysis Failed
            </div>
            <div style="font-size:12px; color:var(--text-secondary);">
              ${error.message || 'Could not analyze image. Please check your API key and try again.'}
            </div>
          </div>
        `;
      }
    };
    reader.readAsDataURL(file);
  };

  async function analyzePokerSituation(base64Image) {
    const apiKey = window.groupData.pokerCoach.apiKey;
    
    // Remove data:image/...;base64, prefix if present
    const imageData = base64Image.split(',')[1] || base64Image;

    try {
      // Call Firebase Cloud Function instead of direct API
      const analyzeFunction = window.firebase.functions().httpsCallable('analyzePokerHand');
      const result = await analyzeFunction({
        imageData: imageData,
        apiKey: apiKey
      });

      if (!result.data.success) {
        throw new Error(result.data.error || 'Analysis failed');
      }

      const analysis = result.data.analysis;

      // Display the analysis
      document.getElementById('aiAnalysisResult').innerHTML = `
        <div style="padding:20px; background:rgba(99,102,241,0.1); border:1px solid var(--accent-purple); border-radius:12px;">
          <div style="font-size:14px; font-weight:600; color:var(--accent-cyan); margin-bottom:12px;">
            🤖 AI Analysis
          </div>
          <div style="font-size:13px; color:var(--text-primary); line-height:1.6; white-space:pre-wrap;">
${analysis}
          </div>
        </div>
        <div style="margin-top:12px; padding:12px; background:rgba(245,158,11,0.1); border:1px solid var(--warning); border-radius:8px; font-size:11px; color:var(--text-secondary);">
          ⚠️ <strong>Reminder:</strong> AI analysis is for learning and casual games. Using AI in tournaments or serious money games may be unethical.
        </div>
      `;
    } catch (error) {
      console.error('Firebase function error:', error);
      throw new Error(error.message || 'Analysis failed');
    }
  }

  // ============================================================================
  // QUICK TOOLS - POT ODDS CALCULATOR
  // ============================================================================

  window.calculatePotOdds = function() {
    const potSize = parseFloat(document.getElementById('potSize').value) || 0;
    const betSize = parseFloat(document.getElementById('betSize').value) || 0;

    if (potSize <= 0 || betSize <= 0) {
      document.getElementById('potOddsResult').innerHTML = `
        <div style="text-align:center; padding:20px; color:var(--text-secondary); font-size:13px;">
          Enter pot size and bet size to calculate
        </div>
      `;
      return;
    }

    const totalPot = potSize + betSize;
    const potOdds = betSize / totalPot;
    const potOddsPercent = (potOdds * 100).toFixed(1);
    const potOddsRatio = `${betSize}:${totalPot}`;
    
    // Calculate required equity
    const requiredEquity = potOddsPercent;

    // Determine recommendation
    let recommendation = '';
    if (potOddsPercent < 20) {
      recommendation = '🟢 Very favorable odds - usually worth calling with any draw';
    } else if (potOddsPercent < 33) {
      recommendation = '🟡 Good odds - call with strong draws (8+ outs)';
    } else if (potOddsPercent < 50) {
      recommendation = '🟠 Marginal odds - need strong hand or draw';
    } else {
      recommendation = '🔴 Poor odds - fold unless you have a very strong hand';
    }

    document.getElementById('potOddsResult').innerHTML = `
      <div style="padding:20px; background:rgba(99,102,241,0.1); border:1px solid var(--accent-purple); border-radius:12px;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:15px;">
          <div>
            <div style="font-size:11px; color:var(--text-secondary); text-transform:uppercase; margin-bottom:4px;">Pot Odds</div>
            <div style="font-size:24px; font-weight:700; color:var(--accent-cyan);">${potOddsPercent}%</div>
            <div style="font-size:12px; color:var(--text-secondary);">${potOddsRatio}</div>
          </div>
          <div>
            <div style="font-size:11px; color:var(--text-secondary); text-transform:uppercase; margin-bottom:4px;">Required Equity</div>
            <div style="font-size:24px; font-weight:700; color:var(--accent-cyan);">${requiredEquity}%</div>
            <div style="font-size:12px; color:var(--text-secondary);">To break even</div>
          </div>
        </div>
        <div style="padding:12px; background:rgba(0,0,0,0.2); border-radius:8px; font-size:13px; color:var(--text-primary);">
          ${recommendation}
        </div>
      </div>
    `;
  };

  // ============================================================================
  // QUICK TOOLS - OUTS CALCULATOR
  // ============================================================================

  window.calculateOuts = function() {
    const outs = parseInt(document.getElementById('outsCount').value) || 0;
    const street = document.getElementById('streetSelect').value;

    if (outs <= 0 || outs > 47) {
      document.getElementById('outsResult').innerHTML = `
        <div style="text-align:center; padding:20px; color:var(--text-secondary); font-size:13px;">
          Enter number of outs (1-47)
        </div>
      `;
      return;
    }

    let winPercent, oddsRatio;
    
    if (street === 'flop') {
      // Two cards to come
      winPercent = (1 - Math.pow((47 - outs) / 47, 2)) * 100;
      oddsRatio = `${(47 - outs).toFixed(0)}:${outs}`;
    } else {
      // One card to come (turn or river)
      winPercent = (outs / 46) * 100;
      oddsRatio = `${(46 - outs).toFixed(0)}:${outs}`;
    }

    // Common draw types
    const drawTypes = {
      15: 'Flush draw + straight draw',
      12: 'Flush draw + pair draw',
      9: 'Flush draw',
      8: 'Open-ended straight draw',
      4: 'Gutshot straight draw',
      6: 'Two overcards',
      2: 'Pocket pair to set'
    };

    const drawType = drawTypes[outs] || '';

    document.getElementById('outsResult').innerHTML = `
      <div style="padding:20px; background:rgba(99,102,241,0.1); border:1px solid var(--accent-purple); border-radius:12px;">
        ${drawType ? `<div style="font-size:13px; font-weight:600; color:var(--accent-cyan); margin-bottom:12px;">📊 ${drawType}</div>` : ''}
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
          <div>
            <div style="font-size:11px; color:var(--text-secondary); text-transform:uppercase; margin-bottom:4px;">Win Probability</div>
            <div style="font-size:24px; font-weight:700; color:var(--accent-cyan);">${winPercent.toFixed(1)}%</div>
          </div>
          <div>
            <div style="font-size:11px; color:var(--text-secondary); text-transform:uppercase; margin-bottom:4px;">Odds Against</div>
            <div style="font-size:24px; font-weight:700; color:var(--accent-cyan);">${oddsRatio}</div>
          </div>
        </div>
      </div>
    `;
  };

  // ============================================================================
  // QUICK TOOLS - HAND STRENGTH CHART
  // ============================================================================

  function loadHandStrengthChart() {
    // Helper function to colorize suits
    const colorSuits = (str) => {
      return str
        .replace(/♠/g, '<span style="color:#f8fafc;">♠</span>')
        .replace(/♣/g, '<span style="color:#f8fafc;">♣</span>')
        .replace(/♥/g, '<span style="color:#ef4444;">♥</span>')
        .replace(/♦/g, '<span style="color:#ef4444;">♦</span>');
    };
    
    const hands = [
      { name: 'Royal Flush', example: 'A♠ K♠ Q♠ J♠ 10♠', rank: 1, color: '#10b981' },
      { name: 'Straight Flush', example: '9♥ 8♥ 7♥ 6♥ 5♥', rank: 2, color: '#10b981' },
      { name: 'Four of a Kind', example: 'K♣ K♦ K♥ K♠ 3♣', rank: 3, color: '#06b6d4' },
      { name: 'Full House', example: 'Q♠ Q♦ Q♣ 7♥ 7♦', rank: 4, color: '#06b6d4' },
      { name: 'Flush', example: 'A♦ J♦ 9♦ 6♦ 3♦', rank: 5, color: '#6366f1' },
      { name: 'Straight', example: '10♣ 9♦ 8♠ 7♥ 6♣', rank: 6, color: '#6366f1' },
      { name: 'Three of a Kind', example: '8♠ 8♥ 8♦ K♣ 4♠', rank: 7, color: '#8b5cf6' },
      { name: 'Two Pair', example: 'J♣ J♦ 5♠ 5♥ A♣', rank: 8, color: '#8b5cf6' },
      { name: 'One Pair', example: 'A♠ A♥ K♦ 9♣ 6♠', rank: 9, color: '#f59e0b' },
      { name: 'High Card', example: 'A♣ Q♦ 8♠ 5♥ 2♣', rank: 10, color: '#ef4444' }
    ];

    return `
      <div style="display:flex; flex-direction:column; gap:10px;">
        ${hands.map(hand => `
          <div style="display:flex; align-items:center; padding:15px; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:12px;">
            <div style="width:40px; height:40px; border-radius:8px; background:${hand.color}; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:700; color:white; margin-right:15px;">
              ${hand.rank}
            </div>
            <div style="flex:1;">
              <div style="font-size:15px; font-weight:700; color:var(--text-primary); margin-bottom:4px;">
                ${hand.name}
              </div>
              <div style="font-size:13px; color:var(--text-secondary); font-family:'Space Mono', monospace;">
                ${colorSuits(hand.example)}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ============================================================================
  // QUICK TOOLS - STARTING HANDS GUIDE
  // ============================================================================

  function loadStartingHandsGuide() {
    return `
      <div style="display:flex; flex-direction:column; gap:15px;">
        <!-- Premium Hands -->
        <div style="padding:15px; background:rgba(16,185,129,0.1); border:1px solid var(--success); border-radius:12px;">
          <div style="font-size:14px; font-weight:700; color:var(--success); margin-bottom:10px;">
            🟢 Premium Hands - Raise from Any Position
          </div>
          <div style="font-size:13px; color:var(--text-primary); font-family:'Space Mono', monospace; line-height:1.8;">
            AA, KK, QQ, JJ, AKs, AKo
          </div>
        </div>

        <!-- Strong Hands -->
        <div style="padding:15px; background:rgba(6,182,212,0.1); border:1px solid var(--accent-cyan); border-radius:12px;">
          <div style="font-size:14px; font-weight:700; color:var(--accent-cyan); margin-bottom:10px;">
            🔵 Strong Hands - Raise from Middle/Late Position
          </div>
          <div style="font-size:13px; color:var(--text-primary); font-family:'Space Mono', monospace; line-height:1.8;">
            TT, 99, 88, AQs, AQo, AJs, KQs
          </div>
        </div>

        <!-- Playable Hands -->
        <div style="padding:15px; background:rgba(99,102,241,0.1); border:1px solid var(--accent-purple); border-radius:12px;">
          <div style="font-size:14px; font-weight:700; color:var(--accent-purple); margin-bottom:10px;">
            🟣 Playable Hands - Late Position or Call
          </div>
          <div style="font-size:13px; color:var(--text-primary); font-family:'Space Mono', monospace; line-height:1.8;">
            77, 66, 55, AJo, ATs, KJs, KTs, QJs, JTs
          </div>
        </div>

        <!-- Speculative Hands -->
        <div style="padding:15px; background:rgba(245,158,11,0.1); border:1px solid var(--warning); border-radius:12px;">
          <div style="font-size:14px; font-weight:700; color:var(--warning); margin-bottom:10px;">
            🟡 Speculative Hands - Button/Multiway Pots Only
          </div>
          <div style="font-size:13px; color:var(--text-primary); font-family:'Space Mono', monospace; line-height:1.8;">
            44, 33, 22, A9s-A2s, K9s, Q9s, J9s, T9s, 98s, 87s, 76s, 65s
          </div>
        </div>

        <!-- Fold -->
        <div style="padding:15px; background:rgba(239,68,68,0.1); border:1px solid var(--error); border-radius:12px;">
          <div style="font-size:14px; font-weight:700; color:var(--error); margin-bottom:10px;">
            🔴 Weak Hands - Usually Fold
          </div>
          <div style="font-size:13px; color:var(--text-primary); line-height:1.6;">
            Most offsuit hands below KTo, unsuited connectors, big gap hands. These hands lose money in the long run from most positions.
          </div>
        </div>

        <!-- Position Guide -->
        <div style="padding:15px; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:12px;">
          <div style="font-size:13px; font-weight:600; color:var(--text-primary); margin-bottom:10px;">
            📍 Position Matters
          </div>
          <div style="font-size:12px; color:var(--text-secondary); line-height:1.6;">
            <strong>Early Position (UTG, UTG+1):</strong> Play only premium hands<br>
            <strong>Middle Position (MP, MP+1):</strong> Add strong hands<br>
            <strong>Late Position (CO, Button):</strong> Play wider range<br>
            <strong>Blinds (SB, BB):</strong> Defend with playable+ hands<br><br>
            <em>s = suited, o = offsuit</em>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================================
  // POKER COACH TAB LOADING
  // ============================================================================

  window.loadPokerCoach = function() {
    const container = document.getElementById('pokerCoachContent');
    if (!container) return;

    const aiEnabled = window.groupData.pokerCoach?.aiEnabled || false;
    const hasApiKey = !!window.groupData.pokerCoach?.apiKey;

    let html = `
      <!-- AI Analysis Section -->
      <div class="glass-card">
        <div class="card-header">
          <div class="card-title">🤖 AI Table Analysis</div>
          ${window.isAdmin ? `<button class="btn btn-secondary btn-small" onclick="openPokerCoachSettings()">⚙️ Settings</button>` : ''}
        </div>
    `;

    if (!aiEnabled) {
      html += `
        <div style="text-align:center; padding:40px;">
          <div style="font-size:64px; margin-bottom:15px;">🔒</div>
          <div style="font-size:18px; font-weight:700; color:var(--text-primary); margin-bottom:10px;">
            AI Analysis Disabled
          </div>
          <div style="font-size:14px; color:var(--text-secondary); margin-bottom:20px;">
            ${window.isAdmin 
              ? 'Enable AI analysis in settings to use this feature' 
              : 'Ask your admin to enable AI analysis'}
          </div>
          ${window.isAdmin ? `<button class="btn btn-primary" onclick="openPokerCoachSettings()">Enable AI Analysis</button>` : ''}
        </div>
      `;
    } else if (!hasApiKey) {
      html += `
        <div style="text-align:center; padding:40px;">
          <div style="font-size:64px; margin-bottom:15px;">🔑</div>
          <div style="font-size:18px; font-weight:700; color:var(--text-primary); margin-bottom:10px;">
            API Key Required
          </div>
          <div style="font-size:14px; color:var(--text-secondary); margin-bottom:20px;">
            ${window.isAdmin 
              ? 'Add your Anthropic API key in settings to use AI analysis' 
              : 'Ask your admin to configure the API key'}
          </div>
          ${window.isAdmin ? `<button class="btn btn-primary" onclick="openPokerCoachSettings()">Add API Key</button>` : ''}
        </div>
      `;
    } else {
      html += `
        <div style="padding:20px;">
          <div style="font-size:14px; color:var(--text-secondary); margin-bottom:15px;">
            📸 Take a photo of your cards and the board, and AI will analyze your situation and provide strategic advice.
          </div>
          <button class="btn btn-primary" onclick="openAIAnalysis()">
            📸 Analyze Table
          </button>
        </div>
      `;
    }

    html += `</div>`;

    // Quick Tools Section
    html += `
      <div class="glass-card" style="margin-top:20px;">
        <div class="card-header">
          <div class="card-title">🛠️ Quick Tools</div>
        </div>
        
        <!-- Tool Tabs -->
        <div style="display:flex; gap:8px; margin-bottom:15px; flex-wrap:wrap; padding:0 20px;">
          <button class="btn btn-small btn-secondary poker-tool-btn active" onclick="switchPokerTool('potOdds')">Pot Odds</button>
          <button class="btn btn-small btn-secondary poker-tool-btn" onclick="switchPokerTool('outs')">Outs Calculator</button>
          <button class="btn btn-small btn-secondary poker-tool-btn" onclick="switchPokerTool('handChart')">Hand Chart</button>
          <button class="btn btn-small btn-secondary poker-tool-btn" onclick="switchPokerTool('startingHands')">Starting Hands</button>
        </div>

        <!-- Pot Odds Calculator -->
        <div id="potOddsTool" class="poker-tool active" style="padding:0 20px 20px;">
          <div class="form-group">
            <label class="form-label">Pot Size ($)</label>
            <input type="number" id="potSize" class="form-input" placeholder="e.g., 100" oninput="calculatePotOdds()">
          </div>
          <div class="form-group">
            <label class="form-label">Bet to Call ($)</label>
            <input type="number" id="betSize" class="form-input" placeholder="e.g., 20" oninput="calculatePotOdds()">
          </div>
          <div id="potOddsResult">
            <div style="text-align:center; padding:20px; color:var(--text-secondary); font-size:13px;">
              Enter pot size and bet size to calculate
            </div>
          </div>
        </div>

        <!-- Outs Calculator -->
        <div id="outsTool" class="poker-tool" style="display:none; padding:0 20px 20px;">
          <div class="form-group">
            <label class="form-label">Number of Outs</label>
            <input type="number" id="outsCount" class="form-input" placeholder="e.g., 9" min="1" max="47" oninput="calculateOuts()">
          </div>
          <div class="form-group">
            <label class="form-label">Street</label>
            <select id="streetSelect" class="form-select" onchange="calculateOuts()">
              <option value="flop">Flop (2 cards to come)</option>
              <option value="turn">Turn (1 card to come)</option>
              <option value="river">River (1 card to come)</option>
            </select>
          </div>
          <div id="outsResult">
            <div style="text-align:center; padding:20px; color:var(--text-secondary); font-size:13px;">
              Enter number of outs (1-47)
            </div>
          </div>
        </div>

        <!-- Hand Strength Chart -->
        <div id="handChartTool" class="poker-tool" style="display:none; padding:0 20px 20px;">
          ${loadHandStrengthChart()}
        </div>

        <!-- Starting Hands Guide -->
        <div id="startingHandsTool" class="poker-tool" style="display:none; padding:0 20px 20px;">
          ${loadStartingHandsGuide()}
        </div>
      </div>
    `;

    container.innerHTML = html;
  };

  window.switchPokerTool = function(tool) {
    // Update buttons
    document.querySelectorAll('.poker-tool-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Update tools
    document.querySelectorAll('.poker-tool').forEach(t => t.style.display = 'none');
    
    const toolMap = {
      'potOdds': 'potOddsTool',
      'outs': 'outsTool',
      'handChart': 'handChartTool',
      'startingHands': 'startingHandsTool'
    };
    
    const toolId = toolMap[tool];
    if (toolId) {
      document.getElementById(toolId).style.display = 'block';
    }
  };

  // ============================================================================
  // SETTINGS FUNCTIONS
  // ============================================================================

  window.openPokerCoachSettings = function() {
    if (!window.isAdmin) {
      showToast('Only admins can change settings', true);
      return;
    }

    // Initialize poker coach settings if not exists
    if (!window.groupData.pokerCoach) {
      window.groupData.pokerCoach = {
        aiEnabled: false,
        apiKey: ''
      };
    }

    // Pre-fill settings
    document.getElementById('aiEnabledToggle').checked = window.groupData.pokerCoach.aiEnabled || false;
    document.getElementById('anthropicApiKey').value = window.groupData.pokerCoach.apiKey || '';

    document.getElementById('pokerCoachSettingsModal').classList.add('active');
  };

  window.savePokerCoachSettings = async function() {
    const aiEnabled = document.getElementById('aiEnabledToggle').checked;
    const apiKey = document.getElementById('anthropicApiKey').value.trim();

    if (!window.groupData.pokerCoach) {
      window.groupData.pokerCoach = {};
    }

    window.groupData.pokerCoach.aiEnabled = aiEnabled;
    window.groupData.pokerCoach.apiKey = apiKey;

    // Show first-time disclaimer if enabling AI
    if (aiEnabled && !window.groupData.pokerCoach.disclaimerShown) {
      window.groupData.pokerCoach.disclaimerShown = true;
      alert('🎓 Poker Coach AI is enabled!\n\nReminder: AI analysis is for learning and casual games. Using AI assistance in tournaments or serious money games may be considered unethical or cheating.\n\nUse responsibly and have fun! 🎉');
    }

    await window.saveGroupData();
    showToast('Poker Coach settings saved!');
    closeModal('pokerCoachSettingsModal');

    // Refresh poker coach tab
    if (document.getElementById('pokerCoach').classList.contains('active')) {
      window.loadPokerCoach();
    }
  };

  // ============================================================================
  // UI INJECTION
  // ============================================================================

  function injectPokerCoachTab() {
    // Check if tab already exists
    if (document.getElementById('pokerCoach')) return;

    // Add Poker Coach tab button
    const tabs = document.querySelector('.tabs');
    if (tabs) {
      const coachTab = document.createElement('div');
      coachTab.className = 'tab';
      coachTab.textContent = '🎓 Poker Coach';
      coachTab.onclick = () => window.switchTab('pokerCoach');
      tabs.appendChild(coachTab);
    }

    // Add Poker Coach tab content
    const container = document.querySelector('.container');
    if (container) {
      const coachContent = document.createElement('div');
      coachContent.id = 'pokerCoach';
      coachContent.className = 'tab-content';
      coachContent.innerHTML = '<div id="pokerCoachContent"></div>';
      container.appendChild(coachContent);
    }
  }

  function injectPokerCoachModals() {
    // Check if already exists
    if (document.getElementById('pokerCoachSettingsModal')) return;

    const modalsHTML = `
      <!-- Poker Coach Settings Modal -->
      <div id="pokerCoachSettingsModal" class="modal">
        <div class="modal-overlay" onclick="closeModal('pokerCoachSettingsModal')"></div>
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-title">⚙️ Poker Coach Settings</div>
            <button onclick="closeModal('pokerCoachSettingsModal')" class="modal-close">×</button>
          </div>

          <div class="form-group">
            <label class="form-label">
              <input type="checkbox" id="aiEnabledToggle" style="margin-right:8px;">
              Enable AI Analysis
            </label>
            <div style="font-size:11px; color:var(--text-secondary); margin-top:6px;">
              Allow players to use AI-powered table analysis
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Anthropic API Key</label>
            <input type="password" 
                   id="anthropicApiKey" 
                   class="form-input" 
                   placeholder="sk-ant-...">
            <div style="font-size:11px; color:var(--text-secondary); margin-top:6px;">
              Get your API key from <a href="https://console.anthropic.com/" target="_blank" style="color:var(--accent-cyan);">console.anthropic.com</a>
            </div>
          </div>

          <div style="padding:12px; background:rgba(99,102,241,0.1); border:1px solid var(--accent-purple); border-radius:8px; font-size:12px; color:var(--text-secondary); margin-bottom:20px;">
            <strong>📖 How to get an API key:</strong><br>
            1. Go to console.anthropic.com<br>
            2. Sign up or log in<br>
            3. Go to API Keys section<br>
            4. Create a new key<br>
            5. Copy and paste it here<br><br>
            <strong>💰 Cost:</strong> ~$0.01 per analysis with Claude 3.5 Sonnet
          </div>

          <div style="display:flex; gap:10px;">
            <button class="btn btn-primary" onclick="savePokerCoachSettings()">Save Settings</button>
            <button class="btn btn-secondary" onclick="closeModal('pokerCoachSettingsModal')">Cancel</button>
          </div>
        </div>
      </div>

      <!-- AI Analysis Modal -->
      <div id="aiAnalysisModal" class="modal">
        <div class="modal-overlay" onclick="closeModal('aiAnalysisModal')"></div>
        <div class="modal-content" style="max-width:600px;">
          <div class="modal-header">
            <div class="modal-title">🤖 AI Table Analysis</div>
            <button onclick="closeModal('aiAnalysisModal')" class="modal-close">×</button>
          </div>

          <div class="form-group">
            <label class="form-label">Upload Photo of Cards & Board</label>
            <input type="file" 
                   id="aiPhotoInput" 
                   accept="image/*"
                   class="form-input"
                   onchange="handleAIPhotoUpload(event)">
            <div style="font-size:11px; color:var(--text-secondary); margin-top:6px;">
              📸 Take a photo or upload from gallery
            </div>
          </div>

          <div id="aiPhotoPreview" style="margin-bottom:15px; text-align:center;"></div>

          <div id="aiAnalysisResult"></div>

          <div style="margin-top:15px;">
            <button class="btn btn-secondary" onclick="closeModal('aiAnalysisModal')">Close</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalsHTML);
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  function initPokerCoach() {
    console.log('Initializing V4 Poker Coach...');

    // Check if we're in admin or viewer mode
    window.isAdmin = typeof saveNight === 'function';

    // Inject UI elements
    injectPokerCoachTab();
    injectPokerCoachModals();

    // Hook into tab switching
    const originalSwitchTab = window.switchTab;
    window.switchTab = function(tabName) {
      originalSwitchTab(tabName);
      if (tabName === 'pokerCoach') {
        window.loadPokerCoach();
      }
    };

    console.log('V4 Poker Coach loaded successfully!');
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
      initPokerCoach();
    } else {
      setTimeout(checkReady, 100);
    }
  }

  waitForReady();

})();
