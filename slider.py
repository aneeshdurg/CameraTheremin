import cv2
class Slider:
    err, minDist = 0, 0
    def __init__(Self, err, minDist):
        Self.minDist = minDist
        Self.err = err
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
        x, y, w, h = 0, 0, 0, 0
        if (cv2.contourArea(hand)>Self.minDist):
            x, y, w, h = cv2.boundingRect(hand)
            if len(cnts)<Self.err:
                cv2.line(frame, (0, y),(400, y), (0, 255, 0), 2)
        cv2.imshow('f', frame)
        return len(cnts), y
