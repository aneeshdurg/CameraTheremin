import cv2
from sys import platform
from os import system as cmd
def cls():
    if platform=='win32':
        cmd('cls')
    else:
        cmd('clear')

class proximitySensor:
    cap = cv2.VideoCapture(0) 
    first = None
    cframe = None
    def setFrame(Self, show):
        _, frame = Self.cap.read()
        frame = cv2.flip(frame, 1)
        #background subtraction assuming mostly static background
        if Self.first == None:
            Self.first = frame
            return False, None, None
        else:
            Self.cframe = cv2.absdiff(Self.first, frame)
        if show:
            cv2.imshow('abs', cframe)
        return True, frame, Self.cframe
    #"depth" detection
    def getValcropped(Self, x1, x2, y1, y2):
        frame = Self.cframe[x1:x2, y1:y2]
        return Self.getVal(frame)
    def getVal(Self, frame):
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
    
    def initialize(Self):
        minDist = -1
        maxDist = -1
        counter = 0
        actualcounter = 0
        done = False
        first = None
        while not done:
            cls()
            actualcounter+=1
            formatting =(10*actualcounter/200)+1 
            if actualcounter<100:
                print 'Place hand away from camera'
            else:
                print 'Please remove hand'
            print '['+'='*formatting+' '*(10-formatting)+']'
            _, frame = Self.cap.read()
            frame = cv2.flip(frame, 1)
            frame = frame[100:300, 100:300] 
            if first == None:
                first = frame
                continue
            elif actualcounter == 100:
                first = frame
            else:
               frame = cv2.absdiff(first, frame)
               cv2.imshow('abs', frame)
               cv2.waitKey(30)
            thresh, val, something= Self.getVal(frame)
            cv2.imshow('minPos', thresh)
            if minDist == -1:
                minDist = val
            else:
                if actualcounter<100:
                    continue
                minDist = (minDist*counter+val)/(counter+1)
            counter+=1
            if counter==100:
                done = True
        
        actualcounter = 0
        counter = 0
        done = False
        first = None
        while not done:
            cls()
            actualcounter+=1
            formatting =(10*actualcounter/200)+1 
            if actualcounter<100:
                print 'Place hand close to camera'
            else:
                print 'Please remove hand'
            print '['+'='*formatting+' '*(10-formatting)+']'
            _, frame = Self.cap.read()
            frame = cv2.flip(frame, 1)
            frame = frame[100:300, 100:300] 
            if first == None:
                first = frame
                continue
            elif actualcounter == 100:
                first = frame
            else:
                frame = cv2.absdiff(first, frame)
                cv2.imshow('abs', frame)
                cv2.waitKey(30)
            thresh, val, something = Self.getVal(frame)
            cv2.imshow('maxPos', thresh)
            if maxDist == -1:
                maxDist = val
            else:
                if actualcounter<100:
                    continue
                maxDist = (maxDist*counter+val)/(counter+1)
            counter+=1
            if counter==100:
                done = True
        cv2.destroyAllWindows()
        return minDist, maxDist
