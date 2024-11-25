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
    if (selectedShape) return;

    const pos = e.target.getStage().getPointerPosition();
    const newShape = {
      id: Date.now(),
      type: selectedTool,
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      radius: 0,
      fill: '#' + Math.floor(Math.random()*16777215).toString(16)
    };

    setShapes([...shapes, newShape]);
    setIsDrawing(true);
    logShapeUpdate('create', newShape);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const pos = e.target.getStage().getPointerPosition();
    const lastShape = shapes[shapes.length - 1];
    
    if (lastShape.type === SHAPES.RECTANGLE) {
      const newShape = {
        ...lastShape,
        width: pos.x - lastShape.x,
        height: pos.y - lastShape.y
      };
      setShapes(shapes.slice(0, -1).concat([newShape]));
    } else if (lastShape.type === SHAPES.CIRCLE) {
      const dx = pos.x - lastShape.x;
      const dy = pos.y - lastShape.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      const newShape = {
        ...lastShape,
        radius
      };
      setShapes(shapes.slice(0, -1).concat([newShape]));
    }
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      const lastShape = shapes[shapes.length - 1];
      logShapeUpdate('modify', lastShape);
      setIsDrawing(false);
    }
  };

  const handleShapeSelect = (shape) => {
    setSelectedShape(shape);
    if (transformerRef.current) {
      transformerRef.current.nodes([shape]);
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
      width: node.width() * scaleX,
      height: node.height() * scaleY,
      radius: node.radius ? node.radius() * scaleX : 0
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
                  {...shape}
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
                  {...shape}
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