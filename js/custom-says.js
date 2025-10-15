class CustomSaysSystem {
    constructor() {
        this.says = [];
        this.init();
    }

    async init() {
        console.log('初始化说说系统...');
        await this.loadSays();
        this.renderSays();
        this.bindEvents();
        this.updateStats();
        console.log('说说系统初始化完成');
    }

    // 加载说说数据
    async loadSays() {
        try {
            console.log('开始加载说说数据...');

            // 直接使用嵌入在页面中的数据
            if (window.shuoshuoData && window.shuoshuoData.length) {
                this.says = window.shuoshuoData;
                this.says.sort((a, b) => new Date(b.date) - new Date(a.date));
                console.log(`成功加载 ${this.says.length} 条说说`);
            } else {
                throw new Error('没有找到说说数据');
            }

        } catch (error) {
            console.error('加载说说失败:', error);
            this.says = this.getDefaultData();
            this.showError('使用默认数据');
        }
    }

    // 默认数据备用方案
    getDefaultData() {
        return [
            {
                "id": 1,
                "content": "这是默认的说说内容，数据加载失败时显示。",
                "date": new Date().toISOString(),
                "likes": 0,
                "comments": 0,
                "tags": ["示例"]
            }
        ];
    }

    // 渲染说说列表 - 修复版
    renderSays() {
        const container = document.getElementById('saysContainer');

        if (!container) {
            console.error('找不到说说容器元素');
            return;
        }

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
                
                <!-- 直接处理图片，不调用 renderImages -->
                ${say.images && say.images.length ? `
                    <div class="say-images">
                        ${say.images.map(img => `
                            <img src="${img}" alt="说说图片" loading="lazy" style="max-width: 100%; border-radius: 8px; margin-top: 10px;">
                        `).join('')}
                    </div>
                ` : ''}
                
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
            '前端': 'tech',
            '设计': 'design',
            '简约': 'design',
            '欢迎': 'welcome'
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

            // 监听滚动显示/隐藏回到顶部按钮
            window.addEventListener('scroll', () => {
                scrollTopBtn.style.display = window.scrollY > 300 ? 'flex' : 'none';
            });

            // 初始隐藏
            scrollTopBtn.style.display = 'none';
        }
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

// 安全初始化
document.addEventListener('DOMContentLoaded', () => {
    window.saysSystem = new CustomSaysSystem();
});