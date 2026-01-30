(function () {
    "use strict";

    // ✅ 开发/测试开关：true = 不使用 localStorage 缓存
    const DEV_NO_CACHE = true;

    function getTodayKey() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }

    function normalizeDateKey(input) {
        if (!input) return "";
        if (typeof input === "string") return input.slice(0, 10);
        try {
            const d = new Date(input);
            if (Number.isNaN(d.getTime())) return "";
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            return `${y}-${m}-${day}`;
        } catch (_) {
            return "";
        }
    }

    function pickBgKey(count) {
        if (count <= 0) return "bg0";
        if (count <= 2) return "bg1";
        if (count <= 4) return "bg2";
        return "bg3";
    }

    function countPostsToday(todayKey, meta) {
        if (!Array.isArray(meta)) return 0;
        let n = 0;
        for (const item of meta) {
            const raw = typeof item === "string" ? item : item.date;
            if (normalizeDateKey(raw) === todayKey) n++;
        }
        return n;
    }

    function applyDuotoneBg() {
        const root = document.documentElement;
        const todayKey = getTodayKey();
        const cacheKey = "bg_duotone_cache_v1";

        // ✅ 1) 仅在非 DEV 模式下才读缓存
        if (!DEV_NO_CACHE) {
            try {
                const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
                if (cached && cached.date === todayKey && cached.bg) {
                    root.setAttribute("data-bg", cached.bg);
                    return;
                }
            } catch (_) {}
        }

        const meta = window.__POST_META__;
        const count = countPostsToday(todayKey, meta);
        const bg = pickBgKey(count);

        root.setAttribute("data-bg", bg);

        // ✅ 2) 仅在非 DEV 模式下才写缓存
        if (!DEV_NO_CACHE) {
            try {
                localStorage.setItem(cacheKey, JSON.stringify({ date: todayKey, bg, count }));
            } catch (_) {}
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyDuotoneBg, { once: true });
    } else {
        applyDuotoneBg();
    }
})();
