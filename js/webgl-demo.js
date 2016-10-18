

var canvas;
var ctx;
var gl;
var intervalID;

var cubeVerticesBuffer;
var cubeVerticesTextureCoordBuffer;
var cubeVerticesIndexBuffer;
var cubeVerticesIndexBuffer;
var cubeRotation = 0.0;
var lastCubeUpdateTime = 0;

var cubeTexture;

var mvMatrix;
var shaderProgram;
var vertexPositionAttribute;
var vertexNormalAttribute;
var textureCoordAttribute;
var perspectiveMatrix;

var bElement;
var threshold = 0;

navigator.getUserMedia = ( navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);

function tdelta(delta){
  threshold+=delta/100;
  console.log(threshold);
}
function pick(event){
  //var x = event.layerX;
  //var y = event.layerY;
  //var readPix = ctx.getImageData(x, y, 1, 1);
  //var readData = readPix.data;
  //var rgba = 'rgba('+data[0]+','+data[1]+','+data[2]+','+(data[3]/255)+')';
  //colorBox.style.background = rgba;
  var colorBox = document.getElementById("myBox");
  var readPix = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
  gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, readPix);
  var white = 0;
  readPix.forEach(function(e){
    if(e==255)
      white+=1;
  });
  //console.log(white/3);
  var xpos = 0;
  if(white!=0){
    document.getElementById("count").innerHTML = "Detected area: "+white+" px";
    if(changemax){
      changemax = false;
      document.getElementById("maxval").innerHTML = "Detected area(upper bound): "+white+" px";
      if(min!=-1&&max==-1)
        setcalibrate();
      max = white;
    }
    if(changemin){
      changemin = false;
      document.getElementById("minval").innerHTML = "Detected area(lower bound): "+white+" px";
      if(min==-1&&max!=-1)
        setcalibrate();
      min = white;
    }
    scaled = scale(white, cont, xpos); 
    //sends frequency to synth  
    if(min<0||max<0||white<0)
      scaled = playSynth(0, -100);
    else
      scaled = playSynth(scaled, xpos);
  }
}

//
// start
//
// Called when the canvas is created to get the ball rolling.
//
function startWebgl() {
  setInterval(pick, 50);
  canvas = document.getElementById("glcanvas");
  canvas.addEventListener('mousemove', pick)

  videoElement = document.getElementById("vid");

  var constraints = {
    video: {
      mandatory: {
        maxWidth: 640,
        maxHeight: 480
      }
    }
  }
  navigator.getUserMedia(constraints, function (stream){
    videoElement.src = URL.createObjectURL(stream);
    //videoElement.play();
  }, function(error){console.log("ERROR: "+error);});

  console.log("here");
  initWebGL(canvas);      // Initialize the GL context

  // Only continue if WebGL is available and working

  if (gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Initialize the shaders; this is where all the lighting for the
    // vertices and so forth is established.

    initShaders();

    // Here's where we call the routine that builds all the objects
    // we'll be drawing.

    initBuffers();

    // Next, load and set up the textures we'll be using.

    initTextures();

    // Start listening for the canplaythrough event, so we don't
    // start playing the video until we can do so without stuttering

    startVideo();
    //videoElement.addEventListener("canplaythrough", startVideo, true);

    // Start listening for the ended event, so we can stop the
    // animation when the video is finished playing.

    videoElement.addEventListener("ended", videoDone, true);
  }
}

