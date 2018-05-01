function GEE_Styles() {}
GEE_Styles.ScrollbarHeight = 16;
GEE_Styles.BackgroundColor = "#4e4e4e";

// Controls: Styles
GEE_Styles.CStroke_Color = "#6e6e6e";
GEE_Styles.Font_Color = "#f9f9f9";

GEE_Styles.ArrowColor_Stroke = "#000000";
GEE_Styles.ArrowColor_Fill = "#6e6e6e";

GEE_Styles.Graph = {
  StartColor: "#9d9d9d",
  Color: "#6d6d6d",
  LineSize: 1,
  SizeX: 120,
  SizeY: 40,
  TextStyle: "bold 11px Arial",
  TextOffsetX: 120 / 2,
  TextOffsetY: 40 / 2,
  Transition: {
    SizeY: 4
  }
};

GEE_Styles.Scrollbar = {
  HorizontalSize: 14,
  VerticalSize: 30
};
function GEE_Util() {}

GEE_Util.FragmentText = function(ctx, text, maxWidth) {
    var result = {
        Lines: [],
        Height: parseInt(ctx.font.match(/\d+/), 10),
        LinesQuantity: 0
    };
    
    var words = text.split(' '),
        lines = [],
        line = "";
        
    if (ctx.measureText(text).width < maxWidth) {
        result.Lines.push(text);
        result.LinesQuantity = 1;
    }
    else {
        while (words.length > 0) {
            var split = false;
            
            while (ctx.measureText(words[0]).width >= maxWidth) {
                var tmp = words[0];
                words[0] = tmp.slice(0, -1);
                
                if (!split) {
                    split = true;
                    words.splice(1, 0, tmp.slice(-1));
                } 
                else { words[1] = tmp.slice(-1) + words[1]; }
            }
            if (ctx.measureText(line + words[0]).width < maxWidth) {
                line += words.shift() + " ";
            } 
            else {
                lines.push(line);
                line = "";
            }
            
            if (words.length === 0) { lines.push(line); }
        }
        
        
        if (words.length > 0) {
            result.Lines = lines;
            result.LinesQuantity = lines.length;
        }
        else {
            var measuredTextWidtth = ctx.measureText(text).width;
            var possibleSplits = Math.ceil(measuredTextWidtth / maxWidth);
            var textSize = text.length;
            var textPartSize = Math.ceil(textSize / possibleSplits);
            
            for (var i = 0; i < possibleSplits; i++) {
                result.Lines.push(text.substr(i * textPartSize, textPartSize));
            }
            
            result.LinesQuantity = possibleSplits;
        }
    }
    
    return result;
}

GEE_Util.Lerp = function (value1, value2, time) {
	return value1 + (value2 - value1) * time;
}

GEE_Util.CirclePosition = function (x0, y0, x1, y1, radius, offsetAngle) {
	var angle = Math.atan2(y1-y0, x1-x0) + (offsetAngle === undefined ? 0 : offsetAngle);
	
	return {
	  x: x0 + (radius * Math.cos(angle)),
	  y: y0 + (radius * Math.sin(angle))
	};
}

GEE_Util.HitTestCenterByPoint = function (x, y, sizeX, sizeY, pointX, pointY) {
    var hSize = sizeX * 0.5;        
    var vSize = sizeY * 0.5;        
    
    var result = (x - hSize) < pointX && (x + hSize) > pointX && 
        (y - vSize) < pointY && (y + vSize) > pointY;
    
    return result;
}

