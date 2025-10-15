class CustomSaysSystem {
    constructor() {
        this.says = [];
        this.init();
    }

    async init() {
        await this.loadSays();
        this.renderSays();
        this.bindEvents();
        this.updateStats();
    }

    // 加载说说数据
    async loadSays() {
        try {
            console.log('开始加载说说数据...');

            // 正确的数据文件路径
            const response = await fetch('../shuoshuo/data.json');

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.says = await response.json();
            this.says.sort((a, b) => new Date(b.date) - new Date(a.date));
            console.log(`成功加载 ${this.says.length} 条说说`);

        } catch (error) {
            console.error('加载说说失败:', error);
            this.showError('数据加载失败，请检查控制台');

            // 使用备用数据
            this.says = [
                {
                    "id": 1,
                    "content": "欢迎来到我的说说空间！这里记录我的技术学习和生活点滴。",
                    "date": "2025-10-15T16:00:00Z",
                    "mood": "happy",
                    "images": [],
                    "likes": 8,
                    "comments": 3,
                    "tags": ["欢迎"]
                },
                {
                    "id": 2,
                    "content": "今天解决了Hexo部署的一个大问题，原来是因为CDN缓存导致的。**重要提示**：记得清理缓存！",
                    "date": "2025-10-15T14:30:00Z",
                    "mood": "excited",
                    "images": ["/images/shuoshuo/solution.jpg"],
                    "likes": 12,
                    "comments": 5,
                    "tags": ["技术", "Hexo"]
                },
                {
                    "id": 3,
                    "content": "学习前端动画真的很有趣，CSS的`transform`和`transition`配合使用效果很棒！",
                    "date": "2025-10-15T10:15:00Z",
                    "mood": "study",
                    "images": [],
                    "likes": 6,
                    "comments": 2,
                    "tags": ["学习", "前端"]
                }
            ];
        }
    }

    // 渲染说说列表
    renderSays() {
        const container = document.getElementById('saysContainer');

        if (!this.says.length) {
            container.innerHTML = `
        <div class="empty-state">
          <div style="font-size: 3rem; margin-bottom: 20px;">📝</div>
          <h3>还没有任何说说</h3>
          <p>快来记录你的第一句话吧！</p>
        </div>
      `;
            return;
        }

        container.innerHTML = this.says.map(say => `
      <div class="say-item" data-id="${say.id}">
        <div class="say-content">${this.formatContent(say.content)}</div>
        
        ${say.tags && say.tags.length ? `
          <div class="say-tags">
            ${say.tags.map(tag => `
              <span class="tag ${this.getTagClass(tag)}">#${tag}</span>
            `).join('')}
          </div>
        ` : ''}
        
        ${say.images && say.images.length ? this.renderImages(say.images) : ''}
        
        <div class="say-meta">
          <span class="say-time">${this.formatTime(say.date)}</span>
          <div class="say-actions">
            <button class="btn-secondary" onclick="saysSystem.handleLike(${say.id})">
              ❤️ ${say.likes || 0}
            </button>
            <button class="btn-secondary" onclick="saysSystem.handleComment(${say.id})">
              💬 ${say.comments || 0}
            </button>
          </div>
        </div>
      </div>
    `).join('');
    }

    // 格式化内容
    formatContent(content) {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    // 获取标签样式
    getTagClass(tag) {
        const tagClasses = {
            '技术': 'tech',
            '学习': 'study',
            '生活': 'life',
            'Hexo': 'tech',
            '前端': 'tech'
        };
        return tagClasses[tag] || '';
    }

    // 格式化时间
    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;

        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // 更新统计信息
    updateStats() {
        const totalSays = document.getElementById('total-says');
        const totalLikes = document.getElementById('total-likes');

        if (totalSays) {
            totalSays.textContent = this.says.length;
        }

        if (totalLikes) {
            const likes = this.says.reduce((sum, say) => sum + (say.likes || 0), 0);
            totalLikes.textContent = likes;
        }
    }

    // 绑定事件
    bindEvents() {
        // 刷新按钮
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refresh());
        }

        // 回到顶部按钮
        const scrollTopBtn = document.getElementById('scrollTopBtn');
        if (scrollTopBtn) {
            scrollTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // 监听滚动显示/隐藏回到顶部按钮
        window.addEventListener('scroll', () => {
            if (scrollTopBtn) {
                scrollTopBtn.style.display = window.scrollY > 300 ? 'flex' : 'none';
            }
        });
    }

    // 刷新功能
    async refresh() {
        const container = document.getElementById('saysContainer');
        container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>刷新中...</p>
      </div>
    `;

        await this.loadSays();
        this.renderSays();
        this.updateStats();
        this.showMessage('刷新成功', 'success');
    }

    // 点赞处理
    handleLike(sayId) {
        const say = this.says.find(s => s.id === sayId);
        if (say) {
            say.likes = (say.likes || 0) + 1;
            this.renderSays();
            this.updateStats();
            this.showMessage('点赞成功！', 'success');
        }
    }

    // 评论处理
    handleComment(sayId) {
        this.showMessage('评论功能即将上线！', 'info');
    }

    // 显示消息
    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `message-${type}`;
        messageEl.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
      ">
        ${message}
      </div>
    `;

        document.body.appendChild(messageEl);

        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }

    // 显示错误
    showError(message) {
        this.showMessage(message, 'error');
    }
}

// 初始化系统
document.addEventListener('DOMContentLoaded', () => {
    window.saysSystem = new CustomSaysSystem();
});