function GEE_Engine() {
    var mSelf = this;
    
    var mParentSelectorName;
    var mParentSelector;
    
    var mParentCanvasSelector;
    var mParentCanvasSelectorName;
    
    var mWidth = 0;
    var mHeight = 0;
    
    var mGraphs = [];
    
    this.ctx = undefined;
    
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
        
        for (var i = 0; i < mGraphs.length; i++) {
            mGraphs[i].Update(dt);
        }
    }
    
    this.DrawConnections = function(dt) {
        for (var i = 0; i < mGraphs.length; i++) {
            var connections = mGraphs[i].GetConnections();
            
            for (var k = 0; k < connections.length; k++) {
                GEE_GraphConnection.Draw(mSelf.ctx, dt, connections[k]);
            }
        }
    }
    
    this.Destroy = function() {
        
    }
}