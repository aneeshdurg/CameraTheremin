# CameraTheremin
A theremin controlled by your webcam

#JS/getUserMedia+Tone.js

Works on browsers that support getUserMedia

https://aneeshdurg.github.io/CameraTheremin

To begin press 'Start theremin'. 

Using the threshold slider, adjust the threshold until you can see your silhouette with no gaps inside.

If there is a lot of intereference from background objects, consider using the binary subtractor to remove the background. The threshold for the subtractor can be adjusted with the threshold slider.

You can optionally use the crop sliders to crop the image so that only a certain region of the image will be used for the detection.

While holding your hand away from the camera, press 'set min' to set the position for low frequencies

While holding your hand close to the camera, press 'set max' to set the position for high frequencies

If you want to clear the max and min values, press 'clear'.

Press 'calibrate' to access the settings panel again. This allows you to change the settings even while the theremin is running. 

#Python/openCV+pyo
Requires OpenCV, pyo

-Try to not be in the camera's field of view when it start's detection, although it shouldn't be a problem unless your hand is in the range actually used by the camera

-Video Demos: <a href="https://www.youtube.com/watch?v=1kbN_tl2IlU">main theremin demo</a>, and <a href="https://www.youtube.com/watch?v=nVjc5MPW474">pitch bend demo</a> 

-Run with the flag '-d' to use some preset values for detection instead of calibrating 

-Run with the flag '-v' to show some of the frames used during detection

-Run with the flag '-e' to change the number of regions that need to be detected before the frame is considered an error

####Controls:

	Motion Controls (requires webcam):
		
		Move hand closer to and way from the camera to control pitch.
	
			in continuous mode this changes the frequency of the note being played continuously
		
			in discrete mode this changes the note on a scale from A3 to A4
				
				in discrete mode, moving your other hand on the vertical slider allows you bend the pitch 

			moving your hand in the region dedicated to amp control will change the amplitude if your hand is still for 5s or more

	Keyboard Controls (requires focus to be on either one of the video output windows):
	
		'q' to quit

		'c' to switch between continuous and discrete mode

		'p' to toggle pitch bend in discrete mode

		'v' to toggle amplitude control

		'[' to decrese amplitude if amplitude control disabled

		']' to increase amplitude if amplitude control disabled

		'\' to convert current amplitude to an integer

		'm' to toggle mute 
