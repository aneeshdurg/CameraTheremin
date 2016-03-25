import cv2
class Slider:
    err, minDist = 0, 0
    width, height = -1, -1
    findx, findy = False, False
    midX, midY = 0, 0
    name = ''
    def __init__(Self, err, minDist, findy, findx, midY, midX, name):
        Self.minDist = minDist
        Self.err = err
        Self.findx = findx
        Self.findy = findy
        Self.midY = midY
        Self.midX = midX
        Self.name = name
    def getVal(Self, frame, orgframe):
        if Self.width == -1:
            Self.width = frame.shape[0]
            Self.height = frame.shape[1]
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
                if Self.findy:
                    cv2.line(orgframe, (0, y),(Self.width, y), (0, 255, 0), 2)
                if Self.findx:
                    cv2.line(orgframe, (x, 0),(x, Self.height ), (0, 255, 0), 2)
        if Self.findy:
            cv2.line(orgframe, (0, Self.midY), (Self.width, Self.midY), (255, 0, 0), 2)
        if Self.findx:
            cv2.line(orgframe, (Self.midX, 0), (Self.midX, Self.height), (255, 0, 0), 2)
        cv2.imshow(Self.name, orgframe)
        return len(cnts), y, x
