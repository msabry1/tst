import React, { useState, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Transformer } from 'react-konva';

const SHAPES = {
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle'
};

const PaintApp = () => {
  const [shapes, setShapes] = useState([]);
  const [selectedShape, setSelectedShape] = useState(null);
  const [selectedTool, setSelectedTool] = useState(SHAPES.RECTANGLE);
  const [isDrawing, setIsDrawing] = useState(false);
  const [newShape, setNewShape] = useState(null);
  const transformerRef = useRef();
  
  // Log shape updates
  const logShapeUpdate = (action, shape) => {
    const shapeData = {
      action,
      shape: {
        id: shape.id,
        type: shape.type,
        x: Math.round(shape.x),
        y: Math.round(shape.y),
        width: Math.round(shape.width || 0),
        height: Math.round(shape.height || 0),
        radius: Math.round(shape.radius || 0),
        fill: shape.fill
      }
    };
    console.log('Shape Update:', JSON.stringify(shapeData, null, 2));
  };

  const handleMouseDown = (e) => {
    // Deselect when clicking empty area
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedShape(null);
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
      }
    }

    if (selectedShape || !clickedOnEmpty) return;

    const pos = e.target.getStage().getPointerPosition();
    const id = `shape-${Date.now()}`;
    const shape = {
      id,
      type: selectedTool,
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      radius: 0,
      fill: '#' + Math.floor(Math.random()*16777215).toString(16)
    };

    setNewShape(shape);
    setShapes([...shapes, shape]);
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !newShape) return;

    const pos = e.target.getStage().getPointerPosition();
    
    if (newShape.type === SHAPES.RECTANGLE) {
      const updatedShape = {
        ...newShape,
        width: pos.x - newShape.x,
        height: pos.y - newShape.y
      };
      setShapes(shapes.map(shape => 
        shape.id === newShape.id ? updatedShape : shape
      ));
      setNewShape(updatedShape);
    } else if (newShape.type === SHAPES.CIRCLE) {
      const dx = pos.x - newShape.x;
      const dy = pos.y - newShape.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      const updatedShape = {
        ...newShape,
        radius
      };
      setShapes(shapes.map(shape => 
        shape.id === newShape.id ? updatedShape : shape
      ));
      setNewShape(updatedShape);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && newShape) {
      // Only log after shape is completely drawn
      logShapeUpdate('create', newShape);
      setIsDrawing(false);
      setNewShape(null);
    }
  };

  const handleShapeSelect = (shape) => {
    if (!shape) return;
    
    setSelectedShape(shape);
    if (transformerRef.current) {
      // Find the Konva node for the shape
      const stage = transformerRef.current.getStage();
      const selectedNode = stage.findOne('#' + shape.id);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
      }
    }
  };

  const handleTransformEnd = (e) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    node.scaleX(1);
    node.scaleY(1);
    
    const updatedShape = {
      ...shapes.find(s => s.id === node.id()),
      x: node.x(),
      y: node.y(),
      width: Math.abs(node.width() * scaleX),
      height: Math.abs(node.height() * scaleY),
      radius: node.radius ? Math.abs(node.radius() * scaleX) : 0
    };

    setShapes(shapes.map(shape => 
      shape.id === updatedShape.id ? updatedShape : shape
    ));
    
    logShapeUpdate('modify', updatedShape);
  };

  const handleDelete = () => {
    if (selectedShape) {
      logShapeUpdate('delete', selectedShape);
      setShapes(shapes.filter(shape => shape.id !== selectedShape.id));
      setSelectedShape(null);
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
      }
    }
  };

  return (
    <div className="w-full h-full">
      <div className="toolbar">
        <button
          className={`button ${selectedTool === SHAPES.RECTANGLE ? 'button-selected' : 'button-primary'}`}
          onClick={() => setSelectedTool(SHAPES.RECTANGLE)}
        >
          Rectangle
        </button>
        <button
          className={`button ${selectedTool === SHAPES.CIRCLE ? 'button-selected' : 'button-primary'}`}
          onClick={() => setSelectedTool(SHAPES.CIRCLE)}
        >
          Circle
        </button>
        <button
          className="button button-danger"
          onClick={handleDelete}
          disabled={!selectedShape}
        >
          Delete Selected
        </button>
      </div>

      <Stage
        width={window.innerWidth}
        height={window.innerHeight - 100}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="canvas-container"
      >
        <Layer>
          {shapes.map((shape) => {
            if (shape.type === SHAPES.RECTANGLE) {
              return (
                <Rect
                  key={shape.id}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={Math.abs(shape.width)}
                  height={Math.abs(shape.height)}
                  fill={shape.fill}
                  draggable
                  onClick={() => handleShapeSelect(shape)}
                  onDragEnd={handleTransformEnd}
                  onTransformEnd={handleTransformEnd}
                />
              );
            } else if (shape.type === SHAPES.CIRCLE) {
              return (
                <Circle
                  key={shape.id}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  radius={shape.radius}
                  fill={shape.fill}
                  draggable
                  onClick={() => handleShapeSelect(shape)}
                  onDragEnd={handleTransformEnd}
                  onTransformEnd={handleTransformEnd}
                />
              );
            }
            return null;
          })}
          {selectedShape && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                return newBox;
              }}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default PaintApp;