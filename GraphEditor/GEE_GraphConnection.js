function GEE_GraphConnection(graphFrom, graphTo, extraParams) {
    this.GraphFrom = graphFrom;
    this.GraphTo = graphTo;
    this.ExtraParams = extraParams;
    this.OnFocus = false;
}

GEE_GraphConnection.OffsetRadius = 20;
GEE_GraphConnection.OffsetAngle = 0.16;

GEE_GraphConnection.Draw = function(ctx, dt, connection, offsetAngle) {
    var graphFrom = connection.GraphFrom;
    var graphTo = connection.GraphTo;

    GEE_GraphConnection.DrawArrow(ctx, graphFrom.cx, graphFrom.cy, 
        graphTo.cx, graphTo.cy, offsetAngle, undefined, undefined, undefined, 
        connection.OnFocus);
}

GEE_GraphConnection.DrawArrow = function(ctx, fromx, fromy, tox, toy, offsetAngle, 
    offsetRadius, colorStroke, colorFill, onFocus){
    
    onFocus = onFocus === undefined ? false: onFocus;
    colorStroke = colorStroke === undefined ? GEE_Styles.ArrowColor_Stroke : colorStroke;
    colorFill = colorFill === undefined ? GEE_Styles.ArrowColor_Fill : colorFill;
    offsetAngle = offsetAngle === undefined ? 0 : offsetAngle;
    offsetRadius = offsetRadius === undefined ? GEE_GraphConnection.OffsetRadius : offsetRadius;
    
    if (onFocus) {
        colorStroke = GEE_Styles.ArrowColorFocus_Stroke;
    }
    
    var headlen = 5;
    var startPosition = GEE_Util.CirclePosition(fromx, fromy, tox, toy, 
        offsetRadius, offsetAngle);
    var endPosition = GEE_Util.CirclePosition(tox, toy, fromx, fromy, 
        offsetRadius, -offsetAngle);
    
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
    ctx.strokeStyle = colorStroke;
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
    ctx.strokeStyle = colorStroke;
    ctx.lineWidth = 0;
    ctx.stroke();
    ctx.fillStyle = colorFill;
    ctx.fill();
    ctx.closePath()
}

GEE_GraphConnection.DrawPreConnector = function(ctx, fromx, fromy, tox, toy) {
    var offsetAngle = 0;
    var offsetRadius = 0;
    var colorStroke = "#003300";
    var colorFill = "#990000";
    
    GEE_GraphConnection.DrawArrow(ctx, fromx, fromy, tox, toy, offsetAngle, 
        offsetRadius, colorStroke, colorFill);
}

GEE_GraphConnection.GetPosition = function(connection, offsetAngle) {
    offsetAngle = offsetAngle === undefined ? 0 : offsetAngle;
    var offsetRadius = GEE_GraphConnection.OffsetRadius;
    
    var graphFrom = connection.GraphFrom;
    var graphTo = connection.GraphTo;
    
    var fromx = graphFrom.cx;
    var fromy = graphFrom.cy; 
    var tox = graphTo.cx;
    var toy = graphTo.cy;
    
    var startPosition = GEE_Util.CirclePosition(fromx, fromy, tox, toy, 
        offsetRadius, offsetAngle);
    var endPosition = GEE_Util.CirclePosition(tox, toy, fromx, fromy, 
        offsetRadius, -offsetAngle);
    
    fromx = startPosition.x;
    fromy = startPosition.y;
    tox = endPosition.x;
    toy = endPosition.y;
    
    return {
        FromX: fromx,
        FromY: fromy,
        ToX: tox,
        ToY: toy,
    }
}