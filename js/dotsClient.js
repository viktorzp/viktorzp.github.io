var app = angular.module('dots', ['btford.socket-io']);

app.factory('socket', function(socketFactory){
	var mySocket = io.connect("https://protected-brushlands-5546.herokuapp.com/"); //"\\192.168.0.100:9999/"
	
	var socket = socketFactory({
		ioSocket : mySocket	
	});
	return socket;
	
});

app.controller('dotsCtrl', function($scope, socket, $timeout, $compile) {
	
	$scope.clientGameStatus = "";
	$scope.data = {playerNumber: undefined, playerColor:undefined ,verge:undefined, sqVerge:undefined, movesLeft:undefined};
	$scope.Dots;
	$scope.showHide = true;
	$scope.currentMove;
	$scope.pointList = [];
	$scope.redScore = 0;
	$scope.blueScore = 0;
	
	$canvas = $("#dotsGame");
	$scope.ctx = $canvas[0].getContext('2d');
	
	socket.on("waitingForRival", function(data){
	
		var message = JSON.parse(data);
		$timeout(function() { $("#clientGameStatus").text(message.msg); /*;$scope.clientGameStatus = message.msg;*/ });

	});
	socket.on("startGame", function(data){
		
		var message = JSON.parse(data);
		
		var messageStyle = "color:" + message.player.color.color +"; font: bold 19px Arial;";
		var consoleMess = message.msg + " - Вы <span style=\""+messageStyle+"\">"+ message.player.color.name +"</span> игрок!"; 

		$timeout(function() { /*$scope.clientGameStatus = consoleMess;*/ $scope.currentMove = "красный"; });
		$("#clientGameStatus").html(consoleMess);
		
		$scope.Dots = new Dots();
		$scope.showHide = false;
		
		$scope.data.playerNumber = message.player.id;
		$scope.data.playerColor = message.player.color.color; 
		$scope.data.verge = message.data.verge;
		$scope.data.sqVerge = message.data.sqVerge;
		$scope.data.movesLeft = message.data.movesLeft;
		
		$scope.Dots.allowClick = ($scope.data.playerNumber == message.moveNow) ? true : false;
		
		//console.log(message);
		
	});
	socket.on('sendField', function(data){
		
		var data = JSON.parse(data);
		$scope.Dots.allowClick = ($scope.data.playerNumber == data.nextMove) ? true : false;
		
		//console.log($scope.data.playerNumber , data.nextMove , $scope.Dots.allowClick, ($scope.data.playerNumber == data.moveNow));
		
		for(var i=0; i<data.field.length; i++){
			$scope.pointList[data.field[i].x+":"+data.field[i].y] = data.field[i];
		}
		
		if($scope.Dots.setPoint($scope.ctx, data.x, data.y, data.moveColor.color) && !$scope.Dots.allowClick)
			socket.emit('pointSetComplete', JSON.stringify({x:data.x, y:data.y, player: $scope.data.playerNumber}));
		
		$timeout(function() {
			$scope.data.movesLeft--; 
			$scope.currentMove = ($scope.currentMove == "красный") ? "синий" : "красный";
			//$("#plMove").html("<span style='color:"+data.moveColor.color+"'>"+$scope.currentMove+"</span>");
			
			if(parseInt($scope.data.movesLeft) == 0)
				$scope.checkMovesLeft();
		});
		
		$scope.toggleMoveWrapper($scope.currentMove);
			
	});
	socket.on('bordersDrawing', function(data){
		
		data = JSON.parse(data);
		
		console.log(data);
		
		$scope.Dots.blockConstruct(data.coordinates, $scope.ctx, data.lineColor.color);
		
		if(data.id == 0)
			$timeout(function() { $scope.redScore += parseInt(data.res.dotsInArea);});  
		else
			$timeout(function() { $scope.blueScore += parseInt(data.res.dotsInArea);  }); 

	});
	socket.on('rivalLeaveThegame', function(data){
		
		data = JSON.parse(data);
		$scope.disableButton = false;
		
		$timeout(function() { $scope.resetVars(); });
		
		alert(data.msg);
		
	});
	socket.on("disconnect", function(data){
		var message = JSON.parse(data);
		$timeout(function() { $("#clientGameStatus").text(message.msg); /*$scope.clientGameStatus = message.msg;*/ });
	});

	
	$scope.connectServer = function(){
		
		$scope.disableButton = true;
		socket.emit('newGame', true); //JSON.stringify({action : 'newGame'})
		
	}
	
	$scope.catchMove = function(e){
		
		offset = $canvas.offset();
		$scope.Dots.mouse.top = parseInt(e.pageY-offset.top);
		$scope.Dots.mouse.left = parseInt(e.pageX-offset.left);
		
		//console.log(mouse.top, mouse.left);
	}
	$scope.getCoordinates = function(e){
		
		x = Math.round($scope.Dots.mouse.left / $scope.data.sqVerge) * $scope.data.sqVerge;
		y = Math.round($scope.Dots.mouse.top / $scope.data.sqVerge) * $scope.data.sqVerge;
		
		if($scope.pointList[x+':'+y] || !$scope.Dots.allowClick) return;
		
		if(x < $scope.data.sqVerge || 
			x > ($scope.data.verge - $scope.data.sqVerge) || 
			y < $scope.data.sqVerge || 
			y > ($scope.data.verge - $scope.data.sqVerge)) return; // forbid to set dots on the field borders
		
		socket.emit('sendCoords', JSON.stringify({player:$scope.data.playerNumber, x:x, y:y, pwned:false}));
	}
	$scope.checkMovesLeft = function(){
			
			$timeout(function() { tmpMsg = $("#clientGameStatus").text();  $("#clientGameStatus").text(tmpMsg + "Ходов больше нет!"); /*$scope.clientGameStatus += "Ходов больше нет!";*/ });
			$scope.whoIsTheWinner();	
		
	}
	$scope.whoIsTheWinner = function(){
		
		if($scope.redScore > $scope.blueScore) alert("Игра завершина! Победил красный игрок!");
		else if($scope.redScore < $scope.blueScore) alert("Игра завершина! Победил синий игрок!");
		else alert("Игра завершина! У нас ничья!");
		
		socket.emit('changeStatus', JSON.stringify({status : 'connected'}));
		$scope.disableButton = false;
		$timeout(function() { $scope.resetVars(); });

	}
	$scope.toggleMoveWrapper = function(color){
		if( color == 'красный' ){
			$("#movePlayerWrap").animate({
				top : "26px",
				backgroundColor:"#0000ff",
				borderColor: "#0000ff"
			}, 500);
			$("#pl1").animate({color: "#ff0000"}, 500);
			$("#pl2").animate({color: "#fff"}, 500);
		} else {
			$("#movePlayerWrap").animate({
				top : "2px",
				backgroundColor : "#ff0000",
				borderColor: "#ff0000"
			}, 500);
			$("#pl1").animate({color: "#fff"}, 500);
			$("#pl2").animate({color: "#0000ff"}, 500);
		}		
	}
	$scope.resetVars = function(){ 
	
			$("#clientGameStatus").html("<div id=\"clientGameStatus\"></div>");
			$scope.data = {playerNumber: undefined, playerColor:undefined ,verge:undefined, sqVerge:undefined, movesLeft:undefined};
			$scope.Dots = undefined;
			$scope.showHide = true;
			$scope.currentMove;
			$scope.pointList = [];
			$scope.redScore = 0;
			$scope.blueScore = 0;

			$("#movePlayerWrap").animate({
				top : "2px",
				backgroundColor : "#ff0000",
				borderColor: "#ff0000"
			}, 500);
			$("#pl1").animate({color: "#fff"}, 500);
			$("#pl2").animate({color: "#0000ff"}, 500);			

	}
	
	
});


