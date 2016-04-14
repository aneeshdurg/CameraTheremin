function initialize(){
	video = document.getElementById("vid");
	canvas = document.getElementById("c");
	context = canvas.getContext("2d");

	width = 640;
	height = 480; 
	canvas.width = width;
	canvas.height = height;
	xe = width;
	ye = height;

	navigator.getUserMedia({video:true}, startStream, function(){});
}

function startStream(stream){
	video.src = URL.createObjectURL(stream);
	video.play();

	requestAnimationFrame(draw);
}

function draw(){
	var frame = readFrame();
	var fcopy = frame;
	if(frame){
		if(counter>=100){
			if(!initialf){
				initialf = frame.data;
			}
			else{
				if(dobsub){
					bsub(frame.data);
				}
				if(dobsub2){
					bsub2(frame.data, subThresh);
				}
				if(doincreaseRed){
					increaseRed(frame.data, color);
				}
				if(dobinsub){
					binsub(frame.data, subThresh);
				}
				if(dobgr2gray){
					bgr2gray(frame.data);
				}
				if(dogaussblur){
					GaussBlur(frame.data, 1.5);
				}
				
				if(dothresh){
					threshold(frame.data, t, 0, 255);
					removeNoise(frame.data, noiseThresh, 255, 0);
				}
				if(docrop){
					crop(xs, xe, ys, ye, frame.data);
				}
				var white = countWhite(frame.data);
				if(changemax){
					max = white;
					changemax = false;
					document.getElementById("maxval").innerHTML = white;
				}
				if(changemin){
					min = white;
					changemin = false;
					document.getElementById("minval").innerHTML = white;
				}

				var scaled = scale(white); 
				document.getElementById("count").innerHTML = scaled;
				//flip(frame.data);
			}
		}
		if(calibrate){
			try{
				context.putImageData(frame, 0, 0);
			} catch(e){
				console.log(e);
			}
		
		}
	}
	counter+=1;
	if(counter%discospeed==0){
		color+=1;
		color%=3;
	}
	requestAnimationFrame(draw);
}

function scale(num){
	if(min<0||max<0)
		return num;
	var high = max-min;
	var sf = 220/high;
	var ret = Math.floor(sf*(num-min)+220);
	playSynth(ret);
	return ret;
}

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

function increaseRed(data, color){
	var len = data.length;
	for(var i = 0, j = 0; j<len; i++, j+=4){
		data[j+color]+=70;
		if(data[j]>255){
			data[j] = 255;
		}
	}
}
function bsub(data){
	var len = data.length;
	for(var i = 0, j = 0; j<len; i++, j+=4){
		for(var k=0; k<3; k++){
			data[j+k]-=initialf[j+k];
			if(data[j+k]<0){
				data[j+k] = 0;
			}
			if(data[j+k]>255){
				data[j+k]=255;
			}
		}
	}
}

function bsub2(data, thresh){
	var len = data.length;
	for(var i=0, j=0; j<len; i++, j+=4){
		var replace = true;
		if(Math.abs(data[j]-initialf[j])>thresh){
			if(Math.abs(data[j+1]-initialf[j+1])>thresh)
				if(Math.abs(data[j+2]-initialf[j+2])>thresh){
					replace = false;
				}
		}
		if(replace){
			data[j] = 0;
			data[j+1] = 0;
			data[j+2] = 0;
		}
	}
}

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
function weight(pos, sigma){
	var y = pos/(4*width);
	var x = pos - 4*width*y; 
	var e = 2.718;
	var pi = 3.14;
	var exp = -1*(Math.pow(x, 2)+Math.pow(y, 2))/(2*Math.pow(sigma, 2));
	var numerator = Math.pow(e, exp);
	var denominator = 2*pi*Math.pow(sigma, 2);
	return numerator/denominator;
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
	bgr2gray(data);
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
