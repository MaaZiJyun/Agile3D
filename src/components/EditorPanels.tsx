export function EditorPanels() {
  return (
    <>
      <aside id="sceneSidebar" className="scene-sidebar glass hidden">
        <div className="editor-heading">
          <strong>Project objects</strong>
          <span>Drag to regroup</span>
        </div>
        <div className="editor-data-status"><span id="projectFileName">No project</span><span id="projectDataStatus">File → New / Open</span></div>
        <div id="sceneHierarchy" className="scene-hierarchy" />

      </aside>

      <div id="tooltip" />

      <section id="objectEditorPanel" className="editor-panel glass hidden">
        <input id="editorName" className="editor-name" aria-label="Object name" disabled />
        <div className="editor-mode-tags" role="group" aria-label="Transform mode">
          <button type="button" className="active" data-transform-mode="translate" aria-pressed="true" disabled>Move</button>
          <button type="button" data-transform-mode="rotate" aria-pressed="false" disabled>Rotate</button>
          <button type="button" data-transform-mode="scale" aria-pressed="false" disabled>Scale</button>
        </div>
        <div className="editor-section-title">Position · millimetres</div>
        <div className="editor-vector-grid">
          <label>X<input type="number" step="1" data-editor-vector="position" data-axis="x" /></label>
          <label>Y<input type="number" step="1" data-editor-vector="position" data-axis="y" /></label>
          <label>Z<input type="number" step="1" data-editor-vector="position" data-axis="z" /></label>
        </div>
        <div className="editor-section-title">Rotation · degrees</div>
        <div className="editor-vector-grid">
          <label>X<input type="number" step="5" data-editor-vector="rotation" data-axis="x" /></label>
          <label>Y<input type="number" step="5" data-editor-vector="rotation" data-axis="y" /></label>
          <label>Z<input type="number" step="5" data-editor-vector="rotation" data-axis="z" /></label>
        </div>
        <div className="editor-section-title">Scale</div>
        <div className="editor-vector-grid">
          <label>X<input type="number" min="0.05" step="0.05" data-editor-vector="scale" data-axis="x" /></label>
          <label>Y<input type="number" min="0.05" step="0.05" data-editor-vector="scale" data-axis="y" /></label>
          <label>Z<input type="number" min="0.05" step="0.05" data-editor-vector="scale" data-axis="z" /></label>
        </div>
        <div className="editor-section-title">Entity size · millimetres</div>
        <div className="editor-vector-grid">
          <label><span data-editor-dimension-label>Width</span><input type="number" min="1" step="1" data-editor-dimension="width" /></label>
          <label><span data-editor-dimension-label>Height</span><input type="number" min="1" step="1" data-editor-dimension="height" /></label>
          <label><span data-editor-dimension-label>Depth</span><input type="number" min="1" step="1" data-editor-dimension="depth" /></label>
        </div>
        <div className="editor-section-title">Appearance</div>
        <div className="editor-appearance">
          <label>Color<input id="editorColor" type="color" defaultValue="#ffffff" /></label>
          <label>Glow<input id="editorEmissive" type="number" min="0" step="0.05" defaultValue="0" /></label>
          <label>Opacity<input id="editorOpacity" type="number" min="0" max="1" step="0.05" defaultValue="1" /></label>
        </div>
      </section>

    </>
  );
}
