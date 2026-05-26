import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Edit2, Check, Trash2, MoreVertical, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const INITIAL_COLUMNS = [
  { id: 'col-1', title: 'Phase 1: Apply' },
  { id: 'col-2', title: 'Phase 2: Process' },
  { id: 'col-3', title: 'Phase 3: Activate' },
  { id: 'col-4', title: 'Phase 4: Launch' }
];

const INITIAL_TILES = [
  { 
    id: 't-1', 
    title: 'John Doe (Demo)', 
    description: 'Missing TREC ID', 
    colorLabel: '#F59E0B', 
    columnId: 'col-1',
    profile: { email: 'john.demo@exprealty.com', phone: '(915) 555-0101', license: 'TX-123456' }
  },
  { 
    id: 't-2', 
    title: 'Jane Smith (Demo)', 
    description: 'Awaiting ICA', 
    colorLabel: '#10B981', 
    columnId: 'col-2',
    profile: { email: 'jane.demo@exprealty.com', phone: '(915) 555-0102', license: 'NM-987654' }
  },
  { 
    id: 't-3', 
    title: 'Robert Jones (Demo)', 
    description: 'Setting up KVCore', 
    colorLabel: '#506CAA', 
    columnId: 'col-3',
    profile: { email: 'robert.demo@exprealty.com', phone: '(915) 555-0103', license: 'TX-456789' }
  },
  { 
    id: 't-4', 
    title: 'Emily Davis (Demo)', 
    description: 'Pending Board Transfer', 
    colorLabel: '#EF4444', 
    columnId: 'col-4',
    profile: { email: 'emily.demo@exprealty.com', phone: '(915) 555-0104', license: 'NM-112233' }
  },
];

