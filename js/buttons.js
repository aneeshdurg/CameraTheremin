//vairables and buttons

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
var docrop = false;
var dothresh = false;
var doColorChange = false; 
var calibrate = true;
var t = 70;
var subThresh = 70;
var noiseThresh = 0;
var min = -1;
var max = -1;
var changemin = false;
var changemax = false;
var setbg = false;
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

function clearmaxmin(){
	max = -1; 
	min = -1;
	document.getElementById("maxval").innerHTML = "";
	document.getElementById("minval").innerHTML = "";
	if(started){
		start();
	}
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

function setbinsub(){
		dobinsub = !dobinsub;
		if(dobinsub){
			document.getElementById("binsubButton").innerHTML = "Thresholder";	
		}
		else{
			document.getElementById("binsubButton").innerHTML = "Binary Subtractor";	
		}
}

function setBackGround(){
	setbg = true;
}

function xDelta(vals){
	xs = vals[0];
	xe = vals[1];
	if(xs>xe){
		xs = vals[1];
		xe = vals[0];
	}
}

function yDelta(vals){
	ys = vals[0];
	ye = vals[1];
	if(ys>ye){
		ys = vals[1];
		ye = vals[0];
	}
}

function threshDelta(val){
		subThresh = val;
		t = val;
	
}

function nthreshdelta(incr){
	if(incr){
		noiseThresh++;
	}
	else{
		noiseThresh--;
	}
}
