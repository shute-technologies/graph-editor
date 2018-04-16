function GEE_Graph(gee) {
    var mSelf = this;
    var mGEE = gee;
    
    var mName = "";
    var mConnections = [];
        
    this.x = 0;
    this.y = 0;
    this.Percentage = 0.5;
    
    this.GetName = function() { return mName; }
    this.GetConnections = function() { return mConnections; }
    
    this.Initialize = function(x, y, name) {
        mName = name;
        
        mSelf.x = x;
        mSelf.y = y;
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
            }
        }
    }
    
    this.Update = function(dt) {
        mSelf.Percentage = mSelf.Percentage > 1.0 ? 1.0 : mSelf.Percentage;
        mSelf.Percentage = mSelf.Percentage < 0.0 ? 0.0 : mSelf.Percentage;
        
        mSelf.Draw(dt);
    }
    
    this.Draw = function(dt) {
        var ctx = mGEE.ctx;
        
        // Draw Rect
        ctx.beginPath();
        ctx.rect(mSelf.x, mSelf.y, GEE_Styles.Graph.SizeX, GEE_Styles.Graph.SizeY);
        ctx.fillStyle = GEE_Styles.Graph.Color;
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