import cv2
import numpy as np
from pyo import Server, SquareTable, SineLoop, Osc
from math import pi as Pi
from sys import argv
from os import system as cmd

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

#useful for debugging
show = False
if "-v" in argv:
    show = True

#Pyo server/objects
s = Server().boot()
s.start()
wav = SineLoop(freq=2*Pi*261.626).out()
otherWav = SineLoop()
notes = dict()
notes['a'] = 220
notes['b'] = 246.942
notes['c'] = 261.626
notes['d'] = 293.665
notes['e'] = 329.628
notes['f'] = 349.228
notes['g'] = 391.995
notes['highA'] = 440 
#otherOut = Osc(table=otherWav).out()
#camera
cap = cv2.VideoCapture(0)

def initialize():
    minDist = -1
    maxDist = -1
    counter = 0
    actualcounter = 0
    done = False
    first = None
    while True:
        _, frame = cap.read()
        frame = cv2.flip(frame, 1)
        frame = frame[100:300, 100:300]
        cv2.imshow('place hands', frame)
        k = cv2.waitKey(30)
        if k==ord('q'):
            cv2.destroyAllWindows()
            break
    while not done:
        cmd('cls')
        actualcounter+=1
        print actualcounter
        _, frame = cap.read()
        frame = cv2.flip(frame, 1)
        frame = frame[100:300, 100:300] 
        if first == None:
            first = frame
            continue
        else:
           frame = cv2.absdiff(first, frame)
           cv2.imshow('abs', frame)
           cv2.waitKey(30)
        thresh, val, something= getVal(frame)
        cv2.imshow('minPos', thresh)
        if minDist == -1:
            minDist = val
        else:
            if actualcounter<500:
                continue
            minDist = (minDist*counter+val)/(counter+1)
        counter+=1
        if counter==200:
            done = True
    
    actualcounter = 0
    counter = 0
    done = False
    first = None
    while True:
        _, frame = cap.read()
        frame = cv2.flip(frame, 1)
        frame = frame[100:300, 100:300]
        cv2.imshow('place hands', frame)
        k = cv2.waitKey(30)
        if k==ord('q'):
            cv2.destroyAllWindows()
            break
    while not done:
        cmd('cls')
        actualcounter+=1
        print actualcounter
        _, frame = cap.read()
        frame = cv2.flip(frame, 1)
        frame = frame[100:300, 100:300] 
        if first == None:
            first = frame
            continue
        else:
           frame = cv2.absdiff(first, frame)
           cv2.imshow('abs', frame)
           cv2.waitKey(30)
        thresh, val, something = getVal(frame)
        cv2.imshow('maxPos', thresh)
        if maxDist == -1:
            maxDist = val
        else:
            if actualcounter<500:
                continue
            maxDist = (maxDist*counter+val)/(counter+1)
        counter+=1
        if counter==200:
            done = True
    cv2.destroyAllWindows()
    return minDist, maxDist

def main():
    minDist = 0
    maxIndex = 0
    if '-d' in argv:
        minDist = 5000
        maxDist = 30000
    else:
        minDist, maxDist = initialize()
    print str(minDist)+' '+str(maxDist)
    raw_input()
    stepLength = maxDist-minDist
    stepLength/=8
    note = 'c'
    
    last = -1
    otherLast = -1
    first = None 
    #main loop
    while True:
        _, orgframe = cap.read()
        cframe = cv2.flip(orgframe, 1)
        orgframe = cv2.flip(orgframe, 1)
        orgframe = orgframe[100:300, 100:500]
    
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
        other = cframe[100:300, 300:500]
        thresh, curr, numcnts = getVal(frame)
        otherThresh, otherCurr, otherNumcnts = getVal(other)
    
        #Setting frequency based off of distance
        if abs(curr-last)>10:
            f = curr - minDist
            f/=stepLength
            f = int(f)
            f%=8
            if curr>maxDist:
                f = 7
            if curr<minDist:
                f = 0
            keys = notes.keys()
            keys.sort()
            note = keys[f]
            cmd('cls')
            #print str(curr)+' '+str(f)+' '+note
            f = 2*Pi*notes[note]
            if numcnts>50:
                f = 0
                note = " "
            print 'current note: '+note
            oldFreq = wav.freq
            while abs(oldFreq-f)>1:
                oldFreq = (oldFreq+f)/2 
                wav.setFreq(oldFreq)
            wav.setFreq(f)
        last = curr
        
        #if abs(otherCurr-otherLast)>10:
        #    print "other"+str(otherCurr)
        #    f = int(otherCurr/300+10)
        #    oldFreq = otherWav.freq
        #    while abs(oldFreq-Pi*f)>1:
        #        oldFreq = (oldFreq+Pi*f)/2
        #        otherWav.setFreq(oldFreq)
        #otherLast = otherCurr
    
        #useful for debugging
        if show:
            cv2.imshow("t", thresh)
            cv2.imshow("ot", otherThresh)
        
        cv2.imshow("Theremin", orgframe)
        k = cv2.waitKey(30)
        if k==ord('q'):
            return
if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pass
    out.stop()
    otherOut.stop()
    s.stop()
    exit()
 
