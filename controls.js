var video, canvas, context, width, height;
var counter = 0;
var xs = 0;
var xe = 0;
var ys = 0;
var ye = 0;
var initialf = null;
var dobinsub = false;
var dobgr2gray = false;
var dogaussblur = false;
var subThresh = 10;
var docrop = false;
var dothresh = false;
var doColorChange = false; 
var calibrate = true;
var t = 0;
var noiseThresh = 0;
var min = -1;
var max = -1;
var changemin = false;
var changemax = false;
var cont = true;

navigator.getUserMedia = ( navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);
function setcont(){
	cont = !cont;
	if(cont)
		document.getElementById("cbutton").innerHTML = "continuous";
	else
		document.getElementById("cbutton").innerHTML = "discrete";	
}

function setmin(val){
	changemin = true;
}
function setmax(val){
	changemax = true;
}
function setcalibrate(){
	calibrate = !calibrate;
	document.getElementById("calibration").style.display = '';
	if(!calibrate)
		document.getElementById("calibration").style.display = 'none';
}

function stUp(){
	subThresh+=1;
	document.getElementById("subThresh").innerHTML = "subtractor threshold = "+subThresh;
	
}
function stdn(){
	subThresh-=1;
	document.getElementById("subThresh").innerHTML = "subtractor threshold = "+subThresh;
}


function setbinsub(){
	if(dobinsub){
		dobinsub = false;
	}
	else{
		dobinsub = true;
	}	
}
function xsdelta(incr){
	if(incr){
		xs+=5;
	}
	else{
		xs-=5;
	}
}
function xedelta(incr){
	if(incr){
		xe-=5;
	}
	else{
		xe+=5;
	}
}
function ysdelta(incr){
	if(incr){
		ys+=5;
	}
	else{
		ys-=5;
	}
}
function yedelta(incr){
	if(incr){
		ye-=5;
	}
	else{
		ye+=5;
	}
}

function threshup(incr){
	if(incr){
		t+=5;
	}
	else{
		t-=5;
	}
}

function nthreshdelta(incr){
	if(incr){
		noiseThresh++;
	}
	else{
		noiseThresh--;
	}
}
