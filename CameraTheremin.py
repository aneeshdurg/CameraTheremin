import cv2
import numpy as np
from pyo import Server, SquareTable, SineLoop, Osc
from math import pi as Pi
from sys import argv, platform
from os import system as cmd
from slider import Slider

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

#"depth" detection
def getVal(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (9, 9), 0)
    _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY+cv2.THRESH_OTSU)
    #thresh = cv2.bitwise_not(thresh)
    cnts, _ = cv2.findContours(thresh.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    maxArea = 0
    maxIndex = -1
    for i in xrange(len(cnts)):
        area = cv2.contourArea(cnts[i])
        if area>maxArea:
            maxArea = area
            maxIndex = i
    hand = cnts[maxIndex]
    handLen = cv2.arcLength(hand, True)
    handCnt = cv2.approxPolyDP(hand, 0.0001*handLen, True)    
    return thresh, cv2.contourArea(handCnt), len(cnts)

def initialize():
    minDist = -1
    maxDist = -1
    counter = 0
    actualcounter = 0
    done = False
    first = None
    while not done:
        cls()
        actualcounter+=1
        print actualcounter
        _, frame = cap.read()
        frame = cv2.flip(frame, 1)
        frame = frame[100:300, 100:300] 
        if first == None:
            first = frame
            continue
        elif actualcounter == 200:
            first = frame
        else:
           frame = cv2.absdiff(first, frame)
           cv2.imshow('abs', frame)
           cv2.waitKey(30)
        thresh, val, something= getVal(frame)
        cv2.imshow('minPos', thresh)
        if minDist == -1:
            minDist = val
        else:
            if actualcounter<200:
                continue
            minDist = (minDist*counter+val)/(counter+1)
        counter+=1
        if counter==200:
            done = True
    
    actualcounter = 0
    counter = 0
    done = False
    first = None
    while not done:
        cls()
        actualcounter+=1
        print actualcounter
        _, frame = cap.read()
        frame = cv2.flip(frame, 1)
        frame = frame[100:300, 100:300] 
        if first == None:
            first = frame
            continue
        elif actualcounter == 200:
            first = frame
        else:
           frame = cv2.absdiff(first, frame)
           cv2.imshow('abs', frame)
           cv2.waitKey(30)
        thresh, val, something = getVal(frame)
        cv2.imshow('maxPos', thresh)
        if maxDist == -1:
            maxDist = val
        else:
            if actualcounter<200:
                continue
            maxDist = (maxDist*counter+val)/(counter+1)
        counter+=1
        if counter==200:
            done = True
    cv2.destroyAllWindows()
    return minDist, maxDist

def main():
    contScale = False
    minDist = 0
    maxIndex = 0
    if '-d' in argv:
        minDist = 5000
        maxDist = 30000
    else:
        minDist, maxDist = initialize()
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

    pitchSlider = Slider(err, minDist) 

    wav.out()
    stopped = False
    pitchBendEnable = True
    #main loop
    while True:
        _, orgframe = cap.read()
        cframe = cv2.flip(orgframe, 1)
        orgframe = cv2.flip(orgframe, 1)
        orgpframe = orgframe[100:400, 500:900]
        orgframe = orgframe[100:300, 100:300]#500]
    
        #background subtraction assuming mostly static background
        if first == None:
            first = cframe
            continue
        else:
            cframe = cv2.absdiff(first, cframe)
        if show:
            cv2.imshow('abs', cframe)
        #cropping frame for more accurate detection
        frame = cframe[100:300, 100:300]
        thresh, curr, numcnts = getVal(frame)
        pitchframe = cframe[100:400, 500:900]
        
        pnumcnts, pitchBend, _ = pitchSlider.getVal(pitchframe, orgpframe) 
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
                            upper = 100
                        else:
                            upper = keys[temp+1] 
                            upper = notes[upper]
                        upper = upper - f
                        pitchBend  = upper - pitchBend*(upper/150)
                    else:
                        lower = 0
                        if temp-1<0:
                            lower = 100
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
    exit()
 
