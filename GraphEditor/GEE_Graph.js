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
    this.IsMouseOver = false;
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
    
    this.RemoveReference = function(connection) {
        for (var i = 0; i < mReferences.length; i++) {
            var tmpReference = mReferences[i];
            
            if (tmpReference && tmpReference.GetName() === connection.GraphFrom.GetName()) {
                mReferences.splice(i, 1);
                break;
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
    
    this.RemoveConnection = function(connection) {
        // Remove the connection
        for (var i = 0; i < mConnections.length; i++) {
            var tmpConnection = mConnections[i];
            
            if (tmpConnection.GraphTo.GetName() === connection.GraphTo.GetName()) {
                mConnections.splice(i, 1);
                break;
            }
        }
        
        // Remove also the reference
        connection.GraphTo.RemoveReference(tmpConnection);
    }
    
    this.OnMouseMove = function(mousePos) {
        mMousePosition = mousePos;
    }
    
    this.OnMouseUp = function(mousePos) {
        mMouseIsDown = false;
    }
    
    this.OnMouseDown = function(mousePos) {
        if (!mIsPlaying) {
            var isHittedGraph = mSelf.IsHittedGraph(mousePos).IsHitted;
            var isHittedConnector = mSelf.IsHittedConnector(mousePos).IsHitted;
            
            if (isHittedGraph && !isHittedConnector) {
                mMouseIsDown = true;
                mMousePositionOffset.x = mSelf.x - mousePos.x;
                mMousePositionOffset.y = mSelf.y - mousePos.y;
            }
        }
    }
    
    this.IsHittedGraph = function(mousePos) {
        var width = GEE_Styles.Graph.SizeX;
        var height = GEE_Styles.Graph.SizeY;
        
        var isHittedGraph = GEE_Util.HitTestByPoint(mSelf.x, mSelf.y, 
            GEE_Styles.Graph.SizeX, GEE_Styles.Graph.SizeY, mousePos.x, 
            mousePos.y);
            
        return {
            IsHitted: isHittedGraph,
            Graph: mSelf
        };
    }
    
    this.IsHittedConnector = function(mousePos) {
        var width = GEE_Styles.Graph.SizeX;
        var radius = GEE_Styles.Graph.CircleConnector.Radius;
        var cX = (mSelf.x + width) - (GEE_Styles.Graph.CircleConnector.OffsetCircle + radius * 2);
        var cY = mSelf.y;
        var cWidth = (radius * 2) + GEE_Styles.Graph.CircleConnector.OffsetCircle;
        var cHeight = (radius * 2) + GEE_Styles.Graph.CircleConnector.OffsetCircle;
            
        var isHittedConnector = GEE_Util.HitTestByPoint(cX, cY, cWidth, 
            cHeight, mousePos.x, mousePos.y);
            
        return {
            IsHitted: isHittedConnector,
            Graph: mSelf,
            ConnectorX: cX + radius + radius * 0.5,
            ConnectorY: cY + radius + radius * 0.5
        };
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
        
        if (!mSelf.IsMouseOver) {
            ctx.fillStyle = !mSelf.IsStart ? GEE_Styles.Graph.Color : GEE_Styles.Graph.StartColor;
        }
        else {
            ctx.fillStyle = GEE_Styles.Graph.MouseOverColor;
        }
        
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
        
        // Draw connector trigger
        var radius = GEE_Styles.Graph.CircleConnector.Radius;
        var offsetCircle = GEE_Styles.Graph.CircleConnector.OffsetCircle;
        
        ctx.beginPath();
        ctx.arc(mSelf.x + GEE_Styles.Graph.SizeX - (radius * 0.5) - offsetCircle, 
            mSelf.y + (radius * 0.5) + offsetCircle, 
            radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#990000';
        ctx.fill();
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = '#003300';
        ctx.stroke();
        
    }
    
    this.Destroy = function() {
        mSelf.PlaybackObject = undefined;
        
        mSelf = undefined;
        mGEE = undefined;
        mMousePosition = undefined;
        mMousePositionOffset = undefined;
        mConnections = undefined;
        mReferences = undefined;
    }
}