const KanbanBoard = () => {
  const { emulateUser } = useAuth();
  const [columns, setColumns] = useState(INITIAL_COLUMNS);
  const [tiles, setTiles] = useState(INITIAL_TILES);

  // Drag state
  const [draggedTileId, setDraggedTileId] = useState(null);
  const [dragOverColId, setDragOverColId] = useState(null);

  // Inline Editing
  const [editingTileId, setEditingTileId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  // New column state
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');

  // New tile state per column
  const [addingTileToCol, setAddingTileToCol] = useState(null);
  const [newTileTitle, setNewTileTitle] = useState('');

  // DRAG AND DROP HANDLERS
  const handleDragStart = (e, tileId) => {
    setDraggedTileId(tileId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tileId); // Required for Firefox
    
    // Slight delay so the original tile doesn't vanish immediately
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedTileId(null);
    setDragOverColId(null);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    if (draggedTileId && dragOverColId !== colId) {
      setDragOverColId(colId);
    }
  };

  const handleDrop = (e, colId) => {
    e.preventDefault();
    setDragOverColId(null);
    if (!draggedTileId) return;

    setTiles(prev => prev.map(t => {
      if (t.id === draggedTileId) {
        return { ...t, columnId: colId };
      }
      return t;
    }));
    setDraggedTileId(null);
  };

  // TILE ACTIONS
  const handleAddTile = (colId) => {
    if (!newTileTitle.trim()) {
      setAddingTileToCol(null);
      return;
    }
    const newTile = {
      id: `t-${Date.now()}`,
      title: newTileTitle,
      description: '',
      colorLabel: '#506CAA',
      columnId: colId
    };
    setTiles([...tiles, newTile]);
    setNewTileTitle('');
    setAddingTileToCol(null);
  };

  const handleDeleteTile = (tileId) => {
    if (window.confirm("Delete this agent from the pipeline?")) {
      setTiles(tiles.filter(t => t.id !== tileId));
    }
  };

  const startEditingTile = (tile) => {
    setEditingTileId(tile.id);
    setEditingTitle(tile.title);
  };

  const saveEditedTile = () => {
    if (editingTitle.trim()) {
      setTiles(tiles.map(t => t.id === editingTileId ? { ...t, title: editingTitle } : t));
    }
    setEditingTileId(null);
  };

  // COLUMN ACTIONS
  const handleAddColumn = () => {
    if (newColTitle.trim()) {
      setColumns([...columns, { id: `col-${Date.now()}`, title: newColTitle }]);
    }
    setNewColTitle('');
    setIsAddingColumn(false);
  };

  const handleDeleteColumn = (colId) => {
    const colTiles = tiles.filter(t => t.columnId === colId);
    if (colTiles.length > 0) {
      if (!window.confirm("This column has agents in it. Are you sure you want to delete it?")) return;
    }
    setColumns(columns.filter(c => c.id !== colId));
    setTiles(tiles.filter(t => t.columnId !== colId));
  };

  return (
    <div style={styles.boardContainer}>
      {/* Board Scroll Area */}
      <div style={styles.columnsContainer}>
        {columns.map(col => {
          const colTiles = tiles.filter(t => t.columnId === col.id);
          const isDragOver = dragOverColId === col.id;

          return (
            <div 
              key={col.id} 
              style={{...styles.column, backgroundColor: isDragOver ? 'rgba(80, 108, 170, 0.1)' : 'var(--color-background)'}}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div style={styles.columnHeader}>
                <div style={styles.columnTitleWrap}>
                  <h3 style={styles.columnTitle}>{col.title}</h3>
                  <span style={styles.countBadge}>{colTiles.length}</span>
                </div>
                <button onClick={() => handleDeleteColumn(col.id)} style={styles.deleteColBtn} title="Delete Column">
                  <X size={16} />
                </button>
              </div>

              {/* Tiles Area */}
              <div style={styles.tilesContainer}>
                {colTiles.map(tile => (
                  <div 
                    key={tile.id} 
                    draggable 
                    onDragStart={(e) => handleDragStart(e, tile.id)}
                    onDragEnd={handleDragEnd}
                    style={styles.tileCard}
                    className="kanban-tile"
                  >
                    <div style={{...styles.colorLabel, backgroundColor: tile.colorLabel}}></div>
                    
                    <div style={styles.tileContent}>
                      {editingTileId === tile.id ? (
                        <div style={styles.editWrap}>
                          <input 
                            autoFocus
                            value={editingTitle}
                            onChange={e => setEditingTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && saveEditedTile()}
                            onBlur={saveEditedTile}
                            style={styles.editInput}
                          />
                        </div>
                      ) : (
                        <div style={styles.tileTitleRow}>
                          <span onClick={() => startEditingTile(tile)} style={styles.tileTitle}>{tile.title}</span>
                          <div style={{display: 'flex', gap: '0.25rem'}}>
                            <button onClick={() => emulateUser(tile)} style={styles.emulateTileBtn} title="Emulate User" className="tile-action-btn">
                              <UserCircle size={14} />
                            </button>
                            <button onClick={() => handleDeleteTile(tile.id)} style={styles.deleteTileBtn} title="Delete Agent" className="tile-action-btn">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {tile.description && !editingTileId && (
                        <p style={styles.tileDescription}>{tile.description}</p>
                      )}
                      
                      {tile.profile && !editingTileId && (
                        <div style={styles.tileProfile}>
                          <div style={styles.profileItem}>📧 {tile.profile.email}</div>
                          <div style={styles.profileItem}>📱 {tile.profile.phone}</div>
                          <div style={styles.profileItem}>🪪 {tile.profile.license}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Visual Placeholder when dragging over an empty spot in column */}
                {isDragOver && draggedTileId && (
                  <div style={styles.dropPlaceholder}></div>
                )}
              </div>

              {/* Add Tile Footer */}
              {addingTileToCol === col.id ? (
                <div style={styles.addTileForm}>
                  <input 
                    autoFocus
                    placeholder="Agent Name..." 
                    value={newTileTitle}
                    onChange={e => setNewTileTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTile(col.id)}
                    style={styles.addTileInput}
                  />
                  <div style={styles.addTileActions}>
                    <button onClick={() => handleAddTile(col.id)} style={styles.addTileBtn}>Add</button>
                    <button onClick={() => setAddingTileToCol(null)} style={styles.cancelBtn}><X size={16}/></button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingTileToCol(col.id)} style={styles.addTileTrigger}>
                  <Plus size={16} /> Add Agent
                </button>
              )}
            </div>
          );
        })}

        {/* Add New Column Button */}
        <div style={styles.addColumnWrap}>
          {isAddingColumn ? (
            <div style={styles.addColumnForm}>
              <input 
                autoFocus
                placeholder="Phase Name..."
                value={newColTitle}
                onChange={e => setNewColTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddColumn()}
                style={styles.addColInput}
              />
              <div style={styles.addTileActions}>
                <button onClick={handleAddColumn} style={styles.addTileBtn}>Add</button>
                <button onClick={() => setIsAddingColumn(false)} style={styles.cancelBtn}><X size={16}/></button>
              </div>
            </div>
          ) : (
            <button onClick={() => setIsAddingColumn(true)} style={styles.addColTrigger}>
              <Plus size={18} /> Add Phase
            </button>
          )}
        </div>
      </div>

      <style>{`
        .kanban-tile .tile-delete-btn {
          opacity: 0;
          transition: opacity 0.2s;
        }
        .kanban-tile:hover .tile-delete-btn {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

const styles = {
  boardContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: '600px',
    backgroundColor: 'var(--color-card-bg)',
    borderRadius: 'var(--border-radius-md)',
    padding: '1.5rem',
    border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden'
  },
  columnsContainer: {
    display: 'flex',
    gap: '1.5rem',
    overflowX: 'auto',
    flexGrow: 1,
    alignItems: 'flex-start',
    paddingBottom: '1rem', // Space for scrollbar
  },
  column: {
    minWidth: '280px',
    maxWidth: '280px',
    backgroundColor: 'var(--color-background)',
    borderRadius: 'var(--border-radius-sm)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '100%',
    border: '1px solid var(--color-border)',
    transition: 'background-color 0.2s',
  },
  columnHeader: {
    padding: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--color-border)'
  },
  columnTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  columnTitle: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--color-dark-navy)'
  },
  countBadge: {
    backgroundColor: 'var(--color-frosted-blue)',
    color: 'var(--color-slate-blue)',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '0.1rem 0.4rem',
    borderRadius: '12px',
  },
  deleteColBtn: {
    color: 'var(--color-moss-grey)',
    opacity: 0.5,
  },
  tilesContainer: {
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    overflowY: 'auto',
    flexGrow: 1,
    minHeight: '50px',
  },
  tileCard: {
    backgroundColor: 'var(--color-white)',
    borderRadius: '6px',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--color-border)',
    overflow: 'hidden',
    cursor: 'grab',
  },
  colorLabel: {
    height: '4px',
    width: '100%',
  },
  tileContent: {
    padding: '0.75rem',
  },
  tileTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tileTitle: {
    fontWeight: '500',
    color: 'var(--color-text-main)',
    fontSize: '0.9rem',
    cursor: 'text',
    wordBreak: 'break-word',
  },
  emulateTileBtn: {
    color: 'var(--color-primary)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
  },
  deleteTileBtn: {
    color: 'var(--color-moss-grey)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
  },
  tileDescription: {
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    marginTop: '0.5rem',
    margin: 0,
  },
  tileProfile: {
    marginTop: '0.75rem',
    paddingTop: '0.5rem',
    borderTop: '1px dashed var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  profileItem: {
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  editWrap: {
    width: '100%',
  },
  editInput: {
    width: '100%',
    padding: '0.25rem',
    border: '1px solid var(--color-primary)',
    borderRadius: '4px',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    outline: 'none',
  },
  dropPlaceholder: {
    height: '40px',
    border: '2px dashed var(--color-primary)',
    borderRadius: '6px',
    backgroundColor: 'rgba(80, 108, 170, 0.05)',
  },
  addTileTrigger: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    color: 'var(--color-moss-grey)',
    fontWeight: '500',
    fontSize: '0.9rem',
    textAlign: 'left',
    borderTop: '1px solid var(--color-border)',
  },
  addTileForm: {
    padding: '0.75rem',
    borderTop: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  addTileInput: {
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid var(--color-border)',
    fontSize: '0.9rem',
    outline: 'none',
  },
  addTileActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  addTileBtn: {
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  cancelBtn: {
    color: 'var(--color-moss-grey)',
    padding: '0.25rem',
  },
  addColumnWrap: {
    minWidth: '280px',
    maxWidth: '280px',
  },
  addColTrigger: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem',
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.5)',
    border: '1px dashed var(--color-border)',
    borderRadius: 'var(--border-radius-sm)',
    color: 'var(--color-slate-blue)',
    fontWeight: '600',
    fontSize: '1rem',
    justifyContent: 'center',
  },
  addColumnForm: {
    backgroundColor: 'var(--color-white)',
    padding: '1rem',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  addColInput: {
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid var(--color-border)',
    fontSize: '0.9rem',
    outline: 'none',
  }
};

export default KanbanBoard;