GEE_Util.HitTestByPoint = function (x, y, sizeX, sizeY, pointX, pointY) {
    var result = x < pointX && (x + sizeX) > pointX && 
        y < pointY && (y + sizeY) > pointY;
    
    return result;
}
function GEE_Engine() {
    var mSelf = this;
    
    var mParentSelectorName;
    var mParentSelector;
    
    var mParentCanvasSelector;
    var mParentCanvasSelectorName;
    
    var mWidth = 0;
    var mHeight = 0;
    var mIsPlaying = false;
    
    var mGraphs = [];
    var mStartGraph = undefined;
    
    this.ctx = undefined;
    this.IsForcePercentage = false;
    
    // internal for GUI
    this.GetWidth = function() { return mWidth; }
    this.GetHeight = function() { return mHeight; }
    
    this.GetParentSelector = function() { return mParentSelector; }
    
    this.Initialize = function(selectorName) {
        mParentSelectorName = selectorName;
        mParentSelector = $(mParentSelectorName);
        mParentSelector.css("height", "100%");
        mWidth = mParentSelector.width();
        mHeight = 400;
        
        mSelf.CreateGUI();
        mSelf.CreateMouseEvents();
    }
    
    this.CreateMouseEvents = function() {
        // Mouse Move
        mParentCanvasSelector.on('mousemove', function(evt) {
            var mousePos = __getMousePos(mParentCanvasSelector[0], evt);
            // on mouse move
            for (var i = 0; i < mGraphs.length; i++) {
                mGraphs[i].OnMouseMove(mousePos);
            }
        });
        
        // Mouse Up
        mParentCanvasSelector.on('mouseup', function(evt) {
            var mousePos = __getMousePos(mParentCanvasSelector[0], evt);
            // on mouse up
            for (var i = 0; i < mGraphs.length; i++) {
                mGraphs[i].OnMouseUp(mousePos);
            }
        });
        
        // Move Down
        mParentCanvasSelector.on('mousedown', function(evt) {
            var mousePos = __getMousePos(mParentCanvasSelector[0], evt);
            // on mouse move
            for (var i = 0; i < mGraphs.length; i++) {
                mGraphs[i].OnMouseDown(mousePos);
            }
        });
        
        function __getMousePos(canvas, evt) {
            var rect = canvas.getBoundingClientRect();
            
            return {
                x: evt.clientX - rect.left,
                y: evt.clientY - rect.top
            };
        }
    }
    
    this.Play = function() {
        if (mStartGraph) {
            mIsPlaying = true;
            mStartGraph.Play();
        }
    }
    
    this.Stop = function() {
        mIsPlaying = false;
        
        for (var i = 0; i < mGraphs.length; i++) {
            mGraphs[i].Stop();
        }
    }
    
    this.ChangeStartGraph = function(graph) {
        for (var i = 0; i < mGraphs.length; i++) {
            mGraphs[i].IsStart = false;
        }
        
        graph.IsStart = true;
        mStartGraph = graph;
    }
    
    this.CreateGUI = function() {
        mParentCanvasSelectorName = "canvas-" + mParentSelectorName.substring(1);
        mParentCanvasSelector = $("<canvas id='" + mParentCanvasSelectorName + 
            "' width='" + mWidth + "' height='" + mHeight + "'></canvas>");
        mParentCanvasSelector.css("float", "left");
        // add HTML canvas
        mParentSelector.append(mParentCanvasSelector);
        
        // get Canvas Context as 2D
        mSelf.ctx = mParentCanvasSelector[0].getContext("2d");
    }
    
    this.DrawGUI = function(dt) {
        var ctx = mSelf.ctx;
        
        // Clear
        ctx.clearRect(0, 0, mWidth, mHeight);
        
        // Background
        ctx.fillStyle = GEE_Styles.BackgroundColor;
        ctx.fillRect(0, 0, mWidth, mHeight);
        
    }
    
    this.CreateGraph = function(x, y, name) {
        var graph = new GEE_Graph(mSelf);
        graph.Initialize(x, y, name);
        
        mGraphs.push(graph);
        
        return graph;
    }
    
    this.ConnectTo = function(graphFrom, graphTo, extraParams) {
        graphFrom.ConnectTo(graphTo, extraParams);
    }
    
    this.ComputeVariables = function() {
        // responsive size
        mParentCanvasSelector.attr('width', mWidth);
        mParentCanvasSelector.attr('height', mHeight);
    }
    
    this.Update = function(dt) {
        // Update size dynamically
        mWidth = mParentSelector.width();
        
        // Compute
        mSelf.ComputeVariables();

        // Draw
        mSelf.DrawGUI(dt);
        
        mSelf.DrawConnections(dt);
        
        for (var i = 0; i < mGraphs.length; i++) {
            mGraphs[i].Update(dt);
        }
    }
    
    this.DrawConnections = function(dt) {
        for (var i = 0; i < mGraphs.length; i++) {
            var connections = mGraphs[i].GetConnections();
            var graphLinkedCount = mGraphs[i].GetGraphLinkedCount(); 
            
            for (var k = 0; k < connections.length; k++) {
                GEE_GraphConnection.Draw(mSelf.ctx, dt, connections[k], 
                    GEE_GraphConnection.OffsetAngle);
            }
        }
    }
    
    this.Destroy = function() {
        
    }
}
function GEE_Graph(gee) {
    var mSelf = this;
    var mGEE = gee;
    
    var mName = "";
    var mConnections = [];
    var mReferences = [];
        
    this.x = 0;
    this.y = 0;
    this.cx = 0;
    this.cy = 0;
    this.Percentage = 0;
    this.Speed = 1;
    this.IsLoop = false;
    this.IsStart = false;
    this.PlaybackObject = undefined;
    // A playbackObject has this interface:
    // Function: Play()
    // Function: Stop()
    // Function: Pause(inTime) --in seconds
    // Function: Update(dt) --normalized delta time
    // Getter: GetCurrentTime()
    // Getter: GetAnimationSeconds()
    
    var mIsPlaying = false;
    var mMouseIsDown = false;
    var mMousePosition = {x: 0, y:0};
    var mMousePositionOffset = {x: 0, y:0};
    
    this.GetName = function() { return mName; }
    this.GetConnections = function() { return mConnections; }
    this.GetReferences = function() { return mReferences; }
    this.GetGraphLinkedCount = function() { return mConnections.length + mReferences.length; }
    
    this.Initialize = function(x, y, name) {
        mName = name;
        
        mSelf.x = x;
        mSelf.y = y;
        
        mSelf.cx = x + GEE_Styles.Graph.SizeX * 0.5;
        mSelf.cy = y + GEE_Styles.Graph.SizeY * 0.5;
    }
    
    this.Play = function() {
        mIsPlaying = true;
        mSelf.Percentage = 0;
        
        if (mSelf.PlaybackObject) {
            mSelf.PlaybackObject.Play();
        }
    }
    
    this.Stop = function() {
        mIsPlaying = false;
        mSelf.Percentage = 0;
        
        if (mSelf.PlaybackObject) {
            mSelf.PlaybackObject.Stop();
        }
    }
    
    this.AddReferenceGraph = function(graph) {
        var graphName = graph.GetName();
        
        if (mName !== graphName) {
            var canReference = true;
            
            for (var i = 0; i < mReferences.length; i++) {
                var reference = mReferences[i];
                
                if (reference && reference.GetName() === graphName) {
                    canReference = false;
                    break;
                }
            }
            
            if (canReference) {
                // add reference
                mReferences.push(graph);
            }
        }
    }
    
    this.ConnectTo = function(graph, extraParams) {
        var graphName = graph.GetName();
        
        if (mName !== graphName) {
            var canConnect = true;
            
            for (var i = 0; i < mConnections.length; i++) {
                var connection = mConnections[i];
                
                if (connection && connection.GraphTo.GetName() === graphName) {
                    canConnect = false;
                    break;
                }
            }
            
            if (canConnect) {
                var connection = new GEE_GraphConnection(mSelf, graph, extraParams);
                mConnections.push(connection);
                
                // add reference
                graph.AddReferenceGraph(mSelf);
            }
        }
    }
    
    this.OnMouseMove = function(mousePos) {
        mMousePosition = mousePos;
    }
    
    this.OnMouseUp = function(mousePos) {
        mMouseIsDown = false;
    }
    
    this.OnMouseDown = function(mousePos) {
        if (!mIsPlaying) {
            
            var width = GEE_Styles.Graph.SizeX;
            var height = GEE_Styles.Graph.SizeY;
            var isHitted = GEE_Util.HitTestByPoint(mSelf.x, mSelf.y, width, height, 
                mousePos.x, mousePos.y);
                
            if (isHitted) {
                mMouseIsDown = true;
                mMousePositionOffset.x = mSelf.x - mousePos.x;
                mMousePositionOffset.y = mSelf.y - mousePos.y;
            }
        }
    }
    
    this.Update = function(dt) {
        mSelf.Draw(dt);
        
        if (mIsPlaying) {
            if (mSelf.PlaybackObject === undefined) {
                mSelf.Percentage += mSelf.Speed * dt;
            }
            else {
                // Only if have a playback object with this interface
                var currentTime = mSelf.PlaybackObject.GetCurrentTime();
                var totalSeconds = mSelf.PlaybackObject.GetAnimationSeconds();
                
                mSelf.Percentage = currentTime / totalSeconds;
            }
            
            if (mSelf.Percentage >= 1.0) {
                mSelf.Percentage = 0;
                
                if (!mSelf.IsLoop) {
                    mIsPlaying = false;
                    // Pause the animation on the end
                    if (mSelf.PlaybackObject) mSelf.PlaybackObject.Pause(mSelf.PlaybackObject.GetAnimationSeconds());
                }
                
                for (var i = 0; i < mConnections.length; i++) {
                    mConnections[i].GraphTo.Play();
                }
            }
            
            // Update PlaybackObject
            if (mSelf.PlaybackObject) mSelf.PlaybackObject.Update(dt);
        }
        else {
            mSelf.Percentage = mSelf.Percentage > 1.0 ? 1.0 : mSelf.Percentage;
            mSelf.Percentage = mSelf.Percentage < 0.0 ? 0.0 : mSelf.Percentage;
            
            if (mMouseIsDown) {
                mSelf.x = mMousePosition.x + mMousePositionOffset.x;
                mSelf.y = mMousePosition.y + mMousePositionOffset.y;
                mSelf.cx = mSelf.x + GEE_Styles.Graph.SizeX * 0.5;
                mSelf.cy = mSelf.y + GEE_Styles.Graph.SizeY * 0.5;
            }
        }
    }
    
    this.Draw = function(dt) {
        var ctx = mGEE.ctx;
        
        // Draw Rect
        ctx.beginPath();
        ctx.rect(mSelf.x, mSelf.y, GEE_Styles.Graph.SizeX, GEE_Styles.Graph.SizeY);
        ctx.fillStyle = !mSelf.IsStart ? GEE_Styles.Graph.Color : GEE_Styles.Graph.StartColor;
        ctx.fill();
        ctx.lineWidth = GEE_Styles.Graph.LineSize;
        ctx.strokeStyle = 'black';
        ctx.stroke();
        ctx.closePath()
        
        // Draw Animation Rect
        var posX = mSelf.x + GEE_Styles.Graph.LineSize;
        var posY = mSelf.y + (GEE_Styles.Graph.SizeY - GEE_Styles.Graph.Transition.SizeY);
        var sizeX = (GEE_Styles.Graph.SizeX - (GEE_Styles.Graph.LineSize * 2.0)) * mSelf.Percentage;
        var sizeY = GEE_Styles.Graph.Transition.SizeY - GEE_Styles.Graph.LineSize;
        
        ctx.beginPath();
        ctx.rect(posX, posY, sizeX, sizeY);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.closePath()
        
        // Draw Text
        var textX = mSelf.x + GEE_Styles.Graph.TextOffsetX;
        var textY = mSelf.y + GEE_Styles.Graph.TextOffsetY;
        ctx.font = GEE_Styles.Graph.TextStyle;
        ctx.textAlign = "center";
        
        var resultLines = GEE_Util.FragmentText(ctx, mName, GEE_Styles.Graph.SizeX);
        var offsetY = resultLines.LinesQuantity > 1 
            ? (resultLines.Height * 0.25) * resultLines.LinesQuantity
            : 0;
        
        for (var i = 0; i < resultLines.LinesQuantity; i++) {
            ctx.fillText(resultLines.Lines[i], textX, textY + (resultLines.Height * i) - offsetY);
        }
        
    }
    
    this.Destroy = function() {
        mSelf = undefined;
        mGEE = undefined;
    }
}
function GEE_GraphConnection(graphFrom, graphTo, extraParams) {
    this.GraphFrom = graphFrom;
    this.GraphTo = graphTo;
    this.ExtraParams = extraParams;
}

