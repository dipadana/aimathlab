(function() {
  'use strict';

  window.AIMLSync = {
    roomId: null,
    channel: null,
    isHost: false,
    
    generateCode() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    },

    async createRoom() {
      const auth = window.AIMLAuth;
      const sb = auth?.getSupabase();
      if (!sb) {
        alert("Authentication not initialized.");
        return null;
      }
      
      const code = this.generateCode();
      const initialState = auth.captureState ? auth.captureState() : {};
      
      try {
        const { error } = await sb.from('active_sessions').insert({
          room_code: code,
          state: initialState,
          created_at: new Date().toISOString()
        });
        if (error) throw error;
        
        this.roomId = code;
        this.isHost = true;
        sessionStorage.setItem('mp_room', code);
        sessionStorage.setItem('mp_isHost', 'true');
        this.subscribe();
        return code;
      } catch (e) {
        console.error("Failed to create room:", e);
        return null;
      }
    },

    async joinRoom(code, isRejoin = false) {
      const auth = window.AIMLAuth;
      const sb = auth?.getSupabase();
      if (!sb) return false;

      code = code.toUpperCase().trim();
      try {
        const { data, error } = await sb.from('active_sessions')
          .select('*')
          .eq('room_code', code)
          .single();
          
        if (error || !data) throw new Error("Room not found");
        
        this.roomId = code;
        this.isHost = isRejoin ? sessionStorage.getItem('mp_isHost') === 'true' : false;
        
        if (!isRejoin) {
          sessionStorage.setItem('mp_room', code);
          sessionStorage.setItem('mp_isHost', this.isHost ? 'true' : 'false');
        }
        
        // Initial sync
        if (data.state && auth.applyState) {
          window.isApplyingNetworkState = true;
          clearTimeout(window._networkLockTimer);
          window._networkLockTimer = setTimeout(() => { window.isApplyingNetworkState = false; }, 2000);
          auth.applyState(data.state);
        }
        
        this.subscribe();
        return true;
      } catch (e) {
        console.error("Join room failed:", e);
        this.leaveRoom(); // Clear invalid session
        return false;
      }
    },

    subscribe() {
      const auth = window.AIMLAuth;
      const sb = auth?.getSupabase();
      if (!sb || !this.roomId) return;
      
      if (this.channel) {
        sb.removeChannel(this.channel);
      }
      
      this.channel = sb.channel('room-' + this.roomId)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'active_sessions', filter: `room_code=eq.${this.roomId}` },
          (payload) => {
            if (payload.new && payload.new.state && auth.applyState) {
              window.isApplyingNetworkState = true;
              clearTimeout(window._networkLockTimer);
              window._networkLockTimer = setTimeout(() => { window.isApplyingNetworkState = false; }, 2000);
              auth.applyState(payload.new.state);
            }
          }
        )
        .subscribe();
    },

    async broadcastState(state) {
      if (!this.roomId || window.isApplyingNetworkState) return;
      
      const auth = window.AIMLAuth;
      const sb = auth?.getSupabase();
      if (!sb) return;

      try {
        await sb.from('active_sessions')
          .update({ state: state })
          .eq('room_code', this.roomId);
      } catch (e) {
        console.warn("Broadcast failed:", e);
      }
    },
    
    leaveRoom() {
      if (this.channel) {
        const auth = window.AIMLAuth;
        const sb = auth?.getSupabase();
        if (sb) sb.removeChannel(this.channel);
        this.channel = null;
      }
      this.roomId = null;
      this.isHost = false;
      
      sessionStorage.removeItem('mp_room');
      sessionStorage.removeItem('mp_isHost');
      
      // Attempt to clean up DB if host
      if (this.isHost) {
        const sb = window.AIMLAuth?.getSupabase();
        if (sb) {
           sb.from('active_sessions').delete().eq('room_code', this.roomId).then();
        }
      }
    },
    
    async init() {
      const savedRoom = sessionStorage.getItem('mp_room');
      if (savedRoom) {
        // Wait for auth to boot
        let attempts = 0;
        while (!window.AIMLAuth?.getSupabase() && attempts < 50) {
          await new Promise(r => setTimeout(r, 100));
          attempts++;
        }
        if (window.AIMLAuth?.getSupabase()) {
          const success = await this.joinRoom(savedRoom, true);
          if (success) {
            document.getElementById('mp-forms').style.display = 'none';
            document.getElementById('mp-status').style.display = 'block';
            document.getElementById('mp-code-display').innerText = savedRoom.toUpperCase();
          }
        }
      }
    }
  };

  // UI Injection for Multiplayer Modal
  window.addEventListener('DOMContentLoaded', () => {
    const modalHtml = `
      <div id="mp-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.5); z-index:9999; align-items:center; justify-content:center;">
        <div style="background:var(--surface); padding:24px; border-radius:12px; width:320px; box-shadow:var(--shadow-lg); border:1px solid var(--border);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <h2 style="margin:0; font-family:system-ui; font-size:1.2rem; color:var(--ink);">Multiplayer Sync</h2>
            <button onclick="document.getElementById('mp-modal').style.display='none'" style="background:none; border:none; cursor:pointer; font-size:1.2rem; color:var(--ink3);">&times;</button>
          </div>
          
          <div id="mp-status" style="margin-bottom:20px; padding:12px; border-radius:8px; background:var(--bg-layer); border:1px solid var(--border); display:none; text-align:center;">
             <div style="font-size:0.9rem; color:var(--ink2); margin-bottom:4px;">Connected to Room:</div>
             <div id="mp-code-display" style="font-family:'JetBrains Mono', monospace; font-size:1.8rem; font-weight:bold; letter-spacing:4px; color:var(--accent);"></div>
             <button onclick="window.AIMLSync.leaveRoom(); document.getElementById('mp-status').style.display='none'; document.getElementById('mp-forms').style.display='block';" style="margin-top:12px; padding:6px 12px; background:var(--bg-layer); color:#ff4444; border:1px solid #ff4444; border-radius:6px; cursor:pointer; width:100%;">Leave Room</button>
          </div>

          <div id="mp-forms">
            <button onclick="window.handleHostRoom(this)" style="width:100%; padding:10px; background:var(--accent); color:#fff; border:none; border-radius:8px; font-weight:500; cursor:pointer; margin-bottom:16px;">
              <i class="fa-solid fa-users" style="margin-right:8px;"></i> Host a Room
            </button>
            <div style="text-align:center; color:var(--ink3); margin-bottom:16px; font-size:0.9em;">- or -</div>
            <div style="display:flex; gap:8px;">
              <input type="text" id="mp-join-input" placeholder="6-digit code" maxlength="6" style="flex:1; padding:10px; border:1px solid var(--border); border-radius:8px; font-family:'JetBrains Mono', monospace; text-transform:uppercase; text-align:center; font-size:1.1rem; background:var(--bg-layer); color:var(--ink);">
              <button onclick="window.handleJoinRoom(this)" style="padding:10px 16px; background:var(--surface2); color:var(--ink); border:1px solid var(--border2); border-radius:8px; cursor:pointer;">Join</button>
            </div>
            <div id="mp-error" style="color:#ff4444; font-size:0.85rem; text-align:center; margin-top:10px; min-height:1rem;"></div>
          </div>
        </div>
      </div>
    `;
    
    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHtml;
    document.body.appendChild(wrapper.firstElementChild);

    // Add Multiplayer Button to header
    const actionsContainer = document.querySelector('.header-actions');
    if (actionsContainer) {
      const mpBtn = document.createElement('button');
      mpBtn.className = 'theme-btn-icon';
      mpBtn.innerHTML = '<i class="fa-solid fa-users"></i>';
      mpBtn.onclick = () => document.getElementById('mp-modal').style.display = 'flex';
      mpBtn.style.marginLeft = '8px';
      mpBtn.style.color = 'var(--accent)';
      
      const themeBtn = document.getElementById('theme-btn');
      if (themeBtn) {
        actionsContainer.insertBefore(mpBtn, themeBtn);
      } else {
        actionsContainer.appendChild(mpBtn);
      }
    }
    
    window.AIMLSync.init();
  });

  window.handleHostRoom = async (btn) => {
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Hosting...';
    btn.disabled = true;
    const code = await window.AIMLSync.createRoom();
    btn.innerHTML = '<i class="fa-solid fa-users" style="margin-right:8px;"></i> Host a Room';
    btn.disabled = false;
    
    if (code) {
      document.getElementById('mp-forms').style.display = 'none';
      document.getElementById('mp-status').style.display = 'block';
      document.getElementById('mp-code-display').innerText = code;
    } else {
      document.getElementById('mp-error').innerText = "Failed to create room. Ensure you are logged in.";
    }
  };

  window.handleJoinRoom = async (btn) => {
    const input = document.getElementById('mp-join-input');
    const code = input.value;
    if (code.length < 6) return;
    
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btn.disabled = true;
    const success = await window.AIMLSync.joinRoom(code);
    btn.innerHTML = 'Join';
    btn.disabled = false;
    
    if (success) {
      document.getElementById('mp-forms').style.display = 'none';
      document.getElementById('mp-status').style.display = 'block';
      document.getElementById('mp-code-display').innerText = code.toUpperCase();
      document.getElementById('mp-error').innerText = '';
    } else {
      document.getElementById('mp-error').innerText = "Room not found or invalid.";
    }
  };

})();