//
// initWebGL
//
// Initialize WebGL, returning the GL context or null if
// WebGL isn't available or could not be initialized.
//
function initWebGL() {
  gl = null;

  try {
    gl = canvas.getContext("experimental-webgl");
    //ctx = canvas.getContext('2d');
  }
  catch(e) {
  }

  // If we don't have a GL context, give up now

  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just have
// one object -- a simple two-dimensional cube.
//
function initBuffers() {

  // Create a buffer for the cube's vertices.

  cubeVerticesBuffer = gl.createBuffer();

  // Select the cubeVerticesBuffer as the one to apply vertex
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);

  // Now create an array of vertices for the cube.

  var vertices = [
    // Front face
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,

    //// Back face
    //-1.0, -1.0, -1.0,
    //-1.0,  1.0, -1.0,
     //1.0,  1.0, -1.0,
     //1.0, -1.0, -1.0,
//
    //// Top face
    //-1.0,  1.0, -1.0,
    //-1.0,  1.0,  1.0,
     //1.0,  1.0,  1.0,
     //1.0,  1.0, -1.0,
//
    //// Bottom face
    //-1.0, -1.0, -1.0,
     //1.0, -1.0, -1.0,
     //1.0, -1.0,  1.0,
    //-1.0, -1.0,  1.0,
//
    //// Right face
     //1.0, -1.0, -1.0,
     //1.0,  1.0, -1.0,
     //1.0,  1.0,  1.0,
     //1.0, -1.0,  1.0,
//
    //// Left face
    //-1.0, -1.0, -1.0,
    //-1.0, -1.0,  1.0,
    //-1.0,  1.0,  1.0,
    //-1.0,  1.0, -1.0
  ];

  // Now pass the list of vertices into WebGL to build the shape. We
  // do this by creating a Float32Array from the JavaScript array,
  // then use it to fill the current vertex buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  // Set up the normals for the vertices, so that we can compute lighting.

  cubeVerticesNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesNormalBuffer);

  var vertexNormals = [
    // Front
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,
     0.0,  0.0,  1.0,

    //// Back
     //0.0,  0.0, -1.0,
     //0.0,  0.0, -1.0,
     //0.0,  0.0, -1.0,
     //0.0,  0.0, -1.0,
//
    //// Top
     //0.0,  1.0,  0.0,
     //0.0,  1.0,  0.0,
     //0.0,  1.0,  0.0,
     //0.0,  1.0,  0.0,
//
    //// Bottom
     //0.0, -1.0,  0.0,
     //0.0, -1.0,  0.0,
     //0.0, -1.0,  0.0,
     //0.0, -1.0,  0.0,
//
    //// Right
     //1.0,  0.0,  0.0,
     //1.0,  0.0,  0.0,
     //1.0,  0.0,  0.0,
     //1.0,  0.0,  0.0,
//
    //// Left
    //-1.0,  0.0,  0.0,
    //-1.0,  0.0,  0.0,
    //-1.0,  0.0,  0.0,
    //-1.0,  0.0,  0.0
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals),
                gl.STATIC_DRAW);

  // Map the texture onto the cube's faces.

  cubeVerticesTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);

  var textureCoordinates = [
    // Front
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    //// Back
    //0.0,  0.0,
    //1.0,  0.0,
    //1.0,  1.0,
    //0.0,  1.0,
    //// Top
    //0.0,  0.0,
    //1.0,  0.0,
    //1.0,  1.0,
    //0.0,  1.0,
    //// Bottom
    //0.0,  0.0,
    //1.0,  0.0,
    //1.0,  1.0,
    //0.0,  1.0,
    //// Right
    //0.0,  0.0,
    //1.0,  0.0,
    //1.0,  1.0,
    //0.0,  1.0,
    //// Left
    //0.0,  0.0,
    //1.0,  0.0,
    //1.0,  1.0,
    //0.0,  1.0
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex array for each face's vertices.

  cubeVerticesIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  var cubeVertexIndices = [
    0,  1,  2,      0,  2,  3,    // front
    //4,  5,  6,      4,  6,  7,    // back
    //8,  9,  10,     8,  10, 11,   // top
    //12, 13, 14,     12, 14, 15,   // bottom
    //16, 17, 18,     16, 18, 19,   // right
    //20, 21, 22,     20, 22, 23    // left
  ]

  // Now send the element array to GL

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
}

//
// initTextures
//
// Initialize the textures we'll be using, then initiate a load of
// the texture images. The handleTextureLoaded() callback will finish
// the job; it gets called each time a texture finishes loading.
//
function initTextures() {
  cubeTexture = gl.createTexture();
}

//
// updateTexture
//
// Update the texture to contain the latest frame from
// our video.
//
function updateTexture() {
  if( videoElement.readyState === videoElement.HAVE_ENOUGH_DATA ){
    gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
          gl.UNSIGNED_BYTE, videoElement);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
}

//
// startVideo
//
// Starts playing the video, so that it will start being used
// as our texture.
//
function startVideo() {
  videoElement.play();
  console.log("PLAYING");
  //videoElement.muted = true;
  intervalID = setInterval(drawScene, 15);
}

//
// videoDone
//
// Called when the video is done playing; this will terminate
// the animation.
//
function videoDone() {
  clearInterval(intervalID);
}

