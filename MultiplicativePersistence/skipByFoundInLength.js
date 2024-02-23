const dontSkipYetGrowing = (foundInPreviousLength, foundInLength, previousLength, currentLength) => {
    if ((currentLength > previousLength) && foundInPreviousLength !== 1) {
        if (foundInLength === foundInPreviousLength) {
            isToSkip = checkForSkipping
        }
    }
    return false
}

const checkForSkipping = (foundInPreviousLength, foundInLength) => {
    //if (foundInPreviousLength === foundInLength) debugger
    return foundInPreviousLength === foundInLength
}

let isToSkip = dontSkipYetGrowing

const skipByFoundInLength = (foundInPreviousLength, foundInLength, previousLength, currentLength) => {
    return isToSkip(foundInPreviousLength, foundInLength, previousLength, currentLength)
}

export default skipByFoundInLength