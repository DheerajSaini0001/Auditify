import React, { useLayoutEffect, useRef, useState } from 'react';

// Only adopt a new packing when it shortens the section by at least this much —
// small expand/collapse changes keep the current arrangement so cards don't
// shuffle on every click.
const REPACK_THRESHOLD_PX = 160;

const greedyPack = (heights) => {
    const colHeights = [0, 0];
    const assignment = [[], []];
    heights.forEach((h, i) => {
        const c = colHeights[0] <= colHeights[1] ? 0 : 1;
        assignment[c].push(i);
        colHeights[c] += h;
    });
    return assignment;
};

const packedHeight = (assignment, heights) =>
    Math.max(...assignment.map((col) => col.reduce((s, i) => s + (heights[i] || 0), 0)));

// Two-column masonry section. A plain CSS grid reserves every row at the tallest
// card's height, so an expanded card next to a short one leaves a large blank and
// pushes the next card into a new row. Instead we measure each card and greedily
// drop it into the currently-shorter column, re-packing when that saves real space
// (with FLIP animation so moves glide instead of snapping). On mobile, or with
// ≤2 cards, it stays a plain grid.
const Section = ({ title, subtitle, icon: Icon, children, darkMode, action }) => {
    const items = React.Children.toArray(children);
    const measureRefs = useRef([]);
    const [cols, setCols] = useState(null); // [[itemIdx...],[itemIdx...]] or null = plain grid
    const colsRef = useRef(null);
    const prevRects = useRef(new Map()); // itemIdx -> DOMRect before the last re-render

    useLayoutEffect(() => {
        const snapshotRects = () => {
            items.forEach((_, i) => {
                const el = measureRefs.current[i];
                if (el) prevRects.current.set(i, el.getBoundingClientRect());
            });
        };

        const compute = () => {
            snapshotRects();
            const isDesktop = window.matchMedia('(min-width: 768px)').matches;
            let next = null;
            if (isDesktop && items.length > 2) {
                const heights = items.map((_, i) => measureRefs.current[i]?.offsetHeight || 0);
                const fresh = greedyPack(heights);
                const current = colsRef.current;
                const currentValid = current && current.flat().length === items.length;
                // Hysteresis: stick with the current arrangement unless repacking
                // meaningfully shortens the section.
                next = currentValid && packedHeight(current, heights) - packedHeight(fresh, heights) < REPACK_THRESHOLD_PX
                    ? current
                    : fresh;
            }
            const key = next ? next.map((c) => c.join(',')).join('|') : 'grid';
            const prevKey = colsRef.current ? colsRef.current.map((c) => c.join(',')).join('|') : 'grid';
            if (key !== prevKey) {
                colsRef.current = next;
                setCols(next);
            }
        };

        compute();
        const ro = new ResizeObserver(compute);
        measureRefs.current.slice(0, items.length).forEach((el) => el && ro.observe(el));
        window.addEventListener('resize', compute);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', compute);
        };
    }, [items.length, cols]);

    // FLIP: after a repack renders, start each moved card at its old position and
    // let it glide to the new one.
    useLayoutEffect(() => {
        const moved = [];
        items.forEach((_, i) => {
            const el = measureRefs.current[i];
            const old = prevRects.current.get(i);
            if (!el || !old) return;
            const rect = el.getBoundingClientRect();
            const dx = old.left - rect.left;
            const dy = old.top - rect.top;
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                el.style.transition = 'none';
                el.style.transform = `translate(${dx}px, ${dy}px)`;
                moved.push(el);
            }
        });
        if (moved.length) {
            requestAnimationFrame(() => {
                moved.forEach((el) => {
                    el.style.transition = 'transform 300ms ease';
                    el.style.transform = '';
                });
            });
            const timer = setTimeout(() => {
                moved.forEach((el) => { el.style.transition = ''; });
            }, 350);
            return () => clearTimeout(timer);
        }
    }, [cols]); // eslint-disable-line react-hooks/exhaustive-deps

    // h-full only in grid mode (lets the card stretch to the row); inside the masonry
    // flex columns each wrapper must keep its natural height.
    const renderItem = (item, i, inGrid) => (
        <div key={item.key ?? i} className={inGrid ? "h-full" : ""} ref={(el) => { measureRefs.current[i] = el; }}>
            {item}
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${darkMode ? "bg-blue-500/20 text-blue-400" : "bg-accentsoft text-accent"}`}>
                        <Icon size={20} />
                    </div>
                    <div>
                        <h2 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-ink"}`}>{title}</h2>
                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-muted"}`}>{subtitle}</p>
                    </div>
                </div>
                {action && <div>{action}</div>}
            </div>
            {cols ? (
                <div className="flex gap-6 mb-8 items-start">
                    {cols.map((colIdxs, c) => (
                        <div key={c} className="flex-1 min-w-0 flex flex-col gap-6">
                            {colIdxs.map((i) => renderItem(items[i], i, false))}
                        </div>
                    ))}
                </div>
            ) : (
                // Plain grid (mobile, or ≤2 cards): default stretch keeps a slightly
                // shorter sibling filling the row, matching the masonry sections.
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {items.map((item, i) => renderItem(item, i, true))}
                </div>
            )}
        </div>
    );
};

export default Section;
