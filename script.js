//sets up camera
function initialize(){
	video = document.getElementById("vid");
	canvas = document.getElementById("c");
	context = canvas.getContext("2d");

	width = 320;//640;
	height = 240;//480; 
	canvas.width = width;
	canvas.height = height;
	xe = width;
	ye = height;

	var constraints = {
		video: {
			mandatory: {
				maxWidth: 320,
				maxHeight: 180
			}
		}
	}
	navigator.getUserMedia(constraints, startStream, function(){});
}

function startStream(stream){
	video.src = URL.createObjectURL(stream);
	video.play();

	requestAnimationFrame(draw);
}

//calls other functions to do detection/edit frame
function draw(){
	var frame = readFrame();
	var scaled = 0;
	if(frame){
		if(counter>=100){
			if(binsub&&!initialf){
				initialf = frame.data;
			}
			else{
				if(dobinsub){
					binsub(frame.data, subThresh);
				}
				if(dogaussblur){
					GaussBlur(frame.data, 1.5);
				}
				
				if(dothresh){
					threshold(frame.data, t, 0, 255);
					if(noiseThresh!=0)
						removeNoise(frame.data, noiseThresh, 255, 0);
				}
				if(docrop){
					crop(xs, xe, ys, ye, frame.data);
				}
				var white = countWhite(frame.data);
				if(changemax){
					max = white;
					changemax = false;
					document.getElementById("maxval").innerHTML = "Detected area(upper bound): "+white+" px";
				}
				if(changemin){
					min = white;
					changemin = false;
					document.getElementById("minval").innerHTML = "Detected area(lower bound): "+white+" px";
				}

				scaled = scale(white, cont); 
				document.getElementById("count").innerHTML = "Detected area: "+white+" px";
				//flip(frame.data);
			}
		}
		if(calibrate){
			try{
				context.putImageData(frame, 0, 0);
			} catch(e){
				console.log(e);
			}
		
		} else{
			frame = readFrame();
			if(frame&&doColorChange){
				increasedColor(frame.data, scaled);
				//drawCroppedBounds(frame.data, xs, xe, ys, ye, 2);
			}
			try{
				context.putImageData(frame, 0, 0);
			} catch(e){
				console.log(e);
			}	
		}
	}
	counter+=1;
	requestAnimationFrame(draw);
}

//adds color to data depending on val
function increasedColor(data, val){
	var temp = Math.abs(val-220);
	temp*=1275/220;
	var r,g,b;
	if(temp==0){
		r = 0;
		g = 0;
		b = 0;
	} else if(temp<255){
		r = temp;
		g = 0;
		b = 0;
	} else if(temp<=510){
		r = 255;
		g = temp-r;
		b = 0;
	} else if(temp<=765){
		r = temp-510;
		g = 255;
		b = 0;
	} else if(temp<=1020){
		temp-=765;
		r = 0;
		g = 255;
		b = temp;
	} else{
		temp-=1020;
		r = 0;
		g = 255-temp;
		b = 255;
	}

	var len = data.length;
	if(temp!=0)
		bgr2gray(data);
	for(var i =0; i<len; i+=4){
		data[i] += r;
		data[i+1] += g;
		data[i+2] += b;
		if(data[i]>255)
			data[i]=255;
		if(data[i+1]>255)
			data[i+1] = 255;
		if(data[i+2]>255)
			data[i+2] = 255;
	}
}

