import cv2
import numpy as np
from pyo import Server, SquareTable, SineLoop, Osc
from math import pi as Pi
from sys import argv, platform
from os import system as cmd
from time import time
from sys import path 
path.append('detection')
from slider import Slider
from proximity import proximitySensor

def cls():
    if platform=='win32':
        cmd('cls')
    else:
        cmd('clear')


cls()

#camera
cap = cv2.VideoCapture(0)

#useful for debugging
show = False
if "-v" in argv:
    show = True



def main():
    proxSensor = proximitySensor() 
    contScale = False
    minDist = 0
    maxIndex = 0
    if '-d' in argv:
        minDist = 5000
        maxDist = 30000
    else:
        minDist, maxDist = proxSensor.initialize()
    err = 50
    if '-e' in argv:
        err = int(raw_input("Please enter an error threshold"))
    print str(minDist)+' '+str(maxDist)
    raw_input('Press any key to continue')
    stepLength = maxDist-minDist
    scaleFactor = 220.0/stepLength
    stepLength/=8
    note = ' '
    
    last = -1
    first = None

    pitchSlider = Slider(err, minDist, True, False, 150, 0, "pitch") 

    lastVolume = 1.0
    timing = False
    vstartTime = 0
    vstart = 0
    vcontrolenabled = True

    wav.out()
    stopped = False
    pitchBendEnable = True
    #main loop
    while True:
        ret, orgframe, cframe = proxSensor.setFrame(show)
        if not ret:
            continue
        orgpframe = orgframe[100:400, 500:900]
        orgvframe = orgframe[0:100, 300:500]
        orgframe = orgframe[100:300, 100:300]#500]
        
        #cropping frame for more accurate detection
        thresh, curr, numcnts = proxSensor.getValcropped(100, 300, 100, 300)

        pitchframe = cframe[100:400, 500:900]
        pnumcnts, pitchBend, _ = pitchSlider.getVal(pitchframe, orgpframe)
        vthresh, vcurr, vnumcnts = proxSensor.getValcropped(0, 100, 300, 500)
        cv2.imshow('vthresh', vthresh)
        estimate = int(lastVolume)
        if vcontrolenabled and vnumcnts<err:
            if timing:
                if abs(vstart-vcurr)>500:
                    timing = False
                else:
                    if time()-vstartTime>=2 and vcurr>=minDist/2:
                        timing = False
                        lastVolume = 10*(vcurr-(minDist/2))/(maxDist/2)
                    estimate = int(10*(vcurr-(minDist/2))/(maxDist/2)) 
            else:
                timing = True
                vstartTime = time()
                vstart = vcurr
        else:
            timing = False

        s.setAmp(lastVolume)
        #Setting frequency based off of distance
        #normal mode sets frequency to one of the frequencies in the 
        #dictionary. Continuous mode maps the frequency to the range
        #220Hz(a) to 440Hz(HighA)
        if abs(curr-last)>10:
            f = curr - minDist
            if contScale: 
                f = 220+scaleFactor*f
                note = str(f)+'Hz'
                pitchBend = 0
            else:
                f/=stepLength
                f = int(f)
                f%=8
                if curr>maxDist:
                    f = 7
                if curr<minDist:
                    f = 0
                keys = notes.keys()
                keys.sort()
                temp = f
                note = keys[f]
                f = notes[note]
                if pitchBendEnable and pnumcnts<err and pitchBend!=0:
                    if pitchBend<150:
                        upper = 0
                        if temp+1>7:
                            upper = f+100
                        else:
                            upper = keys[temp+1] 
                            upper = notes[upper]
                        upper = upper - f
                        pitchBend  = upper - pitchBend*(upper/150)
                    else:
                        lower = 0
                        if temp-1<0:
                            lower = f-100
                        else:
                            lower = keys[temp-1] 
                            lower = notes[lower]
                        lower = f - lower
                        pitchBend = -1*(pitchBend-150)*(lower/150)
                    f+=pitchBend
                else:
                    pitchBend = 0
            cls()
            if numcnts>err or curr<minDist/2:
                f = 0
                note = " "
            print 'current note: '+note
            print 'pitch bend: '+str(pitchBend)
            print 'amp: '+str(lastVolume)
            print 'changing amp: '+str(timing)+' time remaining: '+str(5-time()+vstartTime)
            if timing:
                print 'projected new amp: '+str(estimate)
            f = 2*Pi*f
            oldFreq = wav.freq
            if oldFreq!=0:
                while abs(oldFreq-f)>0.05:
                    #oldFreq = (oldFreq+f)/2 
                    if oldFreq<f:
                        oldFreq+=0.05
                    else:
                        oldFreq-=0.05
                    wav.setFreq(oldFreq)
            wav.setFreq(f)
        last = curr
        
        #useful for debugging
        if show:
            cv2.imshow("t", thresh)
        
        cv2.imshow("Theremin", orgframe)
        k = cv2.waitKey(30)
        if k==ord('q'):
            return
        elif k==ord('c'):
            contScale = not contScale 
        elif k==ord('m'):
            if stopped:
                wav.out()
                stopped = False
            else:
                wav.stop()
                stopped = True
        elif k==ord('p'):
            pitchBendEnable = not pitchBendEnable
        elif k==ord('v'):
            vcontrolenabled = not vcontrolenabled

if __name__ == "__main__":
    #Pyo server/objects
    s = Server().boot()
    s.start()
    wav = SineLoop(freq=2*Pi*261.626)
    notes = dict()
    notes['a'] = 220
    notes['b'] = 246.942
    notes['c'] = 261.626
    notes['d'] = 293.665
    notes['e'] = 329.628
    notes['f'] = 349.228
    notes['g'] = 391.995
    notes['highA'] = 440
    
    try:
        main()
    except KeyboardInterrupt:
        pass
    wav.stop()
    #otherOut.stop()
    s.stop()
    cls()
    print "Stopped theremin"
    exit()
 