//
// drawScene
//
// Draw the scene.
//
function drawScene() {
  updateTexture();

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Establish the perspective with which we want to view the
  // scene. Our field of view is 45 degrees, with a width/height
  // ratio of 640:480, and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  perspectiveMatrix = makePerspective(45, 640.0/480.0, 0.1, 100.0);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.

  loadIdentity();

  // Now move the drawing position a bit to where we want to start
  // drawing the cube.

  mvTranslate([0.0, 0.0, -3.0]);

  // Save the current matrix, then rotate before we draw.

  mvPushMatrix();
  //mvRotate(cubeRotation, [-3, -3, -3]);


  // Draw the cube by binding the array buffer to the cube's vertices
  // array, setting attributes, and pushing it to GL.

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  // Set the texture coordinates attribute for the vertices.

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);
  gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

  // Bind the normals buffer to the shader attribute.

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesNormalBuffer);
  gl.vertexAttribPointer(vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

  // Specify the texture to map onto the faces.

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
  gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);
  
  gl.uniform2f(gl.getUniformLocation(shaderProgram, "uTextureSize"), videoElement.width, videoElement.height);
  gl.uniform1f(gl.getUniformLocation(shaderProgram, "uThreshold"), t);

  //countWhite(context.getImageData(0, 0, width, height).data);


  // Draw the cube.

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

  // Restore the original matrix

  mvPopMatrix();

  // Update the rotation for the next draw, if it's time to do so.

  var currentTime = (new Date).getTime();
  if (lastCubeUpdateTime) {
    var delta = currentTime - lastCubeUpdateTime;

    cubeRotation += (30 * delta) / 1000.0;
  }

  lastCubeUpdateTime = currentTime;
}

function countWhite(data){
  var ret = 0;
  for(var i = ys; i<ye; i++){
    for(var j = xs; j<xe; j++){
      var k = i*4*width+4*j
      if(data[k]==255){
        ret+=1;
      }
    }
  }
  return ret;
}


//
// initShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");

  // Create the shader program

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program: " + gl.getProgramInfoLog(shader));
  }

  gl.useProgram(shaderProgram);

  vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(vertexPositionAttribute);

  textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
  gl.enableVertexAttribArray(textureCoordAttribute);

  vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(vertexNormalAttribute);
}

//
// getShader
//
// Loads a shader program by scouring the current document,
// looking for a script with the specified ID.
//
function getShader(gl, id) {
  var shaderScript = document.getElementById(id);

  // Didn't find an element with the specified ID; abort.

  if (!shaderScript) {
    return null;
  }

  // Walk through the source element's children, building the
  // shader source string.

  var theSource = "";
  var currentChild = shaderScript.firstChild;

  while(currentChild) {
    if (currentChild.nodeType == 3) {
      theSource += currentChild.textContent;
    }

    currentChild = currentChild.nextSibling;
  }

  // Now figure out what type of shader script we have,
  // based on its MIME type.

  var shader;

  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;  // Unknown shader type
  }

  // Send the source to the shader object

  gl.shaderSource(shader, theSource);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

//
// Matrix utility functions
//

function loadIdentity() {
  mvMatrix = Matrix.I(4);
}

function multMatrix(m) {
  mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) {
  multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

function setMatrixUniforms() {
  var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

  var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));

  var normalMatrix = mvMatrix.inverse();
  normalMatrix = normalMatrix.transpose();
  var nUniform = gl.getUniformLocation(shaderProgram, "uNormalMatrix");
  gl.uniformMatrix4fv(nUniform, false, new Float32Array(normalMatrix.flatten()));
}

var mvMatrixStack = [];

function mvPushMatrix(m) {
  if (m) {
    mvMatrixStack.push(m.dup());
    mvMatrix = m.dup();
  } else {
    mvMatrixStack.push(mvMatrix.dup());
  }
}

function mvPopMatrix() {
  if (!mvMatrixStack.length) {
    throw("Can't pop from an empty matrix stack.");
  }

  mvMatrix = mvMatrixStack.pop();
  return mvMatrix;
}

function mvRotate(angle, v) {
  var inRadians = angle * Math.PI / 180.0;

  var m = Matrix.Rotation(inRadians, $V([v[0], v[1], v[2]])).ensure4x4();
  multMatrix(m);
}