//either sets num to preset frequencies
//or uses a linear function to map it to 
//a range of frequencies
function scale(num, mode){
	if(min<0||max<0||num==0){
		playSynth(0);
		return num;
	}
	var high = max-min;
	var sf = 220/high;
	var ret = (sf*(num-min)+220)*1000;
	var ret = Math.floor(ret);
	var ret = ret/1000;
	if(mode){
		if(ret<=150)
			ret=0;
		else if(ret<=233.082)
			ret=220;
		else if(ret<=(246.942+261.626)/2)
			ret = 246.942;
		else if(ret<=277.183)
			ret = 261.626;
		else if(ret<=311.127)
			ret = 293.665;
		else if(ret<=(349.228+329.628)/2)
			ret = 329.628;
		else if(ret<=369.994)
			ret = 349.228;
		else if(ret<=415.305)
			ret = 391.995;
		else
			ret = 440;
	}
	//sends frequency to synth	
	playSynth(ret);
	return ret;
}
//gets frame
function readFrame(){
	try{
		context.save();
		context.scale(-1, 1);
		context.drawImage(video, -width, 0, width, height);
		context.restore();
	} catch(e){
		console.log(e);
		return null;
	}
	return context.getImageData(0, 0, width, height);
}
//subtracts initial frame from current frame
//and sets pixels that differ by more than
//thresh to white
function binsub(data, thresh){
	var len = data.length;
	for(var i = 0, j = 0; j<len; i++, j+=4){
		var replace = true;
		if(Math.abs(data[j]-initialf[j])>thresh){
			if(Math.abs(data[j+1]-initialf[j+1])>thresh)
				if(Math.abs(data[j+2]-initialf[j+2])>thresh){
					replace = false;
				}
		}
		if(replace){
			data[j] = 255;
			data[j+1] = 255;
			data[j+2] = 255;
		}
		else{
			data[j] = 0;
			data[j+1] = 0;
			data[j+2] = 0;
	
		}
	
	}
}
//Blur function (incomplete doesn't actually use a 
//Gaussian distrubtion)
function GaussBlur(data, sigma){
	bgr2gray(data);
	var len = data.length;
	for(var i=0, j=0; j<len; i++, j+=4){
		try{
			var current = 0;
			var num = 9;
			
			current += data[j]*0.147;//*weight(j, sigma);
			current += data[j+4]*0.118;//*weight(j+4, sigma);
			if(j>=4){
				current += data[j-4]*0.118;//*weight(j-4, sigma);	
			}
			else{
				num--;
			}

			current += data[j+4*width]*0.118;//*weight(j+4*width, sigma);
			current += data[j+4*width+4]*0.095;//*weight(j+4*width+4, sigma);	
			current += data[j+4*width-4]*0.095;//*weight(j+4*width-4, sigma);

			if(j>=4*width){
				current += data[j-(4*width)]*0.118;//*weight(j-(4*width), sigma);
				current += data[j-(4*width)+4]*0.095;//*weight(j-(4*width)+4, sigma);
				if(j-(4*width)>=4)
					current += data[j-(4*width)-4]*0.095;//*weight(j-(4*width)-4, sigma);
				else
						num--;
			}
			else{
				num-=3;
			}

			//current/=num;
			data[j] = current;
			data[j+1] = current;
			data[j+2] = current;

		} catch(e){
			console.log(e);
		}

	}
}

function bgr2gray(data){
	var len = data.length;
	for(var i = 0, j = 0; j<len; i++, j+=4){
		var lumin = 0.21*data[j]+0.72*data[j+1]+0.07*data[j+2];
		data[j] = lumin;
		data[j+1] = lumin;
		data[j+2] = lumin;
	}
}

function crop(xstrt, xend, ystrt, yend, data){
	var len = data.length/4;
	for(var i=0; i<len; i++){
		if(i%width>xend||i%width<xstrt||i/width>yend||i/width<ystrt){
			data[i*4] = 0;
			data[i*4+1] = 0;
			data[i*4+2] = 0;
		}
	}
}

function threshold(data, thresh, a, b){
	var len = data.length;
	for(var i=0; i<len; i+=4){
		if(data[i]>thresh){
			data[i] = a;
			data[i+1] = a;
			data[i+2] = a;
		}
		else{
			data[i] = b;
			data[i+1] = b;
			data[i+2] = b;
		}
	}
}

function removeNoise(data, t, a, b){
	var len = data.length;
	var n = 0;
	for(var i = 0; i<len; i+=4){
		if(data[i]==a){
			n++;
		}
		else{
			if(n<t){
				if(!(data[i+4]==a||data[i+8]==a||data[i+12]==a)){
					var j = i;
					while(n>0){
						data[j] = b;
						data[j+1] = b;
						data[j+2] = b;
						j-=4;
						n--;
					}
				}
				else{
					var j = i;
					while(n>0){
						data[j] = a;
						data[j+1] = a;
						data[j+2] = a;
						j-=4;
						n--;
					}	
				}
			}
			n = 0;
		}
	}
}

function countWhite(data){
	var len = data.length;
	var ret = 0;
	for(var i = 0; i<len; i+=4){
		if(data[i]==255){
			ret+=1;
		}
	}
	return ret;
}

addEventListener("DOMContentLoaded", initialize);
