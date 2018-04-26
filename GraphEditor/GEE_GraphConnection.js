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