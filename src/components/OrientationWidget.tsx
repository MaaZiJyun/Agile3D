export function OrientationWidget() {
  return (
    <>
      <div id="orientationWidget" className="orientation-widget" role="group" aria-label="三维视角导航">
        <svg viewBox="0 0 112 112" aria-hidden="true">
          <line data-orientation-line="x" className="orientation-x" x1="56" y1="56" x2="56" y2="56" />
          <line data-orientation-line="y" className="orientation-y" x1="56" y1="56" x2="56" y2="56" />
          <line data-orientation-line="z" className="orientation-z" x1="56" y1="56" x2="56" y2="56" />
          <circle cx="56" cy="56" r="3" className="orientation-origin" />
        </svg>
        <button type="button" data-orientation-axis="x" data-camera="right" className="orientation-x" aria-label="X 轴：侧视" title="X · 侧视">X</button>
        <button type="button" data-orientation-axis="y" data-camera="front" className="orientation-y" aria-label="Y 轴：正视" title="Y · 正视">Y</button>
        <button type="button" data-orientation-axis="z" data-camera="top" className="orientation-z" aria-label="Z 轴：俯视" title="Z · 俯视">Z</button>
      </div>
    </>
  );
}
