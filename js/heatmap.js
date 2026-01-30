(function () {
    "use strict";

    const gridEl = document.getElementById("hm-grid");
    const monthsEl = document.getElementById("hm-months");
    if (!gridEl) return; // 只在热力图页生效

    function pad2(n){ return String(n).padStart(2, "0"); }

    function dateKey(d){
        return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
    }

    function parseToKey(input){
        if (!input) return "";
        if (typeof input === "string") return input.slice(0, 10);
        try {
            const d = new Date(input);
            if (Number.isNaN(d.getTime())) return "";
            return dateKey(d);
        } catch (_) {
            return "";
        }
    }

    // 你也可以未来提供 window.__ACTIVITY_OVERRIDE__ = { "YYYY-MM-DD": 3, ... } 覆盖某天
    const override = window.__ACTIVITY_OVERRIDE__ && typeof window.__ACTIVITY_OVERRIDE__ === "object"
        ? window.__ACTIVITY_OVERRIDE__
        : null;

    // 从 __POST_META__ 统计每天发文数
    function buildCountMap(meta){
        const m = new Map();
        if (!Array.isArray(meta)) return m;

        for (const item of meta) {
            const raw = typeof item === "string" ? item : item.date;
            const k = parseToKey(raw);
            if (!k) continue;
            m.set(k, (m.get(k) || 0) + 1);
        }
        return m;
    }

    // 计算最近 365 天区间，并对齐到周起点（GitHub：按周列排列）
    function startOfWeek(d){
        // GitHub 默认周从周日开始（0）
        const x = new Date(d);
        x.setHours(0,0,0,0);
        const day = x.getDay(); // 0..6
        x.setDate(x.getDate() - day);
        return x;
    }

    function addDays(d, n){
        const x = new Date(d);
        x.setDate(x.getDate() + n);
        return x;
    }

    function levelForCount(c){
        // 0 -> lv0；1 -> lv1；2 -> lv2；3 -> lv3；>=4 -> lv4
        if (c <= 0) return 0;
        if (c === 1) return 1;
        if (c === 2) return 2;
        if (c === 3) return 3;
        return 4;
    }

    function monthLabel(m){
        return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m] || "";
    }

    const meta = window.__POST_META__;
    const countMap = buildCountMap(meta);

    const today = new Date();
    today.setHours(0,0,0,0);

    // 过去 365 天（含今天）：你也可以改成 371/364 等来对齐更像 GitHub
    const rangeDays = 365;
    const rangeStart = addDays(today, -rangeDays + 1);

    // 对齐到周起点，确保网格周列完整
    const gridStart = startOfWeek(rangeStart);

    // 终点也可以延展到完整周（可选，这里让它到今天为止，末尾不足一周也照画）
    const totalDays = Math.round((today - gridStart) / (24*3600*1000)) + 1;

    // 渲染 cells（按天推进；grid-auto-flow: column，所以我们按天 append，CSS 会自动“先填满一列的7行再到下一列”吗？
    // 注意：grid-auto-flow: column + grid-template-rows: repeat(7, ...) 时，
    // DOM 顺序为：先填第一列的 row1..row7，再第二列...，因此我们需要按“周内日”顺序推入。
    // 我们用 d 从 gridStart 到 today，每天 push 一格，刚好顺序正确：周日->周六构成一列。
    const frag = document.createDocumentFragment();

    for (let i = 0; i < totalDays; i++) {
        const d = addDays(gridStart, i);
        const k = dateKey(d);

        // 只在 range 内（过去365天）才算活跃，否则当作 0（仍画出来，形成完整周列背景）
        let c = 0;
        if (d >= rangeStart && d <= today) {
            c = countMap.get(k) || 0;
            if (override && Object.prototype.hasOwnProperty.call(override, k)) {
                c = Number(override[k]) || 0;
            }
        }

        const lv = levelForCount(c);

        const cell = document.createElement("div");
        cell.className = `hm-cell hm-lv${lv}`;
        cell.setAttribute("data-date", k);
        cell.setAttribute("data-count", String(c));
        cell.title = `${k} · ${c}`;
        frag.appendChild(cell);
    }

    gridEl.innerHTML = "";
    gridEl.appendChild(frag);

    // 月份标签：每周一个位置，遇到“新月份第一周”就标一次（非常轻量）
    if (monthsEl) {
        const weeks = Math.ceil(totalDays / 7);
        monthsEl.innerHTML = "";

        let lastMonth = -1;
        for (let w = 0; w < weeks; w++) {
            const weekStart = addDays(gridStart, w * 7);
            const m = weekStart.getMonth();
            const sp = document.createElement("span");

            // 仅当该周包含“当月1号附近”时显示（避免每周都显示）
            // 简单规则：如果 weekStart 月份变化，就显示新月份
            if (m !== lastMonth && weekStart >= rangeStart) {
                sp.textContent = monthLabel(m);
                lastMonth = m;
            } else {
                sp.textContent = "";
            }

            monthsEl.appendChild(sp);
        }
    }
})();