GEE_GraphConnection.OffsetRadius = 20;
GEE_GraphConnection.OffsetAngle = 0.12;

GEE_GraphConnection.Draw = function(ctx, dt, connection, offsetAngle) {
    var graphFrom = connection.GraphFrom;
    var graphTo = connection.GraphTo;

    GEE_GraphConnection.DrawArrow(ctx, graphFrom.cx, graphFrom.cy, 
        graphTo.cx, graphTo.cy, offsetAngle);
}

GEE_GraphConnection.DrawArrow = function(ctx, fromx, fromy, tox, toy, offsetAngle){
    offsetAngle = offsetAngle === undefined ? 0 : offsetAngle;
    
    var headlen = 5;
    var startPosition = GEE_Util.CirclePosition(fromx, fromy, tox, toy, 
        GEE_GraphConnection.OffsetRadius, offsetAngle);
    var endPosition = GEE_Util.CirclePosition(tox, toy, fromx, fromy, 
        GEE_GraphConnection.OffsetRadius, -offsetAngle);
    
    fromx = startPosition.x;
    fromy = startPosition.y;
    tox = endPosition.x;
    toy = endPosition.y;
    
    var angle = Math.atan2(toy-fromy, tox-fromx);
    var middleX = GEE_Util.Lerp(fromx, tox, 0.5);
    var middleY = GEE_Util.Lerp(fromy, toy, 0.5);
    
    //starting path of the arrow from the start square to the end square and drawing the stroke
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.strokeStyle = GEE_Styles.ArrowColor_Stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    //starting a new path from the head of the arrow to one of the sides of the point
    ctx.beginPath();
    ctx.moveTo(middleX, middleY);
    ctx.lineTo(middleX-headlen*Math.cos(angle-Math.PI/7),middleY-headlen*Math.sin(angle-Math.PI/7));

    //path from the side point of the arrow, to the other side point
    ctx.lineTo(middleX-headlen*Math.cos(angle+Math.PI/7),middleY-headlen*Math.sin(angle+Math.PI/7));

    //path from the side point back to the tip of the arrow, and then again to the opposite side point
    ctx.lineTo(middleX, middleY);
    ctx.lineTo(middleX-headlen*Math.cos(angle-Math.PI/7),middleY-headlen*Math.sin(angle-Math.PI/7));

    //draws the paths created above
    ctx.strokeStyle = GEE_Styles.ArrowColor_Stroke;
    ctx.lineWidth = 0;
    ctx.stroke();
    ctx.fillStyle = GEE_Styles.ArrowColor_Fill;
    ctx.fill();
}