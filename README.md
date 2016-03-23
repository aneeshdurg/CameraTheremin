# CameraTheremin
A theremin controlled by your webcam

-Try to not be in the camera's field of view when it start's detection, although it shouldn't be a
problem unless your hand is in the range actually used by the camera
-Video Demo <a href="https://www.youtube.com/watch?v=HO9WqtaXeNo">here</a>
-Run with the flag '-d' to use some preset values for detection instead of calibrating 
-Run with the flag '-v' to show some of the frames used during detection
-Run with the flag '-e' to change the number of regions that need to be detected before the frame is considered an error

Controls:

	Move hand closer to and way from the camera to control pitch.

		in continuous mode this changes the frequency of the note being played continuously
	
		in discrete mode this changes the note on a scale from A3 to A4

	'q' to quit

	'c' to switch between continuous and discrete mode

	'm' to mute 
