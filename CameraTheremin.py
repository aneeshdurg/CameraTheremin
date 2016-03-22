import cv2
import numpy as np
from pyo import Server, SquareTable, SincTable, Osc
from math import pi as Pi
from sys import argv

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
    return thresh, cv2.contourArea(handCnt)
#useful for debugging
show = False
if "-v" in argv:
    show = True

#Pyo server/objects
s = Server().boot()
s.start()
wav = SincTable()
out = Osc(table=wav).out()
otherWav = SincTable()
#otherOut = Osc(table=otherWav).out()
#camera
cap = cv2.VideoCapture(0)
def main():
    
    
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
        thresh, curr = getVal(frame)
        otherThresh, otherCurr = getVal(other)
    
        #Setting frequency based off of distance
        if abs(curr-last)>10:
            print curr
            f = int(curr/3000)
            oldFreq = wav.freq
            while abs(oldFreq-Pi*f)>1:
                oldFreq = (oldFreq+Pi*f)/2 
                wav.setFreq(oldFreq)
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
 
