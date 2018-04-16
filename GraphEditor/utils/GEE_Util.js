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