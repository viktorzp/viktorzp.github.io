function Dots(){
	
	this.mouse = {
		top : 0,
		left : 0
	};
	
	this.allowClick;
	
	this.setPoint = function(ctx, x, y, color){ // setting dot on a field
		
		ctx.beginPath();
		ctx.arc(x, y, 4, 0, Math.PI*2, true);
		ctx.fillStyle = color;
		ctx.closePath();
		ctx.fill();
			
		return true;		  
	}
	
	this.blockConstruct = function(dotsUnact, ctx, color){ // drawing the closed area
						
		var startX, startY;
		ctx.lineWidth=2;
		ctx.strokeStyle = color;
		ctx.beginPath();
		
		for(var i=0; i<dotsUnact.length; i++){
			if(i==0){
				startX = dotsUnact[i].x; startY = dotsUnact[i].y;  
				ctx.moveTo(dotsUnact[i].x, dotsUnact[i].y);	
			}
			ctx.lineTo(dotsUnact[i].x, dotsUnact[i].y);
		}
			
		ctx.lineTo(startX, startY);
						
		ctx.closePath();
		ctx.stroke();
	}
	
	
}




























