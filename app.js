    let ws = null;
    let currentRoomId = null;
    let currentScriptId = null;
    let scripts = [];
    let currentThemeLink = null; // 当前加载的主题样式链接
    let userRole = null; // 'host' 或 'player'
    let autoJoinRoomId = null; // 玩家自动加入的房间ID
    let pendingCreateRoomCallback = null; // 创建房间的回调函数
    let currentPlayerId = null; // 当前玩家的ID
    let currentPlayerName = null; // 当前玩家的名称
    
    // 暴露到 window 对象以便测试访问
    window.pendingCreateRoomCallback = null;

    // 从 URL 参数获取配置
    const urlParams = new URLSearchParams(window.location.search);
    userRole = urlParams.get('role') || null;
    
    // 从 URL 参数或环境变量读取端口配置
    // WebSocket 和 HTTP 现在共用同一个端口
    const PORT = urlParams.get('port') || urlParams.get('wsPort') || urlParams.get('httpPort') || '4000';
    const WS_PORT = PORT;
    const HTTP_PORT = PORT;

    const difficultyMap = {
      easy: '简单',
      medium: '中等',
      hard: '困难'
    };

    // 默认阶段列表（当剧本没有定义阶段时使用）
    const DEFAULT_PHASES = ['IDLE', 'READING', 'SEARCH', 'DISCUSSION', 'VOTE', 'REVEAL'];
    
    // 当前剧本的阶段列表（动态从剧本加载）
    let PHASES = [...DEFAULT_PHASES];
    
    /**
     * 从剧本加载阶段列表
     */
    function loadPhasesFromScript(script) {
      if (script && script.phases && script.phases.length > 0) {
        // 使用剧本定义的阶段，添加 IDLE 作为初始状态
        PHASES = ['IDLE', ...script.phases.map(p => p.id)];
        console.log('[Client] Loaded phases from script:', PHASES);
      } else {
        // 使用默认阶段
        PHASES = [...DEFAULT_PHASES];
        console.log('[Client] Using default phases:', PHASES);
      }
    }
    
    /**
     * 根据阶段索引计算 storyline 范围
     * 将 storyline 平均分配到各个阶段
     */
    function getStorylineIndicesForPhase(script, phaseIndex) {
      if (!script || !script.storyline || !script.phases) {
        return [];
      }
      
      const totalStorylines = script.storyline.length;
      const totalPhases = script.phases.length;
      
      if (totalPhases === 0) return [];
      
      // 平均分配 storyline 到各个阶段
      const storiesPerPhase = Math.ceil(totalStorylines / totalPhases);
      const startIndex = phaseIndex * storiesPerPhase;
      const endIndex = Math.min(startIndex + storiesPerPhase, totalStorylines);
      
      const indices = [];
      for (let i = startIndex; i < endIndex; i++) {
        indices.push(i);
      }
      return indices;
    }

    /**
     * 确保脚本完整加载（包含 phases 或 characters）
     */
    async function ensureScriptLoaded(scriptId, requiredField = 'phases') {
      let script = scripts.find(s => s.id === scriptId);
      if (!script || !script[requiredField]) {
        console.log(`[Client] Script not fully loaded (missing ${requiredField}), loading full script...`);
        try {
          script = await loadFullScript(scriptId);
          console.log(`[Client] Full script loaded:`, script.title);
        } catch (error) {
          console.error(`[Client] Failed to load script:`, error);
          throw error;
        }
      }
      return script;
    }

    /**
     * 查找阶段数据（通过阶段ID直接匹配）
     */
    function findPhaseData(script, phase) {
      if (!script || !script.phases) return null;
      
      // 直接通过阶段ID匹配
      return script.phases.find(p => p.id === phase);
    }

    /**
     * 渲染阶段内容 HTML
     */
    function renderPhaseContentHTML(phaseData) {
      return `
        <h5>${phaseData.name}</h5>
        <p>${phaseData.description}</p>
        ${phaseData.duration ? `<p><strong>预计时长：</strong>${phaseData.duration}分钟</p>` : ''}
        ${phaseData.actions && phaseData.actions.length > 0 ? `
          <div class="phase-actions">
            <strong>可执行操作：</strong>
            <ul>
              ${phaseData.actions.map(action => `<li>${action}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      `;
    }

    // 根据角色更新页面标题
    if (userRole === 'host') {
      document.title = '剧本杀 - 房主';
      document.querySelector('h1').textContent = '🎭 剧本杀 - 房主';
    } else if (userRole === 'player') {
      document.title = '剧本杀 - 玩家';
      document.querySelector('h1').textContent = '🎭 剧本杀 - 玩家';
    }

    /**
     * 加载并应用剧本主题样式
     */
    function loadScriptTheme(script) {
      if (!script || !script.theme) {
        return;
      }

      // 移除之前的主题样式
      removeScriptTheme();

      const theme = script.theme;

      // 优先使用 CSS 文件路径
      if (theme.cssPath) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.id = 'script-theme-style';
        
        // 处理相对路径（相对于 scripts 目录）
        let cssUrl = theme.cssPath;
        if (cssUrl.startsWith('./')) {
          // 如果是相对路径，通过 HTTP 服务器加载
          // 使用当前页面的域名和端口
          const baseUrl = window.location.protocol === 'file:' 
            ? `${window.location.protocol === 'https:' ? 'https' : 'http'}://localhost:${HTTP_PORT}` 
            : window.location.origin;
          cssUrl = `${baseUrl}/scripts/${cssUrl.replace('./', '')}`;
        }
        
        link.href = cssUrl;
        link.onerror = () => {
          console.warn(`Failed to load theme CSS: ${cssUrl}`);
          // 如果 CSS 文件加载失败，尝试使用内联样式
          if (theme.inlineCSS) {
            applyInlineTheme(theme.inlineCSS);
          }
        };
        
        document.head.appendChild(link);
        currentThemeLink = link;
      } else if (theme.inlineCSS) {
        // 使用内联 CSS
        applyInlineTheme(theme.inlineCSS);
      }

      // 应用颜色和字体配置
      if (theme.colors || theme.fontFamily) {
        applyThemeConfig(theme);
      }

      // 添加主题类名到 body
      document.body.classList.add(`script-theme-${script.id}`);
    }

    /**
     * 应用内联 CSS
     */
    function applyInlineTheme(css) {
      const style = document.createElement('style');
      style.id = 'script-theme-inline';
      style.textContent = css;
      document.head.appendChild(style);
    }

    /**
     * 应用主题配置（颜色、字体等）
     */
    function applyThemeConfig(theme) {
      const root = document.documentElement;
      
      if (theme.colors) {
        if (theme.colors.primary) {
          root.style.setProperty('--theme-primary', theme.colors.primary);
        }
        if (theme.colors.secondary) {
          root.style.setProperty('--theme-secondary', theme.colors.secondary);
        }
        if (theme.colors.background) {
          root.style.setProperty('--theme-background', theme.colors.background);
        }
        if (theme.colors.text) {
          root.style.setProperty('--theme-text', theme.colors.text);
        }
        if (theme.colors.accent) {
          root.style.setProperty('--theme-accent', theme.colors.accent);
        }
      }

      if (theme.fontFamily) {
        root.style.setProperty('--theme-font-family', theme.fontFamily);
      }

      if (theme.background) {
        document.body.style.background = theme.background;
      }
    }

    /**
     * 移除剧本主题样式
     */
    function removeScriptTheme() {
      // 移除样式链接
      if (currentThemeLink) {
        currentThemeLink.remove();
        currentThemeLink = null;
      }

      // 移除内联样式
      const inlineStyle = document.getElementById('script-theme-inline');
      if (inlineStyle) {
        inlineStyle.remove();
      }

      // 移除主题类名
      document.body.className = document.body.className
        .split(' ')
        .filter(cls => !cls.startsWith('script-theme-'))
        .join(' ');

      // 清除 CSS 变量
      const root = document.documentElement;
      root.style.removeProperty('--theme-primary');
      root.style.removeProperty('--theme-secondary');
      root.style.removeProperty('--theme-background');
      root.style.removeProperty('--theme-text');
      root.style.removeProperty('--theme-accent');
      root.style.removeProperty('--theme-font-family');
    }

    function showError(message) {
      const errorDiv = document.getElementById('error');
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      setTimeout(() => {
        errorDiv.style.display = 'none';
      }, 5000);
    }

    function connect() {
      // 根据当前页面的协议决定使用 ws:// 还是 wss://
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // 使用当前页面的主机名和端口（window.location.host 包含主机名和端口）
      // 如果部署在反向代理后面，使用 window.location.host 可以自动适配
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;
      
      console.log(`[Client] Connecting to WebSocket: ${wsUrl}`);
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Connected to server');
        loadScriptList();
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleMessage(message);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        showError('连接服务器失败，请确保服务器已启动');
      };

      ws.onclose = () => {
        console.log('Disconnected from server');
        setTimeout(connect, 3000);
      };
    }

    function sendMessage(event, data) {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        showError('未连接到服务器');
        return;
      }

      const id = Date.now().toString();
      ws.send(JSON.stringify({
        id,
        event,
        data
      }));
      return id;
    }

    function handleMessage(message) {
      console.log('Received message:', message);

      if (message.id) {
        // Response to request
        if (message.error) {
          showError(message.error);
          
          // 如果加入房间失败，更新状态
          const statusDiv = document.getElementById('autoJoinStatus');
          if (statusDiv) {
            statusDiv.textContent = `✗ 加入房间失败: ${message.error}`;
            statusDiv.style.color = '#dc3545';
          }
          return;
        }

        if (message.data) {
          if (message.data.scripts) {
            displayScripts(message.data.scripts);
          } else if (message.data.script) {
            console.log('Script loaded:', message.data.script);
            // 如果脚本列表中已有该脚本，更新它；否则添加到列表
            const existingIndex = scripts.findIndex(s => s.id === message.data.script.id);
            if (existingIndex >= 0) {
              scripts[existingIndex] = message.data.script;
            } else {
              scripts.push(message.data.script);
            }
            console.log('[Client] Script added/updated, total scripts:', scripts.length);
          } else if (message.data.roomId) {
            currentRoomId = message.data.roomId;
            if (message.data.room) {
              // 创建房间时，设置 userRole 为 'host'
              userRole = 'host';
              console.log('[Client] room:create response: Set userRole to "host"');
              
              // 保存当前玩家信息（房主）
              if (message.data.room.players && message.data.room.players.length > 0) {
                const hostPlayer = message.data.room.players.find(p => p.isHost);
                if (hostPlayer) {
                  currentPlayerId = hostPlayer.id;
                  currentPlayerName = hostPlayer.name;
                }
              }
              
              updateRoomInfo(message.data.room);
              
              // 隐藏剧本列表，显示房间区域（进入房间页面）
              const scriptListDiv = document.getElementById('scriptList');
              if (scriptListDiv) {
                scriptListDiv.style.display = 'none';
              }
              document.body.classList.add('in-room');
              
              // 更新标题
              updatePageTitle(message.data.room);
              
              // 预加载剧本阶段列表
              const scriptId = message.data.room.scriptId || currentScriptId;
              if (scriptId) {
                ensureScriptLoaded(scriptId, 'phases').then(script => {
                  loadPhasesFromScript(script);
                  console.log('[Client] Pre-loaded script phases for created room');
                }).catch(err => {
                  console.warn('[Client] Failed to pre-load script phases:', err);
                });
              }
            } else {
              console.error('Room data is missing in response:', message.data);
              showError('房间数据不完整');
            }
            
            // 如果是房主，将房间号存储到 localStorage，方便玩家加入
            if (userRole === 'host') {
              localStorage.setItem('lastRoomId', currentRoomId);
              console.log(`[自动模式] 房间已创建: ${currentRoomId}`);
            }
            
            // 如果是玩家且设置了自动加入，尝试加入
            if (userRole === 'player' && !currentRoomId) {
              const lastRoomId = localStorage.getItem('lastRoomId');
              if (lastRoomId && lastRoomId !== currentRoomId) {
                setTimeout(() => {
                  joinRoomByRoomId(lastRoomId);
                }, 500);
              }
            }
            
            // 如果加入房间时还没有加载主题，加载它
            if (currentScriptId && !currentThemeLink) {
              const script = scripts.find(s => s.id === currentScriptId);
              if (script) {
                loadScriptTheme(script);
              }
            }
          } else if (message.data.room) {
            // 设置当前房间ID（如果还没有设置）
            if (!currentRoomId && message.data.room.id) {
              currentRoomId = message.data.room.id;
            }
            
            // 设置当前剧本ID（如果还没有设置）
            if (!currentScriptId && message.data.room.scriptId) {
              currentScriptId = message.data.room.scriptId;
            }
            
            updateRoomInfo(message.data.room);
            
            // 如果加入房间时还没有加载主题，加载它
            if (currentScriptId && !currentThemeLink) {
              const script = scripts.find(s => s.id === currentScriptId);
              if (script) {
                loadScriptTheme(script);
              }
            }
          }
        }
      }

      // Event messages
      if (message.type === 'room:joined') {
        // 处理加入房间成功事件
        if (message.data?.room) {
          currentRoomId = message.data.room.id;
          currentScriptId = message.data.room.scriptId;
          
          // 保存当前玩家信息（玩家）
          if (message.data.player) {
            currentPlayerId = message.data.player.id;
            currentPlayerName = message.data.player.name;
          } else if (message.data.room.players && message.data.room.players.length > 0) {
            // 如果没有直接返回玩家信息，从房间玩家列表中查找（通过名称匹配）
            const playerNameInput = document.getElementById('joinPlayerNameInput') || document.getElementById('playerName');
            const playerName = playerNameInput?.value.trim() || '玩家';
            const player = message.data.room.players.find(p => p.name === playerName && !p.isHost);
            if (player) {
              currentPlayerId = player.id;
              currentPlayerName = player.name;
            }
          }
          
          updateRoomInfo(message.data.room);
          
          // 隐藏剧本列表，显示房间区域（进入房间页面）
          const scriptListDiv = document.getElementById('scriptList');
          if (scriptListDiv) {
            scriptListDiv.style.display = 'none';
          }
          document.body.classList.add('in-room');
          
          // 更新标题
          updatePageTitle(message.data.room);
          
          // 预加载剧本阶段列表
          if (currentScriptId) {
            ensureScriptLoaded(currentScriptId, 'phases').then(script => {
              loadPhasesFromScript(script);
              console.log('[Client] Pre-loaded script phases for room');
            }).catch(err => {
              console.warn('[Client] Failed to pre-load script phases:', err);
            });
          }
          
          // 更新状态显示
            const statusDiv = document.getElementById('autoJoinStatus');
            if (statusDiv) {
              statusDiv.textContent = `✓ 已加入房间 ${currentRoomId}`;
            statusDiv.style.color = '#28a745';
          }
          
          // 加载主题
          if (currentScriptId && !currentThemeLink) {
            const script = scripts.find(s => s.id === currentScriptId);
            if (script) {
              loadScriptTheme(script);
            }
          }
        }
      } else if (message.type === 'game:started') {
        // 处理游戏开始事件
        console.log('[Client] ========== game:started event received ==========');
        console.log('[Client] Full message:', JSON.stringify(message, null, 2));
        if (message.data?.room) {
          console.log('[Client] Room status:', message.data.room.status);
          console.log('[Client] Room ID:', message.data.room.id);
          console.log('[Client] Current body classes BEFORE:', document.body.className);
          
          // 立即添加游戏页面类名，切换到游戏页面
          document.body.classList.add('game-view-active');
          document.body.classList.remove('in-room');
          
          console.log('[Client] Body classes AFTER setting:', document.body.className);
          
          // 加载剧本阶段列表
          const scriptId = message.data.room.scriptId || currentScriptId;
          ensureScriptLoaded(scriptId, 'phases').then(script => {
            // 从剧本加载阶段列表
            loadPhasesFromScript(script);
            
            // 使用剧本定义的第一个阶段作为初始阶段（跳过 IDLE）
            const initialPhase = PHASES.length > 1 ? PHASES[1] : 'READING';
            console.log('[Client] Initial phase from script:', initialPhase);
            
            // 更新游戏阶段为初始阶段
            currentGamePhase = initialPhase;
            updateGamePhase(initialPhase);
          }).catch(err => {
            console.error('[Client] Failed to load script phases:', err);
            // 回退到默认阶段
            currentGamePhase = 'READING';
            updateGamePhase('READING');
          });
          
          // 更新房间信息（包含角色分配）- 注意：updateRoomInfo 现在会检查状态，不会覆盖类名
          console.log('[Client] Calling updateRoomInfo with status:', message.data.room.status);
          updateRoomInfo(message.data.room);
          
          // 强制确保类名正确（使用 setTimeout 确保在 updateRoomInfo 之后执行）
          setTimeout(() => {
            if (message.data.room.status === 'playing') {
              document.body.classList.add('game-view-active');
              document.body.classList.remove('in-room');
              console.log('[Client] Body classes after setTimeout fix:', document.body.className);
              
              // 检查关键元素是否可见
              const gameControlSection = document.getElementById('gameControlSection');
              const playerGameSection = document.getElementById('playerGameSection');
              const waitingSection = document.getElementById('waitingSection');
              console.log('[Client] gameControlSection visible:', gameControlSection?.style.display !== 'none');
              console.log('[Client] playerGameSection visible:', playerGameSection?.style.display !== 'none');
              console.log('[Client] waitingSection visible:', waitingSection?.style.display !== 'none');
            }
          }, 100);
          
          // 显示角色信息和主持人内容
          displayCharacterInfo(message.data.room).catch(err => {
            console.error('[Client] Failed to display character info:', err);
          });
          if (userRole === 'host') {
            // 房主：显示玩家列表（含角色）和主持人内容
            displayPlayersWithCharacters(message.data.room).catch(err => {
              console.error('[Client] Failed to display players with characters:', err);
            });
            // 显示当前阶段内容（房主）- 使用动态阶段
            displayHostCurrentPhaseContent(currentGamePhase).catch(err => {
              console.error('[Client] Failed to display host phase content:', err);
            });
            // 显示主持人剧本内容（根据当前阶段）
            displayHostScriptContent(message.data.room, currentGamePhase).catch(err => {
              console.error('[Client] Failed to display host script content:', err);
            });
          } else {
            // 玩家：显示当前阶段内容
            console.log('[Client] game:started: Player view - displaying phase content');
            
            // 启用沉浸式阅读模式
            document.body.classList.add('player-reading-mode');
            
            // 显示切换房间信息按钮
            const toggleBtn = document.getElementById('toggleRoomInfoBtn');
            if (toggleBtn) {
              toggleBtn.style.display = 'block';
            }
            
            displayCurrentPhaseContent(currentGamePhase).catch(err => {
              console.error('[Client] Failed to display phase content:', err);
            });
            
            // 确保玩家游戏区域显示
            const playerGameSection = document.getElementById('playerGameSection');
            const waitingSection = document.getElementById('waitingSection');
            if (playerGameSection) {
              playerGameSection.style.display = 'block';
              console.log('[Client] game:started: Set playerGameSection to block');
            }
            if (waitingSection) {
              waitingSection.style.display = 'none';
              console.log('[Client] game:started: Set waitingSection to none');
            }
          }
          
          // 更新标题
          updatePageTitle(message.data.room);
          
          // 强制更新游戏控制显示
          showGameControls();
          
          console.log('[Client] ========== game:started event processed ==========');
        }
      } else if (message.type === 'game:phaseUpdate' || message.type === 'game:phaseChanged') {
        // 处理阶段更新事件
        console.log('[Client] ========== game:phaseUpdate/phaseChanged event received ==========');
        console.log('[Client] Message type:', message.type);
        console.log('[Client] Message data:', message.data);
        if (message.data?.phase) {
          console.log('[Client] Updating game phase to:', message.data.phase);
          updateGamePhase(message.data.phase);
          
          // 更新阶段内容（房主和玩家都需要）
          displayCurrentPhaseContent(message.data.phase).catch(err => {
            console.error('[Client] Failed to display phase content:', err);
          });
          
          // 房主也需要显示当前阶段内容
          if (userRole === 'host') {
            displayHostCurrentPhaseContent(message.data.phase).catch(err => {
              console.error('[Client] Failed to display host phase content:', err);
            });
            // 更新主持人剧本内容（根据当前阶段）
            displayHostScriptContent({ scriptId: currentScriptId, id: currentRoomId }, message.data.phase).catch(err => {
              console.error('[Client] Failed to display host script content:', err);
            });
          }
        } else {
          console.warn('[Client] game:phaseUpdate/phaseChanged: No phase in data', message.data);
        }
      } else if (message.type === 'room:playerReady') {
        // 处理玩家准备状态变化事件
        console.log('[Client] room:playerReady event received:', message);
        if (message.data?.room) {
          // 更新房间信息（包含准备状态）
          updateRoomInfo(message.data.room);
          
          // 如果是当前玩家的准备状态变化，更新本地状态
          if (message.data.playerId === currentPlayerId) {
            isReady = message.data.isReady || false;
            updateReadyButton();
          }
        }
      } else if (message.type === 'room:playerJoined') {
        // 更新房间信息（包含新加入的玩家）
        console.log('[Client] room:playerJoined event received:', message);
        console.log('[Client] Message data:', message.data);
        console.log('[Client] Current roomId before update:', currentRoomId);
        console.log('[Client] Current playerId before update:', currentPlayerId);
        
        if (message.data?.room) {
          // 服务器发送了完整的房间信息，直接使用
          console.log('[Client] Updating room info with:', message.data.room);
          console.log('[Client] Room players count:', message.data.room.players?.length);
          console.log('[Client] Room players:', message.data.room.players?.map(p => p.name).join(', '));
          
          // 确保设置了当前房间ID和剧本ID
          if (message.data.room.id) {
            currentRoomId = message.data.room.id;
          }
          if (message.data.room.scriptId) {
            currentScriptId = message.data.room.scriptId;
          }
          
          // 更新房间信息显示（这会自动更新标题和玩家列表）
          updateRoomInfo(message.data.room);
          
          // 如果还没有加载主题，加载它
          if (currentScriptId && !currentThemeLink && message.data.room.scriptId) {
            const script = scripts.find(s => s.id === currentScriptId);
            if (script) {
              loadScriptTheme(script);
            }
          }
        } else if (message.data?.player) {
          // 如果没有完整房间信息但有玩家信息，尝试获取最新房间信息
          console.warn('[Client] No room data in playerJoined event, only player info received');
          console.warn('[Client] Player:', message.data.player);
          console.warn('[Client] Current roomId:', currentRoomId);
          
          // 如果当前有房间ID，尝试重新加载房间信息
          if (currentRoomId) {
            console.log('[Client] Attempting to reload room info...');
            // 注意：这里我们需要手动更新，因为服务器可能没有发送完整房间信息
            // 实际上，服务器应该总是发送完整房间信息，这种情况不应该发生
          }
        } else {
          console.error('[Client] room:playerJoined event missing both room and player data:', message);
        }
      } else if (message.type === 'room:playerLeft') {
        // 更新房间信息（玩家离开后）
        if (message.data?.room) {
          updateRoomInfo(message.data.room);
        } else if (currentRoomId) {
        loadRoomInfo();
        }
      } else if (message.type === 'room:playerReady') {
        // 更新房间信息（玩家准备状态改变后）
        if (message.data?.room) {
          updateRoomInfo(message.data.room);
        } else if (currentRoomId) {
        loadRoomInfo();
        }
      } else if (message.type === 'room:hostChanged') {
        // 更新房间信息（房主变更后）
        if (message.data?.room) {
          updateRoomInfo(message.data.room);
        } else if (currentRoomId) {
          loadRoomInfo();
        }
      } else if (message.type === 'room:created') {
        // 监听房间创建事件（用于玩家自动加入）
        if (userRole === 'player' && message.data?.roomId) {
          const roomId = message.data.roomId;
          localStorage.setItem('lastRoomId', roomId);
          setTimeout(() => {
            joinRoomByRoomId(roomId);
          }, 1000);
        }
      }
    }

    function loadScriptList() {
      sendMessage('script:list', {});
    }

    function loadFullScript(scriptId) {
      // 检查是否已经加载了完整脚本
      const existingScript = scripts.find(s => s.id === scriptId && s.storyline);
      if (existingScript) {
        console.log('[Client] Script already loaded:', scriptId);
        return Promise.resolve(existingScript);
      }
      
      return new Promise((resolve, reject) => {
        sendMessage('script:get', { scriptId });
        // 等待脚本加载（通过消息处理）
        // 注意：这里使用一个简单的轮询机制
        let attempts = 0;
        const checkInterval = setInterval(() => {
          const script = scripts.find(s => s.id === scriptId && s.storyline);
          if (script) {
            clearInterval(checkInterval);
            resolve(script);
          } else if (attempts++ > 10) {
            clearInterval(checkInterval);
            reject(new Error('Script load timeout'));
          }
        }, 100);
      });
    }

    function displayScripts(scriptList) {
      // 保留已加载的完整脚本（包含storyline等完整信息）
      const fullScripts = scripts.filter(s => s.storyline);
      scripts = scriptList;
      // 合并完整脚本信息
      fullScripts.forEach(fullScript => {
        const index = scripts.findIndex(s => s.id === fullScript.id);
        if (index >= 0) {
          scripts[index] = fullScript; // 用完整脚本替换摘要
        }
      });
      
      const loadingDiv = document.getElementById('loading');
      const listDiv = document.getElementById('scriptList');

      loadingDiv.style.display = 'none';
      listDiv.style.display = 'grid';

      listDiv.innerHTML = scriptList.map(script => `
        <div class="script-card">
          <h3>${script.title}</h3>
          <p class="description">${script.description}</p>
          <div class="meta">
            <span>👥 ${script.minPlayers}-${script.maxPlayers}人</span>
            <span>⏱️ ${script.estimatedTime}分钟</span>
            <span class="difficulty ${script.difficulty}">${difficultyMap[script.difficulty]}</span>
          </div>
          <div class="actions">
            <button class="btn btn-primary" onclick="createRoom('${script.id}')">创建房间</button>
            <button class="btn btn-secondary" onclick="showJoinRoomModal('${script.id}')">加入房间</button>
          </div>
        </div>
      `).join('');

      // 如果是房主角色，自动创建第一个剧本的房间
      if (userRole === 'host' && scripts.length > 0) {
        setTimeout(() => {
          console.log('[自动模式] 房主：自动创建房间...');
          const firstScript = scripts[0];
          createRoom(firstScript.id, '房主');
        }, 1000);
      }
    }

    /**
     * 显示加入房间模态对话框
     */
    function showJoinRoomModal(scriptId) {
      currentScriptId = scriptId;
      const script = scripts.find(s => s.id === scriptId);
      
      // 创建或获取加入房间模态对话框
      let joinModal = document.getElementById('joinRoomModal');
      if (!joinModal) {
        joinModal = document.createElement('div');
        joinModal.id = 'joinRoomModal';
        joinModal.className = 'modal';
        document.body.appendChild(joinModal);
      }
      
      joinModal.innerHTML = `
        <div class="modal-content">
          <h3>加入房间</h3>
          ${script ? `<p>加入 "${script.title}" 的房间</p>` : ''}
        <div class="input-group">
            <label for="joinRoomIdInput">房间号：</label>
            <input type="text" id="joinRoomIdInput" class="room-id-input" placeholder="请输入6位房间号" 
                   maxlength="6" pattern="[0-9]{6}">
        </div>
          <div class="input-group">
            <label for="joinPlayerNameInput">你的名字：</label>
            <input type="text" id="joinPlayerNameInput" placeholder="输入你的名字" value="玩家">
        </div>
          <div class="actions">
            <button class="btn btn-secondary" onclick="closeJoinRoomModal()">取消</button>
            <button class="btn btn-primary" onclick="confirmJoinRoom()">加入</button>
          </div>
        </div>
      `;
      
      joinModal.classList.add('active');
      
      // 聚焦到房间号输入框
      const roomIdInput = document.getElementById('joinRoomIdInput');
      if (roomIdInput) {
        roomIdInput.focus();
        // 按 Enter 键确认
        roomIdInput.onkeydown = (e) => {
          if (e.key === 'Enter') {
            confirmJoinRoom();
          } else if (e.key === 'Escape') {
            closeJoinRoomModal();
          }
        };
      }
    }
    
    /**
     * 关闭加入房间模态对话框
     */
    function closeJoinRoomModal() {
      const modal = document.getElementById('joinRoomModal');
      if (modal) {
        modal.classList.remove('active');
      }
    }
    
    /**
     * 确认加入房间
     */
    function confirmJoinRoom() {
      const roomIdInput = document.getElementById('joinRoomIdInput');
      const playerNameInput = document.getElementById('joinPlayerNameInput');
      const roomId = roomIdInput?.value.trim();
      const playerName = playerNameInput?.value.trim() || '玩家';
      
      if (!roomId) {
        showError('请输入房间号');
        return;
      }
      
      // 验证房间号格式（6位数字）
      if (!/^\d{6}$/.test(roomId)) {
        showError('房间号必须是6位数字');
        return;
      }
      
      closeJoinRoomModal();
      joinRoomByRoomId(roomId, playerName);
    }


    /**
     * 自动加入房间（轮询 localStorage）
     */
    function autoJoinRoom() {
      const statusDiv = document.getElementById('autoJoinStatus');
      if (statusDiv) {
        statusDiv.textContent = '正在监听房间创建...';
      }

      if (autoJoinRoomId) {
        joinRoomByRoomId(autoJoinRoomId);
        return;
      }

      let pollCount = 0;
      const maxPolls = 60;
      const pollInterval = setInterval(() => {
        pollCount++;
        const lastRoomId = localStorage.getItem('lastRoomId');
        if (lastRoomId && lastRoomId !== currentRoomId) {
          clearInterval(pollInterval);
          autoJoinRoomId = lastRoomId;
          if (statusDiv) statusDiv.textContent = `发现房间 ${lastRoomId}，正在加入...`;
          joinRoomByRoomId(lastRoomId);
        } else if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          if (statusDiv) statusDiv.textContent = '未检测到房间创建，请手动输入房间号';
        } else if (statusDiv) {
          statusDiv.textContent = `正在监听房间创建... (${pollCount}/${maxPolls})`;
        }
      }, 500);
    }

    /**
     * 通过房间号加入房间
     */
    function joinRoomByRoomId(roomId, playerName = null) {
      if (!roomId) {
        showError('房间号不能为空');
        return;
      }
      
      // 如果没有提供玩家名称，使用输入框中的值或生成随机名称
      if (!playerName) {
        const playerNameInput = document.getElementById('joinPlayerNameInput') || document.getElementById('joinPlayerName');
        playerName = playerNameInput?.value.trim() || `玩家${Math.floor(Math.random() * 1000)}`;
      }
      
      sendMessage('room:join', { roomId, playerName });
      
      // 显示状态
      const statusDiv = document.getElementById('autoJoinStatus');
      if (statusDiv) {
        statusDiv.textContent = `正在加入房间 ${roomId}...`;
        statusDiv.style.color = '#667eea';
      }
      
      // 如果存在房间号输入框，清空它
      const roomIdInput = document.getElementById('roomIdInput');
      if (roomIdInput) {
        roomIdInput.value = '';
      }
    }

    function createRoom(scriptId, defaultPlayerName = null) {
      currentScriptId = scriptId;
      const script = scripts.find(s => s.id === scriptId);
      if (!script) {
        showError('剧本不存在');
        return;
      }

      // 加载剧本主题样式
      loadScriptTheme(script);

      // 如果是自动模式（房主），使用默认名称，否则显示模态对话框
      let playerName;
      if (defaultPlayerName) {
        playerName = defaultPlayerName;
      } else if (userRole === 'host') {
        playerName = '房主';
      } else {
        // 显示模态对话框输入玩家名称
        showPlayerNameModal((name) => {
          playerName = name || '房主';
          sendMessage('room:create', {
            scriptId,
            maxPlayers: script.maxPlayers,
            playerName
          });
        });
        return; // 等待用户输入
      }

      sendMessage('room:create', {
        scriptId,
        maxPlayers: script.maxPlayers,
        playerName
      });
    }

    /**
     * 显示玩家名称输入模态对话框
     */
    function showPlayerNameModal(callback) {
      pendingCreateRoomCallback = callback;
      window.pendingCreateRoomCallback = callback; // 同步到 window 对象
      const modal = document.getElementById('playerNameModal');
      const input = document.getElementById('modalPlayerName');
      modal.classList.add('active');
      input.focus();
      input.select();
      
      // 按 Enter 键确认
      input.onkeydown = (e) => {
        if (e.key === 'Enter') {
          confirmPlayerName();
        } else if (e.key === 'Escape') {
          closePlayerNameModal();
        }
      };
    }

    /**
     * 关闭玩家名称输入模态对话框
     */
    function closePlayerNameModal() {
      const modal = document.getElementById('playerNameModal');
      modal.classList.remove('active');
      pendingCreateRoomCallback = null;
      window.pendingCreateRoomCallback = null; // 同步到 window 对象
    }

    /**
     * 确认玩家名称
     */
    function confirmPlayerName() {
      const input = document.getElementById('modalPlayerName');
      const playerName = input.value.trim() || '房主';
      // 使用局部变量或 window 对象中的回调
      const callback = pendingCreateRoomCallback || window.pendingCreateRoomCallback;
      closePlayerNameModal();
      
      if (callback) {
        callback(playerName);
        pendingCreateRoomCallback = null;
        window.pendingCreateRoomCallback = null;
      }
    }

    function joinRoom() {
      if (!currentRoomId) {
        showError('请先创建或输入房间号');
        return;
      }

      const playerName = document.getElementById('playerName').value || '玩家';
      sendMessage('room:join', {
        roomId: currentRoomId,
        playerName
      });
    }

    /**
     * 切换显示/隐藏房间信息（玩家沉浸式阅读模式）
     */
    function toggleRoomInfo() {
      document.body.classList.toggle('show-room-info');
      const btn = document.getElementById('toggleRoomInfoBtn');
      if (btn) {
        btn.textContent = document.body.classList.contains('show-room-info') ? '✕' : 'ℹ️';
      }
    }

    // 暴露到全局
    window.toggleRoomInfo = toggleRoomInfo;

    function leaveRoom() {
      if (!currentRoomId) {
        return;
      }

      sendMessage('room:leave', {});
      currentRoomId = null;
      currentScriptId = null;
      document.getElementById('roomSection').classList.remove('active');
      
      // 移除主题样式，恢复默认样式
      removeScriptTheme();
    }

    function loadRoomInfo() {
      if (!currentRoomId) return;
      // 发送请求获取最新房间信息（如果需要的话）
      // 目前房间信息会在事件中自动更新，这里保留作为备用
      console.log('loadRoomInfo called for room:', currentRoomId);
    }

    function updatePageTitle(room) {
      const h1 = document.querySelector('h1');
      if (h1 && room) {
        const scriptName = scripts.find(s => s.id === room.scriptId)?.name || room.scriptId || '未知剧本';
        const roomStatus = room.status === 'waiting' ? '等待中' : room.status === 'playing' ? '游戏中' : '已结束';
        h1.textContent = `🎭 ${scriptName} - 房间 ${room.id} (${roomStatus})`;
        document.title = `剧本杀 - ${scriptName} - ${roomStatus}`;
      }
    }

    function updateRoomInfo(room) {
      if (!room) {
        console.warn('[Client] updateRoomInfo called with null/undefined room');
        return;
      }
      
      console.log('[Client] updateRoomInfo called with room:', room);
      console.log('[Client] Room players:', room.players);
      console.log('[Client] Room players count:', room.players?.length);
      console.log('[Client] Current player ID:', currentPlayerId);
      console.log('[Client] Current player name:', currentPlayerName);
      
      const roomSection = document.getElementById('roomSection');
      const roomInfo = document.getElementById('roomInfo');
      const playerList = document.getElementById('playerList');

      // 更新当前房间ID和剧本ID
      if (room.id) currentRoomId = room.id;
      if (room.scriptId) currentScriptId = room.scriptId;

      // 更新标题
      updatePageTitle(room);

      // 显示房间区域，隐藏剧本列表（进入房间页面）
      roomSection.classList.add('active');

      const scriptListDiv = document.getElementById('scriptList');
      if (scriptListDiv) {
        scriptListDiv.style.display = 'none';
      }
      
      // 根据房间状态设置 body 类名（必须在隐藏剧本列表之后）
      // 只有在等待状态时才添加 in-room 类名，游戏状态时应该保持 game-view-active
      if (room.status === 'waiting') {
        document.body.classList.add('in-room');
        document.body.classList.remove('game-view-active');
        console.log('[Client] updateRoomInfo: Set to waiting room (in-room)');
      } else if (room.status === 'playing') {
        document.body.classList.add('game-view-active');
        document.body.classList.remove('in-room');
        console.log('[Client] updateRoomInfo: Set to game view (game-view-active)');
      }

      // 如果没有设置当前玩家ID，尝试从房间玩家列表中查找
      if (!currentPlayerId && room.players && room.players.length > 0) {
        // 如果是房主，查找 isHost 的玩家
        if (userRole === 'host') {
          const hostPlayer = room.players.find(p => p.isHost);
          if (hostPlayer) {
            currentPlayerId = hostPlayer.id;
            currentPlayerName = hostPlayer.name;
          }
        } else {
          // 如果是玩家，查找非房主的玩家（通过名称匹配）
          const playerNameInput = document.getElementById('joinPlayerNameInput') || document.getElementById('playerName');
          const playerName = playerNameInput?.value.trim() || currentPlayerName || '玩家';
          const player = room.players.find(p => !p.isHost && (p.name === playerName || !currentPlayerId));
          if (player) {
            currentPlayerId = player.id;
            currentPlayerName = player.name;
            // 同步准备状态
            isReady = player.isReady || false;
          }
        }
      } else if (currentPlayerId && room.players) {
        // 如果已经有当前玩家ID，同步准备状态
        const currentPlayer = room.players.find(p => p.id === currentPlayerId);
        if (currentPlayer) {
          isReady = currentPlayer.isReady || false;
          updateReadyButton();
        }
      }

      // 检查游戏状态并显示相应的控制区域
      // 检查当前用户是否是房主
      const isCurrentUserHost = userRole === 'host' || (room.players?.some(p => p.isHost && (currentPlayerId ? p.id === currentPlayerId : true)));
      
      // 如果 userRole 不是 'host'，但当前玩家是房主，更新 userRole
      if (!isCurrentUserHost && room.players) {
        const hostPlayer = room.players.find(p => p.isHost);
        if (hostPlayer && currentPlayerId && hostPlayer.id === currentPlayerId) {
          userRole = 'host';
          console.log('[Client] updateRoomInfo: Updated userRole to "host"');
        }
      }
      
      console.log('[Client] updateRoomInfo: isCurrentUserHost=', isCurrentUserHost, 'userRole=', userRole, 'currentPlayerId=', currentPlayerId);
      
      // 检查游戏状态并显示相应的控制区域
      if (room.status === 'playing') {
        // 游戏已开始 - 进入游戏页面
        // 添加游戏页面类名，用于样式控制
        document.body.classList.add('game-view-active');
        document.body.classList.remove('in-room'); // 移除等待页面类名
        
        updateGameStatus('playing');
        
        // 如果当前阶段还是 IDLE，设置为初始阶段
        if (currentGamePhase === 'IDLE') {
          currentGamePhase = 'READING';
          updateGamePhase('READING');
        }
        
        // 隐藏所有等待相关的UI
        const waitingSection = document.getElementById('waitingSection');
        if (waitingSection) {
          waitingSection.style.display = 'none';
        }
        
        // 房主：显示游戏控制区域和主持人内容
        if (isCurrentUserHost) {
          const gameControlSection = document.getElementById('gameControlSection');
          if (gameControlSection) {
            gameControlSection.style.display = 'block';
            console.log('[Client] updateRoomInfo: Set gameControlSection to block for host');
          }
          const playerGameSection = document.getElementById('playerGameSection');
          if (playerGameSection) {
            playerGameSection.style.display = 'none';
            console.log('[Client] updateRoomInfo: Set playerGameSection to none for host');
          }
          // 显示主持人剧本内容（异步加载，根据当前阶段）
          displayHostScriptContent(room, currentGamePhase).catch(err => {
            console.error('[Client] Failed to display host script content:', err);
          });
          // 显示当前阶段内容（房主）
          if (currentGamePhase && currentGamePhase !== 'IDLE') {
            displayHostCurrentPhaseContent(currentGamePhase).catch(err => {
              console.error('[Client] Failed to display host phase content:', err);
            });
          }
          // 显示玩家列表（包含角色分配）
          displayPlayersWithCharacters(room).catch(err => {
            console.error('[Client] Failed to display players with characters:', err);
          });
        } else {
          // 玩家：显示玩家游戏区域和角色信息
          console.log('[Client] updateRoomInfo: Player view - showing player game section');
          
          // 如果游戏已开始，启用沉浸式阅读模式
          if (room.status === 'playing') {
            document.body.classList.add('player-reading-mode');
            // 显示切换房间信息按钮
            const toggleBtn = document.getElementById('toggleRoomInfoBtn');
            if (toggleBtn) {
              toggleBtn.style.display = 'block';
            }
          }
          
          const gameControlSection = document.getElementById('gameControlSection');
          if (gameControlSection) {
            gameControlSection.style.display = 'none';
            console.log('[Client] updateRoomInfo: Set gameControlSection to none for player');
          }
          const playerGameSection = document.getElementById('playerGameSection');
          if (playerGameSection) {
            playerGameSection.style.display = 'block';
            console.log('[Client] updateRoomInfo: Set playerGameSection to block for player');
          }
          // 隐藏等待区域，显示游戏内容
          const waitingSection = document.getElementById('waitingSection');
          if (waitingSection) {
            waitingSection.style.display = 'none';
            console.log('[Client] updateRoomInfo: Set waitingSection to none for player');
          }
          // 隐藏当前阶段信息标题（沉浸式阅读模式）
          const phaseInfo = document.getElementById('currentPhaseInfo');
          if (phaseInfo) {
            phaseInfo.style.display = 'none';
          }
          // 显示角色信息
          displayCharacterInfo(room).catch(err => {
            console.error('[Client] Failed to display character info:', err);
          });
          // 显示当前阶段内容
          if (currentGamePhase && currentGamePhase !== 'IDLE') {
            displayCurrentPhaseContent(currentGamePhase).catch(err => {
              console.error('[Client] Failed to display phase content:', err);
            });
          }
        }
        
        // 显示游戏控制（这会显示下一阶段按钮）
        showGameControls();
      } else {
        // 等待状态：移除游戏页面类名
        document.body.classList.remove('game-view-active');
        document.body.classList.add('in-room');
        // 等待状态：房主显示开始游戏按钮，玩家显示准备按钮
        if (isCurrentUserHost) {
          // 房主：显示游戏控制区域（开始游戏按钮）
          const gameControlSection = document.getElementById('gameControlSection');
          if (gameControlSection) {
            gameControlSection.style.display = 'block';
          }
          const playerGameSection = document.getElementById('playerGameSection');
          if (playerGameSection) {
            playerGameSection.style.display = 'none';
          }
        } else {
          // 玩家：显示玩家游戏区域（准备按钮）
          const gameControlSection = document.getElementById('gameControlSection');
          if (gameControlSection) {
            gameControlSection.style.display = 'none';
          }
          const playerGameSection = document.getElementById('playerGameSection');
          if (playerGameSection) {
            playerGameSection.style.display = 'block';
          }
          // 显示等待区域和准备按钮
          const waitingSection = document.getElementById('waitingSection');
          const cluesSection = document.getElementById('cluesSection');
          if (waitingSection) {
            waitingSection.style.display = 'block';
          }
          if (cluesSection) {
            cluesSection.style.display = 'none';
          }
          // 更新准备按钮状态
          updateReadyButton();
        }
      }

      // 显示房间信息
      const playersCount = (room.players && Array.isArray(room.players)) ? room.players.length : 0;
      roomInfo.innerHTML = `
        <p><strong>房间号：</strong>${room.id}</p>
        <p><strong>剧本：</strong>${room.scriptId || currentScriptId || '未知'}</p>
        <p><strong>人数：</strong>${playersCount}/${room.maxPlayers || 6}</p>
        <p><strong>状态：</strong>${room.status === 'waiting' ? '等待中' : room.status === 'playing' ? '游戏中' : '已结束'}</p>
      `;

      // 显示玩家列表
      if (room.players && Array.isArray(room.players) && room.players.length > 0) {
        console.log('[Client] Rendering player list with', room.players.length, 'players');
        
        // 获取剧本信息以显示角色名称
        const script = scripts.find(s => s.id === room.scriptId);

      playerList.innerHTML = `
        <h3>玩家列表：</h3>
          ${room.players.map(player => {
            const playerName = player.name || '未知玩家';
            const hostBadge = player.isHost ? '<span class="host-badge">房主</span>' : '';
            const readyBadge = player.isReady ? '<span class="ready-badge">✓ 已准备</span>' : '';
            const statusIcon = player.status === 'online' ? '🟢' : '🔴';
            
            // 显示角色信息（如果已分配）
            let characterBadge = '';
            if (player.characterId && script) {
              const character = script.characters?.find(c => c.id === player.characterId);
              if (character) {
                // 房主可以看到所有玩家的角色，玩家只能看到自己的角色
                const isCurrentPlayer = currentPlayerId && player.id === currentPlayerId;
                const isHost = userRole === 'host';
                if (isHost || isCurrentPlayer) {
                  characterBadge = `<span class="character-badge">🎭 ${character.name}</span>`;
                }
              }
            }
            
            // 检查是否是当前玩家
            const isCurrentPlayer = currentPlayerId && player.id === currentPlayerId;
            const currentPlayerClass = isCurrentPlayer ? 'current-player' : '';
            const currentPlayerIndicator = isCurrentPlayer ? '<span class="current-player-indicator">👤 我</span>' : '';
            return `
            <div class="player-item ${currentPlayerClass}">
              <span>${playerName} ${hostBadge}${readyBadge}${characterBadge}${currentPlayerIndicator}</span>
              <span>${statusIcon}</span>
          </div>
          `;
          }).join('')}
        `;
      } else {
        console.log('[Client] No players in room or players is not an array');
        playerList.innerHTML = '<h3>玩家列表：</h3><p>暂无玩家</p>';
      }

      // 根据用户角色显示/隐藏操作区域
      const playerActions = document.getElementById('playerActions');
      const hostActions = document.getElementById('hostActions');
      
      // 使用之前已经声明的 isCurrentUserHost 变量
      if (isCurrentUserHost) {
        // 房主：只显示离开房间按钮，隐藏玩家操作区域
        if (hostActions) hostActions.style.display = 'block';
        if (playerActions) playerActions.style.display = 'none';
      } else {
        // 玩家：如果已经在房间中，显示离开房间；如果还没加入，显示加入房间选项
        const isInRoom = room.players && room.players.some(p => !p.isHost);
        if (isInRoom) {
          // 玩家已加入：显示离开房间按钮
          if (hostActions) hostActions.style.display = 'block';
          if (playerActions) playerActions.style.display = 'none';
        } else {
          // 玩家未加入：显示加入房间选项
          if (playerActions) playerActions.style.display = 'block';
          if (hostActions) hostActions.style.display = 'none';
        }
      }
      
      console.log('[Client] Room info updated successfully');
    }

    /**
     * 显示角色信息（玩家）
     */
    async function displayCharacterInfo(room) {
      if (!room || !currentPlayerId) {
        console.log('[Client] displayCharacterInfo: Missing room or currentPlayerId', { room: !!room, currentPlayerId });
        return;
      }
      
      // 查找当前玩家的角色
      const currentPlayer = room.players?.find(p => p.id === currentPlayerId);
      if (!currentPlayer) {
        console.log('[Client] displayCharacterInfo: Current player not found', { currentPlayerId, players: room.players });
        return;
      }
      
      if (!currentPlayer.characterId) {
        console.log('[Client] displayCharacterInfo: Player has no characterId', { currentPlayer });
        return;
      }
      
      console.log('[Client] displayCharacterInfo: Player characterId:', currentPlayer.characterId);
      
      try {
        const script = await ensureScriptLoaded(room.scriptId, 'characters');
        const character = script.characters.find(c => c.id === currentPlayer.characterId);
        
        if (!character) {
          console.warn('[Client] displayCharacterInfo: Character not found', { 
            characterId: currentPlayer.characterId,
            availableCharacters: script.characters.map(c => c.id)
          });
          return;
        }
        
        console.log('[Client] displayCharacterInfo: Found character', character.name);
        
        // 显示角色信息
        const characterInfo = document.getElementById('characterInfo');
        const characterDetails = document.getElementById('characterDetails');
        
        if (characterInfo && characterDetails) {
          characterInfo.style.display = 'block';
          characterDetails.innerHTML = `
            <div class="character-card">
              <h5>${character.name} - ${character.title}</h5>
              <p><strong>描述：</strong>${character.description}</p>
              <p><strong>背景：</strong>${character.background}</p>
              ${character.secret ? `<p><strong>秘密：</strong><span class="character-secret">${character.secret}</span></p>` : ''}
              <p><strong>目标：</strong>${character.goal}</p>
              ${character.skills && character.skills.length > 0 ? `<p><strong>技能：</strong>${character.skills.join('、')}</p>` : ''}
            </div>
          `;
          console.log('[Client] displayCharacterInfo: Character info displayed');
        } else {
          console.warn('[Client] displayCharacterInfo: Character info elements not found');
        }
      } catch (error) {
        console.error('[Client] displayCharacterInfo: Failed:', error);
      }
    }

    /**
     * 显示玩家列表（包含角色分配）- 房主视角
     */
    async function displayPlayersWithCharacters(room) {
      if (!room || userRole !== 'host') {
        console.log('[Client] displayPlayersWithCharacters: Skipped', { room: !!room, userRole });
        return;
      }
      
      const playerList = document.getElementById('playerList');
      if (!playerList) {
        console.warn('[Client] displayPlayersWithCharacters: playerList element not found');
        return;
      }
      
      console.log('[Client] displayPlayersWithCharacters: Displaying players with characters', {
        roomId: room.id,
        playersCount: room.players?.length,
        scriptId: room.scriptId
      });
      
      try {
        const script = await ensureScriptLoaded(room.scriptId, 'characters');
        
        if (room.players && Array.isArray(room.players) && room.players.length > 0) {
          playerList.innerHTML = `
            <h3>玩家列表（含角色分配）</h3>
            ${room.players.map(player => {
              const playerName = player.name || '未知玩家';
              const hostBadge = player.isHost ? '<span class="host-badge">房主</span>' : '';
              const statusIcon = player.status === 'online' ? '🟢' : '🔴';
              
              // 显示角色信息（房主可以看到所有玩家的角色）
              let characterInfo = '';
              if (player.characterId && script && script.characters) {
                const character = script.characters.find(c => c.id === player.characterId);
                if (character) {
                  characterInfo = `
                    <div class="player-character">
                      <strong>🎭 角色：</strong>${character.name} - ${character.title}
                      <br><small>${character.description}</small>
                    </div>
                  `;
                  console.log('[Client] displayPlayersWithCharacters: Found character for player', {
                    playerName: player.name,
                    characterName: character.name
                  });
                } else {
                  console.warn('[Client] displayPlayersWithCharacters: Character not found', {
                    playerName: player.name,
                    characterId: player.characterId,
                    availableCharacters: script.characters.map(c => c.id)
                  });
                  characterInfo = '<div class="player-character"><em>角色未找到</em></div>';
                }
              } else if (!player.isHost) {
                characterInfo = '<div class="player-character"><em>未分配角色</em></div>';
              }
              
              return `
                <div class="player-item">
                  <div>
                    <div>${playerName} ${hostBadge} ${statusIcon}</div>
                    ${characterInfo}
                  </div>
                </div>
              `;
            }).join('')}
          `;
          playerList.style.display = 'block';
          console.log('[Client] displayPlayersWithCharacters: Player list updated');
        } else {
          console.log('[Client] displayPlayersWithCharacters: No players in room');
          playerList.innerHTML = '<h3>玩家列表（含角色分配）</h3><p>暂无玩家</p>';
          playerList.style.display = 'block';
        }
      } catch (error) {
        console.error('[Client] displayPlayersWithCharacters: Failed:', error);
        // 即使加载失败，也显示玩家列表（只是没有角色信息）
        if (room.players && Array.isArray(room.players) && room.players.length > 0) {
          playerList.innerHTML = `
            <h3>玩家列表（含角色分配）</h3>
            ${room.players.map(player => {
              const playerName = player.name || '未知玩家';
              const hostBadge = player.isHost ? '<span class="host-badge">房主</span>' : '';
              const statusIcon = player.status === 'online' ? '🟢' : '🔴';
              return `
                <div class="player-item">
                  <div>
                    <div>${playerName} ${hostBadge} ${statusIcon}</div>
                    <div class="player-character"><em>角色加载中...</em></div>
                  </div>
                </div>
              `;
            }).join('')}
          `;
          playerList.style.display = 'block';
        }
      }
    }

    /**
     * 显示主持人剧本内容（房主）- 根据当前阶段显示不同的内容
     */
    async function displayHostScriptContent(room, phase = null) {
      if (!room || userRole !== 'host') {
        console.log('[Client] displayHostScriptContent skipped:', { room: !!room, userRole });
        return;
      }
      
      // 使用传入的阶段，如果没有则使用当前阶段
      const targetPhase = phase || currentGamePhase;
      
      console.log('[Client] displayHostScriptContent called for room:', room.scriptId, 'phase:', targetPhase);
      
      try {
        const script = await ensureScriptLoaded(room.scriptId, 'phases');
        showHostScriptContentForPhase(script, targetPhase);
      } catch (error) {
        console.error('[Client] displayHostScriptContent: Failed:', error);
      }
    }

    function showHostScriptContentForPhase(script, phase) {
      // 显示主持人剧本内容
      const hostScriptContent = document.getElementById('hostScriptContent');
      const hostStoryline = document.getElementById('hostStoryline');
      
      console.log('[Client] showHostScriptContentForPhase:', { 
        phase,
        hostScriptContent: !!hostScriptContent, 
        hostStoryline: !!hostStoryline,
        hasPhases: !!script.phases,
        hasStoryline: !!script.storyline
      });
      
      if (!hostScriptContent || !hostStoryline) {
        console.warn('[Client] Host script content elements not found');
        return;
      }
      
      hostScriptContent.style.display = 'block';
      
      // 查找当前阶段的剧本内容
      const phaseData = findPhaseData(script, phase);
      
      // 根据阶段显示不同的内容
      if (phaseData) {
        // 显示当前阶段的主持人内容
        const phaseName = phaseData.name || phase;
        const phaseDescription = phaseData.description || '';
        
        // 根据阶段索引动态计算 storyline 范围
        let relevantStoryline = [];
        if (script.storyline && Array.isArray(script.storyline) && script.phases) {
          const phaseIndex = script.phases.findIndex(p => p.id === phase);
          if (phaseIndex >= 0) {
            const indices = getStorylineIndicesForPhase(script, phaseIndex);
            relevantStoryline = indices.map(i => script.storyline[i]).filter(Boolean);
          }
        }
        
        hostStoryline.innerHTML = `
          <div class="storyline-content">
            <h5>${phaseName} - 主持人指引</h5>
            <p><strong>阶段描述：</strong>${phaseDescription}</p>
            ${relevantStoryline.length > 0 ? `
              <div class="phase-storyline">
                <strong>当前环节剧情要点：</strong>
                <ol>
                  ${relevantStoryline.map(item => `<li>${item}</li>`).join('')}
                </ol>
              </div>
            ` : ''}
            ${script.storyline && script.storyline.length > 0 && relevantStoryline.length === 0 ? `
              <div class="full-storyline">
                <strong>完整故事线：</strong>
                <ol>
                  ${script.storyline.map(item => `<li>${item}</li>`).join('')}
                </ol>
              </div>
            ` : ''}
          </div>
        `;
      } else if (script.storyline && script.storyline.length > 0) {
        // 如果没有找到阶段数据，显示完整故事线
        hostStoryline.innerHTML = `
          <div class="storyline-content">
            <ol>
              ${script.storyline.map(item => `<li>${item}</li>`).join('')}
            </ol>
          </div>
        `;
      } else {
        hostStoryline.innerHTML = '<p>暂无主持人剧本内容</p>';
      }
    }

    // Make functions global for onclick handlers
    window.createRoom = createRoom;
    window.joinRoom = joinRoom;
    window.leaveRoom = leaveRoom;
    window.showJoinRoomModal = showJoinRoomModal;
    window.closeJoinRoomModal = closeJoinRoomModal;
    window.confirmJoinRoom = confirmJoinRoom;
    window.autoJoinRoom = autoJoinRoom;
    window.confirmPlayerName = confirmPlayerName;
    window.closePlayerNameModal = closePlayerNameModal;
    window.startGame = startGame;
    window.nextPhase = nextPhase;
    window.submitClue = submitClue;
    window.toggleReady = toggleReady;

    let isReady = false; // 当前玩家的准备状态

    function toggleReady() {
      if (!currentRoomId) {
        showError('请先加入房间');
        return;
      }
      
      // 切换准备状态
      isReady = !isReady;
      
      // 发送准备/取消准备消息
      sendMessage('room:setReady', { ready: isReady });
      
      // 立即更新按钮状态（乐观更新）
      updateReadyButton();
    }

    function updateReadyButton() {
      const readyBtn = document.getElementById('readyBtn');
      if (readyBtn) {
        if (isReady) {
          readyBtn.textContent = '取消准备';
          readyBtn.classList.remove('btn-primary');
          readyBtn.classList.add('btn-secondary');
        } else {
          readyBtn.textContent = '准备';
          readyBtn.classList.remove('btn-secondary');
          readyBtn.classList.add('btn-primary');
        }
      }
    }

    // 游戏控制函数
    let currentGamePhase = 'IDLE';
    let discoveredClues = [];

    function startGame() {
      if (!currentRoomId) {
        showError('请先创建或加入房间');
        return;
      }

      sendMessage('game:start', {});
    }

    function nextPhase() {
      if (!currentRoomId) {
        showError('请先创建或加入房间');
        return;
      }

      console.log('[Client] nextPhase called, current phase:', currentGamePhase);

      // 获取下一个阶段
      const currentIndex = PHASES.indexOf(currentGamePhase);
      if (currentIndex === -1) {
        showError('当前阶段无效');
        return;
      }
      
      // 不能超过最后一个阶段
      if (currentIndex >= PHASES.length - 1) {
        showError('已经是最后一个阶段');
        return;
      }
      
      const nextIndex = currentIndex + 1;
      const nextPhase = PHASES[nextIndex];

      console.log('[Client] nextPhase: Sending phase update', { currentPhase: currentGamePhase, nextPhase });

      sendMessage('game:phaseUpdate', { phase: nextPhase });
    }

    function prevPhase() {
      if (!currentRoomId) {
        showError('请先创建或加入房间');
        return;
      }

      console.log('[Client] prevPhase called, current phase:', currentGamePhase);

      // 获取上一个阶段
      const currentIndex = PHASES.indexOf(currentGamePhase);
      if (currentIndex === -1) {
        showError('当前阶段无效');
        return;
      }
      
      // 不能回退到 IDLE 之前
      if (currentIndex <= 1) {
        showError('无法回退到更早的阶段');
        return;
      }
      
      const prevIndex = currentIndex - 1;
      const prevPhase = PHASES[prevIndex];

      console.log('[Client] prevPhase: Sending phase update', { currentPhase: currentGamePhase, prevPhase });

      sendMessage('game:phaseUpdate', { phase: prevPhase });
    }

    // 暴露到全局
    window.prevPhase = prevPhase;

    function submitClue() {
      if (!currentRoomId) {
        showError('请先创建或加入房间');
        return;
      }

      const clueIdInput = document.getElementById('clueIdInput');
      const clueId = clueIdInput?.value.trim();
      
      if (!clueId) {
        showError('请输入线索ID');
        return;
      }

      sendMessage('game:clueFound', { clueId });
      
      if (clueIdInput) {
        clueIdInput.value = '';
      }
    }

    function updateGameStatus(status) {
      const gameStatus = document.getElementById('gameStatus');
      if (gameStatus) {
        const statusText = status === 'playing' ? '游戏中' : '等待中';
        gameStatus.innerHTML = `<p>游戏状态：<span>${statusText}</span></p>`;
      }
    }

    async function updateGamePhase(phase) {
      currentGamePhase = phase;
      const gamePhaseSpan = document.getElementById('gamePhase');
      if (gamePhaseSpan) {
        gamePhaseSpan.textContent = phase;
      }

      const phaseInfo = document.getElementById('currentPhaseInfo');
      if (phaseInfo) {
        // 尝试从剧本中获取阶段名称
        let phaseName = phase;
        if (currentScriptId) {
          try {
            const script = scripts.find(s => s.id === currentScriptId);
            if (script && script.phases) {
              const phaseData = script.phases.find(p => p.id === phase);
              if (phaseData) {
                phaseName = phaseData.name;
              }
            }
          } catch (e) {
            console.warn('[Client] Failed to get phase name from script:', e);
          }
        }
        
        // 回退到默认名称映射
        const defaultPhaseNames = {
          'IDLE': '等待开始',
          'READING': '阅读剧本',
          'SEARCH': '搜证环节',
          'DISCUSSION': '集中讨论',
          'VOTE': '投票环节',
          'REVEAL': '复盘/结案'
        };
        const displayName = phaseName !== phase ? phaseName : (defaultPhaseNames[phase] || phase);
        phaseInfo.innerHTML = `<p><strong>当前阶段：</strong>${displayName}</p>`;
        phaseInfo.style.display = 'block';
      }

      // 显示当前阶段的剧本内容
      displayCurrentPhaseContent(phase);

      // 如果是搜证阶段（investigation），显示线索区域
      const cluesSection = document.getElementById('cluesSection');
      if (cluesSection) {
        // 支持默认阶段 'SEARCH' 或剧本定义的 'investigation' 阶段
        const isSearchPhase = phase === 'SEARCH' || phase === 'investigation';
        cluesSection.style.display = isSearchPhase ? 'block' : 'none';
      }
      
      // 更新游戏控制显示（根据阶段更新按钮）
      showGameControls();
    }

    /**
     * 显示当前阶段的剧本内容
     */
    async function displayCurrentPhaseContent(phase) {
      if (!currentScriptId) {
        console.log('[Client] displayCurrentPhaseContent: No currentScriptId');
        return;
      }
      
      console.log('[Client] displayCurrentPhaseContent: phase=', phase, 'currentScriptId=', currentScriptId);
      
      try {
        const script = await ensureScriptLoaded(currentScriptId, 'phases');
        const phaseData = findPhaseData(script, phase);
        
        if (!phaseData) {
          console.warn('[Client] displayCurrentPhaseContent: Phase not found', { 
            phase, 
            availablePhases: script.phases.map(p => p.id)
          });
          return;
        }
        
        console.log('[Client] displayCurrentPhaseContent: Found phase data', phaseData.name);
        
        const phaseContent = document.getElementById('currentPhaseContent');
        const phaseDescription = document.getElementById('phaseDescription');
        
        if (phaseContent && phaseDescription) {
          phaseContent.style.display = 'block';
          phaseDescription.innerHTML = renderPhaseContentHTML(phaseData);
          console.log('[Client] displayCurrentPhaseContent: Phase content displayed');
        } else {
          console.warn('[Client] displayCurrentPhaseContent: Phase content elements not found');
        }
      } catch (error) {
        console.error('[Client] displayCurrentPhaseContent: Failed:', error);
      }
    }

    /**
     * 显示房主当前阶段的剧本内容
     */
    async function displayHostCurrentPhaseContent(phase) {
      if (!currentScriptId) {
        console.log('[Client] displayHostCurrentPhaseContent: No currentScriptId');
        return;
      }
      
      console.log('[Client] displayHostCurrentPhaseContent: phase=', phase, 'currentScriptId=', currentScriptId);
      
      try {
        const script = await ensureScriptLoaded(currentScriptId, 'phases');
        const phaseData = findPhaseData(script, phase);
        
        if (!phaseData) {
          console.warn('[Client] displayHostCurrentPhaseContent: Phase not found', { 
            phase, 
            availablePhases: script.phases.map(p => p.id)
          });
          return;
        }
        
        console.log('[Client] displayHostCurrentPhaseContent: Found phase data', phaseData.name);
        
        const phaseContent = document.getElementById('hostCurrentPhaseContent');
        const phaseDescription = document.getElementById('hostPhaseDescription');
        
        if (phaseContent && phaseDescription) {
          phaseContent.style.display = 'block';
          phaseDescription.innerHTML = renderPhaseContentHTML(phaseData);
          console.log('[Client] displayHostCurrentPhaseContent: Phase content displayed');
        } else {
          console.warn('[Client] displayHostCurrentPhaseContent: Phase content elements not found');
        }
      } catch (error) {
        console.error('[Client] displayHostCurrentPhaseContent: Failed:', error);
      }
    }

    function showGameControls() {
      const gameControlSection = document.getElementById('gameControlSection');
      const playerGameSection = document.getElementById('playerGameSection');
      const startGameBtn = document.getElementById('startGameBtn');
      const nextPhaseBtn = document.getElementById('nextPhaseBtn');
      const waitingSection = document.getElementById('waitingSection');
      const cluesSection = document.getElementById('cluesSection');

      // 检查是否是房主 - 使用全局变量或从房间信息判断
      const isHost = userRole === 'host' || (currentPlayerId && document.querySelector('.player-item.current-player')?.textContent?.includes('房主'));
      
      // 如果无法从上述方式判断，尝试从房间信息获取
      let isCurrentUserHost = isHost;
      if (!isCurrentUserHost && currentRoomId) {
        // 通过检查当前玩家ID是否匹配房主ID
        // 这个逻辑应该在 updateRoomInfo 中已经设置了 isCurrentUserHost
        // 但为了安全，我们在这里也做一次检查
        const roomInfo = document.getElementById('roomInfo');
        if (roomInfo) {
          // 如果房间信息中有房主标识，且当前用户是房主
          isCurrentUserHost = userRole === 'host';
        }
      }
      
      // 使用更可靠的方式：检查 userRole 或通过房间玩家列表判断
      // 由于我们在 updateRoomInfo 中已经计算了 isCurrentUserHost，这里应该使用它
      // 但 showGameControls 是独立调用的，所以需要重新计算
      // 简化：直接使用 userRole 和 currentPlayerId 判断
      const isHostUser = userRole === 'host';
      
      console.log('[Client] showGameControls: isHostUser=', isHostUser, 'userRole=', userRole, 'currentGamePhase=', currentGamePhase);
      
      if (isHostUser) {
        // 房主：显示游戏控制区域
        if (gameControlSection) {
          gameControlSection.style.display = 'block';
          console.log('[Client] showGameControls: Set gameControlSection to block for host');
        }
        if (playerGameSection) {
          playerGameSection.style.display = 'none';
          console.log('[Client] showGameControls: Set playerGameSection to none for host');
        }
        
        // 根据游戏状态和阶段显示/隐藏按钮
        // 如果游戏已开始（status === 'playing'），显示下一阶段按钮
        // 如果游戏未开始（status === 'waiting'），显示开始游戏按钮
        const roomInfo = document.getElementById('roomInfo');
        const isGamePlaying = roomInfo?.textContent?.includes('游戏中') || currentGamePhase !== 'IDLE';
        
        // 简化逻辑：游戏开始后总是显示下一阶段按钮
        if (startGameBtn) {
          // 只在等待状态且阶段为 IDLE 时显示开始游戏按钮
          startGameBtn.style.display = (currentGamePhase === 'IDLE' && !isGamePlaying) ? 'block' : 'none';
        }
        const prevPhaseBtn = document.getElementById('prevPhaseBtn');
        if (prevPhaseBtn) {
          const currentIndex = PHASES.indexOf(currentGamePhase);
          const canGoBack = currentIndex > 1; // 可以回退（不能回退到 IDLE 或 READING 之前）
          prevPhaseBtn.style.display = (canGoBack && isGamePlaying) ? 'block' : 'none';
        }
        
        if (nextPhaseBtn) {
          const shouldShowNextPhase = currentGamePhase !== 'IDLE' || isGamePlaying;
          const currentIndex = PHASES.indexOf(currentGamePhase);
          const isLastPhase = currentIndex >= PHASES.length - 1;
          nextPhaseBtn.style.display = (shouldShowNextPhase && !isLastPhase) ? 'block' : 'none';
          
          console.log('[Client] showGameControls - Next phase button:', {
            currentGamePhase,
            isGamePlaying,
            shouldShowNextPhase,
            isLastPhase,
            display: nextPhaseBtn.style.display,
            elementExists: !!nextPhaseBtn
          });
        }
        
        // 确保游戏控制区域显示
        if (gameControlSection) {
          gameControlSection.style.display = 'block';
        }
        
        console.log('[Client] showGameControls - Host view:', {
          currentGamePhase,
          isGamePlaying,
          startGameBtnDisplay: startGameBtn?.style.display,
          nextPhaseBtnDisplay: nextPhaseBtn?.style.display,
          gameControlSectionDisplay: gameControlSection?.style.display
        });
      } else {
        // 玩家：显示玩家游戏区域
        console.log('[Client] showGameControls: Player view - showing player game section');
        if (gameControlSection) {
          gameControlSection.style.display = 'none';
        }
        if (playerGameSection) {
          playerGameSection.style.display = 'block';
          console.log('[Client] showGameControls: Set playerGameSection to block for player');
        }
        
        // 游戏已开始，隐藏准备按钮，显示游戏内容
        if (waitingSection) {
          waitingSection.style.display = 'none';
          console.log('[Client] showGameControls: Set waitingSection to none for player');
        }
        
        // 显示当前阶段信息
        const phaseInfo = document.getElementById('currentPhaseInfo');
        if (phaseInfo) {
          phaseInfo.style.display = 'block';
        }
        
        // 根据阶段显示线索区域
        if (cluesSection) {
          cluesSection.style.display = currentGamePhase === 'SEARCH' ? 'block' : 'none';
        }
      }
    }

    function addDiscoveredClue(clueId) {
      if (discoveredClues.includes(clueId)) {
        return;
      }

      discoveredClues.push(clueId);
      
      const cluesList = document.getElementById('cluesList');
      if (cluesList) {
        const clueItem = document.createElement('div');
        clueItem.className = 'clue-item discovered';
        clueItem.textContent = `✓ ${clueId}`;
        cluesList.appendChild(clueItem);
      }
    }

    // Connect on page load
    connect();
