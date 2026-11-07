export function EditorMenu() {
  return (
    <>
      <nav id="menuBar" className="menu-bar" aria-label="Application menu" role="menubar">
        <div className="menu-group">
          <button id="fileMenuTrigger" data-menu-trigger aria-haspopup="menu" aria-expanded="false" aria-controls="fileMenu" role="menuitem">File</button>
          <div id="fileMenu" className="menu-dropdown" role="menu" aria-labelledby="fileMenuTrigger" hidden>
            <button id="newProject" role="menuitem">New project</button>
            <button id="openProjectJson" role="menuitem">Open JSON…</button>
            <div className="menu-separator" role="separator" />
            <button id="saveProjectJson" role="menuitem" data-requires-project disabled>Save<span className="menu-shortcut">⌘/Ctrl S</span></button>
            <button data-editor-command="download" role="menuitem" data-requires-project disabled>Download JSON<span className="menu-shortcut">⌘/Ctrl D</span></button>
            <div className="menu-separator" role="separator" />
            <button data-editor-command="revert" role="menuitem" data-requires-project disabled>Revert to saved<span className="menu-shortcut">⌘/Ctrl Z</span></button>
          </div>
        </div>
        <div className="menu-group">
          <button id="editMenuTrigger" data-menu-trigger aria-haspopup="menu" aria-expanded="false" aria-controls="editMenu" role="menuitem">Edit</button>
          <div id="editMenu" className="menu-dropdown" role="menu" aria-labelledby="editMenuTrigger" hidden>
            <button id="addObjectMenuButton" role="menuitem" aria-haspopup="menu" aria-expanded="false" data-requires-project disabled>Add object<span className="menu-shortcut">▾</span></button>
            <div id="addObjectMenu" className="editor-add-menu" role="menu" hidden />
            <div className="menu-separator" role="separator" />
            <button data-editor-command="copy" role="menuitem" data-requires-selection disabled>Copy<span className="menu-shortcut">⌘/Ctrl C</span></button>
            <button data-editor-command="paste" role="menuitem" disabled>Paste<span className="menu-shortcut">⌘/Ctrl V</span></button>
            <button id="deleteObjectButton" className="menu-danger" role="menuitem" data-requires-selection disabled>Delete selected</button>
            <button data-editor-command="deselect" role="menuitem" data-requires-selection disabled>Deselect<span className="menu-shortcut">Esc</span></button>
            <div className="menu-separator" role="separator" />
            <button className="active" data-transform-mode="translate" role="menuitemradio" aria-checked="true" data-requires-selection disabled>Move</button>
            <button data-transform-mode="rotate" role="menuitemradio" aria-checked="false" data-requires-selection disabled>Rotate</button>
            <button data-transform-mode="scale" role="menuitemradio" aria-checked="false" data-requires-selection disabled>Scale</button>
          </div>
        </div>
        <div className="menu-group">
          <button id="viewMenuTrigger" data-menu-trigger aria-haspopup="menu" aria-expanded="false" aria-controls="viewMenu" role="menuitem">View</button>
          <div id="viewMenu" className="menu-dropdown" role="menu" aria-labelledby="viewMenuTrigger" hidden>
            <button id="perspectiveToggle" data-projection-toggle role="menuitemcheckbox" aria-checked="true">Perspective</button>
            <div className="menu-separator" role="separator" />
            <button data-camera="front" role="menuitem">Front<span className="menu-shortcut">+Y</span></button>
            <button data-camera="right" role="menuitem">Side<span className="menu-shortcut">+X</span></button>
            <button data-camera="top" role="menuitem">Top<span className="menu-shortcut">+Z</span></button>
            <button id="frameProject" role="menuitem">Fit project</button>
            <div className="menu-separator" role="separator" />
            <label className="menu-check"><input id="axesToggle" type="checkbox" defaultChecked /><span>Coordinate axes</span></label>
          </div>
        </div>
        <div className="menu-group">
          <button id="windowMenuTrigger" data-menu-trigger aria-haspopup="menu" aria-expanded="false" aria-controls="windowMenu" role="menuitem">Window</button>
          <div id="windowMenu" className="menu-dropdown" role="menu" aria-labelledby="windowMenuTrigger" hidden>
            <label className="menu-check"><input id="objectsPanelToggle" type="checkbox" defaultChecked /><span>Project objects</span></label>
            <label className="menu-check"><input id="propertiesPanelToggle" type="checkbox" defaultChecked /><span>Object properties</span></label>
          </div>
        </div>
        <div className="menu-group">
          <button id="settingsMenuTrigger" data-menu-trigger aria-haspopup="menu" aria-expanded="false" aria-controls="settingsMenu" role="menuitem">Settings</button>
          <div id="settingsMenu" className="menu-dropdown" role="menu" aria-labelledby="settingsMenuTrigger" hidden>
            <label className="menu-check"><input id="editorToggle" type="checkbox" defaultChecked /><span>Edit mode</span></label>
            <label className="menu-check"><input id="nightToggle" type="checkbox" /><span>Night atmosphere</span></label>
          </div>
        </div>
      </nav>
    </>
  );
}
