class CustomLinksSystem {
    constructor() {
        this.links = [];
        this.tags = new Set();
        this.init();
    }

    async init() {
        console.log('初始化友情链接系统...');
        await this.loadLinks();
        this.renderLinks();
        this.renderTags();
        this.updateStats();
        this.bindEvents();
        console.log('友情链接系统初始化完成');
    }

    // 加载链接数据
    async loadLinks() {
        try {
            console.log('开始加载友情链接数据...');

            // 尝试从Hexo数据文件加载
            const response = await fetch('/data/links.json');

            if (response.ok) {
                this.links = await response.json();
            } else {
                // 如果文件不存在，使用默认数据
                this.links = [
                    {
                        "name": "Butterfly 主题文档",
                        "url": "https://butterfly.js.org/",
                        "avatar": "https://butterfly.js.org/img/favicon.png",
                        "desc": "Hexo Butterfly 主题官方文档",
                        "color": "#1abc9c",
                        "tags": ["主题", "文档"]
                    },
                    {
                        "name": "Hexo 官方文档",
                        "url": "https://hexo.io/zh-cn/docs/",
                        "avatar": "https://hexo.io/favicon.ico",
                        "desc": "Hexo 静态博客框架文档",
                        "color": "#0e83cd",
                        "tags": ["框架", "文档"]
                    }
                ];
            }

            // 提取所有标签
            this.links.forEach(link => {
                if (link.tags && link.tags.length) {
                    link.tags.forEach(tag => this.tags.add(tag));
                }
            });

            console.log(`成功加载 ${this.links.length} 个友情链接，${this.tags.size} 个标签`);

        } catch (error) {
            console.error('加载友情链接失败:', error);
            this.showError('加载失败，使用默认数据');
            this.links = this.getDefaultData();
        }
    }

    // 渲染链接列表
    renderLinks(filterTag = 'all') {
        const container = document.getElementById('linksContainer');

        if (!container) {
            console.error('找不到链接容器元素');
            return;
        }

        if (!this.links.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 3rem; margin-bottom: 20px;">🔗</div>
                    <h3>还没有任何友情链接</h3>
                    <p>欢迎申请交换友链！</p>
                </div>
            `;
            return;
        }

        // 筛选链接
        const filteredLinks = filterTag === 'all'
            ? this.links
            : this.links.filter(link =>
                link.tags && link.tags.includes(filterTag)
            );

        if (!filteredLinks.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 3rem; margin-bottom: 20px;">🔍</div>
                    <h3>没有找到相关链接</h3>
                    <p>尝试选择其他标签</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredLinks.map(link => `
            <div class="link-item">
                <img src="${link.avatar}" alt="${link.name}" class="link-avatar" onerror="this.src='/images/default-avatar.png'">
                <div class="link-content">
                    <h3 class="link-name">
                        <a href="${link.url}" target="_blank" rel="noopener">${link.name}</a>
                    </h3>
                    <p class="link-desc">${link.desc}</p>
                    ${link.tags && link.tags.length ? `
                        <div class="link-tags">
                            ${link.tags.map(tag => `
                                <span class="link-tag">${tag}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // 渲染标签筛选器
    renderTags() {
        const container = document.getElementById('filterTags');

        if (!container) {
            console.error('找不到标签筛选容器');
            return;
        }

        // 添加"全部"标签
        container.innerHTML = `
            <button class="tag-btn active" data-tag="all">全部</button>
        `;

        // 添加其他标签
        this.tags.forEach(tag => {
            container.innerHTML += `
                <button class="tag-btn" data-tag="${tag}">${tag}</button>
            `;
        });
    }

    // 更新统计信息
    updateStats() {
        const totalLinks = document.getElementById('total-links');
        const totalTags = document.getElementById('total-tags');

        if (totalLinks) {
            totalLinks.textContent = this.links.length;
        }

        if (totalTags) {
            totalTags.textContent = this.tags.size;
        }
    }

    // 绑定事件
    bindEvents() {
        // 标签筛选按钮
        const tagButtons = document.querySelectorAll('.tag-btn');
        tagButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // 移除所有按钮的active类
                tagButtons.forEach(b => b.classList.remove('active'));
                // 添加当前按钮的active类
                btn.classList.add('active');
                // 筛选链接
                this.renderLinks(btn.dataset.tag);
            });
        });
    }

    // 显示错误
    showError(message) {
        const container = document.getElementById('linksContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
                    <h3>${message}</h3>
                    <p>请稍后刷新重试</p>
                </div>
            `;
        }
    }

    // 获取默认数据
    getDefaultData() {
        return [
            {
                "name": "示例链接",
                "url": "#",
                "avatar": "/images/default-avatar.png",
                "desc": "这是默认的友情链接示例",
                "tags": ["示例"]
            }
        ];
    }
}

// 安全初始化
document.addEventListener('DOMContentLoaded', () => {
    window.linksSystem = new CustomLinksSystem();
});