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

GEE_Util.IsPointInPolygon = function(point, polygon) {
    var minX = polygon[0].x;
    var maxX = polygon[0].x;
    var minY = polygon[0].y;
    var maxY = polygon[0].y;

    for (var i = 1; i < polygon.length; i++) {
        var tmp_point = polygon[i];
        
        minX = Math.min(tmp_point.x, minX);
        maxX = Math.max(tmp_point.x, maxX);
        minY = Math.min(tmp_point.y, minY);
        maxY = Math.max(tmp_point.x, maxY);
    }

    if (point.x < minX || point.x > maxX || point.y < minY || point.y > maxY) {
        return false;
    }

    var pointInsidePolygon = false;

    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        if ((polygon[i].y > point.y) != (polygon[j].y > point.y) && point.x < 
            (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / 
            (polygon[j].y - polygon[i].y) + polygon[i].x) {

            pointInsidePolygon = !pointInsidePolygon;
        }
    }

    return pointInsidePolygon;
}