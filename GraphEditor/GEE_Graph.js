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
    this.Speed = 1 + Math.random() * 2;
    this.IsLoop = false;
    this.IsStart = false;
    
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
    }
    
    this.Stop = function() {
        mIsPlaying = false;
        mSelf.Percentage = 0;
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
            mSelf.Percentage += mSelf.Speed * dt;
            
            if (mSelf.Percentage >= 1.0) {
                mSelf.Percentage = 0;
                
                if (!mSelf.IsLoop) {
                    mIsPlaying = false;
                }
                
                for (var i = 0; i < mConnections.length; i++) {
                    mConnections[i].GraphTo.Play();
                }
            }
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