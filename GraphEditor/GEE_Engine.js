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
    
    var mTryingToConnect = {
        IsTrying: false,
        FromX: 0,
        FromY: 0,
        FromGraph: undefined,
        MouseOverGraph: undefined,
        MousePos: {
            x: 0,
            y: 0
            }
        };
    var mOnFocusConnection = {
        Connection: undefined
    };
    
    // internal for GUI
    this.GetWidth = function() { return mWidth; }
    this.GetHeight = function() { return mHeight; }
    
    this.GetParentSelector = function() { return mParentSelector; }
    this.GetTryingToConnect = function() { return mTryingToConnect; }
    
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
            
            if (mTryingToConnect.IsTrying) {
                mTryingToConnect.MousePos = mousePos;    
            }
        });
        
        // Mouse Up
        mParentCanvasSelector.on('mouseup', function(evt) {
            var mousePos = __getMousePos(mParentCanvasSelector[0], evt);
            // on mouse up
            for (var i = 0; i < mGraphs.length; i++) {
                mGraphs[i].OnMouseUp(mousePos);
            }
            
            if (mTryingToConnect.IsTrying) {
                if (mTryingToConnect.MouseOverGraph) {
                    mTryingToConnect.MouseOverGraph.IsMouseOver = false;
                    
                    // Now connect the graphs
                    mTryingToConnect.FromGraph.ConnectTo(mTryingToConnect.MouseOverGraph);
                }
                
                mTryingToConnect.IsTrying = false;
                mTryingToConnect.FromX = 0;
                mTryingToConnect.FromY = 0;
                mTryingToConnect.FromGraph = undefined;
                mTryingToConnect.MouseOverGraph = undefined;
            }
            
            // Unfocus current one
            if (mOnFocusConnection.Connection) { 
                mOnFocusConnection.Connection.OnFocus = false;
                mOnFocusConnection.Connection = undefined;
            }
            
            // Now search a connection to Focus
            var connection = GEE_Engine.GetConnectionByPosition(mGraphs, 
                mousePos.x, mousePos.y);
                
            if (connection) {
                mOnFocusConnection.Connection = connection;
                mOnFocusConnection.Connection.OnFocus = true;
            }
        });
        
        // Move Down
        mParentCanvasSelector.on('mousedown', function(evt) {
            var hittedConnector = false;
            var mousePos = __getMousePos(mParentCanvasSelector[0], evt);
            // on mouse move
            for (var i = 0, length = mGraphs.length; i < length; i++) {
                hittedConnector = mGraphs[i].IsHittedConnector(mousePos);
                
                if (hittedConnector.IsHitted) { break; }
            }
            
            if (!hittedConnector.IsHitted) {
                for (var i = 0, length = mGraphs.length; i < length; i++) {
                    mGraphs[i].OnMouseDown(mousePos);
                }
            }
            else {
                mTryingToConnect.MousePos = mousePos;
                
                mTryingToConnect.IsTrying = true;
                mTryingToConnect.FromGraph = hittedConnector.Graph;
                mTryingToConnect.FromX = hittedConnector.ConnectorX;
                mTryingToConnect.FromY = hittedConnector.ConnectorY;
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
    
    this.RemoveConnection = function(connection) {
        connection.GraphFrom.RemoveConnection(connection);
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
        
        // Do trying to connect to...
        if (mTryingToConnect.IsTrying) {
            var mousePos = mTryingToConnect.MousePos;
            
            GEE_GraphConnection.DrawPreConnector(mSelf.ctx, mTryingToConnect.FromX,
                mTryingToConnect.FromY, mousePos.x, mousePos.y);
                
            var graphResult = GEE_Engine.GetGraphByPosition(mGraphs, mousePos.x, mousePos.y);
            
            if (graphResult.IsHitted && (graphResult.Graph.GetName() !== mTryingToConnect.FromGraph.GetName())) {
                if (mTryingToConnect.MouseOverGraph) {
                    mTryingToConnect.MouseOverGraph.IsMouseOver = false;
                }
                
                mTryingToConnect.MouseOverGraph = graphResult.Graph;
                mTryingToConnect.MouseOverGraph.IsMouseOver = true;
            }
            else {
                if (mTryingToConnect.MouseOverGraph) {
                    mTryingToConnect.MouseOverGraph.IsMouseOver = false;
                    mTryingToConnect.MouseOverGraph = undefined;
                }
            }
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
        for (var i = 0; i < mGraphs.length; i++) {
            mGraphs[i].Destroy();
        }
        
        mGraphs = undefined;
        mParentSelector = undefined;
        mParentCanvasSelector = undefined;
        mStartGraph = undefined;
        mTryingToConnect = undefined;
        mOnFocusConnection = undefined;
    }
}

GEE_Engine.GetGraphByPosition = function(graphs, x, y) {
    var result = undefined;
    
    for (var i = 0, length = graphs.length; i < length; i++) {
        result = graphs[i].IsHittedGraph({ x: x, y: y});
        if (result.IsHitted) break;
    }
    
    return result;
}

GEE_Engine.GetConnectionByPosition = function(graphs, x, y, ctx) {
    var resultConnection = undefined;  
    var elevation = 3;
    var isDebug = false && ctx !== undefined;
    var perpendicularConst = Math.PI * 0.5;
    
    for (var i = 0, length = graphs.length; i < length; i++) {
        var connections = graphs[i].GetConnections();
        
        for (var j = 0; j < connections.length; j++) {
            var resultPosition = GEE_GraphConnection.GetPosition(connections[j], 
                GEE_GraphConnection.OffsetAngle);
                
            var cp0 = GEE_Util.CirclePosition(resultPosition.FromX, resultPosition.FromY, 
                resultPosition.ToX, resultPosition.ToY, elevation, perpendicularConst);
            var cp1 = GEE_Util.CirclePosition(resultPosition.FromX, resultPosition.FromY, 
                resultPosition.ToX, resultPosition.ToY, elevation, -perpendicularConst);
            var cp2 = GEE_Util.CirclePosition(resultPosition.ToX, resultPosition.ToY, 
                resultPosition.FromX, resultPosition.FromY, elevation, perpendicularConst);
            var cp3 = GEE_Util.CirclePosition(resultPosition.ToX, resultPosition.ToY, 
                resultPosition.FromX, resultPosition.FromY, elevation, -perpendicularConst);
                
            var isInside = GEE_Util.IsPointInPolygon({ x: x, y: y }, [cp0, cp1, cp2, cp3]);
                
            if (isInside) {
                resultConnection = connections[j];
                break; 
            }
                
            if (isDebug) {
                ctx.beginPath();
                ctx.moveTo(cp0.x, cp0.y);
                ctx.lineTo(cp1.x, cp1.y);
                ctx.lineTo(cp2.x, cp2.y);
                ctx.lineTo(cp3.x, cp3.y);
                ctx.lineTo(cp0.x, cp0.y);
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.closePath()
            }
        }
        
        if (resultConnection !== undefined) break;
    }
    
    return resultConnection;
}